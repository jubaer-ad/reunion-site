import { Pool } from 'pg';

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({ connectionString });
}

let _pool: Pool | null = null;

export function getDb() {
  if (!_pool) {
    _pool = getPool();
  }
  return _pool;
}
