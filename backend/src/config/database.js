import mongoose from 'mongoose';
import env from './env.js';

// Connection state constants
const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let isConnected = false;
let connectionPromise = null;

// Lifecycle event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[TRACE Database] MongoDB connected successfully.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[TRACE Database] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[TRACE Database] MongoDB disconnected.');
});

let memoryServerInstance = null;

/**
 * Connects to MongoDB using Mongoose with resilient configuration.
 * Avoids duplicate connections and masks credentials in logs.
 * In development mode, automatically falls back to an embedded in-memory MongoDB instance
 * if the local MongoDB daemon is unreachable.
 * @param {string} [uri] - Optional URI override (e.g. for testing)
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDatabase(uri = env.MONGODB_URI) {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  // Mask credentials in connection log
  const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`[TRACE Database] Connecting to MongoDB at ${sanitizedUri}...`);

  connectionPromise = (async () => {
    try {
      const m = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
        autoIndex: env.NODE_ENV !== 'production',
      });
      return m;
    } catch (err) {
      if (env.NODE_ENV !== 'production') {
        try {
          console.warn(`[TRACE Database] Standalone MongoDB at ${sanitizedUri} unreachable (${err.message}).`);
          console.log('[TRACE Database] Initializing embedded in-memory MongoDB development instance...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          memoryServerInstance = await MongoMemoryServer.create();
          const memoryUri = memoryServerInstance.getUri();
          const m = await mongoose.connect(memoryUri, {
            autoIndex: true,
          });
          console.log(`[TRACE Database] Embedded MongoDB started successfully at ${memoryUri}`);
          return m;
        } catch (memErr) {
          console.error('[TRACE Database] Embedded MongoDB fallback failed:', memErr.message);
          throw err;
        }
      }
      throw err;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Probes actual MongoDB database connectivity with a lightweight ping command and timeout.
 * @param {number} timeoutMs - Timeout in milliseconds (default: 2000)
 * @returns {Promise<{ status: 'UP' | 'DOWN', connected: boolean, latencyMs?: number, error?: string, code?: string }>}
 */
export async function checkDatabaseHealth(timeoutMs = 2000) {
  const startTime = Date.now();

  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return {
      status: 'DOWN',
      connected: false,
      error: `MongoDB server is not connected (current state: ${READY_STATES[mongoose.connection.readyState] || 'unknown'})`,
      code: 'DATABASE_UNAVAILABLE',
    };
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`MongoDB health ping timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const pingPromise = mongoose.connection.db.admin().ping();
    await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;

    return {
      status: 'UP',
      connected: true,
      latencyMs,
    };
  } catch (error) {
    return {
      status: 'DOWN',
      connected: false,
      error: error.message || 'MongoDB ping probe failed',
      code: error.message.includes('timed out') ? 'TIMEOUT' : 'CONNECTION_ERROR',
    };
  }
}

/**
 * Gracefully closes MongoDB connection during process shutdown.
 */
export async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
      console.log('[TRACE Database] MongoDB disconnected cleanly.');
    }
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
      console.log('[TRACE Database] Embedded MongoDB instance stopped.');
    }
  } catch (error) {
    console.error('[TRACE Database] Error disconnecting MongoDB:', error.message);
  }
}

export default mongoose;
