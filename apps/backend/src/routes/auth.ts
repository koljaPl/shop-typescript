import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { db } from '../lib/db.js';
import { JWT_SECRET } from '../lib/config.js';
import { auth } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name zu kurz'),
  email: z.string().email('Ungültige E-Mail'),
  password: z.string().min(8, 'Passwort min. 8 Zeichen'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const sendSession = (res: Response, u: { id: string; email: string; role: Role }) => {
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 86400000 });
  return token;
};

// Registrierung
authRouter.post('/register', async (req, res, next) => {
  try {
    const b = registerSchema.parse(req.body);
    if (await db.user.findUnique({ where: { email: b.email } })) {
      return res.status(409).json({ status: 'fail', message: 'E-Mail bereits registriert.' });
    }
    const user = await db.user.create({
      data: { name: b.name, email: b.email, passwordHash: await bcrypt.hash(b.password, 10) },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json({ status: 'success', data: { user, token: sendSession(res, user) } });
  } catch (e) { next(e); }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const b = loginSchema.parse(req.body);
    const u = await db.user.findUnique({ where: { email: b.email } });
    if (!u || !(await bcrypt.compare(b.password, u.passwordHash))) {
      return res.status(401).json({ status: 'fail', message: 'Falsche Anmeldedaten.' });
    }
    const user = { id: u.id, name: u.name, email: u.email, role: u.role };
    res.json({ status: 'success', data: { user, token: sendSession(res, user) } });
  } catch (e) { next(e); }
});

// Profil abrufen
authRouter.get('/me', auth(), async (req, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true } });
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Benutzer existiert nicht mehr.' });
    }
    res.json({ status: 'success', data: { user } });
  } catch (e) { next(e); }
});

// Logout
authRouter.post('/logout', (_, res) => {
  res.clearCookie('token');
  res.json({ status: 'success', message: 'Abgemeldet.' });
});
