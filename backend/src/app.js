import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import './config/passport.js';
import { globalLimiter } from './shared/middleware/rateLimiter.js';
import { notFound, errorHandler } from './shared/middleware/errorHandler.js';
import { logger } from './shared/utils/logger.js';

// Feature routers
import { authRouter } from './features/auth/index.js';
import { categoryRouter } from './features/categories/index.js';
import { brandRouter } from './features/brands/index.js';
import { productRouter } from './features/products/index.js';
import { shareLinkRouter } from './features/share-links/index.js';
import { achievementRouter } from './features/achievements/index.js';
import { referralRouter } from './features/referrals/index.js';
import { fxRouter } from './features/fx/index.js';
import { adminRouter } from './features/admin/index.js';
import { shippingRouter } from './features/shipping/index.js';
import { orderRouter } from './features/orders/index.js';
import { returnRouter } from './features/returns/index.js';
import { reviewRouter } from './features/reviews/index.js';
import { buyerRouter } from './features/buyers/index.js';
import { collectionRouter } from './features/collections/index.js';
import { promotionRouter } from './features/promotions/index.js';
import { teamRouter } from './features/team/index.js';
import { photoRouter } from './features/photos/index.js';
import { paymentRouter } from './features/payments/index.js';
import { geoRouter } from './features/geo/index.js';
import { messengerRouter } from './features/messenger/index.js';
import { shopifyRouter } from './features/shopify/index.js';
import { crmRouter } from './features/crm/index.js';
import { promotedRouter } from './features/promoted/index.js';

const app = express();

// ─── Security & Parse ────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(cookieParser());
// PayPal webhooks need raw body for signature verification
app.use('/api/payments/paypal/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ─── Global rate limit ───────────────────────────────────────
app.use('/api', globalLimiter);

// ─── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/brands', brandRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/returns', returnRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/buyer', buyerRouter);
app.use('/api/share-links', shareLinkRouter);
app.use('/api/collections', collectionRouter);
app.use('/api/promotions', promotionRouter);
app.use('/api/team', teamRouter);
app.use('/api/photos', photoRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/referrals', referralRouter);
app.use('/api/fx', fxRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/geo', geoRouter);
app.use('/api/messages', messengerRouter);
app.use('/api/shopify', shopifyRouter);
app.use('/api/crm', crmRouter);
app.use('/api/promoted', promotedRouter);

// ─── Error handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
