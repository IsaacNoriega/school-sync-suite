import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScannerUsbView } from './ScannerUsbView';

describe('<ScannerUsbView />', () => {
  const defaultProps = {
    isCooldown: false,
    cooldownRemaining: 0,
    lastScannedCode: '',
    lastScannedSecondsAgo: null,
    onCodeChange: jest.fn(),
    onSubmitScan: jest.fn(),
    scanMode: 'attendance' as const,
    attendanceFeedback: null,
    gradeFeedback: null,
    onOpenDetail: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el estado "Listo para disparar" cuando no hay cooldown activo', () => {
    render(<ScannerUsbView {...defaultProps} isCooldown={false} />);

    expect(screen.getByText(/Lector Óptico USB Conectado y Listo/i)).toBeDefined();
    expect(screen.getByText(/Listo para disparar/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Esperando lectura de credencial/i)).toBeDefined();
  });

  it('debe mostrar el aviso de pausa activa si isCooldown es true', () => {
    render(
      <ScannerUsbView
        {...defaultProps}
        isCooldown={true}
        cooldownRemaining={3}
      />
    );

    expect(screen.getByText(/Pausa activa \(3s\)/i)).toBeDefined();
    expect(screen.queryByText(/Listo para disparar/i)).toBeNull();
  });

  it('debe llamar a onCodeChange al escribir y emitir onSubmitScan al presionar la tecla Enter', () => {
    const onCodeChangeMock = jest.fn();
    const onSubmitScanMock = jest.fn();

    render(
      <ScannerUsbView
        {...defaultProps}
        lastScannedCode="A01234567"
        onCodeChange={onCodeChangeMock}
        onSubmitScan={onSubmitScanMock}
      />
    );

    const input = screen.getByPlaceholderText(/Esperando lectura de credencial/i);

    // Simular escritura continua del escáner óptico USB
    fireEvent.change(input, { target: { value: 'A01234567' } });
    expect(onCodeChangeMock).toHaveBeenCalledWith('A01234567');

    // La pistola emuladora de teclado USB remata con un Enter/Return
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSubmitScanMock).toHaveBeenCalledTimes(1);
    expect(onSubmitScanMock).toHaveBeenCalledWith('A01234567');
  });

  it('no debe disparar onSubmitScan si el código escaneado está vacío al dar Enter', () => {
    const onSubmitScanMock = jest.fn();

    render(
      <ScannerUsbView
        {...defaultProps}
        lastScannedCode="   "
        onSubmitScan={onSubmitScanMock}
      />
    );

    const input = screen.getByPlaceholderText(/Esperando lectura de credencial/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmitScanMock).not.toHaveBeenCalled();
  });
});
