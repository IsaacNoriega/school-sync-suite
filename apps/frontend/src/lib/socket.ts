import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config/api';

let socket: Socket | null = null;

export interface RealtimeScanPayload {
  type?: 'attendance' | 'grade';
  attendanceId?: string;
  gradeId?: string;
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE';
  date?: string;
  scannedAt?: string | Date;
  assignmentId?: string;
  score?: number;
  gradedAt?: string | Date;
}

/**
 * Obtiene o crea la conexión singleton de Socket.io
 */
export function getSocket(token?: string): Socket {
  const authToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined);

  if (!socket) {
    socket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      auth: authToken ? { token: authToken } : undefined,
    });
  } else if (authToken && (!socket.auth || !(socket.auth as any).token)) {
    socket.auth = { token: authToken };
  }
  return socket;
}

/**
 * Inicia la conexión y se suscribe a la sala del docente
 */
export function connectSocket(teacherId: string, token: string): Socket {
  const s = getSocket(token);

  const join = () => {
    s.emit('join_room', { teacherId, token });
  };

  if (s.connected) {
    join();
  } else {
    // Usar .once para que el listener se limpie tras ejecutarse y evitar memory leaks
    s.once('connect', join);
  }

  return s;
}

/**
 * Desconecta la sesión WebSocket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Registra un listener para el evento 'newScanRecord' y eventos asociados
 */
export function onNewScanRecord(
  callback: (record: RealtimeScanPayload) => void
): () => void {
  const s = getSocket();

  const handleScan = (data: RealtimeScanPayload) => {
    callback(data);
  };

  s.on('newScanRecord', handleScan);
  s.on('student_scanned_attendance', (data) => handleScan({ type: 'attendance', ...data }));
  s.on('student_scanned_grade', (data) => handleScan({ type: 'grade', ...data }));

  // Retorna función de limpieza
  return () => {
    s.off('newScanRecord', handleScan);
    s.off('student_scanned_attendance');
    s.off('student_scanned_grade');
  };
}

export default getSocket;
