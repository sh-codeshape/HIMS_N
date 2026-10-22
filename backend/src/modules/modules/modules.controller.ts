import { Request, Response, NextFunction } from 'express';
import { modulesService } from './modules.service';
import { sendSuccess } from '../../shared/utils/response';

export class ModulesController {
  getModules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const modules = await modulesService.getModules();
      sendSuccess(res, modules, 'Modules retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  toggleModule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moduleKey = req.params.moduleKey as string;
      const { enabled } = req.body;
      const userId = req.user?.userId as string | undefined;

      if (typeof enabled !== 'boolean') {
        return next(new (require('../../shared/errors/AppError').ValidationError)(
          'enabled must be a boolean'
        ));
      }

      const module = await modulesService.toggleModule(moduleKey, enabled, userId);
      sendSuccess(res, module, `Module "${moduleKey}" ${enabled ? 'enabled' : 'disabled'} successfully`, 200);
    } catch (error) {
      next(error);
    }
  };
}
