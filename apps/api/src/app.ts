import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { checkReadiness } from './config/readiness';
import { errorMiddleware } from './middlewares/error.middleware';
import { API_PREFIX } from '@petverse/shared-constants';

// Routes
import authRoutes from './modules/auth/auth.routes';
import petRoutes from './modules/pets/pet.routes';
import { vaccinationRoutes } from './modules/vaccination/vaccination.routes';
import { medicationRoutes } from './modules/medication/medication.routes';
import { eventRoutes } from './modules/events/events.routes';
import { automationRoutes } from './modules/automation/automation.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { reminderRoutes } from './modules/reminders/reminders.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import nearbyRoutes from './modules/nearby/nearby.routes';
import userRoutes from './modules/users/user.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import lostFoundRoutes from './modules/lost-found/lost-found.routes';
import expenseRoutes from './modules/expenses/expense.routes';
import communityRoutes from './modules/community/community.routes';
import marketplaceRoutes from './modules/marketplace/marketplace.routes';
import adoptionRoutes from './modules/adoption/adoption.routes';

import { performanceMiddleware, getPerformanceMetrics } from './middlewares/performance.middleware';

export function createApp(): Application {
  const app = express();

  // ─── Performance Monitoring ──────────────────────────────
  app.use(performanceMiddleware);

  // ─── Security ───────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: env.NODE_ENV === 'production',
    })
  );

  // ─── CORS ───────────────────────────────────────────────
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1):(517[0-9]|3000)$/.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // ─── Rate Limiting ──────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_GLOBAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
    },
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: env.RATE_LIMIT_AUTH_MAX,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, slow down.' },
    },
  });

  app.use(globalLimiter);

  // ─── Parsing ────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Logging ────────────────────────────────────────────
  app.use(
    morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );

  // ─── Health Check (process liveness) ───────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        version: '1.0.0',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMb: {
          rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
          heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
        },
      },
    });
  });

  // ─── Readiness Check (dependency availability) ─────────
  app.get('/ready', async (_req: Request, res: Response) => {
    try {
      const result = await checkReadiness();
      if (result.ready) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'ready',
            timestamp: result.timestamp,
            dependencies: result.dependencies,
            system: result.system,
          },
        });
      }
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_READY',
          message: 'Service dependencies are not ready',
          dependencies: result.dependencies,
          system: result.system,
        },
      });
    } catch (err: any) {
      logger.error('[Readiness] Unexpected error in /ready check', { err });
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_NOT_READY', message: err?.message || 'Readiness check failed' },
      });
    }
  });

  // ─── Metrics (performance & telemetry) ─────────────────
  app.get('/metrics', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: getPerformanceMetrics(),
    });
  });

  // ─── API Routes ──────────────────────────────────────────
  app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/pets`, petRoutes);
  app.use(`${API_PREFIX}/vaccinations`, vaccinationRoutes);
  app.use(`${API_PREFIX}/medications`, medicationRoutes);
  app.use(`${API_PREFIX}/events`, eventRoutes);
  app.use(`${API_PREFIX}/automation`, automationRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/reminders`, reminderRoutes);
  app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
  app.use(`${API_PREFIX}/nearby`, nearbyRoutes);
  app.use(`${API_PREFIX}/ai`, aiRoutes);
  app.use(`${API_PREFIX}/payments`, paymentRoutes);
  app.use(`${API_PREFIX}/lost-found`, lostFoundRoutes);
  app.use(`${API_PREFIX}/expenses`, expenseRoutes);
  app.use(`${API_PREFIX}/community`, communityRoutes);
  app.use(`${API_PREFIX}/marketplace`, marketplaceRoutes);
  app.use(`${API_PREFIX}/adoption`, adoptionRoutes);

  // Public QR route (no auth)
  app.get(`${API_PREFIX}/public/pet/:qrCode`, async (req, res) => {
    const { petService } = await import('./modules/pets/pet.service');
    const { apiResponse } = await import('./shared/utils/apiResponse');
    const { asyncHandler } = await import('./middlewares/error.middleware');
    try {
      const pet = await petService.getPetByQrCode(req.params.qrCode);
      apiResponse.success(res, pet);
    } catch (error) {
      res.status(404).json({ success: false, error: { message: 'Pet not found' } });
    }
  });

  // ─── 404 Handler ─────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'API endpoint not found' },
    });
  });

  // ─── Global Error Handler ─────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
