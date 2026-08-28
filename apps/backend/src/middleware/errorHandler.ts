import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';

// Globaler Error-Handler
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    logger.warn(`[VALIDIERUNG] ${req.method} ${req.originalUrl || req.url}: ${JSON.stringify(err.errors)}`);
    return res.status(400).json({ status: 'fail', message: 'Validierungsfehler', errors: err.errors });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      logger.warn(`[PRISMA] P2025 Datensatz nicht gefunden: ${err.message}`);
      return res.status(404).json({ status: 'fail', message: 'Datensatz nicht gefunden.' });
    }
    if (err.code === 'P2002') {
      logger.warn(`[PRISMA] P2002 Unique Constraint verletzt: ${err.message}`);
      return res.status(409).json({ status: 'fail', message: 'Ein Datensatz mit diesen eindeutigen Werten existiert bereits.' });
    }
  }

  logger.error(`[ERROR 500] ${req.method} ${req.originalUrl || req.url}: ${err.message}`, { stack: err.stack });
  res.status(500).json({ status: 'error', message: err.message || 'Interner Serverfehler' });
};
