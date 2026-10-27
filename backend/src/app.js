import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getHealth } from './controllers/healthController.js';
import apiRouter from './routes/index.js';
import { errorResponse } from './utils/responseEnvelope.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration based on frontend environment URL
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  })
);

// JSON body parser with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Correlation ID tracking
app.use(correlationIdMiddleware);

// HTTP request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':date[iso] :method :url :status :response-time ms - :res[content-length] [req-id: :req[x-request-id]]'));
}

// Root health check endpoint: GET /health
app.get('/health', getHealth);

// Versioned API routes: /api/v1/*
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json(
    errorResponse('RESOURCE_NOT_FOUND', `Route ${req.method} ${req.path} not found`, [], req.id)
  );
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
