import app from './app.js';
import env from './config/env.js';

// Create HTTP server instance
const server = app.listen(env.PORT);

// Startup listener
server.on('listening', () => {
  const address = server.address();
  const port = typeof address === 'string' ? address : address?.port || env.PORT;
  console.log(`[TRACE Backend] Server running on http://localhost:${port} in ${env.NODE_ENV} mode`);
  console.log(`[TRACE Backend] Health endpoint: http://localhost:${port}/health`);
  console.log(`[TRACE Backend] API Base: http://localhost:${port}/api/v1`);

  // Non-blocking initial MongoDB connection attempt
  import('./config/database.js').then(({ connectDatabase }) => {
    connectDatabase().catch((err) => {
      console.warn(`[TRACE Backend] Initial MongoDB connection not available: ${err.message}. Backend running in degraded mode.`);
    });
  });
});

// Explicit server-level error handling
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    console.error('[TRACE Backend] Server fatal error:', error);
    process.exit(1);
  }

  switch (error.code) {
    case 'EADDRINUSE':
      console.error(`[TRACE Backend] ERROR: Port ${env.PORT} is already in use.`);
      console.error(`[TRACE Backend] Another process or instance of TRACE backend is already listening on port ${env.PORT}.`);
      console.error(`[TRACE Backend] Please ensure the previous process is terminated before starting a new instance.`);
      process.exit(1);
      break;
    case 'EACCES':
      console.error(`[TRACE Backend] ERROR: Port ${env.PORT} requires elevated privileges.`);
      process.exit(1);
      break;
    default:
      console.error(`[TRACE Backend] Server startup error (${error.code || 'UNKNOWN'}):`, error.message);
      process.exit(1);
  }
});

// Graceful shutdown handling with immediate socket cleanup and DB disconnect
async function handleShutdown(signal) {
  console.log(`\n[TRACE Backend] Received ${signal}. Shutting down gracefully...`);
  try {
    const { disconnectDatabase } = await import('./config/database.js');
    await disconnectDatabase();
  } catch (err) {
    console.error('[TRACE Backend] Error disconnecting database on shutdown:', err);
  }

  if (server && server.listening) {
    // Terminate all open/keep-alive connections so the port is freed immediately
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    server.close((err) => {
      if (err) {
        console.error('[TRACE Backend] Error while closing HTTP server:', err);
        process.exit(1);
      }
      console.log('[TRACE Backend] HTTP server closed cleanly. Port released.');
      process.exit(0);
    });

    // Safety fallback: force exit if connections linger
    setTimeout(() => {
      console.warn('[TRACE Backend] Forcing exit after shutdown timeout.');
      process.exit(0);
    }, 2000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
