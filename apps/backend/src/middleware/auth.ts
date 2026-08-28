import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { JWT_SECRET } from '../lib/config.js';

export type AuthUser = { id: string; email: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Rollenprüfung: Auth + RBAC in einer Funktion
export const auth = (roles?: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ status: 'fail', message: 'Bitte zuerst anmelden.' });
  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = user;
    if (roles && !roles.includes(user.role)) {
      return res.status(403).json({ status: 'fail', message: `Zugriff verweigert für Rolle ${user.role}.` });
    }
    next();
  } catch {
    res.status(401).json({ status: 'fail', message: 'Sitzung abgelaufen.' });
  }
};
