import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/AppError';
import { modulesService } from '../modules/modules/modules.service';

/**
 * Module-level middleware. Blocks access to a module if it is disabled in the
 * module_registry, unless the user has the developer role.
 *
 * Usage:
 *   router.get('/...', authenticate, moduleGuard('pharmacy'), controller.someAction);
 */
export const moduleGuard = (moduleKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Developer bypasses all module checks
    if (user?.roles?.includes('developer')) {
      return next();
    }

    try {
      const enabled = await modulesService.isModuleEnabled(moduleKey);
      if (!enabled) {
        return next(new ForbiddenError(`Module "${moduleKey}" is currently disabled`));
      }
    } catch (error) {
      return next(error);
    }

    next();
  };
};
