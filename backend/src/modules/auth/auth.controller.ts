import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response';

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    sendSuccess(res, result);
  }

  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
  }
}

export const authController = new AuthController();
