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

export default function ScannerClientView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'grades' or 'attendance'
  const initialMode = searchParams.get('mode') === 'grades' ? 'grades' : 'attendance';
  const initialAssignmentId = searchParams.get('assignmentId') || '';

  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [inputSource, setInputSource] = useState<InputSource>('camera');
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
      isCameraRunningRef.current = true;
      setCameraReady(true);
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
