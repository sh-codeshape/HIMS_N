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
}
