"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../shared/errors/AppError");
/* Strip empty-string / null query values so optional Zod fields (enums, UUIDs,
 * etc.) receive `undefined` instead of failing validation when the frontend
 * omits a filter. Express can also parse repeated params as arrays. */
const cleanQuery = (query) => {
    if (query === null || query === undefined)
        return {};
    if (typeof query === 'string') {
        return query === '' ? undefined : query;
    }
    if (Array.isArray(query)) {
        const cleaned = query.filter(v => v !== '' && v !== null && v !== undefined);
        return cleaned.length > 0 ? cleaned : undefined;
    }
    if (typeof query === 'object') {
        const cleaned = {};
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
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: cleanQuery(req.query),
                params: req.params,
            });
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return next(new AppError_1.ValidationError('Validation error', error.issues));
            }
            return next(error);
        }
    };
};
exports.validate = validate;
