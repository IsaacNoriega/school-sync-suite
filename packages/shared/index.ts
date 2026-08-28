export type UserRole = 'SUPER_ADMIN' | 'TEACHER';

export interface IUser {
  _id?: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface ITeacher {
  _id?: string;
  user: string | IUser;
  name: string;
  schoolName: string;
  createdAt?: string;
}

export interface ISubject {
  _id?: string;
  teacher: string | ITeacher;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
}

export interface IStudent {
  _id?: string;
  teacher: string | ITeacher;
  name: string;
  qrCode: string;
  enrollmentNumber?: string;
  createdAt?: string;
}

export interface IAssignment {
  _id?: string;
  subject: string | ISubject;
  title: string;
  description?: string;
  maxScore: number;
  dueDate?: string;
  createdAt?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface IAttendance {
  _id?: string;
  student: string | IStudent;
  subject: string | ISubject;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  scannedAt?: string;
}

export interface IGrade {
  _id?: string;
  student: string | IStudent;
  assignment: string | IAssignment;
  score: number;
  gradedAt?: string;
  manualCorrection: boolean;
}

// WebSocket Event Constants
export const WS_EVENTS = {
  JOIN_ROOM: 'join_room',
  STUDENT_SCANNED_ATTENDANCE: 'student_scanned_attendance',
  STUDENT_SCANNED_GRADE: 'student_scanned_grade',
};
