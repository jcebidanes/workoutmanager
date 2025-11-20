import { Router } from 'express';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import knex from '../../db/db.ts';
import { hashPassword, comparePassword } from '../../src/utils/hashPassword.ts';
import type { Language } from '../../src/types/language.ts';
import { isLanguage, DEFAULT_LANGUAGE } from '../../src/types/language.ts';
import { appConfig } from '../../config/env.ts';

const router = Router();
const { jwtSecret } = appConfig;

router.post('/register', async (req: Request, res: Response) => {
  const { username, password, language } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const normalizedLanguage: Language = isLanguage(language) ? language : DEFAULT_LANGUAGE;

  try {
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const [userId] = await knex('users').insert({ username, password: hashedPassword, language: normalizedLanguage });

    const token = jwt.sign({ userId }, jwtSecret, { expiresIn: '1d' });

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, username, language: normalizedLanguage },
      token,
    });
  } catch (error) {
    console.error('Registration failed', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await knex('users').where({ username }).first();
    if (user && await comparePassword(password, user.password)) {
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1d' });
      return res.json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, language: isLanguage(user.language) ? user.language : DEFAULT_LANGUAGE },
        token,
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login failed', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
