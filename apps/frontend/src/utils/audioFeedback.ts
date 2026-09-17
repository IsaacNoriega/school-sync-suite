/**
 * Utilidad de feedback sonoro sintético utilizando la Web Audio API nativa de HTML5.
 * Funciona de forma inmediata en navegadores modernos sin requerir descargas de archivos externos.
 */

class SoundFeedbackService {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Tono agudo y breve para escaneo exitoso (~120ms).
   * Dos notas armónicas ascendentes o tono limpio en C6 (1046Hz).
   */
  public playSuccess(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Frecuencia inicial C6 (1046 Hz) subiendo ligeramente a 1318 Hz (E6)
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      // Envolvente de volumen para evitar "pops" o distorsión
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      console.warn('No se pudo reproducir el sonido de éxito:', e);
    }
  }

  /**
   * Tono grave y de advertencia para error o código inválido (~240ms).
   * Frecuencia baja en onda triangular/sierra descendente (220Hz -> 140Hz).
   */
  public playError(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('No se pudo reproducir el sonido de error:', e);
    }
  }
}

export const soundFeedback = new SoundFeedbackService();
