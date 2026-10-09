import { BillingRepository } from './billing.repository';
import { CreateInvoiceRequest } from './billing.schema';
import { NotFoundError } from '../../shared/errors/AppError';

export class BillingService {
  private repository: BillingRepository;

  constructor() {
    this.repository = new BillingRepository();
  }

  async createInvoice(data: CreateInvoiceRequest, organizationId: string) {
    const subtotal = data.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const totalAmount = Math.max(0, subtotal - (data.discount_total || 0));

    return this.repository.createInvoice({
      organization_id: organizationId,
      facility_id: data.facility_id,
      patient_id: data.patient_id,
      invoice_type: data.invoice_type,
      subtotal,
      discount_total: data.discount_total || 0,
      total_amount: totalAmount,
      items: data.items,
      payment_mode: data.payment_mode
    });
  }

  async listInvoices(facilityId: string) {
    return this.repository.listInvoices(facilityId);
  }

  async getInvoice(invoiceId: string, facilityId: string) {
    const invoice = await this.repository.getInvoice(invoiceId, facilityId);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }
    return invoice;
  }

  async addCharge(data: any, organizationId: string, userId: string) {
    return this.repository.addCharge({
      ...data,
      organization_id: organizationId,
      user_id: userId
    });
  }

  async removeCharge(id: string, facilityId: string) {
    const charge = await this.repository.removeCharge(id, facilityId);
    if (!charge) {
      throw new NotFoundError('Charge not found or already cancelled');
    }
    return charge;
  }

  async getRunningBill(encounterId: string, facilityId: string) {
    return this.repository.getRunningBill(encounterId, facilityId);
  }

  async recordAdvancePayment(data: any, organizationId: string, userId: string) {
    return this.repository.recordAdvancePayment({
      ...data,
      organization_id: organizationId,
      user_id: userId
    });
  }

  async getEncounterPayments(encounterId: string, facilityId: string) {
    return this.repository.getEncounterPayments(encounterId, facilityId);
  }
}
