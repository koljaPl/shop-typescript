import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Globaler Error-Handler
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ status: 'fail', message: 'Validierungsfehler', errors: err.errors });
  }
  res.status(500).json({ status: 'error', message: err.message || 'Interner Serverfehler' });
};
