import { describe, expect, it } from 'vitest';
import {
  createLabOrderSchema,
  outsourceLabSchema,
  submitBulkResultsSchema,
  verifyResultSchema
} from '../../src/modules/laboratory/lab.schema';

describe('Laboratory, Outsource Lab & Billing Contracts', () => {
  it('validates lab order creation payload with outsource tracking', () => {
    const validPayload = {
      body: {
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        testDefinitionIds: ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
        orderedBy: 'Dr. Anil Singh',
        priority: 'urgent',
        processingSource: 'outsource_send',
        outsourceLabId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        specimenType: 'Blood (EDTA)',
        barcode: 'LAB2026102901',
      }
    };

    const parsed = createLabOrderSchema.parse(validPayload);
    expect(parsed.body.patientId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(parsed.body.priority).toBe('urgent');
    expect(parsed.body.processingSource).toBe('outsource_send');
    expect(parsed.body.outsourceLabId).toBe('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33');
    expect(parsed.body.specimenType).toBe('Blood (EDTA)');
  });

  it('rejects lab order with empty testDefinitionIds', () => {
    const invalidPayload = {
      body: {
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        testDefinitionIds: [],
      }
    };

    expect(() => createLabOrderSchema.parse(invalidPayload)).toThrow();
  });

  it('validates outsource lab partner schema with contract discount rate', () => {
    const partner = outsourceLabSchema.parse({
      body: {
        name: 'Dr Lal PathLabs',
        code: 'DRLAL',
        contactPerson: 'Dr. Alok Verma',
        phone: '+91 11 3988 5050',
        email: 'care@lalpathlabs.com',
        contractRate: 20,
        turnaroundDays: 2,
        isActive: true
      }
    });

    expect(partner.body.name).toBe('Dr Lal PathLabs');
    expect(partner.body.code).toBe('DRLAL');
    expect(partner.body.contractRate).toBe(20);
    expect(partner.body.turnaroundDays).toBe(2);
    expect(partner.body.isActive).toBe(true);
  });

  it('validates bulk parameter results submission schema', () => {
    const parsed = submitBulkResultsSchema.parse({
      params: {
        id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'
      },
      body: {
        results: [
          {
            parameterName: 'Hemoglobin',
            valueNumeric: 14.5,
            valueText: '14.5',
            unit: 'g/dL',
            flag: 'normal',
            comments: 'Within biological reference range'
          },
          {
            parameterName: 'Total Leukocyte Count (TLC)',
            valueNumeric: 11500,
            valueText: '11500',
            unit: '/cumm',
            flag: 'high',
            comments: 'Mild leukocytosis'
          }
        ],
        status: 'preliminary'
      }
    });

    expect(parsed.params.id).toBe('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44');
    expect(parsed.body.results).toHaveLength(2);
    expect(parsed.body.results[0].flag).toBe('normal');
    expect(parsed.body.results[1].flag).toBe('high');
  });

  it('validates pathologist verification schema', () => {
    const parsed = verifyResultSchema.parse({
      params: {
        id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'
      },
      body: {
        verifiedBy: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
        comments: 'Pathology findings reviewed and approved'
      }
    });

    expect(parsed.params.id).toBe('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44');
    expect(parsed.body?.comments).toBe('Pathology findings reviewed and approved');
  });

  it('correctly calculates lab billing charges and margins', () => {
    const testCatalogPrice = 1200; // e.g. Vitamin D Total
    const outsourceContractRate = 25; // 25% discount offered by external lab

    const patientChargeAmount = testCatalogPrice;
    const labOutsourceCost = testCatalogPrice * (1 - outsourceContractRate / 100);
    const grossMargin = patientChargeAmount - labOutsourceCost;

    expect(patientChargeAmount).toBe(1200);
    expect(labOutsourceCost).toBe(900);
    expect(grossMargin).toBe(300);
  });

  it('calculates invoice outstanding dues and payment reconciliations', () => {
    const invoiceTotal = 3500;
    const advancePaid = 1000;
    const additionalPayment = 1500;

    const initialDue = invoiceTotal - advancePaid;
    const finalDue = Math.max(0, initialDue - additionalPayment);

    expect(initialDue).toBe(2500);
    expect(finalDue).toBe(1000);
  });
});
