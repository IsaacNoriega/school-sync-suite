'use client';

import { useEffect, useRef } from 'react';

export interface UsePhysicalScannerOptions {
  /**
   * Callback invocado cuando se detecta un escaneo completo de código QR.
   */
  onScan: (scannedCode: string) => void;

  /**
   * Indica si la escucha del teclado está activa.
   * @default true
   */
  enabled?: boolean;

  /**
   * Intervalo máximo permitido entre pulsaciones sucesivas para considerarlas
   * provenientes de un lector de código de barras / QR de hardware en vez de escritura humana.
   * La mayoría de lectores disparan entre 5ms y 30ms por tecla.
   * @default 35
   */
  maxIntervalMs?: number;

  /**
   * Longitud mínima de caracteres para validar el código escaneado.
   * @default 3
   */
  minLength?: number;

  /**
   * Si es true, cancela la acción por defecto del evento Enter cuando se detecte un escaneo válido
   * para prevenir que se envíen formularios o se activen botones en foco.
   * @default true
   */
  preventDefaultOnEnter?: boolean;
}

/**
 * Hook para capturar ráfagas rápidas de pulsaciones de teclado emitidas
 * por lectores físicos de códigos de barra y QR (USB o Bluetooth en modo HID Keyboard Wedge).
 */
export function usePhysicalScanner({
  onScan,
  enabled = true,
  maxIntervalMs = 35,
  minLength = 3,
  preventDefaultOnEnter = true,
}: UsePhysicalScannerOptions) {
  // Referencias para evitar re-suscripciones innecesarias de event listeners
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const bufferRef = useRef<string[]>([]);
  const timestampsRef = useRef<number[]>([]);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const clearBuffer = () => {
      bufferRef.current = [];
      timestampsRef.current = [];
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();

      // Resetear buffer si hubo una pausa prolongada (escritura lenta o abandono)
      if (timestampsRef.current.length > 0) {
        const lastTimestamp = timestampsRef.current[timestampsRef.current.length - 1];
        if (now - lastTimestamp > maxIntervalMs * 3) {
          clearBuffer();
        }
      }

      // Los lectores HID terminan la cadena de escaneo con 'Enter'
      if (e.key === 'Enter') {
        const buffer = bufferRef.current;
        const timestamps = timestampsRef.current;

        if (buffer.length >= minLength && timestamps.length >= 2) {
          // Calcular el promedio del intervalo entre pulsaciones
          const totalDuration = timestamps[timestamps.length - 1] - timestamps[0];
          const averageInterval = totalDuration / (timestamps.length - 1);

          // Si el promedio fue rápido como un dispositivo de hardware (< maxIntervalMs)
          if (averageInterval <= maxIntervalMs) {
            const scannedCode = buffer.join('').trim();

            if (preventDefaultOnEnter) {
              e.preventDefault();
              e.stopPropagation();
            }

            if (scannedCode) {
              onScanRef.current(scannedCode);
            }
          }
        }

        clearBuffer();
        return;
      }

      // Filtrar teclas especiales que no corresponden al payload del código (Shift, Ctrl, Alt, etc.)
      if (e.key.length === 1) {
        // Verificar si el foco está en un campo de texto regular
        const activeEl = document.activeElement;
        const isInputField = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

        // Si el usuario está escribiendo manualmente en un input y las teclas van despacio, ignorar
        if (isInputField && bufferRef.current.length === 0) {
          // Dejamos que el primer carácter pase, pero guardamos timestamp
        }

        bufferRef.current.push(e.key);
        timestampsRef.current.push(now);

        // Timer de seguridad para limpiar el buffer si no se recibe Enter en tiempo razonable
        if (clearTimerRef.current) {
          clearTimeout(clearTimerRef.current);
        }
        clearTimerRef.current = setTimeout(clearBuffer, maxIntervalMs * 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      clearBuffer();
    };
  }, [enabled, maxIntervalMs, minLength, preventDefaultOnEnter]);
}
