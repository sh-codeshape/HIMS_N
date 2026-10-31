"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'debug',
    databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hims_n_dev?sslmode=disable',
    jwtSecret: process.env.JWT_SECRET || 'super_secret_key_change_me_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    corsOrigin: process.env.CORS_ORIGIN || true,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
};
