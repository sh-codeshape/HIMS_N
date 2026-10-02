import crypto from 'crypto';
import { db } from '../../config/database';
import { patientRepository } from './patient.repository';
import { CreatePatientRequest, SearchPatientQuery } from './patient.schema';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';

export class PatientService {
  private generateUHID(): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    // 6 random uppercase hex characters (e.g. A4F8B2)
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${mm}${yy}-${randomHex}`;
  }

  async createPatient(organizationId: string, data: CreatePatientRequest) {
    // Identity verification (phone + name deduplication)
    const exists = await patientRepository.checkPhoneNameExists(
      organizationId, 
      data.phone, 
      data.first_name, 
      data.last_name
    );

    if (exists) {
      throw new ConflictError('A patient with this name and phone number already exists.');
    }

    const uhid = this.generateUHID();

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const newPatient = await patientRepository.createPatient(client, {
        organization_id: organizationId,
        uhid,
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        phone: data.phone,
        email: data.email,
        blood_group: data.blood_group,
      });

      if (data.address_line1 || data.city || data.state) {
        await patientRepository.createPatientAddress(client, newPatient.id, {
          address_line1: data.address_line1,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
        });
      }

      await client.query('COMMIT');
      return newPatient;
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
}

export const patientService = new PatientService();
