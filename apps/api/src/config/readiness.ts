import mongoose from 'mongoose';
import { logger } from '../shared/utils/logger';

export interface DependencyStatus {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  details?: Record<string, any>;
  error?: string;
}

export interface ReadinessResult {
  ready: boolean;
  timestamp: string;
  dependencies: Record<string, DependencyStatus>;
  system: {
    uptimeSeconds: number;
    memoryMb: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  };
}

/**
 * Check MongoDB connectivity with lightweight admin ping command and replica set inspection.
 */
export async function checkMongoDB(): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    const state = mongoose.connection.readyState;
    if (state !== 1) {
      return { status: 'down', error: `MongoDB readyState=${state} (1=connected)` };
    }

    // Ping admin DB
    const adminDb = mongoose.connection.db!.admin();
    await adminDb.ping();
    const latencyMs = Date.now() - start;

    // Check server status / replica set
    let replicaSet: string | null = null;
    try {
      const serverStatus = await adminDb.serverStatus();
      replicaSet = serverStatus?.repl?.setName || null;
    } catch {
      // Ignored if permissions are restricted
    }

    return {
      status: 'up',
      latencyMs,
      details: {
        replicaSet: replicaSet || 'standalone',
        transactionsSupported: !!replicaSet,
      },
    };
  } catch (err: any) {
    logger.warn('[Readiness] MongoDB ping failed', { error: err?.message });
    return { status: 'down', latencyMs: Date.now() - start, error: err?.message || 'MongoDB ping failed' };
  }
}

/**
 * Aggregate all dependency and system health checks.
 */
export async function checkReadiness(): Promise<ReadinessResult> {
  const [mongodb] = await Promise.all([checkMongoDB()]);

  const dependencies: Record<string, DependencyStatus> = { mongodb };

  const ready = Object.values(dependencies).every((d) => d.status === 'up');

  return {
    ready,
    timestamp: new Date().toISOString(),
    dependencies,
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: {
        rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
      },
    },
  };
}
