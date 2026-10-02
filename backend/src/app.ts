import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use(pinoHttp({ logger }));

import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patient/patient.routes';
import { opdRoutes } from './modules/opd/opd.routes';
import { ipdRoutes } from './modules/ipd/ipd.routes';
import { billingRoutes } from './modules/billing/billing.routes';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/opd', opdRoutes);
app.use('/api/v1/ipd', ipdRoutes);
app.use('/api/v1/billing', billingRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
