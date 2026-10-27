import { successResponse, errorResponse } from '../utils/responseEnvelope.js';
import { checkMlServiceHealth } from '../services/mlClientService.js';
import { checkDatabaseHealth } from '../config/database.js';
import env from '../config/env.js';

/**
 * High-level system health check aggregating Backend, ML Service, and Database
 */
export async function getHealth(req, res) {
  const [mlStatus, dbStatus] = await Promise.all([
    checkMlServiceHealth(),
    checkDatabaseHealth(1500),
  ]);

  const isDegraded = !dbStatus.connected || !mlStatus.available;

  const healthPayload = {
    status: isDegraded ? 'DEGRADED' : 'OPERATIONAL',
    service: 'trace-api',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      backend: {
        status: 'UP',
        port: env.PORT,
      },
      database: {
        status: dbStatus.status,
        connected: dbStatus.connected,
        ...(dbStatus.latencyMs !== undefined ? { latencyMs: dbStatus.latencyMs } : {}),
        ...(dbStatus.error ? { error: dbStatus.error, code: dbStatus.code } : {}),
      },
      mlService: {
        status: mlStatus.available ? 'UP' : 'DEGRADED',
        url: env.ML_SERVICE_URL,
        details: mlStatus.available ? mlStatus.data : mlStatus.error,
      },
    },
  };

  res.status(200).json(successResponse(healthPayload, { requestId: req.id }));
}

/**
 * Dedicated database health check: GET /api/v1/health/database
 * Returns HTTP 200 if PostgreSQL is reachable, HTTP 503 if disconnected
 */
export async function getDatabaseHealth(req, res) {
  const dbStatus = await checkDatabaseHealth(2000);

  if (dbStatus.connected) {
    return res.status(200).json(
      successResponse(
        {
          status: 'UP',
          connected: true,
          provider: 'mongodb',
          latencyMs: dbStatus.latencyMs,
          timestamp: new Date().toISOString(),
        },
        { requestId: req.id }
      )
    );
  }

  return res.status(503).json(
    errorResponse(
      'DATABASE_UNAVAILABLE',
      'Database connection probe failed: MongoDB server unreachable',
      [
        {
          error: dbStatus.error,
          code: dbStatus.code,
        },
      ],
      req.id
    )
  );
}
