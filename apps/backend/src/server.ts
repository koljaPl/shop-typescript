import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PORT } from './lib/config.js';
import { logger } from './lib/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { usersRouter } from './routes/users.js';
import { systemRouter } from './routes/system.js';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Healthcheck
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// API Routen
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/system', systemRouter);

// Globaler Error-Handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 TechShop API aktiv auf http://localhost:${PORT}`);
});

export default app;
