import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Wenn Response abgeschlossen ist
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userId = req.user?.id ? `[User: ${req.user.role}]` : '[Gast]';
    const ip = req.ip || req.socket.remoteAddress || '-';

    const logMsg = `${method} ${url} -> ${status} (${duration}ms) ${userId} - IP: ${ip}`;
    if (status >= 500) {
      logger.error(logMsg);
    } else if (status >= 400) {
      logger.warn(logMsg);
    } else {
      logger.http(logMsg);
    }
  });

  next();
};
