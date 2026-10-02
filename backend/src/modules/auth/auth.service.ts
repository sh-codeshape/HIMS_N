import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { LoginRequest, RegisterRequest } from './auth.schema';
import { UnauthorizedError, ConflictError } from '../../shared/errors/AppError';
import { db } from '../../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  async login(data: LoginRequest) {
    const user = await authRepository.findByUsername(data.username);
    
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid credentials or inactive user');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        organization_id: user.organization_id
      }
    };
  }

  async register(data: RegisterRequest) {
    const existing = await authRepository.findByUsername(data.username);
    if (existing) {
      throw new ConflictError('Username already exists');
    }

    const password_hash = await bcrypt.hash(data.password, 10);
    
    let newUser;
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      newUser = await authRepository.createUser(client, {
        ...data,
        password_hash
      });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return {
      id: newUser.id,
      username: newUser.username,
      first_name: newUser.first_name,
      last_name: newUser.last_name
    };
  }
}

export const authService = new AuthService();
