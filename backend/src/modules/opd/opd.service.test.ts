import { describe, expect, it, vi } from 'vitest';
import { normalizeReportQuery } from './opd.service';
import { OpdRepository } from './opd.repository';
import { db } from '../../config/database';

vi.mock('../../config/database', () => ({
  db: {
    query: vi.fn(),
  },
}));

describe('normalizeReportQuery', () => {
  it('clamps invalid pagination values and normalizes the date range', () => {
    const result = normalizeReportQuery({
      page: 0,
      limit: 9999,
      from: '2026-10-12',
      to: '2026-10-05',
      sortBy: 'started_at',
      sortOrder: 'ASC',
    });

    expect(result).toEqual({
      page: 1,
      limit: 500,
      from: '2026-10-05',
      to: '2026-10-12',
      sortBy: 'started_at',
      sortOrder: 'ASC',
    });
  });

  it('keeps valid page and limit values while defaulting sort order', () => {
    const result = normalizeReportQuery({
      page: 2,
      limit: 50,
      from: '2026-10-01',
      to: '2026-10-31',
    });

    expect(result).toEqual({
      page: 2,
      limit: 50,
      from: '2026-10-01',
      to: '2026-10-31',
      sortBy: 'started_at',
      sortOrder: 'DESC',
    });
  });

  it('leaves the date range empty when no range is provided so the query can load all records', async () => {
    const repo = new OpdRepository();
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ total: '12' }] } as any);
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any);

    await repo.getReports('facility-1', '', '', undefined, undefined, 1, 50);

    const queryText = vi.mocked(db.query).mock.calls[0][0];
    expect(queryText).not.toContain('CURRENT_DATE');
    expect(queryText).not.toContain('DATE(e.started_at) >=');
    expect(queryText).not.toContain('DATE(e.started_at) <=');
  });
});
