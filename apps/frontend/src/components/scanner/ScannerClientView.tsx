'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/config/api';
import { soundFeedback } from '@/utils/audioFeedback';
import { usePhysicalScanner } from '@/hooks/usePhysicalScanner';
import EducaNavbar from '@/components/EducaNavbar';
import RealtimeScanTable, { GradeRecord, AttendanceRecord } from '@/components/RealtimeScanTable';
import { connectSocket } from '@/lib/socket';
import { handleAuthError, isTokenExpired } from '@/lib/auth';

import {
  ScanMode,
  InputSource,
  SubjectOption,
  AssignmentOption,
  AttendanceFeedback,
  GradeFeedback,
  UserProfile,
} from './types';
import ScannerHeader from './ScannerHeader';
import ScannerAttendanceKPIs from './ScannerAttendanceKPIs';
import ScannerSourceToggle from './ScannerSourceToggle';
import ScannerGradingControls from './ScannerGradingControls';
import ScannerCameraView from './ScannerCameraView';
import ScannerUsbView from './ScannerUsbView';
import ScanDetailModal from './ScanDetailModal';

const getLocalTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function ScannerClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'grades' or 'attendance'
  const initialMode = searchParams.get('mode') === 'grades' ? 'grades' : 'attendance';
  const initialAssignmentId = searchParams.get('assignmentId') || '';

  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [inputSource, setInputSource] = useState<InputSource>('camera');
  const [gradingScore, setGradingScore] = useState<number>(100);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState<'environment' | 'user'>('environment');

  // Real database subjects & assignments
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId);
  const [totalStudents, setTotalStudents] = useState<number>(36);
  const [attendancePresentCount, setAttendancePresentCount] = useState<number>(28);

  // Dynamic state refs to prevent stale closures in camera and external scanner callbacks
  const scanModeRef = useRef<ScanMode>(initialMode);
  scanModeRef.current = scanMode;

  const selectedAssignmentIdRef = useRef<string>(initialAssignmentId);
  selectedAssignmentIdRef.current = selectedAssignmentId;

  const gradingScoreRef = useRef<number>(gradingScore);
  gradingScoreRef.current = gradingScore;

  const handleProcessScanRef = useRef<(code: string) => Promise<void> | void>(() => {});
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Loading states
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Hardware/Code Input tracking
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScannedSecondsAgo, setLastScannedSecondsAgo] = useState<number | null>(null);

  // Real database records
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Banner Feedback state (null until a real scan occurs)
  const [lastAttendanceFeedback, setLastAttendanceFeedback] = useState<AttendanceFeedback | null>(null);
  const [lastGradeFeedback, setLastGradeFeedback] = useState<GradeFeedback | null>(null);

  // Camera html5-qrcode
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const isCameraRunningRef = useRef(false);
  const isCameraStartingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Scan cooldown & debouncing
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastScannedRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 });
  const lastAnyScanTimestampRef = useRef<number>(0);
  const GLOBAL_COOLDOWN_MS = 2500; // 2.5s entre cualquier escaneo
  const SAME_CODE_COOLDOWN_MS = 4500; // 4.5s para el mismo código QR consecutivo

  // Cooldown countdown timer
  useEffect(() => {
    if (!isCooldown) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          setIsCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCooldown]);

  // Counter timer for "hace X segundos" in Lector USB view
  useEffect(() => {
    if (lastScannedSecondsAgo === null) return;
    const interval = setInterval(() => {
      setLastScannedSecondsAgo((prev) => (prev !== null && prev < 999 ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastScannedSecondsAgo !== null]);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  const formatHeaderDate = () => {
    const now = new Date();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Helper to format scan times
  const formatTime = (isoString?: string | null) => {
    if (!isoString) {
      return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime())
        ? new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
        : d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  // Fetch initial profile
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!savedToken || !savedUser || isTokenExpired(savedToken)) {
      handleAuthError(router);
      return;
    }

    try {
      const u = JSON.parse(savedUser);
      if (u.role === 'SUPER_ADMIN') {
        router.replace('/admin');
        return;
      }
      setCurrentUser(u);
    } catch {
      handleAuthError(router);
      return;
    }

    fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          handleAuthError(router);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((profile) => {
        if (profile) {
          if (profile.role === 'SUPER_ADMIN') {
            router.replace('/admin');
            return;
          }
          setCurrentUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        }
      })
      .catch(() => {});
  }, [router]);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTotalStudents(data.length);
        }
      }
    } catch (err) {
      console.error('Error fetching students count:', err);
    }
  }, []);

  // Fetch Subjects from DB
  const fetchSubjects = useCallback(async () => {
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: SubjectOption[] = await res.json();
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId((prev) => prev || data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, []);

  // Fetch Assignments for subject
  const fetchAssignments = useCallback(async (rawSubjectId: any) => {
    let subjectId = '';
    if (rawSubjectId && rawSubjectId !== 'all') {
      if (typeof rawSubjectId === 'object' && rawSubjectId !== null) {
        subjectId = rawSubjectId._id || rawSubjectId.id || '';
      } else if (typeof rawSubjectId === 'string' && rawSubjectId !== '[object Object]') {
        subjectId = rawSubjectId.trim();
      }
    }

    if (!subjectId) {
      setAssignments([]);
      setSelectedAssignmentId('');
      return;
    }
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/assignments?subjectId=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: AssignmentOption[] = await res.json();
        setAssignments(data);
        if (data.length > 0) {
          if (initialAssignmentId && data.some(a => a._id === initialAssignmentId)) {
            setSelectedAssignmentId(initialAssignmentId);
          } else {
            setSelectedAssignmentId(data[0]._id);
          }
        } else {
          setSelectedAssignmentId('');
        }
      } else if (res.status === 401 || res.status === 403) {
        handleAuthError(router);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  }, [initialAssignmentId, router]);

  // Fetch Grades for assignment
  const fetchGradesForAssignment = useCallback(async (assignmentId: string) => {
    if (!assignmentId) {
      setGradeRecords([]);
      return;
    }
    const token = getAuthToken();
    try {
      setLoadingGrades(true);
      const res = await fetch(`${API_BASE_URL}/grades/assignment?assignmentId=${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: any[] = await res.json();
        const gradedStudents = data.filter(item => item.score !== null && item.score !== undefined);

        gradedStudents.sort((a, b) => {
          const timeA = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
          const timeB = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
          return timeB - timeA;
        });

        const avatarColors = ['bg-[#bbf7d0]', 'bg-[#fef08a]', 'bg-[#bae6fd]', 'bg-[#fecdd3]'];

        const mapped: GradeRecord[] = gradedStudents.map((item, idx) => {
          const score = item.score ?? 0;
          const points = score >= 90 ? 10 : 5;
          const timeStatus = score >= 90 ? 'A tiempo' : 'Tolerancia (+3m)';
          const rowBg = score >= 100 ? 'bg-[#edf9f0]' : score >= 85 ? 'bg-[#fffbf0]' : 'bg-[#fff3f0]';
          const avatarBg = avatarColors[idx % avatarColors.length];

          return {
            id: item.gradeId || item.studentId,
            name: item.name,
            enrollment: item.enrollmentNumber || '#EQR-0000',
            scanTime: formatTime(item.gradedAt),
            timeStatus,
            score,
            points,
            rowBg,
            avatarBg,
            avatarIcon: '',
          };
        });

        setGradeRecords(mapped);
      }
    } catch (err) {
      console.error('Error fetching assignment grades:', err);
    } finally {
      setLoadingGrades(false);
    }
  }, []);

  // Fetch Today Attendance
  const fetchTodayAttendance = useCallback(async () => {
    const token = getAuthToken();
    const today = getLocalTodayDateString();
    try {
      setLoadingAttendance(true);
      const res = await fetch(`${API_BASE_URL}/attendance/daily?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: any[] = await res.json();
        const attended = data.filter(item => item.status === 'PRESENT' || item.status === 'LATE');
        setAttendancePresentCount(attended.length);

        // Ordenamiento determinista: más reciente primero, con desempate por nombre
        attended.sort((a, b) => {
          const timeA = a.scannedAt ? new Date(a.scannedAt).getTime() : 0;
          const timeB = b.scannedAt ? new Date(b.scannedAt).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });

        // Deduplicación estricta por identidad del alumno
        const seenStudentKeys = new Set<string>();
        const uniqueAttended: any[] = [];
        for (const item of attended) {
          const sKey = String(item.studentId || item._id || item.enrollmentNumber || item.name).trim();
          if (!seenStudentKeys.has(sKey)) {
            seenStudentKeys.add(sKey);
            uniqueAttended.push(item);
          }
        }

        const avatarColors = ['bg-[#bae6fd]', 'bg-[#fecdd3]', 'bg-[#fef08a]', 'bg-[#fed7aa]'];

        const mapped: AttendanceRecord[] = uniqueAttended.map((item, idx) => {
          const isLate = item.status === 'LATE';
          const avatarBg = avatarColors[idx % avatarColors.length];
          const studentId = String(item.studentId || item._id || '').trim();

          return {
            id: String(item.attendanceId || item._id || studentId),
            studentId,
            name: item.name,
            enrollment: item.enrollmentNumber ? `#${item.enrollmentNumber.replace(/^#/, '')}` : '#EQR-0000',
            entryTime: formatTime(item.scannedAt),
            entryPoint: isLate ? 'Tolerancia (+3m)' : 'Puerta Principal',
            status: isLate ? 'justified' : 'punctual',
            statusText: isLate ? 'Retardo Justificado' : 'Asistencia Puntual',
            notificationType: isLate ? 'sms' : 'whatsapp',
            notificationText: isLate ? 'SMS Confirmado' : 'WhatsApp Enviado',
            rowBg: isLate ? 'bg-[#fffbf0]' : 'bg-[#edf9f0]',
            avatarBg,
            avatarIcon: '',
          };
        });

        setAttendanceRecords(mapped);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    fetchTodayAttendance();
  }, [fetchStudents, fetchSubjects, fetchTodayAttendance]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchAssignments(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchAssignments]);

  useEffect(() => {
    if (selectedAssignmentId && scanMode === 'grades') {
      fetchGradesForAssignment(selectedAssignmentId);
    }
  }, [selectedAssignmentId, scanMode, fetchGradesForAssignment]);

  // Realtime updates
  const handleNewAttendanceRecord = useCallback((data: any) => {
    const isLate = data.status === 'LATE';
    const studentId = String(
      data.studentId?._id || data.studentId || data.student?._id || data.student || ''
    ).trim();
    const rawEnrollment =
      data.enrollmentNumber ||
      data.studentEnrollment ||
      data.student?.enrollmentNumber ||
      data.student?.enrollment ||
      '';
    const cleanEnrollment = rawEnrollment.replace(/^#/, '').trim() || 'EQR-0000';
    const studentName = String(
      data.studentName || data.name || data.student?.name || 'Alumno Registrado'
    ).trim();

    const scanTimestamp = data.scannedAt || data.timestamp || new Date();
    const scanTimeFormatted = formatTime(scanTimestamp);
    const recordId = String(data.attendanceId || data._id || studentId || `att-${Date.now()}`);

    const newRecord: AttendanceRecord = {
      id: recordId,
      studentId: studentId || undefined,
      name: studentName,
      enrollment: `#${cleanEnrollment}`,
      entryTime: scanTimeFormatted,
      entryPoint: isLate ? 'Tolerancia (+3m)' : 'Puerta Principal',
      status: isLate ? 'justified' : 'punctual',
      statusText: isLate ? 'Retardo Justificado' : 'Asistencia Puntual',
      notificationType: isLate ? 'sms' : 'whatsapp',
      notificationText: isLate ? 'SMS Confirmado' : 'WhatsApp Enviado',
      rowBg: isLate ? 'bg-[#fffbf0]' : 'bg-[#edf9f0]',
      avatarBg: 'bg-[#bae6fd]',
      avatarIcon: '',
    };

    setAttendanceRecords((prev) => {
      const isSameStudent = (r: AttendanceRecord) => {
        if (studentId && r.studentId && r.studentId === studentId) return true;
        if (cleanEnrollment !== 'EQR-0000' && r.enrollment.replace(/^#/, '') === cleanEnrollment) return true;
        if (
          studentName &&
          studentName !== 'Alumno Registrado' &&
          studentName !== 'Estudiante' &&
          r.name.toLowerCase().trim() === studentName.toLowerCase()
        ) {
          return true;
        }
        if (r.id === newRecord.id) return true;
        return false;
      };

      const existingRecord = prev.find(isSameStudent);
      if (!existingRecord) {
        setAttendancePresentCount((count) => count + 1);
      }

      // Eliminar ocurrencia previa para evitar duplicados o triplicados, y colocar al alumno al frente
      const filtered = prev.filter((r) => !isSameStudent(r));
      return [newRecord, ...filtered];
    });

    setLastAttendanceFeedback({
      name: studentName,
      enrollment: cleanEnrollment,
      time: scanTimeFormatted,
      statusText: isLate ? 'Retardo Justificado' : 'Asistencia Puntual',
      points: 5,
      studentId: studentId || newRecord.id,
    });
    setLastScannedCode(`EQR-${cleanEnrollment}-${studentName.toUpperCase().replace(/\s+/g, '-')}`);
    setLastScannedSecondsAgo(0);
  }, []);

  const handleNewGradeRecord = useCallback((data: any) => {
    const score = data.score ?? 100;
    const points = score >= 90 ? 10 : 5;
    const timeStatus = score >= 90 ? 'A tiempo' : 'Tolerancia (+3m)';
    const studentId = String(
      data.studentId?._id || data.studentId || data.student?._id || data.student || ''
    ).trim();
    const rawEnrollment =
      data.enrollmentNumber ||
      data.studentEnrollment ||
      data.student?.enrollmentNumber ||
      data.student?.enrollment ||
      '';
    const cleanEnrollment = rawEnrollment.replace(/^#/, '').trim() || 'EQR-0000';
    const studentName = String(
      data.studentName || data.name || data.student?.name || 'Alumno Registrado'
    ).trim();

    const scanTimestamp = data.gradedAt || data.timestamp || new Date();
    const scanTimeFormatted = formatTime(scanTimestamp);
    const recordId = String(data.gradeId || data._id || studentId || `grd-${Date.now()}`);

    const newRecord: GradeRecord = {
      id: recordId,
      studentId: studentId || undefined,
      name: studentName,
      enrollment: `#${cleanEnrollment}`,
      scanTime: scanTimeFormatted,
      timeStatus,
      score,
      points,
      rowBg: score >= 100 ? 'bg-[#edf9f0]' : score >= 85 ? 'bg-[#fffbf0]' : 'bg-[#fff3f0]',
      avatarBg: 'bg-[#bbf7d0]',
      avatarIcon: '',
    };

    setGradeRecords((prev) => {
      const isSameStudent = (r: GradeRecord) => {
        if (studentId && r.studentId && r.studentId === studentId) return true;
        if (cleanEnrollment !== 'EQR-0000' && r.enrollment.replace(/^#/, '') === cleanEnrollment) return true;
        if (
          studentName &&
          studentName !== 'Alumno Registrado' &&
          studentName !== 'Estudiante' &&
          r.name.toLowerCase().trim() === studentName.toLowerCase()
        ) {
          return true;
        }
        if (r.id === newRecord.id) return true;
        return false;
      };

      const filtered = prev.filter((r) => !isSameStudent(r));
      return [newRecord, ...filtered];
    });

    setLastGradeFeedback({
      name: studentName,
      enrollment: cleanEnrollment,
      time: scanTimeFormatted,
      points,
      score,
      action: data.alreadyGraded ? 'Nota Actualizada' : 'Pase de Lista Exitoso',
      studentId: studentId || newRecord.id,
    });
    setLastScannedCode(`EQR-${cleanEnrollment}-${studentName.toUpperCase().replace(/\s+/g, '-')}`);
    setLastScannedSecondsAgo(0);
  }, []);

  // WebSockets setup
  useEffect(() => {
    const savedUserStr = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (!savedToken || !savedUserStr) return;

    try {
      const parsedUser = JSON.parse(savedUserStr);
      const teacherId = parsedUser.teacherId || parsedUser.id || parsedUser._id;
      if (teacherId) {
        const socket = connectSocket(teacherId, savedToken);

        const handleScan = (data: any) => {
          if (data.type === 'attendance' || data.attendanceId) {
            handleNewAttendanceRecord(data);
          } else if (data.type === 'grade' || data.gradeId) {
            handleNewGradeRecord(data);
          }
        };

        socket.on('newScanRecord', handleScan);

        return () => {
          socket.off('newScanRecord', handleScan);
        };
      }
    } catch (err) {
      console.error('Error al inicializar WebSockets en escáner:', err);
    }
  }, [handleNewAttendanceRecord, handleNewGradeRecord]);

  // Sincronizador resiliente de cola offline ante interrupciones de WiFi escolar
  useEffect(() => {
    const syncOfflineScans = async () => {
      if (typeof window === 'undefined' || !navigator.onLine) return;
      const rawQueue = localStorage.getItem('school_sync_offline_scans');
      if (!rawQueue) return;

      try {
        const queue: { qrCode: string; date: string }[] = JSON.parse(rawQueue);
        if (!Array.isArray(queue) || queue.length === 0) return;

        const token = getAuthToken();
        if (!token) return;

        toast.loading(`Sincronizando ${queue.length} asistencias registradas offline...`, { id: 'offline-sync' });
        const remaining: typeof queue = [];

        for (const item of queue) {
          try {
            const res = await fetch(`${API_BASE_URL}/attendance/scan`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(item),
            });
            if (!res.ok) remaining.push(item);
          } catch {
            remaining.push(item);
          }
        }

        if (remaining.length === 0) {
          localStorage.removeItem('school_sync_offline_scans');
          toast.success('Todas las asistencias offline fueron sincronizadas', { id: 'offline-sync' });
          fetchTodayAttendance();
        } else {
          localStorage.setItem('school_sync_offline_scans', JSON.stringify(remaining));
          toast.error(`${remaining.length} asistencias pendientes de sincronizar`, { id: 'offline-sync' });
        }
      } catch (e) {
        console.error('Error al procesar sincronización offline:', e);
      }
    };

    window.addEventListener('online', syncOfflineScans);
    if (navigator.onLine) {
      syncOfflineScans();
    }

    return () => {
      window.removeEventListener('online', syncOfflineScans);
    };
  }, [fetchTodayAttendance]);

  // QR Scanning Processor
  const handleProcessScan = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const now = Date.now();
    // Cooldown check: evitar ráfagas globales y duplicados del mismo código
    if (now - lastAnyScanTimestampRef.current < GLOBAL_COOLDOWN_MS) {
      return;
    }
    if (trimmed === lastScannedRef.current.code && now - lastScannedRef.current.timestamp < SAME_CODE_COOLDOWN_MS) {
      return;
    }

    lastAnyScanTimestampRef.current = now;
    lastScannedRef.current = { code: trimmed, timestamp: now };
    setIsCooldown(true);
    setCooldownRemaining(3);

    soundFeedback.playSuccess();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(120);
    }

    const token = getAuthToken();
    const currentMode = scanModeRef.current;
    const currentAssignmentId = selectedAssignmentIdRef.current;
    const currentScore = gradingScoreRef.current;

    if (currentMode === 'grades') {
      if (!currentAssignmentId) {
        toast.error('Por favor selecciona una tarea para calificar');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/grades/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignmentId: currentAssignmentId,
            qrCode: trimmed,
            score: currentScore,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al escanear calificación');
        }

        const gradeResult = await res.json();
        const studentName = gradeResult.student?.name || 'Alumno Registrado';

        handleNewGradeRecord({
          gradeId: gradeResult._id,
          studentId: gradeResult.student?._id || gradeResult.student,
          studentName,
          enrollmentNumber: gradeResult.student?.enrollmentNumber,
          score: gradeResult.score ?? currentScore,
          gradedAt: gradeResult.gradedAt || new Date(),
          alreadyGraded: gradeResult.alreadyGraded,
        });

        if (gradeResult.alreadyGraded) {
          toast.success(`${studentName} ya calificado (Nota: ${currentScore} pts)`);
        } else {
          toast.success(`Calificación guardada: ${studentName} (${currentScore} pts)`);
        }
      } catch (err: any) {
        soundFeedback.playError();
        toast.error(err.message || 'Error al registrar calificación');
      }
    } else {
      const todayStr = getLocalTodayDateString();

      try {
        const res = await fetch(`${API_BASE_URL}/attendance/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ qrCode: trimmed, date: todayStr }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al registrar asistencia');
        }

        const attendanceResult = await res.json();
        const studentName = attendanceResult.student?.name || 'Alumno Registrado';

        handleNewAttendanceRecord({
          attendanceId: attendanceResult._id,
          studentId: attendanceResult.student?._id || attendanceResult.student,
          studentName,
          enrollmentNumber: attendanceResult.student?.enrollmentNumber,
          status: attendanceResult.status,
          scannedAt: attendanceResult.scannedAt || new Date(),
          alreadyScanned: attendanceResult.alreadyScanned,
        });

        if (attendanceResult.alreadyScanned) {
          toast.success(`${studentName} ya había registrado asistencia hoy`);
        } else {
          toast.success(`Asistencia registrada: ${studentName}`);
        }
      } catch (err: any) {
        const isNetworkDrop = typeof navigator !== 'undefined' && (!navigator.onLine || err?.message?.includes('Failed to fetch') || err?.name === 'TypeError');
        if (isNetworkDrop) {
          // Encolar asistencia localmente ante corte de conexión en el aula
          const queueKey = 'school_sync_offline_scans';
          const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
          queue.push({ qrCode: trimmed, date: todayStr });
          localStorage.setItem(queueKey, JSON.stringify(queue));

          soundFeedback.playSuccess();
          toast('📶 Sin conexión: Asistencia guardada localmente. Se sincronizará automáticamente al volver el WiFi.', {
            duration: 5000,
            icon: '💾',
          });
        } else {
          soundFeedback.playError();
          toast.error(err.message || 'Error al registrar asistencia');
        }
      }
    }
  }, [handleNewGradeRecord, handleNewAttendanceRecord]);

  handleProcessScanRef.current = handleProcessScan;

  usePhysicalScanner({
    onScan: (code) => {
      if (handleProcessScanRef.current) {
        handleProcessScanRef.current(code);
      }
    },
    enabled: inputSource === 'external',
    maxIntervalMs: 40,
    minLength: 3,
    preventDefaultOnEnter: true,
  });

  const startCamera = async () => {
    if (typeof window === 'undefined') return;
    if (isCameraStartingRef.current || isCameraRunningRef.current) return;
    isCameraStartingRef.current = true;

    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode('html5-reader');
      }

      let cameraConfig: any = { facingMode: activeCameraId };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          if (activeCameraId === 'environment') {
            const backCam = cameras.find(c => 
              c.label.toLowerCase().includes('back') || 
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('trasera') ||
              c.label.toLowerCase().includes('ambiente')
            );
            cameraConfig = backCam ? backCam.id : cameras[0].id;
          } else {
            const frontCam = cameras.find(c => 
              c.label.toLowerCase().includes('front') || 
              c.label.toLowerCase().includes('user') ||
              c.label.toLowerCase().includes('delantera')
            );
            cameraConfig = frontCam ? frontCam.id : cameras[0].id;
          }
        }
      } catch (deviceErr) {
        console.warn('Could not enumerate cameras, falling back to facingMode:', deviceErr);
        cameraConfig = { facingMode: activeCameraId };
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        if (handleProcessScanRef.current) {
          handleProcessScanRef.current(decodedText);
        }
      };

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.75);
          return {
            width: Math.max(220, Math.min(320, qrboxSize)),
            height: Math.max(220, Math.min(320, qrboxSize)),
          };
        },
        aspectRatio: 1.777778,
      };

      await qrScannerRef.current.start(
        cameraConfig,
        config,
        qrCodeSuccessCallback,
        () => {}
      );

      // Si el componente se desmontó mientras la cámara iniciaba, abortar y detenerla
      if (isCancelledRef.current) {
        if (qrScannerRef.current?.isScanning) {
          await qrScannerRef.current.stop();
        }
        return;
      }

      isCameraRunningRef.current = true;
      setCameraReady(true);
    } catch (e: any) {
      console.warn('Cámara no disponible o bloqueada:', e);
      try {
        if (qrScannerRef.current && !isCameraRunningRef.current && !isCancelledRef.current) {
          await qrScannerRef.current.start(
            { facingMode: 'user' },
            { fps: 15, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              if (handleProcessScanRef.current) {
                handleProcessScanRef.current(decodedText);
              }
            },
            () => {}
          );

          if (isCancelledRef.current) {
            if (qrScannerRef.current?.isScanning) {
              await qrScannerRef.current.stop();
            }
            return;
          }

          isCameraRunningRef.current = true;
          setCameraReady(true);
        }
      } catch (fallbackErr) {
        setCameraReady(false);
        toast.error('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
      }
    } finally {
      isCameraStartingRef.current = false;
    }
  };

  const stopCamera = async () => {
    isCancelledRef.current = true;
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
      } catch (e) {
        console.warn('Error deteniendo cámara:', e);
      } finally {
        isCameraRunningRef.current = false;
        isCameraStartingRef.current = false;
        setIsTorchOn(false);
        setCameraReady(false);
      }
    }
  };

  useEffect(() => {
    if (inputSource === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputSource, activeCameraId]);

  const toggleTorch = async () => {
    if (!qrScannerRef.current || !isCameraRunningRef.current) return;
    try {
      await (qrScannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: !isTorchOn }],
      });
      setIsTorchOn(prev => !prev);
    } catch (e) {
      toast.error('Linterna no disponible en este dispositivo');
    }
  };

  const attendancePercent = totalStudents > 0 ? Math.round((attendancePresentCount / totalStudents) * 100) : 0;

  if (currentUser?.role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans select-none">
        <div className="text-slate-500 font-bold text-sm animate-pulse">
          Redirigiendo al panel de administración...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 relative">
      {/* ===== HEADER DE NAVEGACIÓN EDUCANAVBAR ===== */}
      <EducaNavbar activeTab="scanner" />

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-8 mt-6 space-y-7">
        {/* ===== BARRA SUPERIOR: TÍTULO 'Escáner QR' Y SELECTOR DE MODO ===== */}
        <ScannerHeader
          scanMode={scanMode}
          onScanModeChange={setScanMode}
        />

        {/* ===== FILA DE KPI CARDS (FECHA & ALUMNOS) - SOLO EN MODO PASE DE LISTA ===== */}
        {scanMode === 'attendance' && (
          <ScannerAttendanceKPIs
            formattedDate={formatHeaderDate()}
            attendancePresentCount={attendancePresentCount}
            totalStudents={totalStudents}
            attendancePercent={attendancePercent}
            onNavigateToDashboard={() => router.push('/dashboard')}
          />
        )}

        {/* ===== SELECTOR DE DISPOSITIVO: CÁMARA WEB HD VS LECTOR USB FÍSICO ===== */}
        <ScannerSourceToggle
          inputSource={inputSource}
          onSourceChange={setInputSource}
        />

        {/* ===== CONTROLES ADICIONALES PARA TAREAS (Si está en modo Calificar) ===== */}
        {scanMode === 'grades' && (
          <ScannerGradingControls
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSubjectChange={setSelectedSubjectId}
            assignments={assignments}
            selectedAssignmentId={selectedAssignmentId}
            onAssignmentChange={setSelectedAssignmentId}
            gradingScore={gradingScore}
            onGradingScoreChange={setGradingScore}
          />
        )}

        {/* ===== VISOR DE CÁMARA O LECTOR USB FÍSICO ===== */}
        {inputSource === 'camera' ? (
          <ScannerCameraView
            cameraContainerRef={cameraContainerRef}
            cameraReady={cameraReady}
            isCooldown={isCooldown}
            cooldownRemaining={cooldownRemaining}
            isTorchOn={isTorchOn}
            onToggleTorch={toggleTorch}
            onSwitchCamera={() =>
              setActiveCameraId((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            scanMode={scanMode}
            attendanceFeedback={lastAttendanceFeedback}
            gradeFeedback={lastGradeFeedback}
            onOpenDetail={() => setDetailModalOpen(true)}
          />
        ) : (
          <ScannerUsbView
            isCooldown={isCooldown}
            cooldownRemaining={cooldownRemaining}
            lastScannedCode={lastScannedCode}
            lastScannedSecondsAgo={lastScannedSecondsAgo}
            onCodeChange={setLastScannedCode}
            onSubmitScan={handleProcessScan}
            scanMode={scanMode}
            attendanceFeedback={lastAttendanceFeedback}
            gradeFeedback={lastGradeFeedback}
            onOpenDetail={() => setDetailModalOpen(true)}
          />
        )}

        {/* ===== SECCIÓN: REGISTRO DE DATOS EN TIEMPO REAL ===== */}
        <RealtimeScanTable
          scanMode={scanMode}
          gradeRecords={gradeRecords}
          attendanceRecords={attendanceRecords}
          loadingGrades={loadingGrades}
          loadingAttendance={loadingAttendance}
          onOpenHistory={() => router.push('/attendance')}
        />
      </main>

      {/* ===== MODAL DE DETALLE DE ALUMNO ===== */}
      <ScanDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        scanMode={scanMode}
        attendanceFeedback={lastAttendanceFeedback}
        gradeFeedback={lastGradeFeedback}
      />
    </div>
  );
}
