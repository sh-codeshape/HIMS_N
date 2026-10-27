"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesController = void 0;
const modules_service_1 = require("./modules.service");
const response_1 = require("../../shared/utils/response");
class ModulesController {
    getModules = async (req, res, next) => {
        try {
            const modules = await modules_service_1.modulesService.getModules();
            (0, response_1.sendSuccess)(res, modules, 'Modules retrieved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    };
    toggleModule = async (req, res, next) => {
        try {
            const moduleKey = req.params.moduleKey;
            const { enabled } = req.body;
            const userId = req.user?.userId;
            if (typeof enabled !== 'boolean') {
                return next(new (require('../../shared/errors/AppError').ValidationError)('enabled must be a boolean'));
            }
            const module = await modules_service_1.modulesService.toggleModule(moduleKey, enabled, userId);
            (0, response_1.sendSuccess)(res, module, `Module "${moduleKey}" ${enabled ? 'enabled' : 'disabled'} successfully`, 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ModulesController = ModulesController;
