'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Award, CheckCircle, ShieldAlert, AlertCircle,
  Send, Flashlight, X, ClipboardList, RefreshCw, Database,
  Sliders, Zap, User, Clock, Check, ClipboardCheck, Image
} from 'lucide-react';
// We import html5-qrcode dynamically because it accesses window/navigator and is client-side only
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/config/api';

export default function ScannerPage() {
  const router = useRouter();
  
  // Auth state
  const [token, setToken] = useState('');
  const [teacher, setTeacher] = useState<any>(null);

  // Scanner Configuration
  const [scanMode, setScanMode] = useState<'attendance' | 'grades'>('attendance');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [gradingScore, setGradingScore] = useState<number>(10);
  
  // Custom states matching design
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Scan simulation fallback
  const [manualQrCode, setManualQrCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Scanning feedback
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [scannedData, setScannedData] = useState<{
    studentName: string;
    action: string;
    time: string;
  } | null>(null);

  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  // Debounce: track last scanned code + timestamp to avoid duplicate scans
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Parse query string client-side safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const subId = params.get('subjectId');
      const assId = params.get('assignmentId');
      if (mode === 'attendance' || mode === 'grades') {
        setScanMode(mode);
      }
      if (subId) {
        setSelectedSubjectId(subId);
      }
      if (assId) {
        setSelectedAssignmentId(assId);
      }
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');

    if (!savedToken || !savedUserStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(savedUserStr);
    setTeacher(user);
    setToken(savedToken);

    let initialSubId = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      initialSubId = params.get('subjectId') || '';
    }
    fetchSubjects(savedToken, initialSubId);
    fetchStudents(savedToken);
  }, [router]);

  // Load assignments when subject changes
  useEffect(() => {
    if (token && selectedSubjectId && scanMode === 'grades') {
      let initialAssId = '';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        initialAssId = params.get('assignmentId') || '';
      }
      fetchAssignments(token, selectedSubjectId, initialAssId);
    }
  }, [selectedSubjectId, scanMode, token]);

  // Auto-open config drawer when entering grades mode if no task is selected
  useEffect(() => {
    if (scanMode === 'grades' && !selectedAssignmentId) {
      setShowConfig(true);
    }
  }, [scanMode, selectedAssignmentId]);

  // Load offline queue from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedQueue = localStorage.getItem('offlineQueue');
      if (savedQueue) {
        try {
          setOfflineQueue(JSON.parse(savedQueue));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save offline queue to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    }
  }, [offlineQueue]);

  // File Scanning handler
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('loading');
    setStatusMessage('Procesando imagen...');

    try {
      let scanner = qrCodeRef.current;
      let wasScanning = false;

      if (scanner && scanner.isScanning) {
        wasScanning = true;
        await scanner.stop();
      }

      const tempScanner = new Html5Qrcode('reader');
      const decodedText = await tempScanner.scanFile(file, true);
      
      setScanStatus('idle');
      processScan(decodedText);

      // Restart camera scanning if it was running
      if (wasScanning) {
        tempScanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 }
          },
          handleScanSuccess,
          () => {}
        ).then(() => {
          qrCodeRef.current = tempScanner;
        });
      }
    } catch (err: any) {
      setScanStatus('error');
      setStatusMessage('No se pudo decodificar ningún código QR en la imagen.');
      
      // Attempt to restart camera if it was stopped
      if (qrCodeRef.current && !qrCodeRef.current.isScanning) {
        qrCodeRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 }
          },
          handleScanSuccess,
          () => {}
        ).catch(console.error);
      }
      
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 3000);
    }
  };

  // Initialize html5-qrcode camera scanner
  useEffect(() => {
    const readyToScan = 
      (scanMode === 'attendance') ||
      (scanMode === 'grades' && selectedAssignmentId);

    if (!readyToScan) {
      if (qrCodeRef.current && qrCodeRef.current.isScanning) {
        qrCodeRef.current.stop().catch(err => console.error(err));
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const html5QrCode = new Html5Qrcode('reader');
        qrCodeRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 }
          },
          handleScanSuccess,
          () => {}
        ).catch(err => {
          console.error('Error starting Html5Qrcode:', err);
        });
      } catch (err) {
        console.error('Error initializing Html5Qrcode:', err);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (qrCodeRef.current) {
        if (qrCodeRef.current.isScanning) {
          qrCodeRef.current.stop().catch(err => console.error(err));
        }
      }
    };
  }, [scanMode, selectedSubjectId, selectedAssignmentId]);

  const fetchSubjects = async (authToken: string, initialSubjectId?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subjects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok && data.length > 0) {
        setSubjects(data);
        const subId = initialSubjectId || data[0]._id;
        setSelectedSubjectId(subId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
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

  const fetchAssignments = async (authToken: string, subjectId: string, initialAssignmentId?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments?subjectId=${subjectId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAssignments(data);
        if (data.length > 0) {
          const exists = initialAssignmentId ? data.some((a: any) => a._id === initialAssignmentId) : false;
          if (initialAssignmentId && exists) {
            setSelectedAssignmentId(initialAssignmentId);
            const matching = data.find((a: any) => a._id === initialAssignmentId);
            setGradingScore(matching.maxScore || 10);
          } else {
            setSelectedAssignmentId(data[0]._id);
            setGradingScore(data[0].maxScore || 10);
          }
        } else {
          setSelectedAssignmentId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processScan = async (qrCodeString: string) => {
    setScanStatus('loading');
    setStatusMessage('Procesando escaneo...');

    try {
      let endpoint = '';
      let body: any = { qrCode: qrCodeString };

      if (scanMode === 'attendance') {
        endpoint = `${API_BASE_URL}/attendance/scan`;
        body.subjectId = selectedSubjectId;
      } else {
        endpoint = `${API_BASE_URL}/grades/scan`;
        body.assignmentId = selectedAssignmentId;
        body.score = gradingScore;
      }

      const activeToken = localStorage.getItem('token') || token;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar código QR');
      }

      const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      const studentName = data?.student?.name || data?.studentName || 'Alumno';
      const scoreDisplay = data?.score ?? gradingScore;
      
      setScannedData({
        studentName,
        action: scanMode === 'attendance' ? 'Asistencia registrada' : `Calificación registrada: ${scoreDisplay} pts`,
        time: formattedTime
      });
      setScanStatus('success');
      setStatusMessage('');

      toast.success(`${studentName}: ${scanMode === 'attendance' ? 'Asistencia' : `Nota: ${scoreDisplay} pts`}`);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }

      setTimeout(() => {
        setScanStatus('idle');
        setScannedData(null);
      }, 2500);

    } catch (err: any) {
      setScanStatus('error');
      const errMsg = err.message || 'Código QR no reconocido';
      setStatusMessage(errMsg);
      toast.error(errMsg);
      
      // If server scan fails, we can add it to the offline queue as fallback
      const foundStudent = students.find(s => s.qrCode === qrCodeString);
      const studentName = foundStudent ? foundStudent.name : (qrCodeString.startsWith('STUDENT-') ? `Alumno ${qrCodeString.split('-')[3] || qrCodeString.split('-')[1] || 'Temp'}` : 'Código Escaneado');
      const newOfflineItem = {
        mode: scanMode,
        qrCode: qrCodeString,
        name: studentName,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subjectId: selectedSubjectId,
        assignmentId: selectedAssignmentId,
        score: gradingScore
      };
      
      setOfflineQueue(prev => [newOfflineItem, ...prev]);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 4000);
    }
  };

  const SCAN_COOLDOWN_MS = 3000; // ms to ignore the same QR code again

  const handleScanSuccess = (decodedText: string) => {
    const now = Date.now();
    const last = lastScannedRef.current;
    // Block if same code scanned within cooldown window
    if (decodedText === last.code && now - last.time < SCAN_COOLDOWN_MS) {
      return;
    }
    if (scanStatus === 'idle') {
      lastScannedRef.current = { code: decodedText, time: now };
      processScan(decodedText);
    }
  };

  const handleScanError = (errorMessage: string) => {
    // Silent
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQrCode.trim()) {
      processScan(manualQrCode.trim());
      setManualQrCode('');
    }
  };

  const handleSyncQueue = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    const loadToast = toast.loading('Sincronizando cola de escaneos...');
    
    let successCount = 0;
    const failedItems: any[] = [];

    for (const item of offlineQueue) {
      try {
        let endpoint = '';
        const body: any = { qrCode: item.qrCode };

        if (item.mode === 'attendance') {
          endpoint = `${API_BASE_URL}/attendance/scan`;
          body.subjectId = item.subjectId;
        } else {
          endpoint = `${API_BASE_URL}/grades/scan`;
          body.assignmentId = item.assignmentId;
          body.score = item.score;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error('Sync failed');
        }
        successCount++;
      } catch (err) {
        failedItems.push(item);
      }
    }

    setIsSyncing(false);
    setOfflineQueue(failedItems);
    setShowQueueModal(false);

    if (failedItems.length === 0) {
      setScanStatus('success');
      setStatusMessage(`¡Sincronización exitosa! Se subieron ${successCount} registros.`);
      toast.success(`¡Sincronización exitosa! Se subieron ${successCount} registros.`, { id: loadToast });
    } else {
      setScanStatus('error');
      setStatusMessage(`Sincronización parcial: ${successCount} subidos, ${failedItems.length} fallidos.`);
      toast.error(`Sincronización parcial: ${successCount} subidos, ${failedItems.length} fallidos.`, { id: loadToast });
    }

    setTimeout(() => {
      setScanStatus('idle');
      setStatusMessage('');
    }, 4000);
  };

  const activeSubject = subjects.find(s => s._id === selectedSubjectId);
  const activeAssignment = assignments.find(a => a._id === selectedAssignmentId);

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      color: 'white',
      fontFamily: 'var(--font-outfit)'
    }}>

      {/* ===== FULLSCREEN CAMERA BACKGROUND ===== */}
      <div
        id="reader"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />

      {/* Dark vignette overlay so UI stays readable */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.65) 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* ===== ALL UI IS OVERLAID ABOVE THE CAMERA ===== */}
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 2
      }}>

      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '20px 24px', 
        zIndex: 10,
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0) 100%)'
      }}>
        <button 
          onClick={() => router.push('/dashboard')} 
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '0.5px' }}>
            Escáner QR
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            EducaQR inteligente
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>

          {/* Config Drawer Toggle */}
          <button 
            onClick={() => setShowConfig(prev => !prev)}
            style={{ 
              background: showConfig ? '#0284c7' : 'rgba(255,255,255,0.1)', 
              border: 'none', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!showConfig) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              if (!showConfig) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            <Sliders size={18} />
          </button>
        </div>
      </header>

      {/* Segmented Mode Selector & Context Status Banner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
        {/* Segmented Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '4px',
          margin: '0 24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
          <button
            onClick={() => {
              setScanMode('attendance');
              setScanStatus('idle');
              setStatusMessage('');
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '12px',
              background: scanMode === 'attendance' ? '#0284c7' : 'transparent',
              border: 'none',
              color: scanMode === 'attendance' ? 'white' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ClipboardCheck size={16} />
            Asistencias
          </button>
          <button
            onClick={() => {
              setScanMode('grades');
              setScanStatus('idle');
              setStatusMessage('');
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '12px',
              background: scanMode === 'grades' ? '#0284c7' : 'transparent',
              border: 'none',
              color: scanMode === 'grades' ? 'white' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Award size={16} />
            Calificaciones
          </button>
        </div>

        {/* Status context banner */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '8px 16px',
          margin: '0 24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8rem',
          color: '#e2e8f0',
          textAlign: 'center',
          fontWeight: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {scanMode === 'attendance' ? (
            <span>
              📅{' '}
              <strong style={{ color: '#38bdf8' }}>
                {activeSubject ? `${activeSubject.name} (${activeSubject.code})` : 'Cargando materia...'}
              </strong>
            </span>
          ) : (
            <span>
              🎯{' '}
              <strong style={{ color: '#38bdf8' }}>
                {activeSubject ? activeSubject.name : 'Cargando materia...'}
              </strong>
              {activeAssignment ? (
                <>
                  {' • '}Tarea:{' '}
                  <strong style={{ color: '#fbbf24' }}>
                    {activeAssignment.title} ({gradingScore} pts)
                  </strong>
                </>
              ) : (
                <span style={{ color: '#f87171' }}> (Falta elegir tarea en configuración ⚙️)</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Configuration Drawer */}
      {showConfig && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          zIndex: 9,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>SELECCIONAR MATERIA</label>
            <select 
              value={selectedSubjectId} 
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="form-input"
              style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            >
              {subjects.map(s => <option key={s._id} value={s._id} style={{color: '#000'}}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          {scanMode === 'grades' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0, flex: 2 }}>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>TAREA A EVALUAR</label>
                <select 
                  value={selectedAssignmentId} 
                  onChange={(e) => {
                    setSelectedAssignmentId(e.target.value);
                    const task = assignments.find(t => t._id === e.target.value);
                    if (task) setGradingScore(task.maxScore);
                  }}
                  className="form-input"
                  style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                >
                  {assignments.length === 0 ? (
                    <option value="">No hay tareas registradas</option>
                  ) : (
                    assignments.map(a => <option key={a._id} value={a._id} style={{color: '#000'}}>{a.title}</option>)
                  )}
                </select>
              </div>
              
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>PUNTOS</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ padding: '10px 14px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  value={gradingScore}
                  min={0}
                  onChange={(e) => setGradingScore(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Success Toast HUD */}
      {scanStatus === 'success' && scannedData && (
        <div style={{
          position: 'fixed',
          top: '130px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: '380px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 999,
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#0f172a'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Check size={20} color="#16a34a" strokeWidth={3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{scannedData.studentName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              {scannedData.action}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, alignSelf: 'flex-start' }}>
            {scannedData.time}
          </div>
        </div>
      )}

      {/* Floating Error Toast HUD */}
      {scanStatus === 'error' && (
        <div style={{
          position: 'fixed',
          top: '130px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: '380px',
          background: 'rgba(239, 68, 68, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 999,
          color: 'white'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Error de Lectura</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.95, fontWeight: 600, marginTop: '2px' }}>
              {statusMessage}
            </div>
          </div>
        </div>
      )}

      {/* Camera Viewport Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'relative',
        padding: '24px'
      }}>
        
        {/* Flashlight beam simulation */}
        {isTorchOn && (
          <div style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(253, 224, 71, 0.25) 0%, rgba(253, 224, 71, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 3
          }} />
        )}

        {/* Verification Loader Indicator */}
        {scanStatus === 'loading' && (
          <div style={{
            position: 'absolute',
            zIndex: 10,
            borderRadius: '24px',
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '24px 32px',
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255,255,255,0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '12px'
            }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Procesando código QR...</span>
          </div>
        )}

        {/* Viewfinder overlay layout */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '320px', 
          height: '320px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          
          {/* Viewfinder frame or Warning card if no assignment is selected */}
          {(scanMode === 'attendance' || (scanMode === 'grades' && selectedAssignmentId)) ? (
            <div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent' }}></div>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'rgba(30, 41, 59, 0.85)', 
              backdropFilter: 'blur(8px)',
              borderRadius: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '28px',
              textAlign: 'center'
            }}>
              <AlertCircle size={44} color="#fbbf24" style={{ marginBottom: '14px' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 800 }}>Módulo de Calificaciones</h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4', fontWeight: 500 }}>
                Selecciona una tarea en la configuración (⚙️) para activar la cámara del lector.
              </p>
            </div>
          )}
          
          {/* Corner frame overlays */}
          {(scanMode === 'attendance' || (scanMode === 'grades' && selectedAssignmentId)) && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              {/* Instructions pill */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#f1f5f9',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '20px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                Alinea el código QR en el centro
              </div>

              {/* Blue Corner Scanning Frame matching the screenshot */}
              <div className="qr-scanner-frame" style={{
                position: 'relative',
                width: '210px',
                height: '210px',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '24px',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)' /* Immersive darken effect */
              }}>
                <div className="qr-corner corner-tl" />
                <div className="qr-corner corner-tr" />
                <div className="qr-corner corner-bl" />
                <div className="qr-corner corner-br" />
                <div className="scan-laser-line" />
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Bottom Sheet Action Panel matching the image exactly */}
      <div style={{
        background: 'white',
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        padding: '24px 32px 32px 32px',
        color: '#0f172a',
        boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.3)',
        zIndex: 8
      }}>
        
        {/* Dynamic scanning title summary */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {scanMode === 'attendance' ? 'Escanear Asistencia' : 'Escanear Tarea'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
            {scanMode === 'attendance' 
              ? 'Registra asistencia escaneando el código del alumno'
              : (activeAssignment ? `Registrando: ${activeAssignment.title} (${gradingScore} pts)` : 'Elige una tarea para calificar')
            }
          </p>
        </div>

        {/* 2 Column Action Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>

          {/* Center Column: Flashlight */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              onClick={() => setIsTorchOn(prev => !prev)}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#0284c7',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                marginBottom: '8px',
                boxShadow: isTorchOn ? '0 0 20px rgba(2, 132, 199, 0.6)' : '0 10px 15px -3px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.2s',
                transform: isTorchOn ? 'scale(0.95)' : 'scale(1)'
              }}
            >
              <Flashlight size={30} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              Linterna
            </span>
          </div>

          {/* Right Column: Offline queue (Cola Offline) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <button 
                onClick={() => setShowQueueModal(true)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <Database size={20} />
              </button>
              {offlineQueue.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  {offlineQueue.length}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
              Cola Offline
            </span>
          </div>

        </div>
      </div>

      {/* Offline Queue Modal */}
      {showQueueModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '500px',
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            padding: '32px 24px',
            color: '#0f172a',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Cola de Escaneos Offline</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>Códigos QR acumulados pendientes de sincronizar</p>
              </div>
              <button 
                onClick={() => setShowQueueModal(false)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {offlineQueue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No hay escaneos pendientes en la cola.
                </div>
              ) : (
                offlineQueue.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '14px 18px', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Código: {item.qrCode}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                      {item.date}
                    </div>
                  </div>
                ))
              )}
            </div>

            {offlineQueue.length > 0 && (
              <button 
                onClick={handleSyncQueue}
                disabled={isSyncing}
                className="btn btn-primary"
                style={{ 
                  padding: '14px', 
                  background: '#0284c7', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}
              >
                <RefreshCw size={18} className={isSyncing ? 'spin' : ''} />
                {isSyncing ? 'Subiendo escaneos a la nube...' : 'Sincronizar y Subir'}
              </button>
            )}
          </div>
        </div>
      )}

      </div>{/* end UI overlay */}

      {/* Embedding Custom CSS Styles */}
      <style jsx>{`
        .qr-corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 4px solid #3b82f6;
        }
        .corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 12px; }
        .corner-tr { top: 0; right: 0; border-left: none; border-bottom: none; border-top-right-radius: 12px; }
        .corner-bl { bottom: 0; left: 0; border-right: none; border-top: none; border-bottom-left-radius: 12px; }
        .corner-br { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 12px; }
        
        .scan-laser-line {
          position: absolute;
          width: 100%;
          height: 3px;
          background: #10b981;
          box-shadow: 0 0 10px #10b981, 0 0 20px rgba(16, 185, 129, 0.5);
          animation: scan-laser 2.5s linear infinite;
        }

        @keyframes scan-laser {
          0% { top: 4%; }
          50% { top: 96%; }
          100% { top: 4%; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.2s linear infinite;
        }
      `}</style>
      
      <style jsx global>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #reader {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
