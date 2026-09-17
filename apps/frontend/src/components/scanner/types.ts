export type ScanMode = 'attendance' | 'grades';

export type InputSource = 'camera' | 'external';

export interface SubjectOption {
  _id: string;
  name: string;
  code: string;
}

export interface AssignmentOption {
  _id: string;
  title: string;
  code?: string;
  maxScore: number;
}

export interface AttendanceFeedback {
  name: string;
  enrollment: string;
  time: string;
  statusText: string;
  points: number;
  studentId?: string;
}

export interface GradeFeedback {
  name: string;
  enrollment: string;
  time: string;
  points: number;
  score: number;
  action: string;
  studentId?: string;
}

export interface UserProfile {
  role?: string;
  shift?: string;
  entryTime?: string;
  schoolCycle?: string;
  schoolName?: string;
  [key: string]: any;
}
