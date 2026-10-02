import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError } from '../shared/errors/AppError';

export const validate = (schema: { parseAsync: (data: unknown) => Promise<unknown> }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError('Validation error', error.issues));
      }
      return next(error);
    }
  };
};
