import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import * as clientsService from '../services/clients.ts';

const router = Router();

router.get('/clients', requireAuth, async (req, res) => {
  try {
    const clients = await clientsService.fetchClientsForUser(req.userId as number);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load clients' });
  }
});

// Add other client routes here

export default router;
