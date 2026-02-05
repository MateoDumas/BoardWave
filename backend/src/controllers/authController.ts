import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-prod';

const COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A1', 
  '#33FFF5', '#FF8C33', '#8C33FF', '#FFC733', '#33FF8C'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const existingUser = result.rows[0];

    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    await db.query('INSERT INTO users (username, password, color) VALUES ($1, $2, $3)', [username, hashedPassword, color]);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username, color: user.color });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const db = getDb();
    const result = await db.query('SELECT id, username, color FROM users WHERE id = $1', [decoded.userId]);
    const user = result.rows[0];

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
