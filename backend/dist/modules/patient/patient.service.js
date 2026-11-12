"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientService = exports.PatientService = exports.normalizePatientRequest = exports.deriveDateOfBirthFromAge = exports.getPatientAge = exports.normalizeBloodGroup = exports.normalizeGender = exports.normalizeCountryCode = void 0;
const database_1 = require("../../config/database");
const patient_repository_1 = require("./patient.repository");
const AppError_1 = require("../../shared/errors/AppError");
const uhid_1 = require("../../shared/utils/uhid");
const COUNTRY_NAME_TO_CODE = {
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
const normalizeCountryCode = (value) => {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
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
exports.normalizeCountryCode = normalizeCountryCode;
const normalizeGender = (value) => {
    if (!value)
        return undefined;
    const normalized = value.trim().toLowerCase();
    const mapping = {
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
exports.normalizeGender = normalizeGender;
const normalizeBloodGroup = (value) => {
    if (!value)
        return undefined;
    const normalized = value.trim().toUpperCase().replace(/\s+/g, '');
    const allowed = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
    return allowed.has(normalized) ? normalized : undefined;
};
exports.normalizeBloodGroup = normalizeBloodGroup;
const getPatientAge = (dateOfBirth) => {
    if (!dateOfBirth)
        return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()))
        return null;
    const diffMs = Date.now() - dob.getTime();
    if (diffMs < 0)
        return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
};
exports.getPatientAge = getPatientAge;
const deriveDateOfBirthFromAge = (age) => {
    if (age === undefined || age === null || age === '')
        return undefined;
    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 120) {
        return undefined;
    }
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - parsedAge);
    return dob.toISOString().split('T')[0];
};
exports.deriveDateOfBirthFromAge = deriveDateOfBirthFromAge;
const normalizePatientRequest = (data) => {
    const normalizedGender = (0, exports.normalizeGender)(data.gender) ?? 'unknown';
    const normalizedNationality = (0, exports.normalizeCountryCode)(data.nationality) ?? 'IN';
    const normalizedCountry = (0, exports.normalizeCountryCode)(data.country) ?? 'IN';
    const normalizedDob = data.date_of_birth || (0, exports.deriveDateOfBirthFromAge)(data.age);
    const normalizedAadhaar = data.aadhaar_number ? data.aadhaar_number.replace(/\s+/g, '').trim() || undefined : undefined;
    const normalizedPan = data.pan_number ? data.pan_number.trim().toUpperCase() || undefined : undefined;
    return {
        ...data,
        gender: normalizedGender,
        nationality: normalizedNationality,
        country: normalizedCountry,
        phone: data.phone?.trim() ?? data.phone,
        state: data.state?.trim() || undefined,
        city: data.city?.trim() || undefined,
        blood_group: (0, exports.normalizeBloodGroup)(data.blood_group),
        date_of_birth: normalizedDob,
        age: data.age ?? (normalizedDob ? String((0, exports.getPatientAge)(normalizedDob) ?? '') : undefined),
        aadhaar_number: normalizedAadhaar,
        pan_number: normalizedPan,
    };
};
exports.normalizePatientRequest = normalizePatientRequest;
class PatientService {
    async generateUHID(organizationId) {
        const date = new Date();
        const month = date.getMonth() + 1;
        const yearSuffix = date.getFullYear() % 100;
        const mmyy = `${String(month).padStart(2, '0')}${String(yearSuffix).padStart(2, '0')}`;
        const nextSerial = await patient_repository_1.patientRepository.getNextUHIDSerial();
        return (0, uhid_1.buildUHID)(date, nextSerial);
    }
    async createPatient(organizationId, data) {
        const normalizedData = (0, exports.normalizePatientRequest)(data);
        // Identity verification (phone + name deduplication)
        const existingPatient = normalizedData.phone && normalizedData.phone.trim()
            ? (patient_repository_1.patientRepository.findPatientByPhoneAndName
                ? await patient_repository_1.patientRepository.findPatientByPhoneAndName(organizationId, normalizedData.phone.trim(), normalizedData.first_name, normalizedData.last_name ?? '')
                : (await patient_repository_1.patientRepository.checkPhoneNameExists(organizationId, normalizedData.phone.trim(), normalizedData.first_name, normalizedData.last_name ?? '') ? { id: '', uhid: '', first_name: normalizedData.first_name, last_name: normalizedData.last_name ?? '', full_name: '' } : null))
            : null;
        if (existingPatient) {
            const uhidPart = existingPatient.uhid ? ` (UHID: ${existingPatient.uhid})` : '';
            throw new AppError_1.ConflictError(`A patient with this name and phone number already exists${uhidPart}.`, {
                existing_patient: {
                    id: existingPatient.id,
                    uhid: existingPatient.uhid,
                    name: existingPatient.full_name || [existingPatient.first_name, existingPatient.last_name].filter(Boolean).join(' ').trim()
                }
            });
        }
        // Identity verification (Aadhaar & PAN deduplication)
        if (normalizedData.aadhaar_number) {
            const existingByIdentifier = patient_repository_1.patientRepository.findPatientByIdentifier
                ? await patient_repository_1.patientRepository.findPatientByIdentifier(organizationId, 'aadhaar_token', normalizedData.aadhaar_number)
                : null;
            if (existingByIdentifier) {
                const uhidPart = existingByIdentifier.uhid ? ` (UHID: ${existingByIdentifier.uhid})` : '';
                const patientName = existingByIdentifier.full_name || [existingByIdentifier.first_name, existingByIdentifier.last_name].filter(Boolean).join(' ').trim();
                throw new AppError_1.ConflictError(`A patient with this Aadhaar number already exists${uhidPart}${patientName ? ` - ${patientName}` : ''}.`, {
                    field: 'aadhaar',
                    existing_patient: {
                        id: existingByIdentifier.id,
                        uhid: existingByIdentifier.uhid,
                        name: patientName,
                    }
                });
            }
        }
        if (normalizedData.pan_number) {
            const existingByPan = patient_repository_1.patientRepository.findPatientByIdentifier
                ? await patient_repository_1.patientRepository.findPatientByIdentifier(organizationId, 'pan', normalizedData.pan_number)
                : null;
            if (existingByPan) {
                const uhidPart = existingByPan.uhid ? ` (UHID: ${existingByPan.uhid})` : '';
                const patientName = existingByPan.full_name || [existingByPan.first_name, existingByPan.last_name].filter(Boolean).join(' ').trim();
                throw new AppError_1.ConflictError(`A patient with this PAN number already exists${uhidPart}${patientName ? ` - ${patientName}` : ''}.`, {
                    field: 'pan',
                    existing_patient: {
                        id: existingByPan.id,
                        uhid: existingByPan.uhid,
                        name: patientName,
                    }
                });
            }
        }
        const uhid = await this.generateUHID(organizationId);
        const client = await database_1.db.getClient();
        try {
            await client.query('BEGIN');
            let registeredFacilityId = null;
            if (data.facility_id) {
                try {
                    const facCheck = await client.query('SELECT id FROM facilities WHERE id = $1 LIMIT 1', [data.facility_id]);
                    if (facCheck.rows.length > 0) {
                        registeredFacilityId = data.facility_id;
                    }
                }
                catch {
                    registeredFacilityId = null;
                }
            }
            const customFields = {
                visit_type: data.visit_type,
                department: data.department,
                doctor: data.doctor || data.referred_by,
                referred_by: data.referred_by || data.doctor,
                payment_type: data.payment_type,
                health_insurance: data.health_insurance,
                insurance_provider: data.insurance_provider,
                insurance_number: data.insurance_number,
                aadhaar_number: normalizedData.aadhaar_number,
                aadhaar: normalizedData.aadhaar_number,
                pan_number: normalizedData.pan_number,
                pan: normalizedData.pan_number,
                emergency_name: data.emergency_name,
                guardian_name: data.emergency_name,
                emergency_phone: data.emergency_phone,
                emergency_contact: data.emergency_phone,
                emergency_relation: data.emergency_relation,
                ...(data.custom_fields || {}),
            };
            Object.keys(customFields).forEach((key) => {
                if (customFields[key] === undefined) {
                    delete customFields[key];
                }
            });
            const newPatient = await patient_repository_1.patientRepository.createPatient(client, {
                organization_id: organizationId,
                registered_facility_id: registeredFacilityId,
                uhid,
                first_name: normalizedData.first_name,
                middle_name: normalizedData.middle_name,
                last_name: normalizedData.last_name,
                gender: (0, exports.normalizeGender)(normalizedData.gender) ?? 'unknown',
                date_of_birth: normalizedData.date_of_birth,
                phone: normalizedData.phone ?? '',
                email: normalizedData.email,
                blood_group: normalizedData.blood_group,
                marital_status: normalizedData.marital_status,
                occupation: normalizedData.occupation,
                nationality: (0, exports.normalizeCountryCode)(normalizedData.nationality) ?? 'IN',
                alternate_phone: normalizedData.alternate_phone,
                family_head_id: data.family_head_id,
                relation_to_head: data.relation_to_head,
                custom_fields: customFields
            });
            const patientAge = (0, exports.getPatientAge)(newPatient.date_of_birth);
            const patientName = newPatient.full_name || [newPatient.first_name, newPatient.middle_name, newPatient.last_name].filter(Boolean).join(' ').trim();
            const addresses = [];
            if (normalizedData.address_line1 || normalizedData.city || normalizedData.state) {
                const addressData = {
                    address_line1: normalizedData.address_line1,
                    city: normalizedData.city,
                    state: normalizedData.state,
                    postal_code: normalizedData.postal_code,
                    country: (0, exports.normalizeCountryCode)(normalizedData.country) ?? 'IN'
                };
                await patient_repository_1.patientRepository.createPatientAddress(client, newPatient.id, addressData);
                addresses.push({
                    line1: addressData.address_line1,
                    city: addressData.city,
                    state: addressData.state,
                    postal_code: addressData.postal_code,
                    country: addressData.country,
                    is_primary: true,
                    address_type: 'home'
                });
            }
            const identifiers = [];
            if (normalizedData.aadhaar_number) {
                await patient_repository_1.patientRepository.createPatientIdentifier(client, organizationId, newPatient.id, 'aadhaar_token', normalizedData.aadhaar_number);
                identifiers.push({
                    id_type: 'aadhaar_token',
                    id_value: normalizedData.aadhaar_number,
                });
            }
            if (normalizedData.pan_number) {
                await patient_repository_1.patientRepository.createPatientIdentifier(client, organizationId, newPatient.id, 'pan', normalizedData.pan_number);
                identifiers.push({
                    id_type: 'pan',
                    id_value: normalizedData.pan_number,
                });
            }
            const contacts = [];
            if (data.emergency_name) {
                await patient_repository_1.patientRepository.createPatientContact(client, newPatient.id, data.emergency_name, data.emergency_relation, data.emergency_phone);
                contacts.push({
                    name: data.emergency_name,
                    relationship: data.emergency_relation || null,
                    phone: data.emergency_phone || null,
                    is_emergency_contact: true,
                });
            }
            await client.query('COMMIT');
            return {
                ...newPatient,
                registered_facility_id: newPatient.registered_facility_id ?? registeredFacilityId ?? null,
                age: patientAge,
                full_name: patientName,
                aadhaar_number: normalizedData.aadhaar_number ?? null,
                pan_number: normalizedData.pan_number ?? null,
                emergency_name: data.emergency_name ?? null,
                emergency_phone: data.emergency_phone ?? null,
                emergency_relation: data.emergency_relation ?? null,
                doctor: data.doctor || data.referred_by || null,
                health_insurance: data.health_insurance ?? null,
                insurance_provider: data.insurance_provider ?? null,
                insurance_number: data.insurance_number ?? null,
                addresses: addresses.length > 0 ? addresses : null,
                identifiers: identifiers.length > 0 ? identifiers : null,
                contacts: contacts.length > 0 ? contacts : null,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error?.code === '23505' && error?.constraint === 'patient_identifiers_organization_id_id_type_id_value_key') {
                throw new AppError_1.ConflictError('A patient with this government identifier (Aadhaar or PAN) is already registered in the system.');
            }
            throw error;
        }
        finally {
            client.release();
        }
    }
    async searchPatients(organizationId, query) {
        const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
        const requestedLimit = parseInt(query.limit || '500', 10) || 500;
        const limit = Math.min(Math.max(requestedLimit, 1), 500);
        const offset = (page - 1) * limit;
        const data = await patient_repository_1.patientRepository.searchPatients(organizationId, {
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
                total: data.length,
            }
        };
    }
    async getPatient(id, organizationId) {
        const patient = await patient_repository_1.patientRepository.getPatientById(id, organizationId);
        if (!patient) {
            throw new AppError_1.NotFoundError('Patient not found');
        }
        return patient;
    }
    async getFamilyMembers(familyHeadId, organizationId) {
        return await patient_repository_1.patientRepository.getFamilyMembers(familyHeadId, organizationId);
    }
    async updatePatient(id, organizationId, data) {
        let updateData = { ...data };
        const ageValue = updateData.age;
        const addressData = {
            address_line1: updateData.address_line1 ?? updateData.address,
            city: updateData.city,
            state: updateData.state,
            postal_code: updateData.postal_code ?? updateData.pincode,
            country: updateData.country,
        };
        const aadhaarVal = updateData.aadhaar_number ?? updateData.aadhaar;
        const panVal = updateData.pan_number ?? updateData.pan;
        const emgName = updateData.emergency_name ?? updateData.guardian_name;
        const emgPhone = updateData.emergency_phone ?? updateData.emergency_contact;
        const emgRelation = updateData.emergency_relation;
        const doctorVal = updateData.doctor ?? updateData.referred_by;
        const deptVal = updateData.department;
        const visitTypeVal = updateData.visit_type ?? updateData.category;
        const paymentTypeVal = updateData.payment_type ?? updateData.paymentMode;
        const insuranceVal = updateData.health_insurance;
        const providerVal = updateData.insurance_provider;
        const policyNumVal = updateData.insurance_number;
        delete updateData.age;
        delete updateData.address;
        delete updateData.address_line1;
        delete updateData.city;
        delete updateData.state;
        delete updateData.postal_code;
        delete updateData.pincode;
        delete updateData.country;
        delete updateData.aadhaar;
        delete updateData.aadhaar_number;
        delete updateData.pan;
        delete updateData.pan_number;
        delete updateData.emergency_name;
        delete updateData.guardian_name;
        delete updateData.emergency_phone;
        delete updateData.emergency_contact;
        delete updateData.emergency_relation;
        delete updateData.doctor;
        delete updateData.referred_by;
        delete updateData.department;
        delete updateData.visit_type;
        delete updateData.category;
        delete updateData.payment_type;
        delete updateData.paymentMode;
        delete updateData.health_insurance;
        delete updateData.insurance_provider;
        delete updateData.insurance_number;
        const hasCustomFieldInputs = [
            aadhaarVal, panVal, emgName, emgPhone, emgRelation, doctorVal,
            deptVal, visitTypeVal, paymentTypeVal, insuranceVal, providerVal, policyNumVal
        ].some(v => v !== undefined);
        if (hasCustomFieldInputs || updateData.custom_fields) {
            const existingCustom = (typeof updateData.custom_fields === 'object' && updateData.custom_fields) ? updateData.custom_fields : {};
            updateData.custom_fields = {
                ...existingCustom,
                ...(aadhaarVal !== undefined ? { aadhaar_number: aadhaarVal, aadhaar: aadhaarVal } : {}),
                ...(panVal !== undefined ? { pan_number: panVal, pan: panVal } : {}),
                ...(emgName !== undefined ? { emergency_name: emgName, guardian_name: emgName } : {}),
                ...(emgPhone !== undefined ? { emergency_phone: emgPhone, emergency_contact: emgPhone } : {}),
                ...(emgRelation !== undefined ? { emergency_relation: emgRelation } : {}),
                ...(doctorVal !== undefined ? { doctor: doctorVal, referred_by: doctorVal } : {}),
                ...(deptVal !== undefined ? { department: deptVal } : {}),
                ...(visitTypeVal !== undefined ? { visit_type: visitTypeVal } : {}),
                ...(paymentTypeVal !== undefined ? { payment_type: paymentTypeVal } : {}),
                ...(insuranceVal !== undefined ? { health_insurance: insuranceVal } : {}),
                ...(providerVal !== undefined ? { insurance_provider: providerVal } : {}),
                ...(policyNumVal !== undefined ? { insurance_number: policyNumVal } : {}),
            };
        }
        if (updateData.blood_group !== undefined) {
            const bloodGroup = (0, exports.normalizeBloodGroup)(updateData.blood_group);
            if (bloodGroup) {
                updateData.blood_group = bloodGroup;
            }
            else {
                delete updateData.blood_group;
            }
        }
        if (updateData.gender)
            updateData.gender = (0, exports.normalizeGender)(updateData.gender);
        if (updateData.nationality)
            updateData.nationality = (0, exports.normalizeCountryCode)(updateData.nationality);
        if (!updateData.date_of_birth && ageValue !== undefined) {
            const derivedDob = (0, exports.deriveDateOfBirthFromAge)(ageValue);
            if (derivedDob) {
                updateData.date_of_birth = derivedDob;
            }
        }
        const patient = await patient_repository_1.patientRepository.updatePatient(id, organizationId, updateData);
        if (!patient) {
            throw new AppError_1.NotFoundError('Patient not found');
        }
        const hasAddressUpdate = Object.values(addressData).some((value) => value !== undefined && value !== null && String(value).trim() !== '');
        if (hasAddressUpdate) {
            await patient_repository_1.patientRepository.updatePatientAddress(id, addressData);
        }
        if (aadhaarVal && patient_repository_1.patientRepository.upsertPatientIdentifier) {
            await patient_repository_1.patientRepository.upsertPatientIdentifier(id, organizationId, 'aadhaar_token', aadhaarVal);
        }
        if (panVal && patient_repository_1.patientRepository.upsertPatientIdentifier) {
            await patient_repository_1.patientRepository.upsertPatientIdentifier(id, organizationId, 'pan', panVal);
        }
        if ((emgName || emgPhone) && patient_repository_1.patientRepository.upsertPatientContact) {
            await patient_repository_1.patientRepository.upsertPatientContact(id, emgName, emgRelation, emgPhone);
        }
        return patient;
    }
    async deletePatient(id, organizationId) {
        const success = await patient_repository_1.patientRepository.deletePatient(id, organizationId);
        if (!success) {
            throw new AppError_1.NotFoundError('Patient not found');
        }
        return { message: 'Patient deleted successfully' };
    }
}
exports.PatientService = PatientService;
exports.patientService = new PatientService();
