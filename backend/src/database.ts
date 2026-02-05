import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let pgPool: Pool | null = null;
let sqliteDb: Database | null = null;

const isPostgres = !!process.env.DATABASE_URL || !!process.env.DB_HOST;

export const initDatabase = async () => {
  if (isPostgres) {
    console.log('Initializing PostgreSQL connection...');
    const connectionConfig = process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL }
      : {
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME || 'boardwave',
          password: process.env.DB_PASSWORD || 'password',
          port: Number(process.env.DB_PORT) || 5432,
        };

    pgPool = new Pool(connectionConfig);
    
    try {
      const client = await pgPool.connect();
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
      return pgPool;
    } catch (err) {
      console.error('Failed to connect to PostgreSQL', err);
      throw err;
    }
  } else {
    console.log('Initializing SQLite connection...');
    sqliteDb = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
    
    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        color TEXT DEFAULT '#1A73E8',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('SQLite Database initialized');
    return sqliteDb;
  }
};

export const getDb = () => {
  if (isPostgres) {
    if (!pgPool) throw new Error('Database not initialized');
    return pgPool;
  } else {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    return {
      query: async (sql: string, params: any[] = []) => {
        // Convert $1, $2 to ? for SQLite compatibility
        const sqliteSql = sql.replace(/\$\d+/g, '?');
        
        try {
          if (sql.trim().toUpperCase().startsWith('SELECT')) {
            const rows = await sqliteDb!.all(sqliteSql, params);
            return { rows };
          } else {
            const result = await sqliteDb!.run(sqliteSql, params);
            return { rows: [], rowCount: result.changes };
          }
        } catch (error) {
          console.error('Database query error:', error);
          throw error;
        }
      }
    };
  }
};
