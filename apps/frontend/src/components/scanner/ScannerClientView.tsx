'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, SlidersHorizontal, Users, Camera, Usb, Zap, RotateCcw, 
  QrCode, Check, UserCheck, Clock, DoorOpen, 
  ChevronDown, History, Barcode, ScanLine, MoreHorizontal, User, 
  X, CheckCircle2, ShieldCheck, ClipboardCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Button, Badge, Input } from '@/components/ui';
import { API_BASE_URL } from '@/config/api';
import { soundFeedback } from '@/utils/audioFeedback';
import { usePhysicalScanner } from '@/hooks/usePhysicalScanner';
import EducaNavbar from '@/components/EducaNavbar';
import RealtimeScanTable, { GradeRecord, AttendanceRecord } from '@/components/RealtimeScanTable';
import { connectSocket } from '@/lib/socket';

interface SubjectOption {
  _id: string;
  name: string;
  code: string;
}

interface AssignmentOption {
  _id: string;
  title: string;
  code?: string;
  maxScore: number;
}

export default function ScannerClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'grades' or 'attendance'
  const initialMode = searchParams.get('mode') === 'grades' ? 'grades' : 'attendance';
  const initialAssignmentId = searchParams.get('assignmentId') || '';

  const [scanMode, setScanMode] = useState<'attendance' | 'grades'>(initialMode);
  const [inputSource, setInputSource] = useState<'camera' | 'external'>('camera');
  const [selectedGroup, setSelectedGroup] = useState('Grupo 3° B');
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
  const scanModeRef = useRef<'attendance' | 'grades'>(initialMode);
  scanModeRef.current = scanMode;

  const selectedAssignmentIdRef = useRef<string>(initialAssignmentId);
  selectedAssignmentIdRef.current = selectedAssignmentId;

  const gradingScoreRef = useRef<number>(gradingScore);
  gradingScoreRef.current = gradingScore;

  const handleProcessScanRef = useRef<(code: string) => Promise<void> | void>(() => {});
  const [currentUser, setCurrentUser] = useState<{
    role?: string;
    shift?: string;
    entryTime?: string;
    schoolCycle?: string;
    schoolName?: string;
    [key: string]: any;
  } | null>(null);

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
  const [lastAttendanceFeedback, setLastAttendanceFeedback] = useState<{
    name: string;
    enrollment: string;
    time: string;
    statusText: string;
    points: number;
    studentId?: string;
  } | null>(null);

  const [lastGradeFeedback, setLastGradeFeedback] = useState<{
    name: string;
    enrollment: string;
    time: string;
    points: number;
    score: number;
    action: string;
    studentId?: string;
  } | null>(null);

  // Camera html5-qrcode
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const isCameraRunningRef = useRef(false);
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);

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

    if (!savedToken || !savedUser) {
      router.replace('/login');
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
      router.replace('/login');
      return;
    }

    fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
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
          if (data[0].group) {
            setSelectedGroup(data[0].group);
          }
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
        if (data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, [selectedSubjectId]);

  // Fetch Assignments for subject
  const fetchAssignments = useCallback(async (subjectId: string) => {
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
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  }, [initialAssignmentId]);

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
    const today = new Date().toISOString().split('T')[0];
    try {
      setLoadingAttendance(true);
      const res = await fetch(`${API_BASE_URL}/attendance/daily?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: any[] = await res.json();
        const attended = data.filter(item => item.status === 'PRESENT' || item.status === 'LATE');
        setAttendancePresentCount(attended.length);

        attended.sort((a, b) => {
          const timeA = a.scannedAt ? new Date(a.scannedAt).getTime() : 0;
          const timeB = b.scannedAt ? new Date(b.scannedAt).getTime() : 0;
          return timeB - timeA;
        });

        const avatarColors = ['bg-[#bae6fd]', 'bg-[#fecdd3]', 'bg-[#fef08a]', 'bg-[#fed7aa]'];

        const mapped: AttendanceRecord[] = attended.map((item, idx) => {
          const isLate = item.status === 'LATE';
          const avatarBg = avatarColors[idx % avatarColors.length];

          return {
            id: item.attendanceId || item.studentId,
            name: item.name,
            enrollment: item.enrollmentNumber || '#EQR-0000',
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
    const cleanEnrollment = (data.enrollmentNumber || '#EQR-0000').replace(/^#/, '');

    const newRecord: AttendanceRecord = {
      id: data.attendanceId || data.studentId || `att-${Date.now()}`,
      name: data.studentName || data.name || 'Alumno Registrado',
      enrollment: `#${cleanEnrollment}`,
      entryTime: formatTime(data.scannedAt),
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
      const exists = prev.some(
        (r) =>
          r.id === newRecord.id ||
          (r.enrollment && r.enrollment !== '#EQR-0000' && r.enrollment === newRecord.enrollment) ||
          r.name === newRecord.name
      );

      if (exists) {
        return prev.map((r) =>
          r.id === newRecord.id || r.enrollment === newRecord.enrollment || r.name === newRecord.name
            ? { ...r, entryTime: newRecord.entryTime }
            : r
        );
      }

      setAttendancePresentCount((count) => count + 1);
      return [newRecord, ...prev];
    });

    setLastAttendanceFeedback({
      name: newRecord.name,
      enrollment: cleanEnrollment,
      time: newRecord.entryTime,
      statusText: isLate ? 'Retardo Justificado' : 'Asistencia Puntual',
      points: 5,
      studentId: newRecord.id,
    });
    setLastScannedCode(`EQR-${cleanEnrollment}-${newRecord.name.toUpperCase().replace(/\s+/g, '-')}`);
    setLastScannedSecondsAgo(0);
  }, []);

  const handleNewGradeRecord = useCallback((data: any) => {
    const score = data.score ?? 100;
    const points = score >= 90 ? 10 : 5;
    const timeStatus = score >= 90 ? 'A tiempo' : 'Tolerancia (+3m)';
    const cleanEnrollment = (data.enrollmentNumber || '#EQR-0000').replace(/^#/, '');

    const newRecord: GradeRecord = {
      id: data.gradeId || data.studentId || `grd-${Date.now()}`,
      name: data.studentName || data.name || 'Alumno Registrado',
      enrollment: `#${cleanEnrollment}`,
      scanTime: formatTime(data.gradedAt),
      timeStatus,
      score,
      points,
      rowBg: score >= 100 ? 'bg-[#edf9f0]' : score >= 85 ? 'bg-[#fffbf0]' : 'bg-[#fff3f0]',
      avatarBg: 'bg-[#bbf7d0]',
      avatarIcon: '',
    };

    setGradeRecords((prev) => {
      const filtered = prev.filter(
        (r) =>
          r.id !== newRecord.id &&
          (r.enrollment === '#EQR-0000' || r.enrollment !== newRecord.enrollment) &&
          r.name !== newRecord.name
      );
      return [newRecord, ...filtered];
    });

    setLastGradeFeedback({
      name: newRecord.name,
      enrollment: cleanEnrollment,
      time: newRecord.scanTime,
      points,
      score,
      action: data.alreadyGraded ? 'Nota Actualizada' : 'Pase de Lista Exitoso',
      studentId: newRecord.id,
    });
    setLastScannedCode(`EQR-${cleanEnrollment}-${newRecord.name.toUpperCase().replace(/\s+/g, '-')}`);
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
        socket.on('student_scanned_attendance', (data) => handleScan({ type: 'attendance', ...data }));
        socket.on('student_scanned_grade', (data) => handleScan({ type: 'grade', ...data }));

        return () => {
          socket.off('newScanRecord', handleScan);
          socket.off('student_scanned_attendance');
          socket.off('student_scanned_grade');
        };
      }
    } catch (err) {
      console.error('Error al inicializar WebSockets en escáner:', err);
    }
  }, [handleNewAttendanceRecord, handleNewGradeRecord]);

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
      try {
        const todayStr = (() => {
          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const d = String(now.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        })();

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
        soundFeedback.playError();
        toast.error(err.message || 'Error al registrar asistencia');
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
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode('html5-reader');
      }
      if (!isCameraRunningRef.current) {
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
        isCameraRunningRef.current = true;
      }
    } catch (e: any) {
      console.warn('Cámara no disponible o bloqueada:', e);
      try {
        if (qrScannerRef.current && !isCameraRunningRef.current) {
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
          isCameraRunningRef.current = true;
        }
      } catch (fallbackErr) {
        toast.error('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
      }
    }
  };

  const stopCamera = async () => {
    if (qrScannerRef.current && isCameraRunningRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (e) {
        console.warn('Error deteniendo cámara:', e);
      } finally {
        isCameraRunningRef.current = false;
        setIsTorchOn(false);
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
        
        {/* ===== BARRA SUPERIOR: TÍTULO 'Escáner QR' Y SELECTOR 'Pase de Lista / Calificar Tarea' ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Escáner QR
            </h1>

            {/* Selector de Modo: Pase de Lista vs Calificar Tarea */}
            <div className="inline-flex bg-slate-100 p-1 rounded-full border border-slate-200/70 shadow-2xs">
              <button
                type="button"
                onClick={() => setScanMode('attendance')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  scanMode === 'attendance'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900 bg-transparent'
                }`}
              >
                <SlidersHorizontal size={15} className={scanMode === 'attendance' ? 'text-sky-600' : 'text-slate-400'} />
                <span>Pase de Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('grades')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  scanMode === 'grades'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900 bg-transparent'
                }`}
              >
                <ClipboardCheck size={15} className={scanMode === 'grades' ? 'text-amber-500' : 'text-slate-400'} />
                <span>Calificar Tarea</span>
              </button>
            </div>
          </div>

          {/* Badges de Hardware Status */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white border border-slate-200/80 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span>Cámara HD • Lector USB Listo</span>
            </div>
          </div>
        </div>

        {/* ===== FILA DE KPI CARDS (FECHA & ALUMNOS) - SOLO EN MODO PASE DE LISTA ===== */}
        {scanMode === 'attendance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            
            {/* Card 1: FECHA DE ASISTENCIA */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 px-6 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100/80 text-sky-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Calendar size={20} className="stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                    Fecha de Asistencia
                  </span>
                  <span className="text-base font-black text-slate-800 tracking-tight">
                    {formatHeaderDate()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                title="Filtrar por fecha en Dashboard"
                className="text-slate-300 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>

            {/* Card 2: ALUMNOS PRESENTES */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 px-6 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Users size={20} className="stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
                    Alumnos Presentes
                  </span>
                  <span className="text-base font-black text-slate-900 tracking-tight">
                    {attendancePresentCount}{' '}
                    <span className="text-slate-400 text-xs font-semibold">
                      / {totalStudents || 36} registrados
                    </span>
                  </span>
                </div>
              </div>
              <div className="bg-emerald-100/70 border border-emerald-200/60 text-emerald-700 font-black text-xs px-3 py-1 rounded-full">
                {attendancePercent}%
              </div>
            </div>
          </div>
        )}

        {/* ===== SELECTOR DE DISPOSITIVO: CÁMARA WEB HD VS LECTOR USB FÍSICO ===== */}
        <div className="flex justify-center my-2">
          <div className="inline-flex items-center bg-white p-1.5 rounded-full border border-slate-200/90 shadow-2xs gap-1.5">
            
            {/* Botón Cámara Web HD */}
            <button
              type="button"
              onClick={() => setInputSource('camera')}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                inputSource === 'camera'
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Camera size={16} className="stroke-[2.5]" />
              <span>Cámara Web HD</span>
              {inputSource === 'camera' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
              )}
            </button>

            {/* Botón Lector USB Físico */}
            <button
              type="button"
              onClick={() => setInputSource('external')}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                inputSource === 'external'
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <ScanLine size={16} className="stroke-[2.5]" />
              <span>Lector USB Físico</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                inputSource === 'external'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                Plug & Play
              </span>
            </button>
          </div>
        </div>

        {/* CONTROLES ADICIONALES PARA TAREAS (Si está en modo Calificar) */}
        {scanMode === 'grades' && (
          <div className="max-w-4xl mx-auto bg-[#e6f4fe] border border-sky-100/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0284c7] pl-1">Materia:</label>
                <div className="relative">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-slate-800 appearance-none shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0284c7] pl-1">Tarea Activa:</label>
                <div className="relative">
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-slate-800 appearance-none shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {assignments.map((asg) => (
                      <option key={asg._id} value={asg._id}>{asg.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0284c7] pl-1">Puntos a Asignar:</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={gradingScore}
                  onChange={(e) => setGradingScore(parseFloat(e.target.value) || 0)}
                  className="text-center font-black text-lg text-[#0284c7] bg-white border border-slate-200/80 rounded-2xl py-1 shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== VISTA 1: MODO CÁMARA (VIDEO LIMPIO SIN FONDOS OSCUROS Y ESCANEO EN TIEMPO REAL) ===== */}
        {inputSource === 'camera' ? (
          <div className="max-w-4xl mx-auto">
            <div
              ref={cameraContainerRef}
              className="bg-black rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]"
            >
              {/* VIDEO DE LA CÁMARA: Renderizado real nítido y visible al 100% */}
              <div
                id="html5-reader"
                className="absolute inset-0 w-full h-full overflow-hidden rounded-[32px] z-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_span]:hidden [&_img]:hidden [&_button]:hidden [&_div]:!border-0 opacity-100"
              />

              {/* Fila Superior interna del Visor */}
              <div className="w-full flex items-center justify-between z-10">
                {/* Badge Escáner Activo */}
                <div className="bg-slate-900/85 border border-slate-700/80 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${isCooldown ? 'bg-amber-400' : 'bg-[#84cc16] animate-pulse'}`} />
                  <span>
                    {isCooldown ? `Pausa activa (${cooldownRemaining}s)` : 'Escáner Activo • Detección Automática de QR'}
                  </span>
                </div>

                {/* Botones de Control de Cámara */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTorch}
                    title="Linterna"
                    className={`w-9 h-9 rounded-full border border-slate-700/80 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
                      isTorchOn ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800/80 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Zap size={16} className={isTorchOn ? 'fill-current' : ''} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCameraId((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                    title="Cambiar Cámara"
                    className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

              {/* Recuadro / Framer de captura dentro de la cámara */}
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 mx-auto my-6 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-full h-full rounded-3xl border-2 border-white/40 relative">
                  {/* 4 Esquinas destacadas del framer */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-sky-400 rounded-tl-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-sky-400 rounded-tr-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-sky-400 rounded-bl-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-sky-400 rounded-br-2xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                </div>
              </div>

              {/* Banner Inferior: Solo visible cuando hay un escaneo activo en la sesión */}
              {scanMode === 'attendance' && lastAttendanceFeedback && (
                <div className="w-full bg-[#131E3A]/95 border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-xl z-10 animate-fade-in">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm sm:text-base truncate">
                          ¡Pase de Lista Exitoso!
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-md shrink-0">
                          +{lastAttendanceFeedback.points} Pts
                        </span>
                      </div>
                      <div className="text-slate-300 text-xs font-semibold truncate mt-0.5">
                        <strong className="text-white font-bold">{lastAttendanceFeedback.name}</strong> • #{lastAttendanceFeedback.enrollment} • {lastAttendanceFeedback.time}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <History size={15} />
                    <span>Ver Detalle</span>
                  </button>
                </div>
              )}

              {scanMode === 'grades' && lastGradeFeedback && (
                <div className="w-full bg-[#131E3A]/95 border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-xl z-10 animate-fade-in">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm sm:text-base truncate">
                          ¡Calificación Guardada!
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-md shrink-0">
                          {lastGradeFeedback.score} Pts
                        </span>
                      </div>
                      <div className="text-slate-300 text-xs font-semibold truncate mt-0.5">
                        <strong className="text-white font-bold">{lastGradeFeedback.name}</strong> • #{lastGradeFeedback.enrollment} • {lastGradeFeedback.time}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    <History size={15} />
                    <span>Ver Detalle</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== VISTA 2: MODO LECTOR ÓPTICO USB (IMAGEN 2) ===== */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* Encabezado del Lector USB */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] border border-emerald-200/80 text-[#15803d] flex items-center justify-center shrink-0 shadow-2xs">
                    <ScanLine size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Lector Óptico USB Conectado y Listo
                      </h2>
                      <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                        Plug & Play Reconocido
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Modo HID Emulación Teclado USB • Entrada continua sin retraso
                    </p>
                  </div>
                </div>

                <button type="button" className="text-slate-300 hover:text-slate-600 p-1 cursor-pointer">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Cuerpo en Dos Columnas: Ilustración + Zona de Entrada Continua */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Columna Izquierda: Ilustración de Credencial y Pistola Escáner */}
                <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
                  {/* Ilustración Gráfica */}
                  <div className="relative flex items-center justify-center w-full py-3">
                    
                    {/* Tarjeta / Credencial */}
                    <div className="w-24 h-32 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2 flex flex-col items-center justify-between relative">
                      {/* Avatar del Alumno en la credencial */}
                      <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mt-1">
                        <User size={18} className="stroke-[2.5]" />
                      </div>
                      
                      {/* Líneas de datos */}
                      <div className="w-full space-y-1 px-1">
                        <div className="w-full h-1 bg-slate-200 rounded-full" />
                        <div className="w-2/3 h-1 bg-slate-200 rounded-full" />
                      </div>

                      {/* Código QR en credencial */}
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center p-1 mb-1">
                        <QrCode size={20} />
                      </div>

                      {/* Haz de Láser Rojo que escanea la credencial */}
                      <div className="absolute -left-8 right-0 top-1/2 -translate-y-1/2 h-1 bg-rose-500 shadow-[0_0_12px_#f43f5e] z-10" />
                    </div>

                    {/* Pistola Escáner USB */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="w-12 h-10 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center text-sky-400 shadow-md">
                        <Barcode size={22} className="stroke-[2.2]" />
                      </div>
                    </div>
                  </div>

                  {/* Texto de instrucción bajo la ilustración */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      Apunta el lector a la credencial física
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium max-w-[240px] mx-auto mt-0.5 leading-tight">
                      Reconocimiento instantáneo por disparo o gatillo óptico
                    </p>
                  </div>
                </div>

                {/* Columna Derecha: Zona de Entrada Continua con Autofocus */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500 tracking-wider uppercase">
                      Zona de Entrada Continua (Autofocus Activo)
                    </span>
                    {isCooldown ? (
                      <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-600 animate-spin" />
                        Pausa activa ({cooldownRemaining}s)
                      </span>
                    ) : (
                      <span className="text-xs font-black text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        Listo para disparar
                      </span>
                    )}
                  </div>

                  {/* Input Box Grande con Borde Neón Sky */}
                  <div className="w-full bg-white border-2 border-sky-400 rounded-2xl p-3.5 px-4 flex items-center justify-between shadow-[0_0_15px_rgba(56,189,248,0.2)] focus-within:ring-2 focus-within:ring-sky-400/40 transition-all">
                    <div className="text-sky-500 shrink-0">
                      <ScanLine size={20} className="stroke-[2.5]" />
                    </div>

                    <input
                      type="text"
                      autoFocus
                      value={lastScannedCode}
                      onChange={(e) => setLastScannedCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && lastScannedCode.trim()) {
                          handleProcessScan(lastScannedCode);
                        }
                      }}
                      placeholder="Esperando lectura de credencial..."
                      className="w-full bg-transparent font-mono font-black text-sm sm:text-base text-slate-800 tracking-wider px-3 focus:outline-none placeholder:text-slate-300"
                    />

                    <div className="w-7 h-7 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  </div>

                  {/* Indicador de último código decodificado */}
                  {lastScannedCode && lastScannedSecondsAgo !== null && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#15803d] pl-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                      <span>
                        Último código decodificado hace {lastScannedSecondsAgo} segundos • Registro sincronizado con éxito
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Banner Inferior: Solo visible cuando hay un escaneo activo en la sesión */}
              {scanMode === 'attendance' && lastAttendanceFeedback && (
                <div className="w-full bg-[#ecfdf5] border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs animate-fade-in">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <User size={22} className="stroke-[2.5]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-900 font-black text-sm sm:text-base truncate">
                          {lastAttendanceFeedback.name}
                        </span>
                        <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                          • {lastAttendanceFeedback.statusText}
                        </span>
                        <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                          +{lastAttendanceFeedback.points} Pts
                        </span>
                      </div>
                      <div className="text-slate-600 text-xs font-bold truncate mt-0.5">
                        Matrícula: <strong className="text-slate-800">#{lastAttendanceFeedback.enrollment}</strong> • Hora de entrada: <strong className="text-slate-800">{lastAttendanceFeedback.time}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs transition-all shrink-0 cursor-pointer"
                  >
                    <History size={15} />
                    <span>Ver Detalle</span>
                  </button>
                </div>
              )}

              {scanMode === 'grades' && lastGradeFeedback && (
                <div className="w-full bg-[#ecfdf5] border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs animate-fade-in">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <ClipboardCheck size={22} className="stroke-[2.5]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-900 font-black text-sm sm:text-base truncate">
                          {lastGradeFeedback.name}
                        </span>
                        <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                          • {lastGradeFeedback.action}
                        </span>
                        <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-black px-2.5 py-0.5 rounded-full">
                          Nota: {lastGradeFeedback.score} pts
                        </span>
                      </div>
                      <div className="text-slate-600 text-xs font-bold truncate mt-0.5">
                        Matrícula: <strong className="text-slate-800">#{lastGradeFeedback.enrollment}</strong> • Hora: <strong className="text-slate-800">{lastGradeFeedback.time}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs transition-all shrink-0 cursor-pointer"
                  >
                    <History size={15} />
                    <span>Ver Detalle</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ===== SECCIÓN: REGISTRO DE DATOS EN TIEMPO REAL ===== */}
        <RealtimeScanTable
          scanMode={scanMode}
          gradeRecords={gradeRecords}
          attendanceRecords={attendanceRecords}
          loadingGrades={loadingGrades}
          loadingAttendance={loadingAttendance}
        />

      </main>

      {/* ===== MODAL DE DETALLE DE ALUMNO ===== */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <UserCheck size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Detalle de Registro
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Sincronizado en tiempo real
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {scanMode === 'attendance' && lastAttendanceFeedback && (
              <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Estudiante:</span>
                    <span className="font-black text-slate-900 text-sm">{lastAttendanceFeedback.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Matrícula:</span>
                    <span className="font-bold text-slate-800">#{lastAttendanceFeedback.enrollment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Estado:</span>
                    <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[11px]">
                      {lastAttendanceFeedback.statusText}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Hora Registrada:</span>
                    <span className="font-bold text-slate-800">{lastAttendanceFeedback.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Puntos Obtenidos:</span>
                    <span className="font-black text-emerald-600">+{lastAttendanceFeedback.points} Pts</span>
                  </div>
                </div>
              </div>
            )}

            {scanMode === 'grades' && lastGradeFeedback && (
              <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Estudiante:</span>
                    <span className="font-black text-slate-900 text-sm">{lastGradeFeedback.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Matrícula:</span>
                    <span className="font-bold text-slate-800">#{lastGradeFeedback.enrollment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Acción:</span>
                    <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[11px]">
                      {lastGradeFeedback.action}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Hora Registrada:</span>
                    <span className="font-bold text-slate-800">{lastGradeFeedback.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Calificación / Nota:</span>
                    <span className="font-black text-emerald-600">{lastGradeFeedback.score} Pts</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => setDetailModalOpen(false)}
                className="w-full py-2.5 font-black text-xs rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white cursor-pointer"
              >
                Cerrar Detalle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
