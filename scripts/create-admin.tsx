// scripts/create-admin.ts
require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');
const { hash } = require('bcrypt');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI not defined in .env');
}

const client = new MongoClient(uri);

async function createAdmin() {
  try {
    await client.connect();
    const db = client.db();

    const hashedPassword = await hash('admin', 10);

    await db.collection('users').insertOne({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
    });

    console.log('✅ Admin user created');
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
  } finally {
    await client.close();
  }
}

createAdmin();
