import { describe, expect, it, vi } from 'vitest';
import { patientService } from './patient.service';
import { patientRepository } from './patient.repository';
import { updatePatientSchema } from './patient.schema';

vi.mock('./patient.repository', () => ({
  patientRepository: {
    searchPatients: vi.fn(),
    updatePatient: vi.fn(),
    updatePatientAddress: vi.fn(),
    findPatientByPhoneAndName: vi.fn(),
    checkPhoneNameExists: vi.fn(),
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

  it('accepts title-case gender values from the edit patient form payloads', () => {
    const payload = {
      params: { id: '7d66d989-6d9a-4f7a-9a15-6f9285c0f5d2' },
      body: {
        first_name: 'Test',
        last_name: 'Patient',
        gender: 'Male',
        phone: '9876543210',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        country: 'India',
        address: 'Main Road',
      },
    };

    expect(() => updatePatientSchema.parse(payload)).not.toThrow();
    expect(updatePatientSchema.parse(payload).body.gender).toBe('male');
  });

  it('drops the non-existent age column and derives date_of_birth before updating a patient', async () => {
    vi.mocked(patientRepository.updatePatient).mockResolvedValue({ id: 'patient-1' } as any);

    await patientService.updatePatient('patient-1', 'org-1', { age: 30, gender: 'Male' } as any);

    expect(patientRepository.updatePatient).toHaveBeenCalledWith(
      'patient-1',
      'org-1',
      expect.objectContaining({
        gender: 'male',
        date_of_birth: expect.any(String),
      }),
    );
    expect((patientRepository.updatePatient as any).mock.calls[0][2]).not.toHaveProperty('age');
  });

  it('keeps address fields out of the patients table and updates the patient address record instead', async () => {
    vi.mocked(patientRepository.updatePatient).mockResolvedValue({ id: 'patient-1' } as any);
    vi.mocked(patientRepository.updatePatientAddress).mockResolvedValue({ id: 'addr-1' } as any);

    await patientService.updatePatient('patient-1', 'org-1', {
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      address_line1: 'Jansa',
      postal_code: '221405',
    } as any);

    expect(patientRepository.updatePatient).toHaveBeenCalledWith(
      'patient-1',
      'org-1',
      expect.not.objectContaining({
        city: expect.anything(),
        state: expect.anything(),
        country: expect.anything(),
        address_line1: expect.anything(),
      }),
    );
    expect(patientRepository.updatePatientAddress).toHaveBeenCalledWith('patient-1', expect.objectContaining({
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      address_line1: 'Jansa',
      postal_code: '221405',
    }));
  });

  it('drops blank or invalid blood groups before updating patients', async () => {
    vi.mocked(patientRepository.updatePatient).mockResolvedValue({ id: 'patient-1' } as any);

    await patientService.updatePatient('patient-1', 'org-1', {
      blood_group: '',
      gender: 'Male',
    } as any);

    expect(patientRepository.updatePatient).toHaveBeenCalledWith(
      'patient-1',
      'org-1',
      expect.objectContaining({
        gender: 'male',
      }),
    );
    expect((patientRepository.updatePatient as any).mock.calls.at(-1)[2]).not.toHaveProperty('blood_group');
  });
});

describe('patientService.createPatient duplicate verification', () => {
  it('throws ConflictError with existing patient UHID and details when phone and name match', async () => {
    vi.mocked(patientRepository.findPatientByPhoneAndName).mockResolvedValue({
      id: 'existing-id-123',
      uhid: '1026-0001',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      phone: '9876543210',
    } as any);

    await expect(
      patientService.createPatient('org-1', {
        facility_id: '00000000-0000-0000-0000-000000000000',
        first_name: 'John',
        last_name: 'Doe',
        phone: '9876543210',
        gender: 'male',
      } as any)
    ).rejects.toThrow('A patient with this name and phone number already exists (UHID: 1026-0001).');
  });

  it('falls back to checkPhoneNameExists if findPatientByPhoneAndName is unavailable', async () => {
    const originalFind = patientRepository.findPatientByPhoneAndName;
    (patientRepository as any).findPatientByPhoneAndName = undefined;
    vi.mocked(patientRepository.checkPhoneNameExists).mockResolvedValue(true);

    try {
      await expect(
        patientService.createPatient('org-1', {
          facility_id: '00000000-0000-0000-0000-000000000000',
          first_name: 'Alice',
          last_name: 'Smith',
          phone: '9123456789',
          gender: 'female',
        } as any)
      ).rejects.toThrow('A patient with this name and phone number already exists.');
    } finally {
      (patientRepository as any).findPatientByPhoneAndName = originalFind;
    }
  });
});
