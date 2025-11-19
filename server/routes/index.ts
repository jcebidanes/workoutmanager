import { Router } from 'express';
import authRoutes from './auth.ts';
import userRoutes from './users.ts';
import templateRoutes from './templates.ts';
import clientRoutes from './clients.ts';
import messageRoutes from './messages.ts';
import metricRoutes from './metrics.ts';

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(templateRoutes);
router.use(clientRoutes);
router.use(messageRoutes);
router.use(metricRoutes);

export default router;
