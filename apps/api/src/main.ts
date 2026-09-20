import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { initWebSocketServer } from './events/websocket.gateway';
import { DomainEventBus } from './events/event-bus';
import { metricsMiddleware, register } from './common/metrics';
import { prisma } from './prisma';
import { StorageFactory } from './storage/storage.factory';

// Modular Domain Routers
import { authRouter } from './auth/auth.routes';
import { incidentsRouter } from './incidents/incidents.routes';
import { reportsRouter } from './reports/reports.routes';
import { resourcesRouter } from './resources/resources.routes';
import { dispatchesRouter } from './dispatches/dispatches.routes';
import { notificationsRouter } from './notifications/notifications.routes';
import { analyticsRouter } from './analytics/analytics.routes';
import { demoRouter } from './demo/demo.routes';
import { storageRouter } from './storage/storage.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 1. Initialize Event Bus and WebSockets
DomainEventBus.initialize();
initWebSocketServer(server, CORS_ORIGIN);

// 2. Gateway Security: Helmet Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Leaflet tiles and WebSockets
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 3. Request ID Correlation Middleware (Distributed Tracing)
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);
  (req as any).id = reqId;
  next();
});

// 4. Prometheus Metrics Middleware
app.use(metricsMiddleware);

// 5. CORS and Body Parsing
const allowedOrigins =
  CORS_ORIGIN === '*'
    ? '*'
    : CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 6. Rate Limiting Protection (DDoS Protection)
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please throttle back.', code: 'RATE_LIMITED' },
});
app.use('/api/', globalLimiter);

// Dedicated reporting rate limiter (60/min per IP)
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Report rate limit exceeded. Please wait.', code: 'REPORT_RATE_LIMITED' },
});
app.use('/api/reports', reportLimiter);

// 7. Static Local Uploads Serving
const uploadDir = path.resolve(process.env.STORAGE_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// ====================================================
// 8. ENTERPRISE HEALTH PROBES & METRICS
// ====================================================

// Liveness probe (Process alive)
app.get(['/health/live', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'ResQGrid Emergency Intelligence API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Readiness probe (Database & Storage readiness)
app.get('/health/ready', async (_req, res) => {
  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    const storage = StorageFactory.getStorageService();

    res.json({
      status: 'ready',
      database: 'connected',
      storageProvider: storage.getProviderName(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'not_ready',
      error: err.message,
    });
  }
});

// Prometheus Scraping Endpoint
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end();
  }
});

// ====================================================
// 9. DOMAIN ROUTE MOUNTING
// ====================================================
app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/dispatches', dispatchesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/demo', demoRouter);
app.use('/api/storage', storageRouter);

// Global Error Interceptor
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const reqId = (req as any).id || 'unknown';
  console.error(`[Error][Req:${reqId}]`, err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected internal system error occurred',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    requestId: reqId,
  });
});

// 10. Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ResQGrid Emergency Operations Server active on port ${PORT}`);
  console.log(`📍 REST API: http://localhost:${PORT}/api`);
  console.log(`⚡ WebSocket Server: ws://localhost:${PORT}`);
  console.log(`📊 Prometheus Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🛡️ Liveness & Readiness: http://localhost:${PORT}/health/live & ready`);
  console.log(`☁️ Storage Provider: ${StorageFactory.getStorageService().getProviderName().toUpperCase()}`);
  console.log(`====================================================`);
});

// 11. Graceful Shutdown
function gracefulShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP and WebSocket listeners closed.');
    await prisma.$disconnect();
    console.log('[Database] Prisma connections disconnected.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('[Server] Forced exit after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
