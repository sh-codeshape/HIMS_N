"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const logger_1 = require("./config/logger");
const PORT = process.env.PORT || 3000;
const server = app_1.app.listen(PORT, () => {
    logger_1.logger.info(`Server listening on port ${PORT}`);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
});
