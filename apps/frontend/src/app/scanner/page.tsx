'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Award, CheckCircle, ShieldAlert, 
  Send, Flashlight, X, ClipboardList, RefreshCw, Database,
  Sliders, Zap, User, Clock, Check, ClipboardCheck
} from 'lucide-react';
// We import html5-qrcode dynamically because it accesses window/navigator and is client-side only
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerPage() {
  const router = useRouter();
  
  // Auth state
  const [token, setToken] = useState('');
  const [teacher, setTeacher] = useState<any>(null);

  // Scanner Configuration
  const [scanMode, setScanMode] = useState<'attendance' | 'grades'>('attendance');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [gradingScore, setGradingScore] = useState<number>(10);
  
  // Custom states matching design
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([
    { qrCode: 'STUDENT-101', name: 'Juan Pérez', date: 'Hoy, 09:40 AM' },
    { qrCode: 'STUDENT-102', name: 'María Gómez', date: 'Hoy, 09:41 AM' },
    { qrCode: 'STUDENT-103', name: 'Carlos López', date: 'Hoy, 09:41 AM' },
    { qrCode: 'STUDENT-104', name: 'Ana Martínez', date: 'Hoy, 09:42 AM' },
    { qrCode: 'STUDENT-105', name: 'Luis Rodríguez', date: 'Hoy, 09:43 AM' },
  ]);

  // Scan simulation fallback
  const [manualQrCode, setManualQrCode] = useState('');

  // Scanning feedback
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [scannedData, setScannedData] = useState<{
    studentName: string;
    action: string;
    time: string;
  } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Initialize html5-qrcode camera scanner
  useEffect(() => {
    // Only initialize scanner if we have selected the required fields
    const readyToScan = 
      (scanMode === 'attendance') ||
      (scanMode === 'grades' && selectedAssignmentId);

    if (!readyToScan) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    // Delay instantiation to ensure DOM element '#reader' is fully rendered
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'reader',
          { 
            fps: 15, 
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );

        scanner.render(handleScanSuccess, handleScanError);
        scannerRef.current = scanner;
      } catch (err) {
        console.error('Error initializing scanner:', err);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Error clearing scanner:', err));
        scannerRef.current = null;
      }
    };
  }, [scanMode, selectedSubjectId, selectedAssignmentId]);

  // Start rear camera feed for fullscreen background, with dynamic visibility control
  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      if (streamRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('No se pudo acceder a la cámara trasera:', err);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };

    startCamera();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startCamera();
      } else {
        stopCamera();
      }
    };

    const handlePageShow = () => {
      startCamera();
    };

    const handlePageHide = () => {
      stopCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      active = false;
      stopCamera();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  const fetchSubjects = async (authToken: string, initialSubjectId?: string) => {
    try {
      const response = await fetch('http://localhost:3001/subjects', {
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

  const fetchAssignments = async (authToken: string, subjectId: string, initialAssignmentId?: string) => {
    try {
      const response = await fetch(`http://localhost:3001/assignments?subjectId=${subjectId}`, {
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
        endpoint = 'http://localhost:3001/attendance/scan';
        body.subjectId = selectedSubjectId;
      } else {
        endpoint = 'http://localhost:3001/grades/scan';
        body.assignmentId = selectedAssignmentId;
        body.score = gradingScore;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar código QR');
      }

      const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      // Attendance returns populated student obj; grades returns populated student obj
      const studentName = data?.student?.name || data?.studentName || 'Alumno';
      const scoreDisplay = data?.score ?? gradingScore;
      
      setScannedData({
        studentName,
        action: scanMode === 'attendance' ? 'Asistencia registrada' : `Calificación registrada: ${scoreDisplay} pts`,
        time: formattedTime
      });
      setScanStatus('success');

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }

    } catch (err: any) {
      setScanStatus('error');
      setStatusMessage(err.message || 'Código QR no reconocido');
      
      // If server scan fails, we can add it to the offline queue as fallback
      const studentName = qrCodeString.startsWith('STUDENT-') ? `Alumno ${qrCodeString.split('-')[1] || 'Temp'}` : 'Código Escaneado';
      const newOfflineItem = {
        qrCode: qrCodeString,
        name: studentName,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const handleScanSuccess = (decodedText: string) => {
    if (scanStatus === 'idle') {
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
    
    // Simulate cloud uploading logs
    setTimeout(() => {
      setIsSyncing(false);
      setOfflineQueue([]);
      setShowQueueModal(false);
      setScanStatus('success');
      setStatusMessage('¡Sincronización de cola completada con éxito!');
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 3000);
    }, 2550);
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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
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
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 100%)'
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
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
            Escáner Activo
          </h1>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            color: '#38bdf8', 
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px'
          }}>
            {scanMode === 'attendance' ? 'Asistencia General' : `Calificar ${activeSubject ? `• ${activeSubject.name}` : ''}`}
          </span>
        </div>

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
        >
          <Sliders size={18} />
        </button>
      </header>

      {/* Expandable Configuration Drawer */}
      {showConfig && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 9,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>MATERIA</label>
            <select 
              value={selectedSubjectId} 
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="form-input"
              style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {subjects.map(s => <option key={s._id} value={s._id} style={{color: '#000'}}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          {scanMode === 'grades' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0, flex: 2 }}>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>TAREA A CALIFICAR</label>
                <select 
                  value={selectedAssignmentId} 
                  onChange={(e) => {
                    setSelectedAssignmentId(e.target.value);
                    const task = assignments.find(t => t._id === e.target.value);
                    if (task) setGradingScore(task.maxScore);
                  }}
                  className="form-input"
                  style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {assignments.length === 0 ? (
                    <option value="">No hay tareas para esta materia</option>
                  ) : (
                    assignments.map(a => <option key={a._id} value={a._id} style={{color: '#000'}}>{a.title}</option>)
                  )}
                </select>
              </div>
              
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>PUNTAJE</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ padding: '10px 14px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={gradingScore}
                  min={0}
                  onChange={(e) => setGradingScore(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Scanning Area */}
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

        {/* Verification Status Overlay */}
        {scanStatus !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            zIndex: 10,
            borderRadius: '24px',
            background: scanStatus === 'success' ? 'rgba(16, 185, 129, 0.95)' : 
                        scanStatus === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '30px',
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            {scanStatus === 'success' && <CheckCircle size={64} style={{ marginBottom: '15px', color: '#34d399' }} />}
            {scanStatus === 'error' && <ShieldAlert size={64} style={{ marginBottom: '15px', color: '#f87171' }} />}
            {scanStatus === 'loading' && <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(255,255,255,0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }} />}
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
              {scanStatus === 'success' ? '¡Escaneado!' : scanStatus === 'error' ? 'Error' : 'Verificando'}
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>{statusMessage}</p>
          </div>
        )}

        {/* Immersive Scanning Box layout matching image */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '320px', 
          height: '320px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          
          {/* html5-qrcode reader element goes behind */}
          {(scanMode === 'attendance' || (scanMode === 'grades' && selectedAssignmentId)) ? (
            <div id="reader" style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}></div>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: '#1e293b', 
              borderRadius: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <Zap size={36} color="#38bdf8" style={{ marginBottom: '8px', opacity: 0.9 }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#f1f5f9' }}>Configurar Escáner</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Selecciona los datos para iniciar
                  </p>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>MATERIA</label>
                  <select 
                    value={selectedSubjectId} 
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="form-input"
                    style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', width: '100%', borderRadius: '8px' }}
                  >
                    <option value="" style={{color: '#000'}}>-- Seleccionar Materia --</option>
                    {subjects.map(s => <option key={s._id} value={s._id} style={{color: '#000'}}>{s.name} ({s.code})</option>)}
                  </select>
                </div>

                {scanMode === 'grades' && (
                  <>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>TAREA A CALIFICAR</label>
                      <select 
                        value={selectedAssignmentId} 
                        onChange={(e) => {
                          setSelectedAssignmentId(e.target.value);
                          const task = assignments.find(t => t._id === e.target.value);
                          if (task) setGradingScore(task.maxScore);
                        }}
                        className="form-input"
                        style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', width: '100%', borderRadius: '8px' }}
                      >
                        <option value="" style={{color: '#000'}}>-- Seleccionar Tarea --</option>
                        {assignments.length === 0 ? (
                          <option value="" style={{color: '#000'}} disabled>No hay tareas para esta materia</option>
                        ) : (
                          assignments.map(a => <option key={a._id} value={a._id} style={{color: '#000'}}>{a.title}</option>)
                        )}
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>PUNTAJE A ASIGNAR</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', width: '100%', borderRadius: '8px' }}
                        value={gradingScore}
                        min={0}
                        onChange={(e) => setGradingScore(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Overlay elements */}
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
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#f1f5f9',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                Alinea el código QR dentro del recuadro
              </div>

              {/* Blue Corner Scanning Frame matching the screenshot */}
              <div className="qr-scanner-frame" style={{
                position: 'relative',
                width: '220px',
                height: '220px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
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

      {/* Manual Code Simulator Input in a drawer form */}
      <div style={{ padding: '0 24px', marginBottom: '10px' }}>
        <details style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <summary style={{ padding: '12px', fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>
            Simular Escaneo Manual
          </summary>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', padding: '0 12px 12px 12px' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}
              placeholder="Ej. STUDENT-101"
              value={manualQrCode}
              onChange={(e) => setManualQrCode(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', background: '#0284c7' }}>
              <Send size={14} />
            </button>
          </form>
        </details>
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
        
        {/* Active scan mode configuration visual representation */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {scanMode === 'attendance' ? 'Escanear Asistencia' : 'Escanear Tarea'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
            {scanMode === 'attendance' 
              ? 'Asistencia General'
              : (activeAssignment ? `Evaluando: ${activeAssignment.title} (${gradingScore} pts)` : 'Tarea no seleccionada')
            }
          </p>
        </div>

        {/* 3 Column design matching the screenshot */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          
          {/* Left Column: Toggle Mode (Calificar / Asistencia) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              onClick={() => {
                setScanMode(prev => prev === 'attendance' ? 'grades' : 'attendance');
                setScanStatus('idle');
                setStatusMessage('');
              }}
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
                marginBottom: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              {scanMode === 'attendance' ? <ClipboardList size={22} /> : <Calendar size={22} />}
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
              {scanMode === 'attendance' ? 'Calificar' : 'Asistencias'}
            </span>
          </div>

          {/* Center Column: Flashlight (Linterna) */}
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
                boxShadow: isTorchOn ? '0 0 20px #0284c7' : '0 10px 15px -3px rgba(2, 132, 199, 0.4)',
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
                <Database size={22} />
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

      {/* Success Scan Modal Overlay */}
      {scanStatus === 'success' && scannedData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          fontFamily: 'var(--font-outfit), sans-serif'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '340px',
            background: 'white',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header Section */}
            <div style={{
              background: '#f1f5f9',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Check size={28} color="#16a34a" strokeWidth={3} />
              </div>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                textAlign: 'center'
              }}>
                Escaneo Exitoso
              </h2>
            </div>

            {/* Body Section */}
            <div style={{
              padding: '24px 24px 16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Item: Alumno */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ color: '#64748b', marginTop: '3px' }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Alumno</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {scannedData.studentName}
                  </div>
                </div>
              </div>

              {/* Thin Line separator */}
              <div style={{ borderBottom: '1px solid #f1f5f9' }} />

              {/* Item: Acción */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ color: '#64748b', marginTop: '3px' }}>
                  <ClipboardCheck size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Acción</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {scannedData.action}
                  </div>
                </div>
              </div>

              {/* Item: Hora */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ color: '#64748b', marginTop: '3px' }}>
                  <Clock size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Hora</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {scannedData.time}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div style={{
              background: '#f8fafc',
              padding: '16px 20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setScanStatus('idle');
                  setStatusMessage('');
                  setScannedData(null);
                }}
                style={{
                  width: '100%',
                  background: '#025ca2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(2, 92, 162, 0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#014c88'}
                onMouseOut={(e) => e.currentTarget.style.background = '#025ca2'}
              >
                Continuar Escaneando
              </button>
            </div>
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
        /* Hide the internal video/viewfinder of html5-qrcode — we show our own */
        #reader video,
        #reader__scan_region video {
          display: none !important;
        }
        #reader,
        #reader__scan_region,
        #reader__dashboard {
          background: transparent !important;
          border: none !important;
        }
        #html5-qrcode-button-camera-start,
        #html5-qrcode-button-camera-stop,
        #html5-qrcode-button-camera-permission {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          border-radius: 10px;
          background: #0284c7 !important;
          color: white !important;
          border: none;
          font-family: var(--font-outfit);
          font-weight: 700;
          font-size: 0.85rem;
          margin-top: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        #html5-qrcode-button-camera-start:hover {
          background: #0369a1 !important;
        }
        #html5-qrcode-anchor-scan-type-change {
          color: #38bdf8;
          text-decoration: none;
          font-size: 0.8rem;
          display: block;
          margin-top: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
