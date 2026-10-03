import type { Response } from 'express';
import { logger } from '../../shared/utils/logger';

class SseService {
  // Map of userId -> Set of active SSE Response connections
  private clients: Map<string, Set<Response>> = new Map();

  /**
   * Register a new authenticated client connection for SSE stream.
   */
  public addClient(userId: string, res: Response): void {
    // 1. Set required SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // 2. Add to client pool
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);

    // 3. Send initial connected event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // 4. Periodic heartbeat (prevents proxy / cloud timeouts)
    const heartbeat = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25000);

    // 5. Cleanup on socket close/disconnect
    res.on('close', () => {
      clearInterval(heartbeat);
      const userConns = this.clients.get(userId);
      if (userConns) {
        userConns.delete(res);
        if (userConns.size === 0) {
          this.clients.delete(userId);
        }
      }
      logger.info(`[SSE] Client disconnected for user ${userId}. Active users: ${this.clients.size}`);
    });

    logger.info(`[SSE] Client connected for user ${userId}. Active connections for user: ${this.clients.get(userId)?.size}`);
  }

  /**
   * Send a targeted real-time event to a specific user.
   * Completely isolated: no cross-user event leakage.
   */
  public sendToUser(userId: string, event: string, data: unknown): void {
    const userConns = this.clients.get(userId);
    if (!userConns || userConns.size === 0) {
      return;
    }

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of userConns) {
      try {
        res.write(payload);
      } catch (err) {
        logger.error(`[SSE] Error writing event to client for user ${userId}`, { err });
      }
    }
  }

  /**
   * Broadcast an event to all actively connected users.
   */
  public broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [userId, userConns] of this.clients.entries()) {
      for (const res of userConns) {
        try {
          res.write(payload);
        } catch (err) {
          logger.error(`[SSE] Error broadcasting event to user ${userId}`, { err });
        }
      }
    }
  }

  /**
   * Get active connection metrics.
   */
  public getActiveCount(): { totalUsers: number; totalConnections: number } {
    let totalConnections = 0;
    for (const conns of this.clients.values()) {
      totalConnections += conns.size;
    }
    return {
      totalUsers: this.clients.size,
      totalConnections,
    };
  }
}

export const sseService = new SseService();
