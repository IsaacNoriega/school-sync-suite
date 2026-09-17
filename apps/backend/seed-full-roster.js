require('dotenv').config();
const mongoose = require('mongoose');

async function seedFullRoster() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const teachersCol = mongoose.connection.db.collection('teachers');
    const studentsCol = mongoose.connection.db.collection('students');

    // Find Kenia or the first teacher
    let teacher = await teachersCol.findOne({ email: 'kenia@email.com' });
    if (!teacher) {
      teacher = await teachersCol.findOne();
    }
    if (!teacher) {
      console.error('No teacher found in database!');
      process.exit(1);
    }
    console.log(`Using teacher: ${teacher.name} (${teacher._id})`);

    const roster = [
      { name: 'Sofía Valentina Morales', enrollment: 'EQR-1092', tutor: 'Sra. Claudia Morales', status: 'EMITTED' },
      { name: 'Dante Podenzana', enrollment: 'EQR-1091', tutor: 'Sr. Marco Podenzana', status: 'EMITTED' },
      { name: 'Sabine Klein', enrollment: 'EQR-1090', tutor: 'Mónica Klein', status: 'PENDING' },
      { name: 'Mateo Benítez', enrollment: 'EQR-1089', tutor: 'Héctor Benítez', status: 'EMITTED' },
      { name: 'Camila Vargas', enrollment: 'EQR-1088', tutor: 'Elena Vargas', status: 'EMITTED' },
      { name: 'Lucas Alarcón', enrollment: 'EQR-1087', tutor: 'Gabriel Alarcón', status: 'PENDING' },
      { name: 'Valeria Mendoza', enrollment: 'EQR-1086', tutor: 'Roberto Mendoza', status: 'EMITTED' },
      { name: 'Emiliano Ríos', enrollment: 'EQR-1085', tutor: 'Lucía Domínguez', status: 'EMITTED' },
      { name: 'Susan Chan', enrollment: 'EQR-1084', tutor: 'David Chan', status: 'EMITTED' },
      { name: 'Mateo Domínguez Ruiz', enrollment: 'EQR-1083', tutor: 'Carmen Ruiz', status: 'EMITTED' },
      { name: 'Isaac Abdiel Noriega Villalobos', enrollment: 'EQR-1082', tutor: 'Gabriela Villalobos', status: 'EMITTED' },
      { name: 'Renata González Castro', enrollment: 'EQR-1081', tutor: 'Alejandro González', status: 'EMITTED' },
      { name: 'Santiago Herrera Gil', enrollment: 'EQR-1080', tutor: 'Patricia Gil', status: 'PENDING' },
      { name: 'Mariana Silva Ortiz', enrollment: 'EQR-1079', tutor: 'Felipe Silva', status: 'EMITTED' },
      { name: 'Leonardo Flores Paredes', enrollment: 'EQR-1078', tutor: 'Rosa Paredes', status: 'EMITTED' },
      { name: 'Ximena Castro Navarro', enrollment: 'EQR-1077', tutor: 'Enrique Castro', status: 'EMITTED' },
      { name: 'Diego Romero Estrada', enrollment: 'EQR-1076', tutor: 'Adriana Estrada', status: 'EMITTED' },
      { name: 'Natalia Torres Rivas', enrollment: 'EQR-1075', tutor: 'Jorge Torres', status: 'EMITTED' },
      { name: 'Sebastián Ramos Meza', enrollment: 'EQR-1074', tutor: 'Silvia Meza', status: 'EMITTED' },
      { name: 'Daniela Peña Salazar', enrollment: 'EQR-1073', tutor: 'Manuel Peña', status: 'EMITTED' },
      { name: 'Gabriel Soto Cordero', enrollment: 'EQR-1072', tutor: 'Lorena Cordero', status: 'PENDING' },
      { name: 'Paula Vázquez Luna', enrollment: 'EQR-1071', tutor: 'Víctor Vázquez', status: 'EMITTED' },
      { name: 'Nicolás Cruz Beltrán', enrollment: 'EQR-1070', tutor: 'Beatriz Beltrán', status: 'EMITTED' },
      { name: 'Andrea Reyes Lara', enrollment: 'EQR-1069', tutor: 'Esteban Reyes', status: 'EMITTED' },
      { name: 'Alejandro Morales Mora', enrollment: 'EQR-1068', tutor: 'Laura Mora', status: 'EMITTED' },
      { name: 'Fernanda Ortiz Figueroa', enrollment: 'EQR-1067', tutor: 'Carlos Ortiz', status: 'EMITTED' },
      { name: 'Rodrigo Gómez Pineda', enrollment: 'EQR-1066', tutor: 'Martha Pineda', status: 'EMITTED' },
      { name: 'Regina Delgado Cárdenas', enrollment: 'EQR-1065', tutor: 'Sergio Delgado', status: 'EMITTED' },
      { name: 'Mauricio Cabrera Pacheco', enrollment: 'EQR-1064', tutor: 'Guadalupe Pacheco', status: 'EMITTED' },
      { name: 'Victoria Espinoza Bravo', enrollment: 'EQR-1063', tutor: 'Ignacio Espinoza', status: 'EMITTED' },
      { name: 'Tomás Aguirre Medina', enrollment: 'EQR-1062', tutor: 'Cecilia Medina', status: 'EMITTED' },
      { name: 'Jimena Rocha Villalpando', enrollment: 'EQR-1061', tutor: 'Raúl Rocha', status: 'EMITTED' },
      { name: 'Emilio Cervantes Rosas', enrollment: 'EQR-1060', tutor: 'Yolanda Rosas', status: 'EMITTED' },
      { name: 'Alicia Zamora Gallegos', enrollment: 'EQR-1059', tutor: 'Fernando Zamora', status: 'EMITTED' },
      { name: 'Bruno Sandoval Quiroz', enrollment: 'EQR-1058', tutor: 'Miriam Quiroz', status: 'EMITTED' },
      { name: 'Elena Montesinos Serrano', enrollment: 'EQR-1057', tutor: 'Alfonso Montesinos', status: 'EMITTED' },
    ];

    console.log(`Upserting ${roster.length} students into MongoDB for teacher ${teacher.name}...`);

    for (const item of roster) {
      const qrCode = `STUDENT-${teacher._id.toString().substring(18, 24).toUpperCase()}-${item.enrollment}`;
      await studentsCol.updateOne(
        { teacher: teacher._id, enrollmentNumber: item.enrollment },
        {
          $set: {
            teacher: teacher._id,
            name: item.name,
            enrollmentNumber: item.enrollment,
            qrCode,
            group: '3° B',
            shift: 'Matutino',
            tutor: item.tutor,
            status: item.status,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const finalCount = await studentsCol.countDocuments({ teacher: teacher._id });
    console.log(`Teacher now has ${finalCount} real students in MongoDB!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding roster:', err);
    process.exit(1);
  }
}

seedFullRoster();
