import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { listMetrics, createMetric } from '../services/metrics.ts';

const router = Router();

router.get('/clients/:clientId/metrics', requireAuth, async (req, res) => {
  const clientId = Number(req.params.clientId);
  if (Number.isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client id' });
  }
  try {
    const metrics = await listMetrics(clientId, req.userId as number);
    return res.json(metrics);
  } catch (error) {
    if ((error as Error).message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.error('Failed to load metrics', error);
    return res.status(500).json({ error: 'Failed to load metrics' });
  }
});

router.post('/clients/:clientId/metrics', requireAuth, async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { name, value, unit, recordedAt } = req.body ?? {};
  if (Number.isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client id' });
  }
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Metric name is required' });
  }
  if (value === undefined || Number.isNaN(Number(value))) {
    return res.status(400).json({ error: 'Metric value is required' });
  }
  try {
    const metric = await createMetric(clientId, req.userId as number, {
      name: name.trim(),
      value: Number(value),
      unit: unit ?? null,
      recordedAt,
    });
    return res.status(201).json(metric);
  } catch (error) {
    if ((error as Error).message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.error('Failed to create metric', error);
    return res.status(500).json({ error: 'Failed to create metric' });
  }
});

export default router;
