import { Router } from 'express';
import { Role } from '@prisma/client';
import { auth } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

export const systemRouter = Router();

// Logs abrufen (Nur Admin)
systemRouter.get('/logs', auth([Role.ADMIN]), (req, res) => {
  const limit = Math.min(200, parseInt(String(req.query.limit || '100'), 10));
  const logs = logger.getRecentLogs(limit);
  res.json({ status: 'success', data: { logs } });
});

// Logs leeren (Nur Admin)
systemRouter.delete('/logs', auth([Role.ADMIN]), (req, res) => {
  logger.clearLogs();
  logger.info(`[SYSTEM] Logs wurden von Admin ${req.user?.email} geleert.`);
  res.json({ status: 'success', message: 'Logs geleert.' });
});
