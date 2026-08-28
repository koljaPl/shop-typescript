import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { db } from '../lib/db.js';
import { auth } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

export const usersRouter = Router();

// Benutzerverwaltung (Nur Admin)
usersRouter.get('/', auth([Role.ADMIN]), async (_, res, next) => {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: { users } });
  } catch (e) { next(e); }
});

// Rolle eines Benutzers ändern (Nur Admin)
usersRouter.patch('/:id/role', auth([Role.ADMIN]), async (req, res, next) => {
  try {
    const role = z.nativeEnum(Role).parse(req.body.role);

    if (req.params.id === req.user?.id && role !== Role.ADMIN) {
      return res.status(400).json({ status: 'fail', message: 'Administratoren können ihre eigene Rolle nicht entziehen.' });
    }

    const user = await db.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    logger.info(`[USER] Rolle von ${user.email} auf ${user.role} geändert durch ${req.user?.email}`);
    res.json({ status: 'success', data: { user } });
  } catch (e) { next(e); }
});
