const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function createAdmin() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@schoolsync.com';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const passwordHash = await bcrypt.hash(password, 12);

  const filter = { email };
  const update = {
    $set: {
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  };

  await mongoose.connection.db.collection('users').updateOne(filter, update, { upsert: true });

  const user = await mongoose.connection.db.collection('users').findOne({ email });
  console.log('\n--- SUPER_ADMIN LISTO ---');
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ${user.role}`);
  console.log(`Active:   ${user.isActive}`);
  console.log(`ID:       ${user._id}`);
  console.log('-------------------------\n');

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error('Error al crear super admin:', err);
  process.exit(1);
});
