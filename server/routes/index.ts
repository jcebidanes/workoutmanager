import { Router } from 'express';
import authRoutes from './auth.ts';
import userRoutes from './users.ts';
import templateRoutes from './templates.ts';
import clientRoutes from './clients.ts';

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(templateRoutes);
router.use(clientRoutes);

export default router;
