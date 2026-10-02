import { db } from '../../config/database';
import { PoolClient } from 'pg';

export interface UserRecord {
  id: string;
  organization_id: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export class AuthRepository {
  async findByUsername(username: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, organization_id, username, password_hash, first_name, last_name, is_active
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
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
    }
  ): Promise<UserRecord> {
    const query = `
      INSERT INTO users (
        organization_id, username, password_hash, first_name, last_name, email, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, organization_id, username, password_hash, first_name, last_name, is_active
    `;
    const values = [
      data.organization_id,
      data.username,
      data.password_hash,
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
    ];
    const result = await client.query(query, values);
    return result.rows[0];
  }
}

export const authRepository = new AuthRepository();
