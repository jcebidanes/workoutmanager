import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { listMessages, createMessage } from '../services/messages.ts';

const router = Router();

router.get('/clients/:clientId/messages', requireAuth, async (req, res) => {
  const clientId = Number(req.params.clientId);
  if (Number.isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client id' });
  }
  try {
    const messages = await listMessages(clientId, req.userId as number);
    return res.json(messages);
  } catch (error) {
    if ((error as Error).message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.error('Failed to load messages', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/clients/:clientId/messages', requireAuth, async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { content } = req.body ?? {};
  if (Number.isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client id' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Message content is required' });
  }
  try {
    const message = await createMessage(clientId, req.userId as number, content.trim());
    return res.status(201).json(message);
  } catch (error) {
    if ((error as Error).message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.error('Failed to create message', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
});

export default router;
