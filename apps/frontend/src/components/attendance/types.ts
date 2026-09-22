export type AttendanceDbStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export type AttendanceFilterStatus = 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT';

export interface DailyAttendanceStudent {
  studentId: string;
  name: string;
  enrollmentNumber: string;
  qrCode?: string;
  tutor?: string;
  tutorPhone?: string;
  group?: string;
  shift?: string;
  badgeStatus?: string;
  attendanceId?: string | null;
  status: AttendanceDbStatus;
  scannedAt?: string | Date | null;
  attendedDaysCount?: number;
  daysInMonth?: number;
  attendanceRatio?: string;
  homeworkScore?: number;
}

export interface AttendanceSummaryStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number; // Porcentaje de asistencia (present + late) / total
}

export interface HistoryViewProps {
  /** Indica si la vista se renderiza como modal */
  isModal?: boolean;
  /** Controla la visibilidad cuando se usa como modal */
  isOpen?: boolean;
  /** Callback al cerrar el modal o salir de la vista */
  onClose?: () => void;
  /** Fecha inicial seleccionada en formato YYYY-MM-DD */
  initialDate?: string;
  /** Callback para sincronizar cambios de asistencia con el componente padre */
  onAttendanceUpdated?: () => void;
}
