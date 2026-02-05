import { Pool } from 'pg';

let pool: Pool | null = null;

export const initDatabase = async () => {
  if (pool) return pool;

  const connectionConfig = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'boardwave',
        password: process.env.DB_PASSWORD || 'Clarita2020',
        port: Number(process.env.DB_PORT) || 5432,
      };

  pool = new Pool(connectionConfig);

  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        color VARCHAR(20) DEFAULT '#1A73E8',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    client.release();
    console.log('PostgreSQL Database initialized');
    return pool;
  } catch (err) {
    console.error('Failed to connect to PostgreSQL', err);
    throw err;
  }
};

export const getDb = () => {
  if (!pool) throw new Error('Database not initialized');
  return pool;
};
