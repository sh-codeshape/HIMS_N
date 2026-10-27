"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleGuard = void 0;
const AppError_1 = require("../shared/errors/AppError");
const modules_service_1 = require("../modules/modules/modules.service");
/**
 * Module-level middleware. Blocks access to a module if it is disabled in the
 * module_registry, unless the user has the developer role.
 *
 * Usage:
 *   router.get('/...', authenticate, moduleGuard('pharmacy'), controller.someAction);
 */
const moduleGuard = (moduleKey) => {
    return async (req, res, next) => {
        const user = req.user;
        // Developer bypasses all module checks
        if (user?.roles?.includes('developer')) {
            return next();
        }
        try {
            const enabled = await modules_service_1.modulesService.isModuleEnabled(moduleKey);
            if (!enabled) {
                return next(new AppError_1.ForbiddenError(`Module "${moduleKey}" is currently disabled`));
            }
        }
        catch (error) {
            return next(error);
        }
        next();
    };
};
exports.moduleGuard = moduleGuard;
