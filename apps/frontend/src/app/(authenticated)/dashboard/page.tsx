'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Users, FileText, CheckSquare, Plus, Calendar, RefreshCw, Award, Radio, QrCode, 
  Search, Trash2, Check, X, Download, TrendingUp, User, UserCheck, UserX, Clock, Globe, FlaskConical, Calculator, ArrowLeft, Eye, ChevronLeft, ChevronRight, School, AlertCircle, EyeOff, ShieldAlert, Key
} from 'lucide-react';

import { useLayout } from '../layout-context';
import { API_BASE_URL } from '@/config/api';
import StatCard from '@/components/StatCard';
import SubjectCard from '@/components/SubjectCard';
import CreateSubjectModal, { SUBJECT_ICON_OPTIONS, SUBJECT_COLOR_OPTIONS } from '@/components/CreateSubjectModal';
import CreateAssignmentModal from '@/components/CreateAssignmentModal';
import StudentQrModal from '@/components/StudentQrModal';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    token, 
    user, 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    socket, 
    unreadNotifications, 
    setUnreadNotifications, 
    syncLogs, 
    addLog 
  } = useLayout();

  // Business Data State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [gradeList, setGradeList] = useState<any[]>([]);

  // Loading & Error States
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [errorSubjects, setErrorSubjects] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorStudents, setErrorStudents] = useState('');
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [errorAssignments, setErrorAssignments] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [errorAttendance, setErrorAttendance] = useState('');
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [errorGrades, setErrorGrades] = useState('');

  // Selected entities for detail views
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modals state
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [activeQrStudent, setActiveQrStudent] = useState<any>(null);

  // Student detail inspection state
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [studentSummary, setStudentSummary] = useState<any>(null);
  const [studentSummaryLoading, setStudentSummaryLoading] = useState(false);
  const [studentSummaryError, setStudentSummaryError] = useState('');

  // Forms state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEnrollment, setNewStudentEnrollment] = useState('');

  // Change password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Set default selected date once mounted
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Fetch initial lists when token is available
  useEffect(() => {
    if (token) {
      fetchSubjects(token);
      fetchStudents(token);
    }
  }, [token]);

  // Load lists dynamically when selectedSubject or activeTab or selectedDate changes
  useEffect(() => {
    if (token) {
      if (selectedSubject) {
        fetchAssignments(token, selectedSubject._id);
      }
      if (activeTab === 'attendance') {
        fetchAttendance(token, selectedSubject?._id || 'global', selectedDate);
      }
    }
  }, [selectedSubject, activeTab, selectedDate, token]);

  // Fetch grades when assignment changes
  useEffect(() => {
    if (token && selectedAssignment) {
      fetchGrades(token, selectedAssignment._id);
    }
  }, [selectedAssignment, token]);

  // Real-time synchronization socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleAttendanceScan = (data: any) => {
      addLog(`[Asistencia] QR Escaneado: ${data.studentName} marcado como PRESENTE.`);
      setUnreadNotifications(prev => prev + 1);
      
      // Real-time local state update
      setAttendanceList(prev => prev.map(item => {
        if (item.studentId === data.studentId) {
          return {
            ...item,
            attendanceId: data.attendanceId,
            status: data.status,
            scannedAt: data.scannedAt
          };
        }
        return item;
      }));
    };

    const handleGradeScan = (data: any) => {
      addLog(`[Calificación] QR Escaneado: ${data.studentName} recibió ${data.score} puntos.`);
      setUnreadNotifications(prev => prev + 1);

      // Real-time local state update
      setGradeList(prev => prev.map(item => {
        if (item.studentId === data.studentId) {
          return {
            ...item,
            gradeId: data.gradeId,
            score: data.score,
            gradedAt: data.gradedAt
          };
        }
        return item;
      }));
    };

    socket.on('student_scanned_attendance', handleAttendanceScan);
    socket.on('student_scanned_grade', handleGradeScan);

    return () => {
      socket.off('student_scanned_attendance', handleAttendanceScan);
      socket.off('student_scanned_grade', handleGradeScan);
    };
  }, [socket, addLog, setUnreadNotifications]);

  // Helper to map subject color/icon to display
  const getSubjectVisuals = (s: any, index: number) => {
    const colorEntry = SUBJECT_COLOR_OPTIONS.find(c => c.color === (s.color || '')) ||
      [
        { bg: '#e0f2fe', color: '#0284c7' },
        { bg: '#f3e8ff', color: '#a855f7' },
        { bg: '#ffedd5', color: '#f97316' },
        { bg: '#fee2e2', color: '#ef4444' },
      ][index % 4];

    const iconKey = s.iconKey || (() => {
      const lc = (s.name || '').toLowerCase();
      if (lc.includes('mat') || lc.includes('cálculo') || lc.includes('algebra')) return 'Calculator';
      if (lc.includes('esp') || lc.includes('lengua') || lc.includes('lectura')) return 'FileText';
      if (lc.includes('cien') || lc.includes('biol') || lc.includes('quim') || lc.includes('físic') || lc.includes('lab')) return 'FlaskConical';
      if (lc.includes('hist') || lc.includes('geog') || lc.includes('social')) return 'Globe';
      return 'BookOpen';
    })();

    const iconNode = SUBJECT_ICON_OPTIONS.find(i => i.key === iconKey)?.node || <BookOpen size={24} />;
    return { icon: iconNode, bg: colorEntry.bg, color: colorEntry.color };
  };

  // --- API Fetch Handlers ---

  const fetchSubjects = async (authToken: string) => {
    setLoadingSubjects(true);
    setErrorSubjects('');
    try {
      const response = await fetch(`${API_BASE_URL}/subjects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
        if (data.length > 0 && !selectedSubject) {
          setSelectedSubject(data[0]);
        }
      } else {
        setErrorSubjects(data.message || 'Error al cargar asignaturas');
      }
    } catch (err) {
      setErrorSubjects('Error de conexión al cargar asignaturas');
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchStudents = async (authToken: string) => {
    setLoadingStudents(true);
    setErrorStudents('');
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      } else {
        setErrorStudents(data.message || 'Error al cargar alumnos');
      }
    } catch (err) {
      setErrorStudents('Error de conexión al cargar alumnos');
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchStudentSummary = async (studentId: string) => {
    if (!token) return;
    setStudentSummaryLoading(true);
    setStudentSummaryError('');
    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudentSummary(data);
      } else {
        setStudentSummaryError(data.message || 'Error al cargar historial del estudiante');
      }
    } catch (err) {
      setStudentSummaryError('Error de red al cargar historial del estudiante');
      console.error(err);
    } finally {
      setStudentSummaryLoading(false);
    }
  };

  const fetchAssignments = async (authToken: string, subjectId: string) => {
    setLoadingAssignments(true);
    setErrorAssignments('');
    try {
      const response = await fetch(`${API_BASE_URL}/assignments?subjectId=${subjectId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAssignments(data);
      } else {
        setErrorAssignments(data.message || 'Error al cargar tareas');
      }
    } catch (err) {
      setErrorAssignments('Error de conexión al cargar tareas');
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAttendance = async (authToken: string, subjectId: string, date: string) => {
    setLoadingAttendance(true);
    setErrorAttendance('');
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/daily?subjectId=${subjectId}&date=${date}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAttendanceList(data);
      } else {
        setErrorAttendance(data.message || 'Error al cargar asistencia');
      }
    } catch (err) {
      setErrorAttendance('Error de conexión al cargar asistencia');
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchGrades = async (authToken: string, assignmentId: string) => {
    setLoadingGrades(true);
    setErrorGrades('');
    try {
      const response = await fetch(`${API_BASE_URL}/grades/assignment?assignmentId=${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setGradeList(data);
      } else {
        setErrorGrades(data.message || 'Error al cargar calificaciones');
      }
    } catch (err) {
      setErrorGrades('Error de conexión al cargar calificaciones');
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
  };

  // --- API Action Handlers ---

  const handleCreateSubjectSubmit = async (newSubject: { name: string; description: string; iconKey: string; color: string }) => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSubject)
    });
    const data = await response.json();
    if (response.ok) {
      setSubjects(prev => [...prev, data]);
      if (!selectedSubject) setSelectedSubject(data);
      addLog(`Materia creada: ${data.name}`);
    } else {
      throw new Error(data.message || 'Error al registrar la materia');
    }
  };

  const handleCreateAssignmentSubmit = async (newAssignment: { title: string; description: string; maxScore: number; dueDate: string }) => {
    if (!selectedSubject) return;
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newAssignment,
        subjectId: selectedSubject._id
      })
    });
    const data = await response.json();
    if (response.ok) {
      setAssignments(prev => [...prev, data]);
      setSelectedAssignment(data);
      addLog(`Tarea creada: ${data.title}`);
    } else {
      throw new Error(data.message || 'Error al registrar la tarea');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newStudentName, enrollmentNumber: newStudentEnrollment })
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(prev => [...prev, data]);
        setNewStudentName('');
        setNewStudentEnrollment('');
        addLog(`Alumno registrado: ${data.name}`);
      } else {
        alert(data.message || 'Error al registrar el alumno');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al registrar alumno');
    }
  };

  const handleUpdateAttendanceManual = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    const subId = selectedSubject?._id || 'global';
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          subjectId: subId,
          date: selectedDate,
          status
        })
      });
      if (response.ok) {
        setAttendanceList(prev => prev.map(item => {
          if (item.studentId === studentId) {
            return {
              ...item,
              status,
              scannedAt: new Date()
            };
          }
          return item;
        }));
        addLog(`Asistencia corregida manualmente a ${status === 'PRESENT' ? 'Presente' : status === 'LATE' ? 'Retardo' : 'Falta'}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGradeManual = async (studentId: string, score: number) => {
    if (!selectedAssignment) return;
    try {
      const response = await fetch(`${API_BASE_URL}/grades/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          assignmentId: selectedAssignment._id,
          score
        })
      });
      const data = await response.json();
      if (response.ok) {
        setGradeList(prev => prev.map(item => {
          if (item.studentId === studentId) {
            return {
              ...item,
              score,
              manualCorrection: true,
              gradedAt: new Date()
            };
          }
          return item;
        }));
        addLog(`Calificación corregida manualmente a ${score} pts.`);
      } else {
        alert(data.message || 'Error al actualizar calificación');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllPresent = async () => {
    const subId = selectedSubject?._id || 'global';
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/mark-all-present`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: subId,
          date: selectedDate
        })
      });
      if (response.ok) {
        setAttendanceList(prev => prev.map(item => ({
          ...item,
          status: 'PRESENT',
          scannedAt: new Date()
        })));
        addLog('Todos los alumnos marcados como PRESENTES.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setChangePasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setChangePasswordSuccess('Contraseña cambiada con éxito');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setChangePasswordError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      setChangePasswordError('Error de red al intentar cambiar la contraseña');
      console.error(err);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // --- Export Report Helpers ---

  const handleExportCSV = () => {
    if (attendanceList.length === 0) return;
    
    const headers = ['Nº', 'Nombre del Alumno', 'Matrícula', 'Estado', 'Hora de Escaneo'];
    const rows = filteredAttendance.map((record, index) => [
      String(index + 1).padStart(2, '0'),
      record.name,
      record.enrollmentNumber || '',
      record.status === 'PRESENT' ? 'Asistencia' : record.status === 'LATE' ? 'Retardo' : 'Falta',
      record.scannedAt ? new Date(record.scannedAt).toLocaleTimeString() : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pase_de_Lista_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Reporte diario exportado a CSV.');
  };

  const handleExportAssignmentCSV = async () => {
    if (!selectedAssignment || !selectedSubject || gradeList.length === 0) return;
    
    const headers = ['Nº', 'Nombre del Alumno', 'Matrícula', 'Calificación', 'Puntuación Máxima', 'Estatus', 'Fecha de Registro'];
    const rows = gradeList.map((record, index) => [
      String(index + 1),
      record.name,
      record.enrollmentNumber || '—',
      record.score !== null && record.score !== undefined ? String(record.score) : 'Pendiente',
      String(selectedAssignment.maxScore),
      record.score !== null && record.score !== undefined ? (record.manualCorrection ? 'Manual' : 'Código QR') : 'Pendiente',
      record.gradedAt ? new Date(record.gradedAt).toLocaleString() : '—'
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    // Download locally
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Calificaciones_${selectedAssignment.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save to disk
    try {
      await fetch(`${API_BASE_URL}/assignments/${selectedAssignment._id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectName: selectedSubject.name,
          assignmentTitle: selectedAssignment.title,
          csvContent: csvContent
        })
      });
      addLog(`Reporte de tarea guardado localmente en carpeta exports/${selectedSubject.name}/`);
    } catch (err) {
      console.error('Error saving report to server disk:', err);
    }
  };

  const handleExportStudentCSV = async () => {
    if (!selectedStudentDetail || !studentSummary) return;
    
    let csvRows = [];
    csvRows.push('REPORTE ACADÉMICO DEL ALUMNO');
    csvRows.push('Nombre,Matrícula,Código QR,Promedio General de Tareas,Tasa de Asistencia');
    csvRows.push(`"${selectedStudentDetail.name}","${selectedStudentDetail.enrollmentNumber || '—'}","${selectedStudentDetail.qrCode}","${studentSummary.summary.averageGradePercent}%","${studentSummary.summary.attendanceRate}%"`);
    csvRows.push('');
    
    csvRows.push('HISTORIAL DE ASISTENCIAS');
    csvRows.push('Fecha,Asignatura,Estatus');
    studentSummary.attendance.forEach((att: any) => {
      let statusLabel = 'Falta';
      if (att.status === 'PRESENT') statusLabel = 'Presente';
      if (att.status === 'LATE') statusLabel = 'Retardo';
      csvRows.push(`"${att.date}","${att.subjectName}","${statusLabel}"`);
    });
    csvRows.push('');
    
    csvRows.push('HISTORIAL DE CALIFICACIONES DE TAREAS');
    csvRows.push('Tarea,Asignatura,Calificación,Puntuación Máxima,Método de Registro');
    studentSummary.grades.forEach((grd: any) => {
      const methodLabel = grd.manualCorrection ? 'Manual' : 'Código QR';
      csvRows.push(`"${grd.assignment.title}","${grd.subjectName}","${grd.score}","${grd.assignment.maxScore}","${methodLabel}"`);
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n');
    
    // Download locally
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_${selectedStudentDetail.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save to disk
    try {
      await fetch(`${API_BASE_URL}/students/${selectedStudentDetail._id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName: selectedStudentDetail.name,
          csvContent: csvContent
        })
      });
      addLog(`Reporte de alumno guardado localmente en carpeta exports/Alumnos/`);
    } catch (err) {
      console.error('Error saving student report to server disk:', err);
    }
  };

  const handleAdjustDate = (days: number) => {
    if (!selectedDate) return;
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatSpanishDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- Filtering Lists by Search ---

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.enrollmentNumber && student.enrollmentNumber.includes(searchQuery))
  );

  const filteredAttendance = attendanceList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGrades = gradeList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Dynamic Tab Rendering */}

      {/* TAB: Teachers (Restricted) */}
      {activeTab === 'teachers' && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <ShieldAlert size={48} color="var(--warning)" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px' }}>Sección Restringida</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 20px auto' }}>
            El alta, suspensión y edición de cuentas de profesoras es un privilegio exclusivo del rol <strong>SUPER_ADMIN</strong>.
          </p>
          <button className="btn btn-secondary" onClick={() => setActiveTab('attendance')}>
            Volver a Asistencia
          </button>
        </div>
      )}

      {/* TAB: Attendance */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="attendance-header-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => handleAdjustDate(-1)} 
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px', borderRadius: '50%', display: 'inline-flex', 
                  alignItems: 'center', justifyContent: 'center', background: 'white', 
                  borderColor: 'var(--border-color)', color: '#0284c7', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              
              <h2 className="attendance-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', flex: 1, color: '#0f172a' }}>
                Pase de Lista - {selectedDate ? formatSpanishDate(selectedDate) : 'Hoy'}
              </h2>
              
              <button 
                onClick={() => handleAdjustDate(1)} 
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px', borderRadius: '50%', display: 'inline-flex', 
                  alignItems: 'center', justifyContent: 'center', background: 'white', 
                  borderColor: 'var(--border-color)', color: '#0284c7', cursor: 'pointer'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="attendance-actions-wrapper">
              <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '0', borderRadius: '50%', width: '40px', height: '40px', 
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                    background: 'white', borderColor: 'var(--border-color)', color: '#0284c7', cursor: 'pointer'
                  }}
                >
                  <Calendar size={20} />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer', zIndex: 1
                  }}
                />
              </div>
              <button onClick={handleExportCSV} className="btn btn-primary" style={{ padding: '10px 20px', background: '#0284c7', color: 'white' }}>
                <Download size={16} /> Exportar Reporte del Día
              </button>
              <button 
                onClick={() => router.push(`/scanner?mode=attendance`)} 
                className="btn btn-primary" 
                style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <QrCode size={16} /> Escanear Asistencia
              </button>
            </div>
          </div>

          {/* Main Grid split */}
          <div className="attendance-layout-grid">
            
            {/* Left Side: Students List */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  Alumnos Inscritos ({filteredAttendance.length})
                </h3>
                {selectedSubject && filteredAttendance.length > 0 && (
                  <button 
                    onClick={handleMarkAllPresent}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: '#bae6fd', color: '#0369a1', background: '#e0f2fe' }}
                  >
                    Marcar todos presentes
                  </button>
                )}
              </div>

              {loadingAttendance ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={24} className="spin" />
                  <span>Obteniendo lista de asistencia...</span>
                </div>
              ) : errorAttendance ? (
                <div style={{ color: 'var(--error)', background: 'var(--error-light)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 10px auto' }} />
                  <div>{errorAttendance}</div>
                </div>
              ) : filteredAttendance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No hay alumnos que coincidan con la búsqueda.' : 'No hay alumnos registrados. Configura alumnos en la pestaña Students.'}
                </div>
              ) : (
                <div className="custom-table-container" style={{ border: 'none' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Nº</th>
                        <th>Nombre del Alumno</th>
                        <th style={{ width: '150px', textAlign: 'center' }}>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record, index) => (
                        <tr key={record.studentId}>
                          <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>
                            {record.name}
                          </td>
                          <td>
                            <div className="status-btn-group" style={{ justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleUpdateAttendanceManual(record.studentId, 'PRESENT')}
                                className={`status-btn ${record.status === 'PRESENT' ? 'active-present' : ''}`}
                                title="Presente"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleUpdateAttendanceManual(record.studentId, 'LATE')}
                                className={`status-btn ${record.status === 'LATE' ? 'active-late' : ''}`}
                                title="Retardo"
                              >
                                <Clock size={16} />
                              </button>
                              <button 
                                onClick={() => handleUpdateAttendanceManual(record.studentId, 'ABSENT')}
                                className={`status-btn ${record.status === 'ABSENT' ? 'active-absent' : ''}`}
                                title="Falta"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Side: Stats Panel & Real-time Logs */}
            <div className="summary-cards-container">
              <div className="stats-row">
                <StatCard 
                  label="Total Presentes" 
                  value={filteredAttendance.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length} 
                  icon={<UserCheck size={20} />} 
                  iconBg="#d1fae5" 
                  iconColor="#10b981" 
                />
                <StatCard 
                  label="Faltas Hoy" 
                  value={filteredAttendance.filter(r => r.status === 'ABSENT').length} 
                  icon={<UserX size={20} />} 
                  iconBg="#fee2e2" 
                  iconColor="#ef4444" 
                />
              </div>

              {/* Monthly global card */}
              <div className="monthly-global-card">
                <div>
                  <div className="monthly-global-title">
                    <Radio size={16} className="pulse-success" />
                    Asistencia Global Mensual
                  </div>
                  <div className="monthly-global-val">
                    {filteredAttendance.length > 0 
                      ? `${Math.round((filteredAttendance.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length / filteredAttendance.length) * 100)}%` 
                      : '100%'}
                  </div>
                  <div className="monthly-global-sub">+2% vs mes pasado</div>
                </div>
                <button className="monthly-chart-btn" onClick={() => alert('Gráfico de rendimiento académico mensual.')} title="Ver gráfico">
                  <TrendingUp size={24} />
                </button>
              </div>

              {/* Real-time sync logs panel */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} className="pulse-success" />
                  Sincronización en Vivo
                </h3>
                <div style={{ 
                  maxHeight: '220px', overflowY: 'auto', background: '#f8fafc', 
                  border: '1px solid var(--border-color)', borderRadius: '8px', 
                  padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', 
                  color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  {syncLogs.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                      Esperando escaneos QR o eventos de sincronización...
                    </div>
                  ) : (
                    syncLogs.map((log, i) => <div key={i} style={{ wordBreak: 'break-all' }}>{log}</div>)
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB: Subjects */}
      {activeTab === 'subjects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {selectedSubject && selectedAssignment ? (
            /* VIEW 2: Detailed Assignment View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <button 
                onClick={() => setSelectedAssignment(null)} 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'white', width: 'fit-content' }}
              >
                <ArrowLeft size={16} /> Volver a {selectedSubject.name}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="attendance-title" style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#0f172a' }}>
                    {selectedAssignment.title}
                  </h2>
                  <p className="attendance-subtitle">
                    Asignatura: {selectedSubject.name}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleExportAssignmentCSV}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Download size={16} /> Exportar Excel Tarea
                  </button>
                  <button 
                    onClick={() => router.push(`/scanner?mode=grades&subjectId=${selectedSubject._id}&assignmentId=${selectedAssignment._id}`)} 
                    className="btn btn-primary" 
                    style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <QrCode size={16} /> Escanear Tarea
                  </button>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="responsive-3col-grid" style={{ marginBottom: '10px' }}>
                <StatCard 
                  label="Calificados" 
                  value={gradeList.filter(g => g.score !== null && g.score !== undefined).length} 
                  icon={<CheckSquare size={20} />} 
                  iconBg="#d1fae5" 
                  iconColor="#10b981" 
                  align="left"
                />
                <StatCard 
                  label="Pendientes" 
                  value={gradeList.filter(g => g.score === null || g.score === undefined).length} 
                  icon={<Clock size={20} />} 
                  iconBg="#f1f5f9" 
                  iconColor="#64748b" 
                  align="left"
                />
                <StatCard 
                  label="Promedio Grupal" 
                  value={(() => {
                    const graded = gradeList.filter(g => g.score !== null && g.score !== undefined);
                    return graded.length > 0 
                      ? (graded.reduce((acc, curr) => acc + curr.score, 0) / graded.length).toFixed(1) 
                      : '—';
                  })()} 
                  icon={<Award size={20} />} 
                  iconBg="#fef3c7" 
                  iconColor="#d97706" 
                  align="left"
                />
              </div>

              {/* Student grades table */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Lista de Calificaciones
                  </h3>
                  <span className="badge badge-present" style={{ textTransform: 'none', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Radio size={14} className="pulse-success" /> Sincronización Móvil QR Activa
                  </span>
                </div>

                {loadingGrades ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw size={24} className="spin" />
                    <span>Cargando calificaciones...</span>
                  </div>
                ) : errorGrades ? (
                  <div style={{ color: 'var(--error)', background: 'var(--error-light)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 10px auto' }} />
                    <div>{errorGrades}</div>
                  </div>
                ) : gradeList.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                    No hay alumnos registrados en esta materia.
                  </div>
                ) : (
                  <div className="custom-table-container" style={{ border: 'none' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>Nº</th>
                          <th>Nombre del Alumno</th>
                          <th>Matrícula</th>
                          <th style={{ width: '180px', textAlign: 'center' }}>Calificación</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>Estatus</th>
                          <th>Última Modificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrades.map((record, index) => (
                          <tr key={record.studentId}>
                            <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                              {record.name}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {record.enrollmentNumber || '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min={0}
                                  max={selectedAssignment.maxScore}
                                  value={record.score !== null && record.score !== undefined ? record.score : ''}
                                  placeholder="—"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : Number(e.target.value);
                                    if (val !== null && val >= 0 && val <= selectedAssignment.maxScore) {
                                      handleUpdateGradeManual(record.studentId, val);
                                    }
                                  }}
                                  className="form-input"
                                  style={{
                                    width: '70px', padding: '8px 10px', textAlign: 'center',
                                    fontWeight: 800, fontSize: '1rem', borderRadius: '8px',
                                    background: record.score !== null ? '#f0fdf4' : '#f8fafc',
                                    borderColor: record.score !== null ? '#bbf7d0' : 'var(--border-color)',
                                    color: record.score !== null ? '#166534' : 'var(--text-main)'
                                  }}
                                />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  /{selectedAssignment.maxScore}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {record.score !== null && record.score !== undefined ? (
                                <span className="badge badge-present" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                                  {record.manualCorrection ? 'Manual' : 'Código QR'}
                                </span>
                              ) : (
                                <span className="badge badge-absent" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', padding: '6px 12px' }}>
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {record.gradedAt ? new Date(record.gradedAt).toLocaleTimeString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* VIEW 1: Main Subjects selector and Tasks list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="attendance-title" style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#0f172a' }}>
                    Gestión de Asignaturas
                  </h2>
                  <p className="attendance-subtitle">
                    Selecciona una asignatura para administrar alumnos
                  </p>
                </div>
                <button 
                  onClick={() => setShowCreateSubjectModal(true)} 
                  className="btn btn-primary" 
                  style={{ padding: '10px 20px', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Crear Asignatura
                </button>
              </div>

              {/* Grid of Subject Cards */}
              {loadingSubjects ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={24} className="spin" />
                  <span>Obteniendo asignaturas...</span>
                </div>
              ) : errorSubjects ? (
                <div style={{ color: 'var(--error)', background: 'var(--error-light)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 10px auto' }} />
                  <div>{errorSubjects}</div>
                </div>
              ) : (
                <div className="subjects-grid">
                  {subjects.map((s, index) => {
                    const visuals = getSubjectVisuals(s, index);
                    return (
                      <SubjectCard 
                        key={s._id}
                        name={s.name}
                        icon={visuals.icon}
                        iconBg={visuals.bg}
                        iconColor={visuals.color}
                        isActive={selectedSubject?._id === s._id}
                        onClick={() => {
                          setSelectedSubject(s);
                          setSelectedAssignment(null);
                        }}
                      />
                    );
                  })}

                  {/* Create Card fallback */}
                  <SubjectCard isCreator onClick={() => setShowCreateSubjectModal(true)} />
                </div>
              )}

              {/* Assignments listing underneath the cards */}
              {selectedSubject && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                  <div className="responsive-section-header">
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Tareas de {selectedSubject.name}
                    </h3>
                    <button 
                      onClick={() => setShowCreateAssignmentModal(true)}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', borderColor: '#0284c7', padding: '8px 16px', background: 'white' }}
                    >
                      <Plus size={16} /> Nueva Tarea
                    </button>
                  </div>

                  {loadingAssignments ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px auto' }} />
                      <span>Cargando tareas disponibles...</span>
                    </div>
                  ) : errorAssignments ? (
                    <div style={{ color: 'var(--error)', padding: '20px', textAlign: 'center' }}>
                      {errorAssignments}
                    </div>
                  ) : assignments.filter(a => (a.subject?._id || a.subject) === selectedSubject._id).length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <p style={{ marginBottom: '12px', fontSize: '0.95rem' }}>No hay tareas creadas para esta asignatura.</p>
                      <button 
                        onClick={() => setShowCreateAssignmentModal(true)}
                        className="btn btn-primary"
                        style={{ padding: '10px 20px', background: '#0284c7' }}
                      >
                        Crear Primera Tarea
                      </button>
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Tareas Disponibles</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {assignments.filter(a => (a.subject?._id || a.subject) === selectedSubject._id).map((assignment) => (
                          <div
                            key={assignment._id}
                            onClick={() => setSelectedAssignment(assignment)}
                            className="glass-panel"
                            style={{
                              padding: '20px', cursor: 'pointer', border: '1px solid var(--border-color)',
                              borderRadius: '12px', background: '#ffffff', transition: 'all 0.2s',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{assignment.title}</div>
                              {assignment.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{assignment.description}</div>}
                            </div>
                            <span className="badge badge-present" style={{ padding: '6px 12px' }}>
                              {assignment.maxScore} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* TAB: Students */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {selectedStudentDetail ? (
            /* Inspect specific student view */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <button 
                onClick={() => {
                  setSelectedStudentDetail(null);
                  setStudentSummary(null);
                }} 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'white', width: 'fit-content' }}
              >
                <ArrowLeft size={16} /> Volver a Lista de Alumnos
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="attendance-title" style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#0f172a' }}>
                    {selectedStudentDetail.name}
                  </h2>
                  <p className="attendance-subtitle">
                    Matrícula: {selectedStudentDetail.enrollmentNumber || 'Sin Matrícula'} • Código QR: {selectedStudentDetail.qrCode}
                  </p>
                </div>
                {studentSummary && (
                  <button 
                    onClick={handleExportStudentCSV} 
                    className="btn btn-primary" 
                    style={{ padding: '10px 20px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Download size={16} /> Exportar Excel Alumno
                  </button>
                )}
              </div>

              {studentSummaryLoading ? (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
                  <p>Cargando historial y métricas del alumno...</p>
                </div>
              ) : studentSummaryError ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <AlertCircle size={32} color="var(--error)" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ color: 'var(--error)' }}>{studentSummaryError}</p>
                </div>
              ) : studentSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Summary Metric Cards */}
                  <div className="responsive-3col-grid">
                    <StatCard 
                      label={`Asistencias: ${studentSummary.summary.presents} | Retardos: ${studentSummary.summary.lates} | Faltas: ${studentSummary.summary.absents}`}
                      value={`${studentSummary.summary.attendanceRate}%`}
                      icon={<Calendar size={20} />}
                      iconBg="#e0f2fe"
                      iconColor="#0284c7"
                      align="left"
                    />
                    <StatCard 
                      label={`Tareas Evaluadas: ${studentSummary.summary.gradedAssignments}/${studentSummary.summary.totalAssignments}`}
                      value={`${studentSummary.summary.averageGradePercent}%`}
                      icon={<Award size={20} />}
                      iconBg="#fef3c7"
                      iconColor="#d97706"
                      align="left"
                    />
                    <StatCard 
                      label="Tareas Pendientes de Evaluar"
                      value={studentSummary.summary.pendingAssignments}
                      icon={<Clock size={20} />}
                      iconBg="#fee2e2"
                      iconColor="#ef4444"
                      align="left"
                    />
                  </div>

                  {/* Dual Grid: Attendance & Tareas */}
                  <div className="responsive-2col-grid" style={{ alignItems: 'start' }}>
                    
                    {/* Attendance History */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        Historial de Asistencias
                      </h3>
                      <div className="custom-table-container" style={{ border: 'none', maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Asignatura</th>
                              <th style={{ textAlign: 'center' }}>Estatus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentSummary.attendance.length === 0 ? (
                              <tr>
                                <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                  Sin registros de asistencia.
                                </td>
                              </tr>
                            ) : (
                              studentSummary.attendance.map((att: any) => (
                                <tr key={att._id}>
                                  <td style={{ fontWeight: 600 }}>{att.date}</td>
                                  <td>{att.subjectName}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    {att.status === 'PRESENT' && (
                                      <span className="badge badge-present" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Presente</span>
                                    )}
                                    {att.status === 'LATE' && (
                                      <span className="badge" style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.75rem', padding: '4px 8px' }}>Retardo</span>
                                    )}
                                    {att.status === 'ABSENT' && (
                                      <span className="badge badge-absent" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Falta</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Grades History */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        Historial de Tareas
                      </h3>
                      <div className="custom-table-container" style={{ border: 'none', maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Tarea</th>
                              <th>Asignatura</th>
                              <th style={{ textAlign: 'center' }}>Calificación</th>
                              <th style={{ textAlign: 'center' }}>Vía</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentSummary.grades.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                  Sin tareas calificadas.
                                </td>
                              </tr>
                            ) : (
                              studentSummary.grades.map((grd: any) => (
                                <tr key={grd._id}>
                                  <td style={{ fontWeight: 600 }}>{grd.assignment.title}</td>
                                  <td>{grd.subjectName}</td>
                                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#166534' }}>
                                    {grd.score} / {grd.assignment.maxScore}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className="badge badge-present" style={{ fontSize: '0.7rem', padding: '3px 6px' }}>
                                      {grd.manualCorrection ? 'Manual' : 'Código QR'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              ) : null}

            </div>
          ) : (
            /* Student registration and visual table list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="attendance-title" style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#0f172a' }}>
                    Gestión de Alumnos
                  </h2>
                  <p className="attendance-subtitle">
                    Registra nuevos alumnos y consulta su historial de asistencia y tareas
                  </p>
                </div>
              </div>

              <div className="responsive-split-1-2">
                {/* Form Card */}
                <div className="glass-panel">
                  <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px' }}>Registrar Alumno</h2>
                  <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Nombre del Estudiante</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej. Carlos Mendoza"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Matrícula Escolar</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej. 24890"
                        value={newStudentEnrollment}
                        onChange={(e) => setNewStudentEnrollment(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                      Registrar en Plataforma
                    </button>
                  </form>
                </div>

                {/* Listing Linked Students */}
                <div className="glass-panel">
                  <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px' }}>Alumnos Vinculados</h2>
                  
                  {loadingStudents ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <RefreshCw size={24} className="spin" />
                      <span>Cargando lista de alumnos...</span>
                    </div>
                  ) : errorStudents ? (
                    <div style={{ color: 'var(--error)', background: 'var(--error-light)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 10px auto' }} />
                      <div>{errorStudents}</div>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {searchQuery ? 'No hay alumnos que coincidan con la búsqueda.' : 'No hay estudiantes registrados.'}
                    </div>
                  ) : (
                    <div className="custom-table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Matrícula</th>
                            <th>Código QR</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map(std => (
                            <tr key={std._id}>
                              <td style={{ fontWeight: 600 }}>{std.name}</td>
                              <td>{std.enrollmentNumber || '-'}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{std.qrCode}</td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => {
                                      setSelectedStudentDetail(std);
                                      fetchStudentSummary(std._id);
                                    }}
                                  >
                                    <Eye size={14} /> Inspeccionar
                                  </button>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => setActiveQrStudent(std)}
                                  >
                                    <QrCode size={14} /> QR
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB: Settings */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="attendance-title" style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#0f172a' }}>
                Configuración de Cuenta
              </h2>
              <p className="attendance-subtitle">
                Administra los detalles de tu cuenta y actualiza tu contraseña de acceso
              </p>
            </div>
          </div>

          <div className="responsive-2col-grid" style={{ alignItems: 'start' }}>
            {/* Account Details */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Detalles Personales
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Profesora</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{user?.name}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Institución Educativa</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{user?.schoolName}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Correo Electrónico</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{user?.email}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Identificador único</span>
                  <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#64748b' }}>{user?.teacherId}</span>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} /> Cambiar Contraseña
              </h3>

              {changePasswordError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                  <ShieldAlert size={16} />
                  <span>{changePasswordError}</span>
                </div>
              )}

              {changePasswordSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                  <Check size={16} />
                  <span>{changePasswordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Contraseña Actual</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="btn btn-primary"
                  style={{
                    marginTop: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', background: '#0284c7'
                  }}
                >
                  {changePasswordLoading && <RefreshCw size={16} className="spin" />}
                  {changePasswordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* ================= MODALS OVERLAYS ================= */}

      {/* Modal: Create Subject */}
      <CreateSubjectModal 
        isOpen={showCreateSubjectModal} 
        onClose={() => setShowCreateSubjectModal(false)} 
        onSubmit={handleCreateSubjectSubmit}
      />

      {/* Modal: Create Assignment */}
      <CreateAssignmentModal 
        isOpen={showCreateAssignmentModal} 
        onClose={() => setShowCreateAssignmentModal(false)} 
        onSubmit={handleCreateAssignmentSubmit}
      />

      {/* Modal: Student QR Code */}
      <StudentQrModal 
        student={activeQrStudent} 
        onClose={() => setActiveQrStudent(null)} 
      />
    </>
  );
}
