import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../shared/utils/logger';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);

    const isProduction = env.NODE_ENV === 'production';

    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: isProduction ? 50 : 10,
      minPoolSize: isProduction ? 5 : 1,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      autoIndex: !isProduction,
    });

    isConnected = true;

    // Detect replica set status for transactions
    try {
      const adminDb = mongoose.connection.db?.admin();
      if (adminDb) {
        const status = await adminDb.serverStatus();
        const replSet = status?.repl?.setName;
        if (replSet) {
          logger.info(`[Database] MongoDB connected to replica set: ${replSet} (ACID transactions enabled)`);
        } else {
          logger.info('[Database] MongoDB connected in standalone mode (single-document operations)');
        }
      }
    } catch {
      logger.info('[Database] MongoDB connected successfully');
    }

    mongoose.connection.on('error', (error) => {
      logger.error('[Database] MongoDB connection error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[Database] MongoDB disconnected — reconnecting...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('[Database] MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown on termination signals
    const gracefulShutdown = async (signal: string) => {
      try {
        await mongoose.connection.close();
        logger.info(`[Database] MongoDB connection closed on ${signal}`);
        process.exit(0);
      } catch (err) {
        logger.error(`[Database] Error closing MongoDB connection on ${signal}`, { err });
        process.exit(1);
      }
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    logger.error('[Database] Failed to connect to MongoDB', { error });
    process.exit(1);
  }
}

/** Returns true if MongoDB is currently connected */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getConnection() {
  return mongoose.connection;
}
