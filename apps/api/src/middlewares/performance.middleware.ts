import type { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils/logger';

interface PerformanceMetrics {
  totalRequests: number;
  slowRequestsCount: number;
  statusCodes: Record<string, number>;
  totalLatencyMs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  recentLatencies: number[];
}

const metrics: PerformanceMetrics = {
  totalRequests: 0,
  slowRequestsCount: 0,
  statusCodes: {},
  totalLatencyMs: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  recentLatencies: [],
};

const SLOW_REQUEST_THRESHOLD_MS = 500;
const MAX_LATENCY_SAMPLES = 200;

export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();

  // Intercept writeHead to ensure header is set before response flushes
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args: any[]) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const roundedMs = Math.round(durationMs * 100) / 100;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${roundedMs}ms`);
    }
    return (originalWriteHead as any).apply(res, args);
  };

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1_000_000;
    const roundedMs = Math.round(durationMs * 100) / 100;

    // Update metrics
    metrics.totalRequests++;
    metrics.totalLatencyMs += roundedMs;
    metrics.avgLatencyMs = Math.round((metrics.totalLatencyMs / metrics.totalRequests) * 100) / 100;

    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    metrics.statusCodes[statusGroup] = (metrics.statusCodes[statusGroup] || 0) + 1;

    // Maintain recent sample window for p95 calculation
    metrics.recentLatencies.push(roundedMs);
    if (metrics.recentLatencies.length > MAX_LATENCY_SAMPLES) {
      metrics.recentLatencies.shift();
    }
    const sorted = [...metrics.recentLatencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    metrics.p95LatencyMs = sorted[p95Index] || roundedMs;

    // Slow request warning
    if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
      metrics.slowRequestsCount++;
      logger.warn(
        `[Slow Request Warning] ${req.method} ${req.originalUrl} completed in ${roundedMs}ms with status ${res.statusCode}`
      );
    }
  });

  next();
}

export function getPerformanceMetrics() {
  return {
    totalRequests: metrics.totalRequests,
    slowRequestsCount: metrics.slowRequestsCount,
    statusCodes: { ...metrics.statusCodes },
    avgLatencyMs: metrics.avgLatencyMs,
    p95LatencyMs: metrics.p95LatencyMs,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: {
      rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
      heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
  };
}
