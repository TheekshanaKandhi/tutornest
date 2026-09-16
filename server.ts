import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/auth.js';
import { tutorsRouter } from './server/routes/tutors.js';
import { bookingsRouter } from './server/routes/bookings.js';
import { paymentsRouter } from './server/routes/payments.js';
import { reviewsRouter } from './server/routes/reviews.js';
import { subjectsRouter } from './server/routes/subjects.js';
import { learningRouter } from './server/routes/learning.js';
import { messagesRouter } from './server/routes/messages.js';
import { notificationsRouter } from './server/routes/notifications.js';
import { adminRouter } from './server/routes/admin.js';
import { studentRouter } from './server/routes/student.js';
import { tutorRouter } from './server/routes/tutor.js';
import { contactRouter } from './server/routes/contact.js';
import { docsRouter } from './server/routes/docs.js';
import { store } from './server/db/store.js';

async function startServer() {
  await store.initialize();
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Production accepts only explicitly configured origins. Development is
  // intentionally limited to local browser origins.
  const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  const allowedOrigins = new Set(envOrigins);
  const isLocalOrigin = (origin: string) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  // Explicit CORS and security headers middleware.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const originAllowed = Boolean(
      origin &&
      (process.env.NODE_ENV === 'production'
        ? allowedOrigins.has(origin)
        : isLocalOrigin(origin))
    );

    if (originAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-Id'
      );
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      if (origin && !originAllowed) return res.status(403).json({ success: false, message: 'CORS origin denied' });
      return res.status(204).end();
    }

    // Standard production security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  });

  // Middleware
  app.use(express.json());

  // Request ID middleware & structured logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    res.on('finish', () => {
      void store.persist();
    });
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.originalUrl || req.path} (ID: ${requestId})`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      app: 'TutorNest Production Server',
      timestamp: new Date().toISOString(),
      requestId: res.getHeader('X-Request-Id'),
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/tutors', tutorsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/student', studentRouter);
  app.use('/api/tutor', tutorRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/docs', docsRouter);

  // Global Exception Handler (Spring @ControllerAdvice equivalent)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.path} - ${err.message}`, err.stack);
    const status = err.status || 500;
    const isProd = process.env.NODE_ENV === 'production';
    res.status(status).json({
      success: false,
      status,
      error: err.name || 'InternalServerError',
      message: (isProd && status >= 500)
        ? 'A server error occurred while processing your request. Please try again shortly.'
        : (err.message || 'An unexpected error occurred. Please try again.'),
      path: req.path,
      timestamp: new Date().toISOString(),
      requestId: res.getHeader('X-Request-Id'),
    });
  });

  // Explicit 404 JSON handler for unmatched /api routes
  // This prevents any unmatched /api route from falling through to Vite's SPA HTML fallback!
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      status: 404,
      error: 'NotFound',
      message: `API route ${req.method} ${req.originalUrl || req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId: res.getHeader('X-Request-Id'),
    });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TutorNest] Production server listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[TutorNest] ${signal} received; flushing PostgreSQL state.`);
    await store.close();
    httpServer.close(() => process.exit(0));
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('Fatal failure starting TutorNest server:', err);
  process.exit(1);
});
