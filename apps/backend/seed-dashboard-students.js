const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const teachersCol = mongoose.connection.db.collection('teachers');
    const studentsCol = mongoose.connection.db.collection('students');
    const attendancesCol = mongoose.connection.db.collection('attendances');

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

    const studentsToSeed = [
      {
        name: 'Sabine Klein',
        enrollmentNumber: 'EQR-0842',
        status: 'ABSENT',
        avatarType: 'sabine',
      },
      {
        name: 'Dante Podenzana',
        enrollmentNumber: 'EQR-0843',
        status: 'LATE',
        avatarType: 'dante',
      },
      {
        name: 'Susan Chan',
        enrollmentNumber: 'EQR-0844',
        status: 'PRESENT',
        avatarType: 'susan',
      },
      {
        name: 'Mateo Domínguez Ruiz',
        enrollmentNumber: 'EQR-0845',
        status: 'PRESENT',
        avatarType: 'mateo',
      },
      {
        name: 'Sofía Valentina Morales',
        enrollmentNumber: 'EQR-0846',
        status: 'LATE',
        avatarType: 'sofia',
      },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const fixedDateStr = '2026-09-14';

    for (const item of studentsToSeed) {
      let student = await studentsCol.findOne({ enrollmentNumber: item.enrollmentNumber });
      if (!student) {
        const qrCode = `STUDENT-${teacher._id.toString().substring(18, 24).toUpperCase()}-${item.enrollmentNumber}`;
        const res = await studentsCol.insertOne({
          teacher: teacher._id,
          name: item.name,
          enrollmentNumber: item.enrollmentNumber,
          qrCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        student = { _id: res.insertedId, name: item.name };
        console.log(`Created student: ${item.name}`);
      } else {
        console.log(`Student ${item.name} already exists`);
      }

      // Upsert attendance for today and for 2026-09-14
      for (const d of [todayStr, fixedDateStr]) {
        await attendancesCol.updateOne(
          { student: student._id, date: d },
          {
            $set: {
              teacher: teacher._id,
              student: student._id,
              date: d,
              status: item.status,
              scannedAt: item.status !== 'ABSENT' ? new Date() : null,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
