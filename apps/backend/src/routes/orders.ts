import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { JWT_SECRET } from '../lib/config.js';
import { AuthUser } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

export const ordersRouter = Router();

const checkoutSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.coerce.number().int().positive() })).min(1),
});

// Checkout mit atomarem Bestandsabzug (verhindert Überverkäufe)
ordersRouter.post('/checkout', async (req, res, next) => {
  try {
    const { items } = checkoutSchema.parse(req.body);
    let userId: string | null = null;
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        userId = (jwt.verify(token, JWT_SECRET) as AuthUser).id;
      } catch {}
    }

    const order = await db.$transaction(async (tx) => {
      let subtotal = 0;
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

        subtotal += Number(prod.price) * item.quantity;
        orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: prod.price });
      }

      const shipping = subtotal >= 100 ? 0 : 4.90;
      const totalAmount = Number((subtotal + shipping).toFixed(2));

      return tx.order.create({
        data: { userId, totalAmount, status: 'PAID', items: { create: orderItems } },
        include: { items: { include: { product: true } } },
      });
    });

    logger.info(`[ORDER] Bestellung abgeschlossen: #${order.id} | Summe: ${order.totalAmount} € | Positionen: ${order.items?.length ?? 0}`);
    res.status(201).json({ status: 'success', message: 'Kauf abgeschlossen!', data: { order } });
  } catch (e: any) {
    if (e.message?.includes('nicht verfügbar')) return res.status(404).json({ status: 'fail', message: e.message });
    if (e.message?.includes('Nicht genügend Bestand')) return res.status(409).json({ status: 'fail', message: e.message });
    next(e);
  }
});
