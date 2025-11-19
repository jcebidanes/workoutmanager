import { Router } from 'express';
import type { Request, Response } from 'express';
import knex from '../../db/db.ts';
import { requireAuth } from '../middleware/auth.ts';
import type { Language } from '../../src/types/language.ts';
import { isLanguage, DEFAULT_LANGUAGE } from '../../src/types/language.ts';

const router = Router();

router.put('/users/preferences', requireAuth, async (req: Request, res: Response) => {
  const { language } = req.body;
  const normalizedLanguage: Language = isLanguage(language) ? language : DEFAULT_LANGUAGE;

  try {
    await knex('users').where({ id: req.userId }).update({ language: normalizedLanguage });
    return res.json({ language: normalizedLanguage });
  } catch (error) {
    console.error('Failed to update preferences', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
