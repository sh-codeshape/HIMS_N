import { describe, it, expect, vi } from 'vitest';
import { AuthRepository } from '../../src/modules/auth/auth.repository';
import { db } from '../../src/config/database';

describe('auth user contract', () => {
  it('uses the database schema contract for users: full_name instead of first_name/last_name', async () => {
    const repo = new AuthRepository();
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({
      rows: [{
        id: 'user-1',
        organization_id: 'org-1',
        username: 'admin@narayanhospital.com',
        password_hash: 'hash',
        full_name: 'HIMS Admin',
        is_active: true,
      }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: [],
    } as any);

    const result = await repo.findByUsername('admin@narayanhospital.com');

    expect(result?.full_name).toBe('HIMS Admin');
    expect(querySpy.mock.calls[0][0]).toContain('full_name');
    expect(querySpy.mock.calls[0][0]).not.toContain('first_name');
    expect(querySpy.mock.calls[0][0]).not.toContain('last_name');
  });
});
