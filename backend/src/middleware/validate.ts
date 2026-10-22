import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError } from '../shared/errors/AppError';

/* Strip empty-string / null query values so optional Zod fields (enums, UUIDs,
 * etc.) receive `undefined` instead of failing validation when the frontend
 * omits a filter. Express can also parse repeated params as arrays. */
const cleanQuery = (query: any): any => {
  if (query === null || query === undefined) return {};
  if (typeof query === 'string') {
    return query === '' ? undefined : query;
  }
  if (Array.isArray(query)) {
    const cleaned = query.filter(v => v !== '' && v !== null && v !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (typeof query === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(query)) {
      const cleanedValue = cleanQuery(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned; // always return an object (possibly empty)
  }
  return query;
};

export const validate = (schema: { parseAsync: (data: unknown) => Promise<unknown> }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: cleanQuery(req.query),
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
