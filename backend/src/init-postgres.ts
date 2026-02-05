import { Client } from 'pg';

const initDB = async () => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Clarita2020',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to default postgres database');

    // Check if boardwave database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'boardwave'");
    
    if (res.rowCount === 0) {
      console.log('Creating database boardwave...');
      await client.query('CREATE DATABASE boardwave');
      console.log('Database boardwave created successfully');
    } else {
      console.log('Database boardwave already exists');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await client.end();
  }
};

initDB();