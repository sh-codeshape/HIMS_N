import { describe, expect, it, vi } from 'vitest';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { BillingController } from './billing.controller';

vi.mock('./billing.repository', () => {
  return {
    BillingRepository: vi.fn().mockImplementation(function (this: any) {
      this.getReportsAnalytics = vi.fn();
    }),
  };
});

describe('Billing Analytics Service & Controller', () => {
  const mockAnalyticsData = {
    kpis: {
      totalInvoiced: 50000,
      totalRevenue: 35000,
      outstandingDues: 15000,
      todayCollections: 8000,
      totalInvoices: 20,
      pendingInvoicesCount: 6,
      collectionEfficiency: 70.0,
    },
    revenueTrends: [
      { date: '2026-10-25', invoiced: 10000, collected: 8000, dues: 2000, invoiceCount: 3, paymentCount: 2 },
      { date: '2026-10-26', invoiced: 15000, collected: 12000, dues: 3000, invoiceCount: 5, paymentCount: 4 },
    ],
    departmentRevenue: [
      { id: 'dept-1', name: 'Pathology & Laboratory', code: 'LAB', type: 'diagnostic', chargeCount: 25, totalRevenue: 15000, billedAmount: 12000, unbilledDues: 3000 },
      { id: 'dept-2', name: 'Cardiology', code: 'CARD', type: 'clinical', chargeCount: 10, totalRevenue: 25000, billedAmount: 20000, unbilledDues: 5000 },
    ],
    doctorRevenue: [
      { practitionerId: 'doc-1', doctorName: 'Dr. Anand Prakash Tiwari', specialty: 'General Surgery', encounterCount: 15, totalRevenue: 22000, consultationRevenue: 9000, procedureRevenue: 13000 },
      { practitionerId: 'doc-2', doctorName: 'Dr. Sadhana Chaurasiya', specialty: 'General Medicine', encounterCount: 20, totalRevenue: 18000, consultationRevenue: 12000, procedureRevenue: 6000 },
    ],
    pathologyAnalytics: {
      totalRevenue: 15000,
      billedAmount: 12000,
      unbilledDues: 3000,
      totalTests: 45,
      topTests: [
        { name: 'Complete Blood Count (CBC)', category: 'Hematology', volume: 20, unitPrice: 350, revenue: 7000 },
        { name: 'Kidney Function Test (KFT)', category: 'Biochemistry', volume: 15, unitPrice: 650, revenue: 9750 },
      ],
    },
    paymentModes: [
      { mode: 'Cash', count: 30, total: 30000, share: 75.0 },
      { mode: 'UPI / GPay / PhonePe', count: 10, total: 10000, share: 25.0 },
    ],
    byInvoiceType: [
      { type: 'opd', count: 15, totalAmount: 30000, paidAmount: 25000, dueAmount: 5000 },
      { type: 'ipd_final', count: 5, totalAmount: 20000, paidAmount: 10000, dueAmount: 10000 },
    ],
  };

  it('service calls repository.getReportsAnalytics with facilityId and options', async () => {
    const service = new BillingService();
    (service as any).repository.getReportsAnalytics = vi.fn().mockResolvedValue(mockAnalyticsData);

    const result = await service.getReportsAnalytics('fac-123', {
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      practitionerId: 'doc-1',
    });

    expect((service as any).repository.getReportsAnalytics).toHaveBeenCalledWith('fac-123', {
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      practitionerId: 'doc-1',
    });
    expect(result.kpis.totalRevenue).toBe(35000);
    expect(result.doctorRevenue).toHaveLength(2);
    expect(result.pathologyAnalytics.topTests).toHaveLength(2);
  });

  it('controller correctly scopes practitionerId for non-admin doctors under RBAC', async () => {
    const service = new BillingService();
    service.getReportsAnalytics = vi.fn().mockResolvedValue(mockAnalyticsData);

    const controller = new BillingController();
    (controller as any).service = service;

    const req: any = {
      user: {
        facilityId: 'fac-123',
        roles: ['doctor'],
        permissions: ['billing.view'],
        practitionerId: 'doc-auto-scoped',
      },
      query: {
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
      },
    };

    let sentData: any = null;
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockImplementation((payload) => {
        sentData = payload;
      }),
    };

    await controller.getReportsAnalytics(req, res);

    expect(service.getReportsAnalytics).toHaveBeenCalledWith(
      'fac-123',
      expect.objectContaining({
        practitionerId: 'doc-auto-scoped',
      })
    );
    expect(sentData.success).toBe(true);
    expect(sentData.data.kpis.collectionEfficiency).toBe(70.0);
  });

  it('controller allows admin to view all doctors without practitionerId scoping', async () => {
    const service = new BillingService();
    service.getReportsAnalytics = vi.fn().mockResolvedValue(mockAnalyticsData);

    const controller = new BillingController();
    (controller as any).service = service;

    const req: any = {
      user: {
        facilityId: 'fac-123',
        roles: ['admin'],
        permissions: ['billing.view', 'billing.manage'],
      },
      query: {},
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await controller.getReportsAnalytics(req, res);

    expect(service.getReportsAnalytics).toHaveBeenCalledWith(
      'fac-123',
      expect.objectContaining({
        practitionerId: undefined,
      })
    );
  });
});
