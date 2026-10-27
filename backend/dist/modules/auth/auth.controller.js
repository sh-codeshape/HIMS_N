"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
class AuthController {
    async login(req, res) {
        const result = await auth_service_1.authService.login(req.body);
        (0, response_1.sendSuccess)(res, result);
    }
    async register(req, res) {
        const result = await auth_service_1.authService.register(req.body);
        (0, response_1.sendSuccess)(res, result, 201);
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
