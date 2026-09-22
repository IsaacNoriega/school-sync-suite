const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function seedDatabaseForVideo() {
  console.log('--- Conectando a MongoDB Atlas ---');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conexión exitosa.\n');

  const db = mongoose.connection.db;

  // 1. Limpiar colecciones anteriores
  console.log('1. Vaciando base de datos (colecciones escolares)...');
  await db.collection('grades').deleteMany({});
  await db.collection('attendances').deleteMany({});
  await db.collection('assignments').deleteMany({});
  await db.collection('subjects').deleteMany({});
  await db.collection('students').deleteMany({});
  await db.collection('teachers').deleteMany({});
  await db.collection('users').deleteMany({});
  console.log('✓ Base de datos completamente limpia.\n');

  // 2. Crear Usuarios (SUPER_ADMIN y TEACHER)
  console.log('2. Creando usuarios de acceso...');
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  const teacherPasswordHash = await bcrypt.hash('admin123', 10);

  // Super Admin: isaac_norvi@hotmail.com
  const adminUserResult = await db.collection('users').insertOne({
    email: process.env.ADMIN_EMAIL || 'isaac_norvi@hotmail.com',
    passwordHash: adminPasswordHash,
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const adminUserId = adminUserResult.insertedId;

  // Docente para el video tutorial: docente@educaqr.com
  const teacherUserResult = await db.collection('users').insertOne({
    email: 'docente@educaqr.com',
    passwordHash: teacherPasswordHash,
    role: 'TEACHER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const teacherUserId = teacherUserResult.insertedId;
  console.log('✓ Super Admin y Docente creados con éxito.\n');

  // 3. Crear Perfiles de Docente (Teacher)
  console.log('3. Creando perfiles institucionales de docente...');
  const teacherDocResult = await db.collection('teachers').insertOne({
    user: teacherUserId,
    name: 'Prof. Diego Camacho Noriega',
    schoolName: 'Colegio San Patricio',
    schoolCycle: '2025-2026',
    shift: 'Matutino',
    entryTime: '07:30',
    studentSequence: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const teacherProfileId = teacherDocResult.insertedId;

  // Perfil de docente también para el super admin
  const adminTeacherDocResult = await db.collection('teachers').insertOne({
    user: adminUserId,
    name: 'Ing. Isaac Noriega (Admin)',
    schoolName: 'Colegio San Patricio',
    schoolCycle: '2025-2026',
    shift: 'Matutino',
    entryTime: '07:30',
    studentSequence: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const adminTeacherProfileId = adminTeacherDocResult.insertedId;
  console.log('✓ Perfiles institucionales asignados.\n');

  // Función helper para poblar un docente con alumnos, materias y tareas
  async function populateTeacher(tId, prefix) {
    // 4. Crear Alumnos
    const studentData = [
      { name: 'Sofía Valentina Morales', num: `${prefix}-1001`, qr: `QR-${prefix}-1001`, tutor: 'Claudia Morales', phone: '+52 33 1234 5678' },
      { name: 'Mateo Alexander Silva', num: `${prefix}-1002`, qr: `QR-${prefix}-1002`, tutor: 'Roberto Silva', phone: '+52 33 2345 6789' },
      { name: 'Sabine Hernández Cruz', num: `${prefix}-1003`, qr: `QR-${prefix}-1003`, tutor: 'Elena Cruz', phone: '+52 33 3456 7890' },
      { name: 'Dante Emilio Vega', num: `${prefix}-1004`, qr: `QR-${prefix}-1004`, tutor: 'Marcos Vega', phone: '+52 33 4567 8901' },
      { name: 'Valeria Regina Ortiz', num: `${prefix}-1005`, qr: `QR-${prefix}-1005`, tutor: 'Patricia Ortiz', phone: '+52 33 5678 9012' },
      { name: 'Santiago Gael Navarro', num: `${prefix}-1006`, qr: `QR-${prefix}-1006`, tutor: 'Fernando Navarro', phone: '+52 33 6789 0123' },
      { name: 'Camila Renée Torres', num: `${prefix}-1007`, qr: `QR-${prefix}-1007`, tutor: 'Gabriela Torres', phone: '+52 33 7890 1234' },
      { name: 'Leonardo Daniel Ramos', num: `${prefix}-1008`, qr: `QR-${prefix}-1008`, tutor: 'Javier Ramos', phone: '+52 33 8901 2345' },
    ];

    const studentDocs = [];
    for (const s of studentData) {
      const res = await db.collection('students').insertOne({
        teacher: tId,
        name: s.name,
        enrollmentNumber: `#${s.num}`,
        qrCode: s.qr,
        group: '3° B',
        shift: 'Matutino',
        tutor: s.tutor,
        tutorPhone: s.phone,
        status: 'EMITTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      studentDocs.push({ _id: res.insertedId, ...s });
    }

    // 5. Crear Materias (Subjects)
    const subjectsData = [
      {
        name: 'Matemáticas',
        code: `MAT-${prefix}`,
        color: '#3b82f6',
        iconKey: 'Calculator',
        description: 'Aritmética, fracciones equivalentes y resolución geométrica',
      },
      {
        name: 'Español y Lectura',
        code: `ESP-${prefix}`,
        color: '#10b981',
        iconKey: 'BookOpen',
        description: 'Comprensión lectora, redacción y fábulas literarias',
      },
      {
        name: 'Ciencias Naturales',
        code: `CIE-${prefix}`,
        color: '#f59e0b',
        iconKey: 'FlaskConical',
        description: 'Ecosistemas, el cuerpo humano y experimentos en clase',
      },
      {
        name: 'Historia y Geografía',
        code: `HIS-${prefix}`,
        color: '#8b5cf6',
        iconKey: 'Globe',
        description: 'Historia de México, geografía y culturas del mundo',
      },
    ];

    const subjectDocs = [];
    for (const sub of subjectsData) {
      const res = await db.collection('subjects').insertOne({
        teacher: tId,
        name: sub.name,
        code: sub.code,
        color: sub.color,
        iconKey: sub.iconKey,
        description: sub.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      subjectDocs.push({ _id: res.insertedId, ...sub });
    }

    // 6. Crear Tareas (Assignments)
    const matSub = subjectDocs[0];
    const espSub = subjectDocs[1];
    const cieSub = subjectDocs[2];
    const hisSub = subjectDocs[3];

    const now = new Date();
    const inDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    // Tareas de Matemáticas
    const tMat1 = await db.collection('assignments').insertOne({
      subject: matSub._id,
      title: 'Fracciones Equivalentes',
      description: 'Identificar fracciones comunes y resolver los ejercicios de la página 45.',
      maxScore: 10,
      dueDate: inDays(3),
      code: `TAR-MAT-01-${prefix}`,
      color: '#3b82f6',
      iconKey: 'Sparkles',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tMat2 = await db.collection('assignments').insertOne({
      subject: matSub._id,
      title: 'Multiplicaciones de 2 Cifras',
      description: 'Práctica de multiplicación con acarreo en el cuaderno de trabajo.',
      maxScore: 10,
      dueDate: inDays(6),
      code: `TAR-MAT-02-${prefix}`,
      color: '#0284c7',
      iconKey: 'Calculator',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tareas de Español
    const tEsp1 = await db.collection('assignments').insertOne({
      subject: espSub._id,
      title: 'Fábulas y Moralejas',
      description: 'Lectura de La Liebre y la Tortuga con reporte de reflexión moral.',
      maxScore: 10,
      dueDate: inDays(2),
      code: `TAR-ESP-01-${prefix}`,
      color: '#10b981',
      iconKey: 'BookOpen',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tEsp2 = await db.collection('assignments').insertOne({
      subject: espSub._id,
      title: 'Lectura Semanal: El Principito',
      description: 'Capítulos 1 al 4 y resumen de ideas principales.',
      maxScore: 10,
      dueDate: inDays(5),
      code: `TAR-ESP-02-${prefix}`,
      color: '#059669',
      iconKey: 'FileText',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tareas de Ciencias
    await db.collection('assignments').insertOne({
      subject: cieSub._id,
      title: 'Maqueta del Sistema Solar',
      description: 'Presentación visual de los planetas y sus órbitas relativas.',
      maxScore: 10,
      dueDate: inDays(7),
      code: `TAR-CIE-01-${prefix}`,
      color: '#f59e0b',
      iconKey: 'Sun',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tareas de Historia
    await db.collection('assignments').insertOne({
      subject: hisSub._id,
      title: 'Línea del Tiempo: Independencia',
      description: 'Fechas clave de 1810 a 1821 ilustradas con recortes.',
      maxScore: 10,
      dueDate: inDays(9),
      code: `TAR-HIS-01-${prefix}`,
      color: '#8b5cf6',
      iconKey: 'Clock',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 7. Calificaciones Escaneadas de Ejemplo (Grades)
    // Para tMat1 (Fracciones Equivalentes): 5 alumnos entregaron
    const scoresMat = [10, 9, 10, 8, 9];
    for (let i = 0; i < scoresMat.length; i++) {
      await db.collection('grades').insertOne({
        student: studentDocs[i]._id,
        assignment: tMat1.insertedId,
        score: scoresMat[i],
        scannedAt: new Date(now.getTime() - (i + 1) * 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Para tEsp1 (Fábulas): 4 alumnos entregaron
    const scoresEsp = [10, 10, 9, 8];
    const studentIdxs = [0, 1, 5, 6];
    for (let i = 0; i < scoresEsp.length; i++) {
      await db.collection('grades').insertOne({
        student: studentDocs[studentIdxs[i]]._id,
        assignment: tEsp1.insertedId,
        score: scoresEsp[i],
        scannedAt: new Date(now.getTime() - (i + 2) * 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 8. Asistencia del Día y de Ayer (Attendances)
    const todayStr = now.toISOString().slice(0, 10);
    const yestStr = new Date(now.getTime() - 24 * 3600000).toISOString().slice(0, 10);

    for (let i = 0; i < studentDocs.length; i++) {
      // Hoy: 7 PRESENTES, 1 RETARDO (el 4to)
      await db.collection('attendances').insertOne({
        student: studentDocs[i]._id,
        date: todayStr,
        status: i === 3 ? 'LATE' : 'PRESENT',
        scannedAt: new Date(now.getTime() - (8 - i) * 600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Ayer: todos PRESENTES
      await db.collection('attendances').insertOne({
        student: studentDocs[i]._id,
        date: yestStr,
        status: 'PRESENT',
        scannedAt: new Date(now.getTime() - 24 * 3600000 - i * 300000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Poblar tanto para el Docente principal como para el Super Admin
  console.log('4. Creando estudiantes, materias, tareas y calificaciones para el docente...');
  await populateTeacher(teacherProfileId, 'EQR');

  console.log('5. Creando entorno espejo para el Super Admin...');
  await populateTeacher(adminTeacherProfileId, 'ADM');

  console.log('\n======================================================');
  console.log('🎉 BASE DE DATOS INICIALIZADA PERFECTAMENTE PARA EL VIDEO');
  console.log('======================================================');
  console.log('CUENTAS DE ACCESO DISPONIBLES:\n');
  console.log('1. SUPER ADMINISTRADOR:');
  console.log(`   Email:    ${process.env.ADMIN_EMAIL || 'isaac_norvi@hotmail.com'}`);
  console.log('   Password: admin123');
  console.log('   Rol:      SUPER_ADMIN\n');
  console.log('2. DOCENTE TITULAR (Recomendado para grabar el video):');
  console.log('   Email:    docente@educaqr.com');
  console.log('   Password: admin123');
  console.log('   Nombre:   Prof. Diego Camacho Noriega');
  console.log('   Escuela:  Colegio San Patricio\n');
  console.log('DATOS INCLUIDOS:');
  console.log('✓ 8 Alumnos con nombres completos, matrículas, tutores y QR emitidos.');
  console.log('✓ 4 Materias (Matemáticas, Español, Ciencias, Historia).');
  console.log('✓ 6 Tareas activas con fechas de entrega y puntaje 10 pts.');
  console.log('✓ Calificaciones ya escaneadas para mostrar barras de progreso en el video.');
  console.log('✓ Historial de asistencia de hoy y ayer (95% asistencia).');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seedDatabaseForVideo().catch((err) => {
  console.error('Error al poblar base de datos:', err);
  process.exit(1);
});
