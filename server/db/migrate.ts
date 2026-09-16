import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run db:migrate.');
  }

  const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');
  const schema = await readFile(schemaPath, 'utf8');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await pool.query(schema);
    console.log('TutorNest PostgreSQL schema is up to date.');
  } finally {
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('TutorNest database migration failed:', error);
  process.exitCode = 1;
});
