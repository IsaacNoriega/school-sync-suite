'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { 
  BookOpen, Users, FileText, CheckSquare, LogOut, 
  Plus, Calendar, RefreshCw, Award, Radio, QrCode, 
  Smartphone, Bell, HelpCircle, GraduationCap, Settings, ShieldAlert,
  Search, User, Trash2, Check, X, Download, TrendingUp, UserCheck, UserX, AlertTriangle, Clock, Globe, FlaskConical, Calculator, ArrowLeft, Eye, ChevronLeft, ChevronRight, School
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  // Authentication State
  const [teacher, setTeacher] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  // Active Navigation Tab (Matches Sidebar image 2)
  const [activeTab, setActiveTab] = useState<'teachers' | 'attendance' | 'subjects' | 'students' | 'reports' | 'settings'>('attendance');

  // Business Data
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [gradeList, setGradeList] = useState<any[]>([]);

  // Selected entities for detail views
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time synchronization log
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Forms state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEnrollment, setNewStudentEnrollment] = useState('');

  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState(10);
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('');

  // Modal State for QR display
  const [activeQrStudent, setActiveQrStudent] = useState<any>(null);
  // Student detail inspection state
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const [studentSummary, setStudentSummary] = useState<any>(null);
  const [studentSummaryLoading, setStudentSummaryLoading] = useState(false);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);

  // Initials generator for topbar avatar (e.g., Ana Pérez -> AP)
  const getInitials = (name: string) => {
    if (!name) return 'AP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getSubjectVisuals = (name: string, index: number) => {
    const lowercase = name.toLowerCase();
    const colors = [
      { bg: '#e0f2fe', color: '#0284c7' },
      { bg: '#f3e8ff', color: '#a855f7' },
      { bg: '#ffedd5', color: '#f97316' },
      { bg: '#fee2e2', color: '#ef4444' }
    ];
    const color = colors[index % colors.length];

    if (lowercase.includes('mat') || lowercase.includes('cálculo') || lowercase.includes('algebra') || lowercase.includes('arith')) {
      return { icon: <Calculator size={24} />, bg: '#e0f2fe', color: '#0284c7' };
    }
    if (lowercase.includes('esp') || lowercase.includes('lengua') || lowercase.includes('lectura') || lowercase.includes('liter')) {
      return { icon: <FileText size={24} />, bg: '#f3e8ff', color: '#a855f7' };
    }
    if (lowercase.includes('cien') || lowercase.includes('biol') || lowercase.includes('quim') || lowercase.includes('fisic') || lowercase.includes('lab')) {
      return { icon: <FlaskConical size={24} />, bg: '#ffedd5', color: '#f97316' };
    }
    if (lowercase.includes('hist') || lowercase.includes('geog') || lowercase.includes('social') || lowercase.includes('civic') || lowercase.includes('mund')) {
      return { icon: <Globe size={24} />, bg: '#fee2e2', color: '#ef4444' };
    }
    return { icon: <BookOpen size={24} />, ...color };
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');

    if (!savedToken || !savedUserStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(savedUserStr);
    if (user.role !== 'TEACHER') {
      router.push('/admin');
      return;
    }

    setTeacher(user);
    setToken(savedToken);
    setSelectedDate(new Date().toISOString().split('T')[0]);

    // Initial API calls
    fetchSubjects(savedToken);
    fetchStudents(savedToken);

    // Initialize WebSockets
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { teacherId: user.teacherId });
      addLog('Conectado al servidor de sincronización en tiempo real.');
    });

    socket.on('student_scanned_attendance', (data: any) => {
      addLog(`[Asistencia] QR Escaneado: ${data.studentName} marcado como PRESENTE.`);
      setUnreadNotifications(prev => prev + 1);
      // Update attendance list if matching
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
    });

    socket.on('student_scanned_grade', (data: any) => {
      addLog(`[Calificación] QR Escaneado: ${data.studentName} recibió ${data.score} puntos.`);
      setUnreadNotifications(prev => prev + 1);
      // Update grades list if matching assignment
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
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router]);

  // Fetch lists when subject or active assignment changes
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

  useEffect(() => {
    if (token && selectedAssignment) {
      fetchGrades(token, selectedAssignment._id);
    }
  }, [selectedAssignment, token]);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
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
    
    // Download locally in browser
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Calificaciones_${selectedAssignment.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save to server local disk
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/assignments/${selectedAssignment._id}/export`, {
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
    
    // 1. Profile section
    csvRows.push('REPORTE ACADÉMICO DEL ALUMNO');
    csvRows.push('Nombre,Matrícula,Código QR,Promedio General de Tareas,Tasa de Asistencia');
    csvRows.push(`"${selectedStudentDetail.name}","${selectedStudentDetail.enrollmentNumber || '—'}","${selectedStudentDetail.qrCode}","${studentSummary.summary.averageGradePercent}%","${studentSummary.summary.attendanceRate}%"`);
    csvRows.push('');
    
    // 2. Attendance Section
    csvRows.push('HISTORIAL DE ASISTENCIAS');
    csvRows.push('Fecha,Asignatura,Estatus');
    studentSummary.attendance.forEach((att: any) => {
      let statusLabel = 'Falta';
      if (att.status === 'PRESENT') statusLabel = 'Presente';
      if (att.status === 'LATE') statusLabel = 'Retardo';
      csvRows.push(`"${att.date}","${att.subjectName}","${statusLabel}"`);
    });
    csvRows.push('');
    
    // 3. Grades Section
    csvRows.push('HISTORIAL DE CALIFICACIONES DE TAREAS');
    csvRows.push('Tarea,Asignatura,Calificación,Puntuación Máxima,Método de Registro');
    studentSummary.grades.forEach((grd: any) => {
      const methodLabel = grd.manualCorrection ? 'Manual' : 'Código QR';
      csvRows.push(`"${grd.assignment.title}","${grd.subjectName}","${grd.score}","${grd.assignment.maxScore}","${methodLabel}"`);
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n');
    
    // Download locally in browser
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_${selectedStudentDetail.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save to server local disk
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/students/${selectedStudentDetail._id}/export`, {
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

  // --- API Handlers ---

  const fetchSubjects = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:3001/subjects', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
        if (data.length > 0 && !selectedSubject) {
          setSelectedSubject(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:3001/students', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentSummary = async (studentId: string) => {
    if (!token) return;
    setStudentSummaryLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/students/${studentId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudentSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentSummaryLoading(false);
    }
  };

  const fetchAssignments = async (authToken: string, subjectId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/assignments?subjectId=${subjectId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAssignments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async (authToken: string, subjectId: string, date: string) => {
    try {
      const response = await fetch(`http://localhost:3001/attendance/daily?subjectId=${subjectId}&date=${date}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAttendanceList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGrades = async (authToken: string, assignmentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/grades/assignment?assignmentId=${assignmentId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setGradeList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Form Submit Handlers ---

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSubjectName, code: newSubjectCode, description: newSubjectDesc })
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(prev => [...prev, data]);
        if (!selectedSubject) setSelectedSubject(data);
        setNewSubjectName('');
        setNewSubjectCode('');
        setNewSubjectDesc('');
        addLog(`Materia creada: ${data.name}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/students', {
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      const response = await fetch('http://localhost:3001/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: selectedSubject._id,
          title: newAssignmentTitle,
          description: newAssignmentDesc,
          maxScore: newAssignmentMaxScore,
          dueDate: newAssignmentDueDate
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAssignments(prev => [...prev, data]);
        setSelectedAssignment(data);
        setNewAssignmentTitle('');
        setNewAssignmentDesc('');
        setNewAssignmentMaxScore(10);
        setNewAssignmentDueDate('');
        addLog(`Tarea creada: ${data.title}`);
      } else {
        alert(data.message || 'Error al crear la tarea');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al servidor');
    }
  };

  // --- Manual Correction Handlers ---

  const handleUpdateAttendanceManual = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    const subId = selectedSubject?._id || 'global';
    try {
      const response = await fetch('http://localhost:3001/attendance/manual', {
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
        addLog(`Asistencia corregida manualmente.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGradeManual = async (studentId: string, score: number) => {
    if (!selectedAssignment) return;
    try {
      const response = await fetch('http://localhost:3001/grades/manual', {
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
        addLog(`Calificación corregida manualmente.`);
      } else {
        alert(data.message || 'Error al actualizar calificación');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatSpanishDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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

  const handleMarkAllPresent = async () => {
    const subId = selectedSubject?._id || 'global';
    try {
      const response = await fetch('http://localhost:3001/attendance/mark-all-present', {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Filter lists based on Topbar search query
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
    <div className="app-layout">
      
      {/* 1. SIDEBAR (Image 2) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-container">
            <GraduationCap size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">EduControl Pro</span>
            <span className="brand-subtitle">Academic Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <User size={20} />
            <span>Teachers</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Calendar size={20} />
            <span>Attendance</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <BookOpen size={20} />
            <span>Subjects</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={20} />
            <span>Students</span>
          </div>
        </nav>

        {/* Sidebar footer: teacher profile + settings + logout */}
        <div style={{ marginTop: 'auto', padding: '16px 16px 20px 16px', borderTop: '1px solid var(--border-color)' }}>
          {/* Teacher / School info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px', background: 'rgba(2, 132, 199, 0.06)', borderRadius: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
              {teacher ? getInitials(teacher.name) : 'MA'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {teacher?.name || 'Maestra'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <School size={11} color="var(--text-muted)" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {teacher?.school || 'Mi Escuela'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              title="Configuración"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'white', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              onClick={() => alert('Configuración próximamente')}
            >
              <Settings size={15} />
              <span>Config</span>
            </button>
            <button
              title="Cerrar sesión"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid #fecaca', borderRadius: '10px', background: '#fff5f5', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE WRAPPER */}
      <div className="main-wrapper">
        
        {/* 3. CONTENT BODY (topbar removed) */}
        <div className="content-body">
          
          {/* TAB: Teachers (Deactivated) */}
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

          {/* TAB: Attendance (Pase de Lista - Diseño de Imagen 3) */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header section with Date and Export Button */}
              <div className="attendance-header-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    onClick={() => handleAdjustDate(-1)} 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '50%', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: 'white', 
                      borderColor: 'var(--border-color)', 
                      color: '#0284c7',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <h2 className="attendance-title" style={{ margin: 0, minWidth: '320px' }}>
                    Pase de Lista - {selectedDate ? formatSpanishDate(selectedDate) : 'Hoy'}
                  </h2>
                  
                  <button 
                    onClick={() => handleAdjustDate(1)} 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '50%', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: 'white', 
                      borderColor: 'var(--border-color)', 
                      color: '#0284c7',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      style={{ 
                        padding: '0', 
                        borderRadius: '50%', 
                        width: '40px', 
                        height: '40px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: 'white',
                        borderColor: 'var(--border-color)',
                        color: '#0284c7',
                        cursor: 'pointer'
                      }}
                    >
                      <Calendar size={20} />
                    </button>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 1
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
              {/* Main Split Grid */}
              <div className="attendance-layout-grid">
                
                {/* Left Side: Enrolled Students List */}
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

                  {filteredAttendance.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      No hay alumnos registrados en el sistema. Registra alumnos en la pestaña <strong>Students</strong>.
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

                {/* Right Side: Stats Panel (Image 3) */}
                <div className="summary-cards-container">
                  
                  {/* Row 1: Mini stats present/absent */}
                  <div className="stats-row">
                    <div className="mini-stat-card">
                      <div className="mini-stat-icon-wrapper" style={{ background: '#d1fae5', color: '#10b981' }}>
                        <UserCheck size={20} />
                      </div>
                      <div className="mini-stat-val">
                        {filteredAttendance.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length}
                      </div>
                      <div className="mini-stat-lbl">Total Presentes</div>
                    </div>

                    <div className="mini-stat-card">
                      <div className="mini-stat-icon-wrapper" style={{ background: '#fee2e2', color: '#ef4444' }}>
                        <UserX size={20} />
                      </div>
                      <div className="mini-stat-val">
                        {filteredAttendance.filter(r => r.status === 'ABSENT').length}
                      </div>
                      <div className="mini-stat-lbl">Faltas Hoy</div>
                    </div>
                  </div>

                  {/* Row 2: Monthly global attendance card */}
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
                    <button className="monthly-chart-btn" onClick={() => alert('Gráfico de rendimiento académico mensual.')}>
                      <TrendingUp size={24} />
                    </button>
                  </div>

                  {/* Row 3: Alerts warning container */}
                  <div className="attendance-alerts-card">
                    <div className="alert-warning-title">
                      <AlertTriangle size={18} color="#f59e0b" />
                      Alertas de Asistencia
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {filteredAttendance.filter(r => r.status === 'ABSENT').length === 0 ? (
                        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                          Sin faltas registradas el día de hoy.
                        </div>
                      ) : (
                        filteredAttendance.filter(r => r.status === 'ABSENT').map(student => (
                          <div key={student.studentId} className="alert-warning-item">
                            <div className="alert-item-icon">
                              <span style={{ fontWeight: 800, fontSize: '1rem' }}>!</span>
                            </div>
                            <div className="alert-item-text">
                              <span className="alert-item-name">{student.name}</span>
                              3 faltas consecutivas. Se requiere notificar a tutor.
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* WebSockets Realtime live feed logs inside stats panel (collapsible or neat log) */}
                  <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Terminal de Eventos</span>
                      <button onClick={() => setSyncLogs([])} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Limpiar</button>
                    </div>
                    <div style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {syncLogs.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>Esperando escaneos...</span>
                      ) : (
                        syncLogs.map((log, idx) => <div key={idx}>{log}</div>)
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB: Subjects (Gestión de Asignaturas - Diseño de Imagen 4) */}
          {activeTab === 'subjects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* VIEW 2: Detailed Assignment Grading View (When a task is selected) */}
              {selectedSubject && selectedAssignment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Back Button */}
                  <button 
                    onClick={() => setSelectedAssignment(null)} 
                    className="btn btn-secondary" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'white', width: 'fit-content' }}
                  >
                    <ArrowLeft size={16} /> Volver a {selectedSubject.name}
                  </button>

                  {/* Header Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                    <h2 className="attendance-title" style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#0f172a' }}>
                      {selectedAssignment.title}
                    </h2>
                    <p className="attendance-subtitle">
                      Asignatura: {selectedSubject.name} • Código: {selectedSubject.code}
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '10px' }}>

                    <div className="mini-stat-card" style={{ padding: '20px 24px', alignItems: 'flex-start', textAlign: 'left' }}>
                      <div className="mini-stat-icon-wrapper" style={{ background: '#d1fae5', color: '#10b981', alignSelf: 'flex-start' }}>
                        <CheckSquare size={20} />
                      </div>
                      <div className="mini-stat-val" style={{ fontSize: '2.6rem', marginTop: '6px' }}>
                        {gradeList.filter(g => g.score !== null && g.score !== undefined).length}
                      </div>
                      <div className="mini-stat-lbl" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Calificados</div>
                    </div>

                    <div className="mini-stat-card" style={{ padding: '20px 24px', alignItems: 'flex-start', textAlign: 'left' }}>
                      <div className="mini-stat-icon-wrapper" style={{ background: '#f1f5f9', color: '#64748b', alignSelf: 'flex-start' }}>
                        <Clock size={20} />
                      </div>
                      <div className="mini-stat-val" style={{ fontSize: '2.6rem', marginTop: '6px' }}>
                        {gradeList.filter(g => g.score === null || g.score === undefined).length}
                      </div>
                      <div className="mini-stat-lbl" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Pendientes</div>
                    </div>

                    <div className="mini-stat-card" style={{ padding: '20px 24px', alignItems: 'flex-start', textAlign: 'left' }}>
                      <div className="mini-stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706', alignSelf: 'flex-start' }}>
                        <Award size={20} />
                      </div>
                      <div className="mini-stat-val" style={{ fontSize: '2.6rem', marginTop: '6px' }}>
                        {(() => {
                          const graded = gradeList.filter(g => g.score !== null && g.score !== undefined);
                          return graded.length > 0 
                            ? (graded.reduce((acc, curr) => acc + curr.score, 0) / graded.length).toFixed(1) 
                            : '—';
                        })()}
                      </div>
                      <div className="mini-stat-lbl" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Promedio Grupal</div>
                    </div>

                  </div>

                  {/* Large Student List Table */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        Lista de Calificaciones
                      </h3>
                      <span className="badge badge-present" style={{ textTransform: 'none', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Radio size={14} className="pulse-success" /> Sincronización Móvil QR Activa
                      </span>
                    </div>

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
                          {gradeList.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No hay alumnos registrados en esta materia.
                              </td>
                            </tr>
                          ) : (
                            gradeList.map((record, index) => (
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
                                        width: '70px',
                                        padding: '8px 10px',
                                        textAlign: 'center',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        borderRadius: '8px',
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>



                </div>
              ) : (
                
                /* VIEW 1: Main Subjects Cards Grid and Assignments list */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* Header */}
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

                  {/* Horizontal / Grid Cards Row */}
                  <div className="subjects-grid">
                    {subjects.map((s, index) => {
                      const visuals = getSubjectVisuals(s.name, index);
                      return (
                        <div 
                          key={s._id} 
                          className={`subject-card ${selectedSubject?._id === s._id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedSubject(s);
                            setSelectedAssignment(null);
                          }}
                        >
                          <div className="subject-card-icon-box" style={{ backgroundColor: visuals.bg, color: visuals.color }}>
                            {visuals.icon}
                          </div>
                          <div className="subject-card-name">{s.name}</div>
                        </div>
                      );
                    })}

                    {/* Dashed Create Card */}
                    <div 
                      className="subject-card"
                      style={{ 
                        borderStyle: 'dashed', 
                        borderColor: '#94a3b8', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        background: '#f8fafc',
                        height: '160px'
                      }}
                      onClick={() => setShowCreateSubjectModal(true)}
                    >
                      <div className="subject-card-icon-box" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        <Plus size={24} />
                      </div>
                      <div className="subject-card-name" style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px' }}>Crear Asignatura</div>
                    </div>
                  </div>

                  {/* Assignments Section below Subjects cards */}
                  {selectedSubject && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
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

                      {assignments.filter(a => (a.subject?._id || a.subject) === selectedSubject._id).length === 0 ? (
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
                                  padding: '20px',
                                  cursor: 'pointer',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '12px',
                                  background: '#ffffff',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
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

              {/* MODALS OVERLAYS (Rendered from both views if needed) */}
              
              {/* Modal Overlay to Register Subject */}
              {showCreateSubjectModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  backdropFilter: 'blur(4px)'
                }}>
                  <div className="glass-panel" style={{
                    maxWidth: '500px',
                    width: '100%',
                    padding: '32px',
                    borderRadius: '16px',
                    background: 'white',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={20} color="#0284c7" />
                      Registrar Nueva Asignatura
                    </h2>
                    <form onSubmit={async (e) => {
                      await handleCreateSubject(e);
                      setShowCreateSubjectModal(false);
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Nombre de la Asignatura</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Ej. Matemáticas"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Clave / Código</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="MAT-101"
                          value={newSubjectCode}
                          onChange={(e) => setNewSubjectCode(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Descripción (Opcional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Turno Matutino / Semestre Otoño"
                          value={newSubjectDesc}
                          onChange={(e) => setNewSubjectDesc(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setShowCreateSubjectModal(false)}
                          style={{ flex: 1, padding: '12px' }}
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '12px', background: '#0284c7' }}
                        >
                          Crear Asignatura
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal Overlay to Create Assignment (Tarea) */}
              {showCreateAssignmentModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  backdropFilter: 'blur(4px)'
                }}>
                  <div className="glass-panel" style={{
                    maxWidth: '500px',
                    width: '100%',
                    padding: '32px',
                    borderRadius: '16px',
                    background: 'white',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={20} color="#0284c7" />
                      Crear Nueva Tarea
                    </h2>
                    <form onSubmit={async (e) => {
                      await handleCreateAssignment(e);
                      setShowCreateAssignmentModal(false);
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Título de la Tarea</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Ej. Tarea 1: Fracciones"
                          value={newAssignmentTitle}
                          onChange={(e) => setNewAssignmentTitle(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Descripción / Instrucciones</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej. Resolver ejercicios de la página 45"
                          value={newAssignmentDesc}
                          onChange={(e) => setNewAssignmentDesc(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Puntuación Máxima</label>
                        <input
                          type="number"
                          required
                          min={1}
                          className="form-input"
                          value={newAssignmentMaxScore}
                          onChange={(e) => setNewAssignmentMaxScore(Number(e.target.value))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>Fecha de Entrega</label>
                        <input
                          type="date"
                          className="form-input"
                          value={newAssignmentDueDate}
                          onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => setShowCreateAssignmentModal(false)}
                          style={{ flex: 1, padding: '12px' }}
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '12px', background: '#0284c7' }}
                        >
                          Crear Tarea
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'students' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* If inspecting a specific student's details */}
              {selectedStudentDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Back Button */}
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

                  {/* Header */}
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
                  ) : studentSummary ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Metric Summary Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        
                        <div className="mini-stat-card" style={{ padding: '20px 24px', alignItems: 'flex-start', textAlign: 'left' }}>
                          <div className="mini-stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7', alignSelf: 'flex-start' }}>
                            <Calendar size={20} />
                          </div>
                          <div className="mini-stat-val" style={{ fontSize: '2.6rem', marginTop: '6px' }}>
                            {studentSummary.summary.attendanceRate}%
                          </div>
                          <div className="mini-stat-lbl" style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                            Asistencias: {studentSummary.summary.presents} | Retardos: {studentSummary.summary.lates} | Faltas: {studentSummary.summary.absents}
                          </div>
                        </div>

                        <div className="mini-stat-card" style={{ padding: '20px 24px', alignItems: 'flex-start', textAlign: 'left' }}>
                          <div className="mini-stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706', alignSelf: 'flex-start' }}>
                            <Award size={20} />
                          </div>
                          <div className="mini-stat-val" style={{ fontSize: '2.6rem', marginTop: '6px' }}>
                            {studentSummary.summary.averageGradePercent}%
                          </div>
                          <div className="mini-stat-lbl" style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                            Promedio General de Tareas Evaluadas ({studentSummary.summary.gradedAssignments}/{studentSummary.summary.totalAssignments})
                          </div>
                        </div>

                        <div className="mini-stat-card" style={{ padding: '20px 24px', alignItems: 'flex-start', textAlign: 'left' }}>
                          <div className="mini-stat-icon-wrapper" style={{ background: '#fee2e2', color: '#ef4444', alignSelf: 'flex-start' }}>
                            <Clock size={20} />
                          </div>
                          <div className="mini-stat-val" style={{ fontSize: '2.6rem', marginTop: '6px' }}>
                            {studentSummary.summary.pendingAssignments}
                          </div>
                          <div className="mini-stat-lbl" style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                            Tareas Pendientes de Evaluar
                          </div>
                        </div>

                      </div>

                      {/* Split Columns: Attendance and Grades */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                        
                        {/* Attendance History Card */}
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

                        {/* Task Grades History Card */}
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
                  ) : (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se pudo cargar el historial del estudiante.
                    </div>
                  )}

                </div>
              ) : (
                
                /* Standard Students Table and Registration Form */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                  
                  {/* Form */}
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

                  {/* List */}
                  <div className="glass-panel">
                    <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px' }}>Alumnos Vinculados</h2>
                    {filteredStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No hay estudiantes registrados.
                      </div>
                    ) : (
                      <div className="custom-table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Matrícula</th>
                              <th>Código de QR</th>
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
              )}

            </div>
          )}
                    {/* TAB: Reports (Calificaciones) */}
          {activeTab === 'reports' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px' }}>
              
              {/* Form & Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel">
                  <h3 style={{ fontSize: '1rem', color: '#0369a1', marginBottom: '12px' }}>Seleccionar Tarea</h3>
                  <select 
                    value={selectedAssignment?._id || ''} 
                    onChange={(e) => {
                      const task = assignments.find(t => t._id === e.target.value);
                      setSelectedAssignment(task || null);
                    }}
                    className="form-input"
                    style={{ background: '#f8fafc', marginBottom: '10px' }}
                  >
                    {assignments.length === 0 ? (
                      <option value="">No hay tareas registradas</option>
                    ) : (
                      assignments.map(a => <option key={a._id} value={a._id}>{a.title} (Max: {a.maxScore}p)</option>)
                    )}
                  </select>
                </div>

                <div className="glass-panel">
                  <h3 style={{ fontSize: '1rem', color: '#0369a1', marginBottom: '12px' }}>Nueva Tarea</h3>
                  <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Título</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Ej. Tarea 2: Ensayos"
                        value={newAssignmentTitle}
                        onChange={(e) => setNewAssignmentTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Puntaje Máximo</label>
                      <input
                        type="number"
                        required
                        className="form-input"
                        value={newAssignmentMaxScore}
                        onChange={(e) => setNewAssignmentMaxScore(parseInt(e.target.value) || 10)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                      Crear Tarea
                    </button>
                  </form>
                </div>
              </div>

              {/* Grades Table */}
              <div className="glass-panel">
                <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px' }}>Tablero de Calificaciones</h2>
                {!selectedAssignment ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Selecciona o crea una tarea en el menú lateral para evaluar a los estudiantes.
                  </div>
                ) : filteredGrades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No hay estudiantes.
                  </div>
                ) : (
                  <div className="custom-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Matrícula</th>
                          <th>Puntaje Obtenido</th>
                          <th>Hora Calificación</th>
                          <th>Editar Nota Manual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrades.map((record) => (
                          <tr key={record.studentId}>
                            <td style={{ fontWeight: 600 }}>{record.name}</td>
                            <td>{record.enrollmentNumber || '-'}</td>
                            <td>
                              {record.score !== null ? (
                                <span style={{ 
                                  fontWeight: 700, 
                                  color: record.score >= (selectedAssignment.maxScore * 0.6) ? 'var(--success)' : 'var(--error)',
                                  fontSize: '1rem' 
                                }}>
                                  {record.score} / {selectedAssignment.maxScore}
                                  {record.manualCorrection && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>(Manual)</span>}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin calificar</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {record.gradedAt ? new Date(record.gradedAt).toLocaleTimeString() : '-'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  className="form-input"
                                  style={{ width: '60px', padding: '4px 6px', fontSize: '0.85rem' }}
                                  min={0}
                                  max={selectedAssignment.maxScore}
                                  defaultValue={record.score || ''}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) {
                                      handleUpdateGradeManual(record.studentId, val);
                                    }
                                  }}
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>pts</span>
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
          )}

          {/* TAB: Settings */}
          {activeTab === 'settings' && (
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0369a1', marginBottom: '20px' }}>Información de la Cuenta</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Profesora</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{teacher?.name}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Institución Educativa</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{teacher?.schoolName}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Correo Electrónico</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{teacher?.email}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Identificador de Tenant</span>
                  <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{teacher?.teacherId}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal to display Student QR Code */}
      {activeQrStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '350px',
            width: '100%',
            padding: '30px',
            textAlign: 'center',
            borderRadius: '16px',
            background: 'white',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0c4a6e', marginBottom: '8px' }}>Código QR del Alumno</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{activeQrStudent.name}</p>
            
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${activeQrStudent.qrCode}`}
                alt={`Código QR para ${activeQrStudent.name}`}
                style={{ display: 'block' }}
              />
            </div>
            
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '20px', wordBreak: 'break-all' }}>
              {activeQrStudent.qrCode}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => window.print()}
                style={{ width: '100%' }}
              >
                Imprimir Código QR
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveQrStudent(null)}
                style={{ width: '100%' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
