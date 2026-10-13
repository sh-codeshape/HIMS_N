import { describe, expect, it, vi } from 'vitest';
import { patientService } from './patient.service';
import { patientRepository } from './patient.repository';

vi.mock('./patient.repository', () => ({
  patientRepository: {
    searchPatients: vi.fn(),
  },
}));

describe('patientService.searchPatients', () => {
  it('uses a larger default page size so registration reports do not silently cap at 10 rows', async () => {
    vi.mocked(patientRepository.searchPatients).mockResolvedValue([{ id: 'patient-1' }] as any);

    const result = await patientService.searchPatients('org-1', { page: '1' } as any);

    expect(patientRepository.searchPatients).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        limit: 500,
        offset: 0,
      }),
    );
    expect(result.meta.limit).toBe(500);
  });
});
