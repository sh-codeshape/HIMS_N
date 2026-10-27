"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("./config/logger");
exports.app = (0, express_1.default)();
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
exports.app.use(express_1.default.json());
exports.app.use((req, res, next) => {
    logger_1.logger.info({ method: req.method, url: req.originalUrl }, 'HTTP request');
    next();
});
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const patient_routes_1 = __importDefault(require("./modules/patient/patient.routes"));
const opd_routes_1 = require("./modules/opd/opd.routes");
const ipd_routes_1 = require("./modules/ipd/ipd.routes");
const billing_routes_1 = require("./modules/billing/billing.routes");
const bed_routes_1 = require("./modules/bed/bed.routes");
const staff_routes_1 = require("./modules/staff/staff.routes");
const practitioner_routes_1 = require("./modules/staff/practitioner.routes");
const lab_routes_1 = require("./modules/laboratory/lab.routes");
const pharmacy_routes_1 = require("./modules/pharmacy/pharmacy.routes");
const inventory_routes_1 = require("./modules/inventory/inventory.routes");
const roles_routes_1 = require("./modules/roles/roles.routes");
const modules_routes_1 = require("./modules/modules/modules.routes");
// Health check
exports.app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
exports.app.use('/api/v1/auth', auth_routes_1.default);
exports.app.use('/api/v1/patients', patient_routes_1.default);
exports.app.use('/api/v1/opd', opd_routes_1.opdRoutes);
exports.app.use('/api/v1/ipd', ipd_routes_1.ipdRoutes);
exports.app.use('/api/v1/billing', billing_routes_1.billingRoutes);
exports.app.use('/api/v1/beds', bed_routes_1.bedRoutes);
exports.app.use('/api/v1/staff', staff_routes_1.staffRoutes);
exports.app.use('/api/v1/practitioners', practitioner_routes_1.practitionerRoutes);
exports.app.use('/api/v1/laboratory', lab_routes_1.labRoutes);
exports.app.use('/api/v1/pharmacy', pharmacy_routes_1.pharmacyRoutes);
exports.app.use('/api/v1/inventory', inventory_routes_1.inventoryRoutes);
exports.app.use('/api/v1/roles', roles_routes_1.rolesRoutes);
exports.app.use('/api/v1/modules', modules_routes_1.modulesRoutes);
// Global Error Handler
exports.app.use((err, req, res, next) => {
    logger_1.logger.error(err);
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
