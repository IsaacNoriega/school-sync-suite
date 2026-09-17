const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function resetDatabase() {
  const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@schoolsync.com';
  const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';

  console.log('Conectando a MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conexión establecida con éxito.\n');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  console.log(`Colecciones encontradas: ${collections.map((c) => c.name).join(', ')}`);
  console.log('Vaciando colecciones...\n');

  for (const colInfo of collections) {
    const colName = colInfo.name;
    // Ignorar colecciones del sistema de Mongo
    if (colName.startsWith('system.')) continue;

    const col = db.collection(colName);
    const countBefore = await col.countDocuments();

    if (colName === 'users') {
      // Borrar todos los usuarios para dejar solamente al admin limpio
      await col.deleteMany({});
      console.log(`[users]: ${countBefore} usuarios eliminados.`);
    } else {
      await col.deleteMany({});
      console.log(`[${colName}]: ${countBefore} documentos eliminados.`);
    }
  }

  // Crear el único usuario SUPER_ADMIN
  console.log('\nCreando usuario administrador único...');
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const now = new Date();

  const adminUser = {
    email: adminEmail,
    passwordHash,
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db.collection('users').insertOne(adminUser);

  console.log('\n========================================');
  console.log('BASE DE DATOS VACIADA COMPLETAMENTE');
  console.log('========================================');
  console.log(`Admin ID:   ${insertResult.insertedId}`);
  console.log(`Email:      ${adminEmail}`);
  console.log(`Password:   ${adminPassword}`);
  console.log(`Role:       SUPER_ADMIN`);
  console.log(`Active:     true`);
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('Desconectado de MongoDB.');
}

resetDatabase().catch((err) => {
  console.error('Error al resetear la base de datos:', err);
  process.exit(1);
});
