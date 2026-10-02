import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'debug',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hims_n_dev?sslmode=disable',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_key_change_me_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
