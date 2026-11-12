import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModulesService } from '../../src/modules/modules/modules.service';
import { db } from '../../src/config/database';

vi.mock('../../src/config/database', () => ({
  db: {
    query: vi.fn(),
  },
}));

describe('ModulesService - Hierarchical Submodule Inheritance', () => {
  let service: ModulesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ModulesService();
  });

  it('returns true when root module is enabled', async () => {
    (db.query as any).mockResolvedValueOnce({
      rows: [{ is_enabled: true }],
    });

    const result = await service.isModuleEnabled('billing');
    expect(result).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT is_enabled'),
      ['billing']
    );
  });

  it('returns false for submodule if parent root module is disabled', async () => {
    // Parent query returns disabled (false)
    (db.query as any).mockResolvedValueOnce({
      rows: [{ is_enabled: false }],
    });

    const result = await service.isModuleEnabled('billing.refunds');
    expect(result).toBe(false);
    // It should check parent 'billing' first
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT is_enabled FROM module_registry WHERE module_key = $1'),
      ['billing']
    );
  });

  it('returns submodule own state if parent root module is enabled', async () => {
    // Parent query returns enabled (true)
    (db.query as any).mockResolvedValueOnce({
      rows: [{ is_enabled: true }],
    });
    // Submodule query returns enabled (true)
    (db.query as any).mockResolvedValueOnce({
      rows: [{ is_enabled: true }],
    });

    const result = await service.isModuleEnabled('billing.refunds');
    expect(result).toBe(true);
  });

  it('returns false if parent is enabled but submodule is toggled off', async () => {
    // Parent query returns enabled (true)
    (db.query as any).mockResolvedValueOnce({
      rows: [{ is_enabled: true }],
    });
    // Submodule query returns disabled (false)
    (db.query as any).mockResolvedValueOnce({
      rows: [{ is_enabled: false }],
    });

    const result = await service.isModuleEnabled('billing.refunds');
    expect(result).toBe(false);
  });
});
