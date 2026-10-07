import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './config/logger';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.originalUrl }, 'HTTP request');
  next();
});

import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patient/patient.routes';
import { opdRoutes } from './modules/opd/opd.routes';
import { ipdRoutes } from './modules/ipd/ipd.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { bedRoutes } from './modules/bed/bed.routes';
import { staffRoutes } from './modules/staff/staff.routes';
import { labRoutes } from './modules/laboratory/lab.routes';
import { pharmacyRoutes } from './modules/pharmacy/pharmacy.routes';

import { rolesRoutes } from './modules/roles/roles.routes';

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
app.use('/api/v1/beds', bedRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/laboratory', labRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/roles', rolesRoutes);

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
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
