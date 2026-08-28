import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { db } from '../lib/db.js';
import { auth } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

export const productsRouter = Router();

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(5),
  category: z.string().default('Allgemein'),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
});

// Produkte abrufen (Kunde/Mitarbeiter/Admin)
productsRouter.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const where: any = { isActive: true };
    if (search) where.OR = [{ name: { contains: String(search), mode: 'insensitive' } }, { description: { contains: String(search), mode: 'insensitive' } }];
    if (category && category !== 'Alle') where.category = { equals: String(category), mode: 'insensitive' };
    res.json({ status: 'success', data: { products: await db.product.findMany({ where, orderBy: { createdAt: 'desc' } }) } });
  } catch (e) { next(e); }
});

// Einzelnes Produkt abrufen
productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await db.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ status: 'fail', message: 'Produkt nicht gefunden.' });
    res.json({ status: 'success', data: { product } });
  } catch (e) { next(e); }
});

// Nur Admin darf neue Produkte erstellen
productsRouter.post('/', auth([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await db.product.create({ data: { ...data, imageUrl: data.imageUrl || null } });
    logger.info(`[PRODUCT] Neues Produkt angelegt: "${product.name}" (ID: ${product.id}) durch ${req.user?.email}`);
    res.status(201).json({ status: 'success', data: { product } });
  } catch (e) { next(e); }
});

// Mitarbeiter & Admin dürfen Details und Bestand ändern
productsRouter.put('/:id', auth([Role.EMPLOYEE, Role.ADMIN]), async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await db.product.update({ where: { id: req.params.id }, data });
    logger.info(`[PRODUCT] Produkt #${req.params.id} aktualisiert durch ${req.user?.email}`);
    res.json({ status: 'success', data: { product } });
  } catch (e) { next(e); }
});

// Lagerbestand aktualisieren
productsRouter.patch('/:id/stock', auth([Role.EMPLOYEE, Role.ADMIN]), async (req, res, next) => {
  try {
    const stock = z.coerce.number().int().nonnegative().parse(req.body.stock);
    const product = await db.product.update({ where: { id: req.params.id }, data: { stock } });
    logger.info(`[PRODUCT] Lagerbestand für #${req.params.id} auf ${stock} geändert durch ${req.user?.email}`);
    res.json({ status: 'success', data: { product } });
  } catch (e) { next(e); }
});

// Nur Admin darf Produkte löschen
productsRouter.delete('/:id', auth([Role.ADMIN]), async (req, res, next) => {
  try {
    const prod = await db.product.findUnique({ where: { id: req.params.id } });
    if (!prod) return res.status(404).json({ status: 'fail', message: 'Produkt nicht gefunden.' });

    const hasOrders = await db.orderItem.findFirst({ where: { productId: req.params.id } });
    if (hasOrders) await db.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    else await db.product.delete({ where: { id: req.params.id } });
    logger.info(`[PRODUCT] Produkt #${req.params.id} ("${prod.name}") gelöscht/archiviert durch ${req.user?.email}`);
    res.status(204).send();
  } catch (e) { next(e); }
});
