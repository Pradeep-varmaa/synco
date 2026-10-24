import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString
    ? {
        rejectUnauthorized: false,
      }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Neon PostgreSQL idle client error:', err);
});

export async function query(text: string, params?: unknown[]) {
  if (!connectionString) {
    return null;
  }
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database query execution error:', err);
    return null;
  }
}

export { pool };
export default pool;
