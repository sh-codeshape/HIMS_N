import { db } from '../../config/database';
import { patientRepository } from './patient.repository';
import { CreatePatientRequest, SearchPatientQuery } from './patient.schema';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
import { buildUHID } from '../../shared/utils/uhid';

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  india: 'IN',
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  ireland: 'IE',
  canada: 'CA',
  australia: 'AU',
  germany: 'DE',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  nepal: 'NP',
  bangladesh: 'BD',
  sri: 'LK',
  'sri lanka': 'LK',
  pakistan: 'PK',
  afghanistan: 'AF',
  china: 'CN',
  japan: 'JP',
  singapore: 'SG',
  uae: 'AE',
  'united arab emirates': 'AE',
  saudi: 'SA',
  'saudi arabia': 'SA',
};

export const normalizeCountryCode = (value?: string): string | undefined => {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }

  const key = trimmed.toLowerCase();
  if (COUNTRY_NAME_TO_CODE[key]) {
    return COUNTRY_NAME_TO_CODE[key];
  }

  return undefined;
};

export const normalizeGender = (value?: string): string | undefined => {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  const mapping: Record<string, string> = {
    m: 'male',
    male: 'male',
    f: 'female',
    female: 'female',
    other: 'other',
    o: 'other',
    u: 'unknown',
    unknown: 'unknown',
    n: 'unknown',
  };

  return mapping[normalized] ?? normalized;
};

export const getPatientAge = (dateOfBirth?: string | Date | null): number | null => {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const diffMs = Date.now() - dob.getTime();
  if (diffMs < 0) return 0;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
};

export const deriveDateOfBirthFromAge = (age?: string | number | null): string | undefined => {
  if (age === undefined || age === null || age === '') return undefined;

  const parsedAge = Number(age);
  if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 120) {
    return undefined;
  }

  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - parsedAge);
  return dob.toISOString().split('T')[0];
};

export const normalizePatientRequest = <T extends {
  gender?: string;
  nationality?: string;
  country?: string;
  phone?: string;
  state?: string;
  city?: string;
  date_of_birth?: string;
  age?: string | number;
}>(data: T): T => {
  const normalizedGender = normalizeGender(data.gender) ?? 'unknown';
  const normalizedNationality = normalizeCountryCode(data.nationality) ?? 'IN';
  const normalizedCountry = normalizeCountryCode(data.country) ?? 'IN';
  const normalizedDob = data.date_of_birth || deriveDateOfBirthFromAge(data.age);

  return {
    ...data,
    gender: normalizedGender,
    nationality: normalizedNationality,
    country: normalizedCountry,
    phone: data.phone?.trim() ?? data.phone,
    state: data.state?.trim() || undefined,
    city: data.city?.trim() || undefined,
    date_of_birth: normalizedDob,
    age: data.age ?? (normalizedDob ? String(getPatientAge(normalizedDob) ?? '') : undefined),
  } as T;
};

export class PatientService {
  private async generateUHID(organizationId: string): Promise<string> {
    const date = new Date();
    const month = date.getMonth() + 1;
    const yearSuffix = date.getFullYear() % 100;
    const mmyy = `${String(month).padStart(2, '0')}${String(yearSuffix).padStart(2, '0')}`;
    const nextSerial = await patientRepository.getNextUHIDSerial();
    return buildUHID(date, nextSerial);
  }

  async createPatient(organizationId: string, data: CreatePatientRequest) {
    const normalizedData = normalizePatientRequest(data);

    // Identity verification (phone + name deduplication)
    const exists = await patientRepository.checkPhoneNameExists(
      organizationId, 
      normalizedData.phone ?? '', 
      normalizedData.first_name,
      normalizedData.last_name ?? ''
    );

    if (exists) {
      throw new ConflictError('A patient with this name and phone number already exists.');
    }

    const uhid = await this.generateUHID(organizationId);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const newPatient = await patientRepository.createPatient(client, {
        organization_id: organizationId,
        uhid,
        first_name: normalizedData.first_name,
        middle_name: normalizedData.middle_name,
        last_name: normalizedData.last_name,
        gender: normalizeGender(normalizedData.gender) ?? 'unknown',
        date_of_birth: normalizedData.date_of_birth,
        phone: normalizedData.phone ?? '',
        email: normalizedData.email,
        blood_group: normalizedData.blood_group,
        marital_status: normalizedData.marital_status,
        occupation: normalizedData.occupation,
        nationality: normalizeCountryCode(normalizedData.nationality) ?? 'IN',
        alternate_phone: normalizedData.alternate_phone,
        family_head_id: data.family_head_id,
        relation_to_head: data.relation_to_head
      });

      const patientAge = getPatientAge(newPatient.date_of_birth);
      const patientName = newPatient.full_name || [newPatient.first_name, newPatient.middle_name, newPatient.last_name].filter(Boolean).join(' ').trim();

      if (normalizedData.address_line1 || normalizedData.city || normalizedData.state) {
        await patientRepository.createPatientAddress(client, newPatient.id, {
          address_line1: normalizedData.address_line1,
          city: normalizedData.city,
          state: normalizedData.state,
          postal_code: normalizedData.postal_code,
          country: normalizeCountryCode(normalizedData.country) ?? 'IN'
        });
      }

      if (data.aadhaar_number) {
        await patientRepository.createPatientIdentifier(client, organizationId, newPatient.id, 'aadhaar_token', data.aadhaar_number);
      }
      
      if (data.pan_number) {
        await patientRepository.createPatientIdentifier(client, organizationId, newPatient.id, 'pan', data.pan_number);
      }

      if (data.emergency_name) {
        await patientRepository.createPatientContact(client, newPatient.id, data.emergency_name, data.emergency_relation, data.emergency_phone);
      }

      await client.query('COMMIT');
      return {
        ...newPatient,
        age: patientAge,
        full_name: patientName,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async searchPatients(organizationId: string, query: SearchPatientQuery) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const offset = (page - 1) * limit;

    const data = await patientRepository.searchPatients(organizationId, {
      query: query.query,
      phone: query.phone,
      uhid: query.uhid,
      limit,
      offset,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total: data.length // Note: real total count would require a second query
      }
    };
  }

  async getPatient(id: string, organizationId: string) {
    const patient = await patientRepository.getPatientById(id, organizationId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  }

  async getFamilyMembers(familyHeadId: string, organizationId: string) {
    return await patientRepository.getFamilyMembers(familyHeadId, organizationId);
  }
}

export const patientService = new PatientService();
