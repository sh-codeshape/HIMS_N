import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);

export default router;
