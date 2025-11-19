import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import * as templatesService from '../services/templates.ts';

const router = Router();

router.get('/templates', requireAuth, async (req, res) => {
  try {
    const templates = await templatesService.fetchTemplatesForUser(req.userId as number);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

// Add other template routes here

export default router;
