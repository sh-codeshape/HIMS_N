"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, messageOrStatus, statusCodeOverride) => {
    const status = typeof messageOrStatus === 'number' ? messageOrStatus : (statusCodeOverride ?? 200);
    const message = typeof messageOrStatus === 'string' ? messageOrStatus : undefined;
    res.status(status).json({
        success: true,
        ...(message ? { message } : {}),
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendPaginated = (res, data, meta, statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        data,
        meta,
    });
};
exports.sendPaginated = sendPaginated;
