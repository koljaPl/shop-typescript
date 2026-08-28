import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_geheimes_jwt_token_2026';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

type AuthUser = { id: string; email: string; role: Role };
declare global {
  namespace Express { interface Request { user?: AuthUser; } }
}

// Rollenprüfung: Auth + RBAC in einer Funktion
const auth = (roles?: Role[]) => (req: Request, res: Response, next: NextFunction) => {
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

// Zod Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name zu kurz'),
  email: z.string().email('Ungültige E-Mail'),
  password: z.string().min(8, 'Passwort min. 8 Zeichen'),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(5),
  category: z.string().default('Allgemein'),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
});
const checkoutSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.coerce.number().int().positive() })).min(1),
});

const sendSession = (res: Response, u: { id: string; email: string; role: Role }) => {
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 86400000 });
  return token;
};

// --- ROUTEN ---
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Authentifizierung
app.post('/api/v1/auth/register', async (req, res, next) => {
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

app.post('/api/v1/auth/login', async (req, res, next) => {
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

app.get('/api/v1/auth/me', auth(), async (req, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true } });
    res.json({ status: 'success', data: { user } });
  } catch (e) { next(e); }
});

app.post('/api/v1/auth/logout', (_, res) => {
  res.clearCookie('token');
  res.json({ status: 'success', message: 'Abgemeldet.' });
});

// Produkte (Kunde/Mitarbeiter/Admin)
app.get('/api/v1/products', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const where: any = { isActive: true };
    if (search) where.OR = [{ name: { contains: String(search), mode: 'insensitive' } }, { description: { contains: String(search), mode: 'insensitive' } }];
    if (category && category !== 'Alle') where.category = { equals: String(category), mode: 'insensitive' };
    res.json({ status: 'success', data: { products: await db.product.findMany({ where, orderBy: { createdAt: 'desc' } }) } });
  } catch (e) { next(e); }
});

app.get('/api/v1/products/:id', async (req, res, next) => {
  try {
    const product = await db.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ status: 'fail', message: 'Produkt nicht gefunden.' });
    res.json({ status: 'success', data: { product } });
  } catch (e) { next(e); }
});

// Nur Admin darf neue Produkte erstellen
app.post('/api/v1/products', auth([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await db.product.create({ data: { ...data, imageUrl: data.imageUrl || null } });
    res.status(201).json({ status: 'success', data: { product } });
  } catch (e) { next(e); }
});

// Mitarbeiter & Admin dürfen Details und Bestand ändern
app.put('/api/v1/products/:id', auth([Role.EMPLOYEE, Role.ADMIN]), async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    res.json({ status: 'success', data: { product: await db.product.update({ where: { id: req.params.id }, data }) } });
  } catch (e) { next(e); }
});

app.patch('/api/v1/products/:id/stock', auth([Role.EMPLOYEE, Role.ADMIN]), async (req, res, next) => {
  try {
    const stock = z.coerce.number().int().nonnegative().parse(req.body.stock);
    res.json({ status: 'success', data: { product: await db.product.update({ where: { id: req.params.id }, data: { stock } }) } });
  } catch (e) { next(e); }
});

// Nur Admin darf Produkte löschen
app.delete('/api/v1/products/:id', auth([Role.ADMIN]), async (req, res, next) => {
  try {
    const hasOrders = await db.orderItem.findFirst({ where: { productId: req.params.id } });
    if (hasOrders) await db.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    else await db.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

// Checkout mit atomarem Bestandsabzug (verhindert Überverkäufe)
app.post('/api/v1/orders/checkout', async (req, res, next) => {
  try {
    const { items } = checkoutSchema.parse(req.body);
    let userId: string | null = null;
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) { try { userId = (jwt.verify(token, JWT_SECRET) as AuthUser).id; } catch {} }

    const order = await db.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod || !prod.isActive) throw new Error(`Produkt ${item.productId} nicht verfügbar.`);

        // Atomares Update mit Bedingung: stock >= Menge
        const upd = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity }, isActive: true },
          data: { stock: { decrement: item.quantity } },
        });

        if (upd.count === 0) {
          throw new Error(`Nicht genügend Bestand für "${prod.name}". Verfügbar: ${prod.stock}, Angefordert: ${item.quantity}`);
        }

        totalAmount += Number(prod.price) * item.quantity;
        orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: prod.price });
      }

      return tx.order.create({
        data: { userId, totalAmount, status: 'PAID', items: { create: orderItems } },
        include: { items: { include: { product: true } } },
      });
    });

    res.status(201).json({ status: 'success', message: 'Kauf abgeschlossen!', data: { order } });
  } catch (e: any) {
    if (e.message?.includes('Nicht genügend Bestand')) return res.status(409).json({ status: 'fail', message: e.message });
    next(e);
  }
});

// Benutzerverwaltung (Nur Admin)
app.get('/api/v1/users', auth([Role.ADMIN]), async (_, res, next) => {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: { users } });
  } catch (e) { next(e); }
});

app.patch('/api/v1/users/:id/role', auth([Role.ADMIN]), async (req, res, next) => {
  try {
    const role = z.nativeEnum(Role).parse(req.body.role);
    const user = await db.user.update({ where: { id: req.params.id }, data: { role }, select: { id: true, name: true, email: true, role: true } });
    res.json({ status: 'success', data: { user } });
  } catch (e) { next(e); }
});

// Globaler Error-Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ status: 'fail', message: 'Validierungsfehler', errors: err.errors });
  }
  res.status(500).json({ status: 'error', message: err.message || 'Interner Serverfehler' });
});

app.listen(PORT, () => console.log(`🚀 TechShop API auf http://localhost:${PORT} aktiv`));
