import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Globaler Error-Handler
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ status: 'fail', message: 'Validierungsfehler', errors: err.errors });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return res.status(404).json({ status: 'fail', message: 'Datensatz nicht gefunden.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ status: 'fail', message: 'Ein Datensatz mit diesen eindeutigen Werten existiert bereits.' });
    }
  }
  res.status(500).json({ status: 'error', message: err.message || 'Interner Serverfehler' });
};
