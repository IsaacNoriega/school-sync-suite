const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const teacherId = new mongoose.Types.ObjectId('6a94a773066b96b1de8a7f13');
  const students = await mongoose.connection.collection('students').find({ teacher: teacherId }).toArray();
  console.log(`Found ${students.length} students for teacher Kenia`);

  // Remove old subjects and assignments for this teacher to have a fresh clean state
  const oldSubjects = await mongoose.connection.collection('subjects').find({ teacher: teacherId }).toArray();
  const oldSubjectIds = oldSubjects.map(s => s._id);

  if (oldSubjectIds.length > 0) {
    const oldAssignments = await mongoose.connection.collection('assignments').find({ subject: { $in: oldSubjectIds } }).toArray();
    const oldAssignmentIds = oldAssignments.map(a => a._id);
    if (oldAssignmentIds.length > 0) {
      await mongoose.connection.collection('grades').deleteMany({ assignment: { $in: oldAssignmentIds } });
      await mongoose.connection.collection('assignments').deleteMany({ _id: { $in: oldAssignmentIds } });
    }
    await mongoose.connection.collection('subjects').deleteMany({ _id: { $in: oldSubjectIds } });
  }

  const subjectsData = [
    {
      name: 'Matemáticas III',
      code: 'MAT-301',
      description: 'Aritmética, fracciones y cálculo rápido',
      tasks: [
        {
          title: 'Taller de Fracciones Equivalentes',
          code: 'QR-MAT-01',
          description: 'Ejercicios prácticos con fracciones y simplificación',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 6), // hoy en la tarde
          deliveredStudentsCount: 32,
        },
        {
          title: 'Problemas de Multiplicación con Decimales',
          code: 'QR-MAT-02',
          description: 'Resolución de problemas de la vida cotidiana con números decimales',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          deliveredStudentsCount: 18,
        },
        {
          title: 'Geometría: Polígonos y Perímetros',
          code: 'QR-MAT-03',
          description: 'Cálculo de áreas y perímetros en figuras regulares',
          maxScore: 100,
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // hace 2 días
          deliveredStudentsCount: students.length, // 100%
        },
        {
          title: 'Cálculo Mental Rápido #3',
          code: 'QR-MAT-04',
          description: 'Lote de hojas de ejercicios rápidos de agilidad numérica',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          deliveredStudentsCount: 0, // Pendiente
        },
      ],
    },
    {
      name: 'Español & Lectura',
      code: 'ESP-301',
      description: 'Comprensión lectora y redacción',
      tasks: [
        {
          title: 'Reporte de Lectura: El Principito',
          code: 'QR-ESP-01',
          description: 'Análisis de personajes y reflexión del capítulo 21',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
          deliveredStudentsCount: 25,
        },
        {
          title: 'Ortografía: Acentuación y Puntuación',
          code: 'QR-ESP-02',
          description: 'Reglas de palabras agudas, graves y esdrújulas',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          deliveredStudentsCount: 12,
        },
      ],
    },
    {
      name: 'Ciencias Naturales',
      code: 'CIE-301',
      description: 'Ecosistemas, flora y experimentos',
      tasks: [
        {
          title: 'Investigación sobre la Fotosíntesis',
          code: 'QR-CIE-01',
          description: 'Diagrama del proceso fotosintético y respiración vegetal',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          deliveredStudentsCount: 29,
        },
        {
          title: 'Maqueta del Sistema Solar',
          code: 'QR-CIE-02',
          description: 'Representación a escala y datos astronómicos',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9),
          deliveredStudentsCount: 0,
        },
      ],
    },
    {
      name: 'Historia & Arte',
      code: 'HIS-301',
      description: 'Culturas antiguas y expresión plástica',
      tasks: [
        {
          title: 'Línea del Tiempo: Culturas Prehispánicas',
          code: 'QR-HIS-01',
          description: 'Mural ilustrado sobre mayas, mexicas y olmecas',
          maxScore: 100,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
          deliveredStudentsCount: 35,
        },
      ],
    },
  ];

  for (const s of subjectsData) {
    const createdSubject = await mongoose.connection.collection('subjects').insertOne({
      teacher: teacherId,
      name: s.name,
      code: s.code,
      description: s.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Created subject: ${s.name} (${createdSubject.insertedId})`);

    for (const t of s.tasks) {
      const createdAssignment = await mongoose.connection.collection('assignments').insertOne({
        subject: createdSubject.insertedId,
        title: t.title,
        code: t.code,
        description: t.description,
        maxScore: t.maxScore,
        dueDate: t.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  Created assignment: ${t.title} (${t.code})`);

      // Seed grades for deliveredStudentsCount
      const deliveredCount = Math.min(t.deliveredStudentsCount, students.length);
      const gradesToInsert = [];
      for (let i = 0; i < deliveredCount; i++) {
        const student = students[i];
        const score = Math.floor(75 + Math.random() * 26); // Score between 75 and 100
        gradesToInsert.push({
          student: student._id,
          assignment: createdAssignment.insertedId,
          score,
          gradedAt: new Date(),
          manualCorrection: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (gradesToInsert.length > 0) {
        await mongoose.connection.collection('grades').insertMany(gradesToInsert);
        console.log(`    Inserted ${gradesToInsert.length} grades`);
      }
    }
  }

  console.log('Finished seeding real subjects and assignments!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
