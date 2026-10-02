import { db } from '../../config/database';
import { PoolClient } from 'pg';

export interface UserRecord {
  id: string;
  organization_id: string;
  username: string;
  email?: string | null;
  password_hash: string;
  full_name: string;
  is_active: boolean;
  is_superadmin?: boolean;
  phone?: string | null;
}

export class AuthRepository {
  async findByUsername(username: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, organization_id, username, email, password_hash, full_name, is_active, is_superadmin
      FROM users
      WHERE username = $1
    `;
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  async createUser(
    client: PoolClient,
    data: {
      organization_id: string;
      username: string;
      password_hash: string;
      full_name: string;
      email?: string;
      phone?: string;
      is_superadmin?: boolean;
    }
  ): Promise<UserRecord> {
    const query = `
      INSERT INTO users (
        organization_id, username, password_hash, full_name, email, phone, is_superadmin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, organization_id, username, email, password_hash, full_name, is_active, is_superadmin
    `;
    const values = [
      data.organization_id,
      data.username,
      data.password_hash,
      data.full_name,
      data.email ?? null,
      data.phone ?? null,
      data.is_superadmin ?? false,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }
}

export const authRepository = new AuthRepository();
