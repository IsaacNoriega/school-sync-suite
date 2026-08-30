const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const parsedUrl = new URL(url);
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Iniciando pruebas avanzadas de validación, seguridad y autorización del backend...\n');
  const timestamp = Date.now().toString(36).toUpperCase();
  const testEmail = `teacher_${timestamp}@test.com`;
  const secondEmail = `teacher_sec_${timestamp}@test.com`;
  const testEnrollment = `ENROLL_${timestamp}`;
  const testSubjectName = `Asignatura Test ${timestamp}`;
  const testAssignmentTitle = `Tarea Test ${timestamp}`;

  let adminToken = '';
  let teacherToken = '';
  let secondTeacherToken = '';
  let subjectId = '';
  let studentId = '';
  let studentQr = '';
  let secondStudentQr = '';
  let assignmentId = '';

  // 1. Login Admin
  try {
    console.log('🧪 Prueba 1: Iniciar sesión como SUPER_ADMIN...');
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@schoolsync.com', password: 'admin123' }
    });
    if (res.status === 200 || res.status === 201) {
      adminToken = res.body.access_token;
      console.log('   ✅ SUPER_ADMIN autenticado correctamente.\n');
    } else {
      console.log('   ❌ Error al autenticar SUPER_ADMIN:', res.body);
      process.exit(1);
    }
  } catch (e) {
    console.error('   ❌ Error de conexión al backend (¿está encendido en el puerto 3001?):', e.message);
    process.exit(1);
  }

  // 2. Registro Duplicado Admin/User
  console.log('🧪 Prueba 2: Intentar registrar un correo ya existente...');
  const resRegisterDuplicate = await request('/auth/register-teacher', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      email: 'admin@schoolsync.com',
      password: 'password123',
      name: 'Admin Duplicate',
      schoolName: 'Test School'
    }
  });
  if (resRegisterDuplicate.status === 409 && resRegisterDuplicate.body.message === 'El correo electrónico ya está registrado.') {
    console.log('   ✅ Validado correctamente. Retornó 409 con el mensaje en español esperado.\n');
  } else {
    console.log('   ❌ Falla en validación de correo duplicado. Status:', resRegisterDuplicate.status, 'Body:', resRegisterDuplicate.body);
    process.exit(1);
  }

  // 3. Registrar nuevo profesor (Teacher 1)
  console.log('🧪 Prueba 3: Registrar primer profesor para pruebas...');
  const resRegister = await request('/auth/register-teacher', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      email: testEmail,
      password: 'password123',
      name: 'Profesor Test 1',
      schoolName: 'Test School 1'
    }
  });
  if (resRegister.status === 201 || resRegister.status === 200) {
    console.log(`   ✅ Profesor 1 creado: ${testEmail}\n`);
  } else {
    console.log('   ❌ Error al registrar nuevo profesor:', resRegister.body);
    process.exit(1);
  }

  // 4. Iniciar sesión con primer profesor
  console.log('🧪 Prueba 4: Iniciar sesión con el primer profesor...');
  const resLoginTeacher = await request('/auth/login', {
    method: 'POST',
    body: { email: testEmail, password: 'password123' }
  });
  if (resLoginTeacher.status === 200 || resLoginTeacher.status === 201) {
    teacherToken = resLoginTeacher.body.access_token;
    console.log('   ✅ Profesor 1 autenticado correctamente.\n');
  } else {
    console.log('   ❌ Error al autenticar profesor:', resLoginTeacher.body);
    process.exit(1);
  }

  // 5. Crear Asignatura
  console.log('🧪 Prueba 5: Registrar nueva asignatura...');
  const resSubject = await request('/subjects', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      name: testSubjectName,
      description: 'Asignatura para pruebas de integración',
      iconKey: 'BookOpen',
      color: '#0284c7'
    }
  });
  if (resSubject.status === 201 || resSubject.status === 200) {
    subjectId = resSubject.body._id;
    console.log(`   ✅ Asignatura creada con ID: ${subjectId}\n`);
  } else {
    console.log('   ❌ Error al crear asignatura:', resSubject.body);
    process.exit(1);
  }

  // 6. Crear Asignatura Duplicada
  console.log('🧪 Prueba 6: Intentar registrar asignatura con nombre idéntico...');
  const resSubjectDuplicate = await request('/subjects', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      name: testSubjectName,
      description: 'Otra descripción',
      iconKey: 'Calculator',
      color: '#ef4444'
    }
  });
  if (resSubjectDuplicate.status === 409 && resSubjectDuplicate.body.message === 'Ya tienes una asignatura registrada con este nombre.') {
    console.log('   ✅ Validado correctamente. Retornó 409 con el mensaje en español esperado.\n');
  } else {
    console.log('   ❌ Falla en validación de asignatura duplicada. Status:', resSubjectDuplicate.status, 'Body:', resSubjectDuplicate.body);
    process.exit(1);
  }

  // 7. Registrar Alumno
  console.log('🧪 Prueba 7: Registrar un alumno bajo Profesor 1...');
  const resStudent = await request('/students', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      name: 'Alumno Test',
      enrollmentNumber: testEnrollment
    }
  });
  if (resStudent.status === 201 || resStudent.status === 200) {
    studentId = resStudent.body._id;
    studentQr = resStudent.body.qrCode;
    console.log(`   ✅ Alumno registrado. ID: ${studentId}, QR: ${studentQr}\n`);
  } else {
    console.log('   ❌ Error al registrar alumno:', resStudent.body);
    process.exit(1);
  }

  // 8. Registrar Alumno con Matrícula Duplicada
  console.log('🧪 Prueba 8: Intentar registrar alumno con matrícula idéntica...');
  const resStudentDuplicate = await request('/students', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      name: 'Otro Alumno',
      enrollmentNumber: testEnrollment
    }
  });
  if (resStudentDuplicate.status === 409 && resStudentDuplicate.body.message === 'La matrícula ya está registrada para otro alumno.') {
    console.log('   ✅ Validado correctamente. Retornó 409 con el mensaje en español esperado.\n');
  } else {
    console.log('   ❌ Falla en validación de matrícula duplicada. Status:', resStudentDuplicate.status, 'Body:', resStudentDuplicate.body);
    process.exit(1);
  }

  // 9. Registrar Tarea (Assignment)
  console.log('🧪 Prueba 9: Registrar una tarea...');
  const resAssignment = await request('/assignments', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      subjectId: subjectId,
      title: testAssignmentTitle,
      description: 'Tarea de pruebas',
      maxScore: 10,
      dueDate: '2026-12-31T23:59:59.000Z'
    }
  });
  if (resAssignment.status === 201 || resAssignment.status === 200) {
    assignmentId = resAssignment.body._id;
    console.log(`   ✅ Tarea registrada con ID: ${assignmentId}\n`);
  } else {
    console.log('   ❌ Error al registrar tarea:', resAssignment.body);
    process.exit(1);
  }

  // 10. Registrar Tarea Duplicada
  console.log('🧪 Prueba 10: Intentar registrar tarea con título idéntico...');
  const resAssignmentDuplicate = await request('/assignments', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      subjectId: subjectId,
      title: testAssignmentTitle,
      description: 'Otra descripción',
      maxScore: 100,
      dueDate: '2026-12-31T23:59:59.000Z'
    }
  });
  if (resAssignmentDuplicate.status === 409 && resAssignmentDuplicate.body.message === 'Ya existe una tarea con este título en esta asignatura.') {
    console.log('   ✅ Validado correctamente. Retornó 409 con el mensaje en español esperado.\n');
  } else {
    console.log('   ❌ Falla en validación de tarea duplicada. Status:', resAssignmentDuplicate.status, 'Body:', resAssignmentDuplicate.body);
    process.exit(1);
  }

  // 11. Escanear Asistencia (Caso Exitoso)
  console.log('🧪 Prueba 11: Escanear asistencia para un alumno propio...');
  const resAttendance = await request('/attendance/scan', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      qrCode: studentQr,
      subjectId: subjectId
    }
  });
  if (resAttendance.status === 201 || resAttendance.status === 200) {
    console.log(`   ✅ Asistencia marcada con éxito. Status: ${resAttendance.body.status}\n`);
  } else {
    console.log('   ❌ Error al registrar asistencia:', resAttendance.body);
    process.exit(1);
  }

  // 12. Registrar y Autenticar Profesor 2 (Para pruebas de autorización)
  console.log('🧪 Prueba 12: Registrar y autenticar un segundo profesor...');
  const resRegister2 = await request('/auth/register-teacher', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      email: secondEmail,
      password: 'password123',
      name: 'Profesor Test 2',
      schoolName: 'Test School 2'
    }
  });
  if (resRegister2.status === 201 || resRegister2.status === 200) {
    const resLoginTeacher2 = await request('/auth/login', {
      method: 'POST',
      body: { email: secondEmail, password: 'password123' }
    });
    secondTeacherToken = resLoginTeacher2.body.access_token;
    
    // Crear un alumno bajo Profesor 2
    const resStudent2 = await request('/students', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secondTeacherToken}` },
      body: {
        name: 'Alumno de Profesor 2',
        enrollmentNumber: `SEC_${testEnrollment}`
      }
    });
    secondStudentQr = resStudent2.body.qrCode;
    console.log(`   ✅ Profesor 2 autenticado y Alumno 2 registrado con QR: ${secondStudentQr}\n`);
  } else {
    console.log('   ❌ Error al registrar segundo profesor:', resRegister2.body);
    process.exit(1);
  }

  // 13. Escanear Asistencia de Alumno Ajeno (Caso de Error de Autorización)
  console.log('🧪 Prueba 13: Intentar marcar asistencia de alumno que pertenece a otro profesor...');
  const resAttendanceForbidden = await request('/attendance/scan', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      qrCode: secondStudentQr,
      subjectId: subjectId
    }
  });
  if (resAttendanceForbidden.status === 403 && resAttendanceForbidden.body.message === 'This student does not belong to you') {
    console.log('   ✅ Seguridad comprobada correctamente. Retornó 403 Forbidden esperado.\n');
  } else {
    console.log('   ❌ Falla de seguridad: Se permitió registrar asistencia de alumno ajeno. Status:', resAttendanceForbidden.status, 'Body:', resAttendanceForbidden.body);
    process.exit(1);
  }

  // 14. Registrar Calificación (Caso Exitoso)
  console.log('🧪 Prueba 14: Escanear calificación válida para alumno propio...');
  const resGrade = await request('/grades/scan', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      qrCode: studentQr,
      assignmentId: assignmentId,
      score: 8.5
    }
  });
  if (resGrade.status === 201 || resGrade.status === 200) {
    console.log(`   ✅ Calificación registrada con éxito. Puntos: ${resGrade.body.score}\n`);
  } else {
    console.log('   ❌ Error al registrar calificación:', resGrade.body);
    process.exit(1);
  }

  // 15. Registrar Calificación con Puntaje Superior al Límite Máximo
  console.log('🧪 Prueba 15: Intentar registrar calificación excediendo los puntos máximos...');
  const resGradeOverflow = await request('/grades/scan', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      qrCode: studentQr,
      assignmentId: assignmentId,
      score: 15 // Límite máximo es 10
    }
  });
  if (resGradeOverflow.status === 403 && resGradeOverflow.body.message.startsWith('Score must be between 0 and')) {
    console.log(`   ✅ Validado correctamente. Retornó 403 Forbidden con mensaje: "${resGradeOverflow.body.message}"\n`);
  } else {
    console.log('   ❌ Falla en validación de puntaje máximo. Status:', resGradeOverflow.status, 'Body:', resGradeOverflow.body);
    process.exit(1);
  }

  // 16. Calificar Alumno Ajeno (Caso de Error de Autorización)
  console.log('🧪 Prueba 16: Intentar calificar alumno que pertenece a otro profesor...');
  const resGradeForbidden = await request('/grades/scan', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${teacherToken}` },
    body: {
      qrCode: secondStudentQr,
      assignmentId: assignmentId,
      score: 9.0
    }
  });
  if (resGradeForbidden.status === 403 && resGradeForbidden.body.message === 'This student does not belong to you') {
    console.log('   ✅ Seguridad comprobada correctamente. Retornó 403 Forbidden esperado.\n');
  } else {
    console.log('   ❌ Falla de seguridad: Se permitió calificar alumno ajeno. Status:', resGradeForbidden.status, 'Body:', resGradeForbidden.body);
    process.exit(1);
  }

  // 17. Rate Limiting (100 req/min)
  console.log('🧪 Prueba 17: Validar protección contra Rate Limiting (100 req/min)...');
  console.log('   Disparando 105 peticiones rápidas a /health...');
  
  let throttled = false;
  let requestsSent = 0;
  
  for (let i = 0; i < 110; i++) {
    try {
      const res = await request('/health');
      requestsSent++;
      if (res.status === 429) {
        throttled = true;
        break;
      }
    } catch (e) {
      // Ignorar fallas menores
    }
  }

  if (throttled) {
    console.log(`   ✅ Bloqueo Rate Limiter activado tras ${requestsSent} peticiones rápidas (HTTP 429 Too Many Requests).\n`);
  } else {
    console.log(`   ❌ El Rate Limiter no bloqueó las peticiones. Peticiones enviadas: ${requestsSent}.`);
    process.exit(1);
  }

  console.log('🎉 ¡Todas las pruebas avanzadas han finalizado con éxito! La integridad, validaciones en español, seguridad de acceso y restricciones de puntuación del backend funcionan a la perfección. 🎉');
}

run();
