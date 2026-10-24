// Neon PostgreSQL automated database migration runner
// Run with: node scripts/migrate.js or npm run db:migrate

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env if available
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  // Ignore env loading errors
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not set in your environment or .env.local file.');
  console.log('Please configure your Neon DB connection string before running migrations.');
  console.log('Example: postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  const client = await pool.connect();
  console.log('⚡ Connected to Neon PostgreSQL...');

  try {
    const schemaPath = path.resolve(__dirname, '../src/lib/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Running schema migrations...');
    await client.query(sql);
    console.log('✅ Neon DB tables, constraints, and seed data created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
