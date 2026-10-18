import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Common reusable validators                                        */
/* ------------------------------------------------------------------ */
const uuid = z.string().uuid('Invalid UUID');
// Treat empty strings (from optional query params) as undefined so UUID
// validation doesn't reject them when the caller omits the field.
const optionalUuid = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().uuid('Invalid UUID').optional().nullable()
);
// Treat empty strings (from optional query params) as undefined so enum
// validation doesn't reject them when the caller omits the field.
const optional = (schema: any) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    schema
  );
const positiveQty = z
  .number()
  .positive('Quantity must be greater than 0')
  .optional();
const nonNegativeQty = z
  .number()
  .nonnegative('Quantity must not be negative')
  .optional();
const name = z.string().min(1, 'Name is required').max(100);
const code = z.string().min(1, 'Code is required').max(50);
const description = z.string().max(500).optional().nullable();
const isActive = z.boolean().optional();

/* ------------------------------------------------------------------ */
/*  Item Categories                                                   */
/* ------------------------------------------------------------------ */
export const createItemCategorySchema = z.object({
  body: z.object({
    organization_id: uuid,
    parent_id: optionalUuid.nullable(),
    code,
    name,
    category_type: z
      .enum([
        'drug',
        'consumable',
        'implant',
        'surgical',
        'reagent',
        'equipment',
        'general',
      ])
      .default('drug'),
    is_active: isActive.default(true),
  }),
});

export const updateItemCategorySchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    parent_id: optionalUuid.nullable(),
    code: code.optional(),
    name: name.optional(),
    category_type: z
      .enum([
        'drug',
        'consumable',
        'implant',
        'surgical',
        'reagent',
        'equipment',
        'general',
      ])
      .optional(),
    is_active: isActive.optional(),
  }),
});

export const listItemCategoriesSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    is_active: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getItemCategorySchema = z.object({
  params: z.object({ id: uuid }),
});

export const deleteItemCategorySchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Items                                                             */
/* ------------------------------------------------------------------ */
export const createItemSchema = z.object({
  body: z.object({
    organization_id: uuid,
    category_id: optionalUuid.nullable(),
    manufacturer_id: optionalUuid.nullable(),
    tax_group_id: optionalUuid.nullable(),
    medical_code_id: optionalUuid.nullable(),
    service_id: optionalUuid.nullable(),
    code,
    name,
    generic_name: z.string().optional().nullable(),
    brand_name: z.string().optional().nullable(),
    item_type: z
      .enum([
        'drug',
        'consumable',
        'implant',
        'reagent',
        'equipment',
        'general',
      ])
      .default('drug'),
    dosage_form: z.string().optional().nullable(),
    strength: z.string().optional().nullable(),
    route: z.string().optional().nullable(),
    drug_schedule: z
      .enum(['none', 'otc', 'h', 'h1', 'x', 'g'])
      .default('none'),
    requires_prescription: z.boolean().default(false),
    is_controlled: z.boolean().default(false),
    is_high_alert: z.boolean().default(false),
    base_uom: z.string().default('unit'),
    pack_size: z.number().positive().default(1),
    hsn_code: z.string().optional().nullable(),
    mrp: z.number().nonnegative().optional().nullable(),
    reorder_level: z.number().nonnegative().default(0),
    reorder_quantity: z.number().nonnegative().default(0),
    max_stock_level: z.number().nonnegative().optional().nullable(),
    track_batches: z.boolean().default(true),
    track_expiry: z.boolean().default(true),
    storage_conditions: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    is_active: isActive.default(true),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    category_id: optionalUuid.nullable(),
    manufacturer_id: optionalUuid.nullable(),
    tax_group_id: optionalUuid.nullable(),
    code: code.optional(),
    name: name.optional(),
    item_type: z
      .enum([
        'drug',
        'consumable',
        'implant',
        'reagent',
        'equipment',
        'general',
      ])
      .optional(),
    base_uom: z.string().optional(),
    reorder_level: z.number().nonnegative().optional(),
    reorder_quantity: z.number().nonnegative().optional(),
    max_stock_level: z.number().nonnegative().optional().nullable(),
    track_batches: z.boolean().optional(),
    track_expiry: z.boolean().optional(),
    is_active: isActive.optional(),
  }),
});

export const listItemsSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    store_id: optionalUuid,
    category_id: optionalUuid,
    item_type: z
      .enum([
        'drug',
        'consumable',
        'implant',
        'reagent',
        'equipment',
        'general',
      ])
      .optional(),
    is_active: z.string().optional(),
    low_stock: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getItemSchema = z.object({
  params: z.object({ id: uuid }),
});

export const deleteItemSchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Stores                                                            */
/* ------------------------------------------------------------------ */
export const createStoreSchema = z.object({
  body: z.object({
    organization_id: uuid,
    facility_id: uuid,
    department_id: optionalUuid.nullable(),
    parent_store_id: optionalUuid.nullable(),
    code,
    name,
    store_type: z
      .enum(['central', 'pharmacy', 'ward', 'ot', 'lab', 'other'])
      .default('pharmacy'),
    is_dispensing_point: z.boolean().default(false),
    is_active: isActive.default(true),
  }),
});

export const updateStoreSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    code: code.optional(),
    name: name.optional(),
    store_type: z
      .enum(['central', 'pharmacy', 'ward', 'ot', 'lab', 'other'])
      .optional(),
    is_dispensing_point: z.boolean().optional(),
    is_active: isActive.optional(),
  }),
});

export const listStoresSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    store_type: z
      .enum(['central', 'pharmacy', 'ward', 'ot', 'lab', 'other'])
      .optional(),
    is_active: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getStoreSchema = z.object({
  params: z.object({ id: uuid }),
});

export const deleteStoreSchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */
export const listStockBatchesSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    store_id: optionalUuid,
    item_id: optionalUuid,
    status: z
      .enum([
        'active',
        'quarantined',
        'expired',
        'recalled',
        'depleted',
      ])
      .optional(),
    expiry_before: z.string().optional(),
    expiry_after: z.string().optional(),
    low_stock: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------ */
/*  Stock Movements                                                   */
/* ------------------------------------------------------------------ */
export const listStockMovementsSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    store_id: optionalUuid,
    item_id: optionalUuid,
    batch_id: optionalUuid,
    movement_type: z
      .enum([
        'opening',
        'purchase_receipt',
        'purchase_return',
        'dispense',
        'dispense_return',
        'transfer_out',
        'transfer_in',
        'consumption',
        'adjustment_in',
        'adjustment_out',
        'write_off_expired',
        'write_off_damaged',
      ])
      .optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    reference_type: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------ */
/*  Stock Adjustment                                                  */
/* ------------------------------------------------------------------ */
export const stockAdjustmentSchema = z.object({
  body: z.object({
    store_id: uuid,
    item_id: uuid,
    batch_id: uuid,
    movement_type: z.enum([
      'adjustment_in',
      'adjustment_out',
    ]),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit_cost: z.number().nonnegative().optional().nullable(),
    reference_type: z.string().optional().nullable(),
    reference_id: optionalUuid.nullable(),
    notes: z.string().optional().nullable(),
  }),
});

/* ------------------------------------------------------------------ */
/*  Stock Write-off                                                   */
/* ------------------------------------------------------------------ */
export const stockWriteOffSchema = z.object({
  body: z.object({
    store_id: uuid,
    item_id: uuid,
    batch_id: uuid,
    quantity: z.number().positive('Quantity must be greater than 0'),
    reason: z
      .enum(['expired', 'damaged'])
      .default('damaged'),
    notes: z.string().optional().nullable(),
  }),
});

/* ------------------------------------------------------------------ */
/*  Suppliers                                                         */
/* ------------------------------------------------------------------ */
export const createSupplierSchema = z.object({
  body: z.object({
    organization_id: uuid,
    code,
    name,
    contact_person: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    gstin: z.string().optional().nullable(),
    drug_license_no: z.string().optional().nullable(),
    payment_terms_days: z.number().nonnegative().default(30),
    bank_details: z.record(z.string(), z.any()).default({}),
    is_active: isActive.default(true),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    code: code.optional(),
    name: name.optional(),
    contact_person: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    gstin: z.string().optional().nullable(),
    drug_license_no: z.string().optional().nullable(),
    payment_terms_days: z.number().nonnegative().optional(),
    bank_details: z.record(z.string(), z.any()).optional(),
    is_active: isActive.optional(),
  }),
});

export const listSuppliersSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    is_active: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getSupplierSchema = z.object({
  params: z.object({ id: uuid }),
});

export const deleteSupplierSchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Purchase Orders                                                   */
/* ------------------------------------------------------------------ */
export const createPurchaseOrderSchema = z.object({
  body: z.object({
    organization_id: uuid,
    facility_id: uuid,
    supplier_id: uuid,
    store_id: uuid,
    order_date: z.string().optional(),
    expected_date: z.string().optional().nullable(),
    terms: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(
      z.object({
        item_id: uuid,
        ordered_qty: z.number().positive('Ordered qty must be greater than 0'),
        unit_cost: z.number().nonnegative('Unit cost must not be negative'),
        discount_percent: z.number().nonnegative().default(0),
        tax_group_id: optionalUuid.nullable(),
        tax_amount: z.number().nonnegative().default(0),
        line_total: z.number().nonnegative().default(0),
      })
    ).min(1, 'At least one item is required'),
  }),
});

export const updatePurchaseOrderSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    supplier_id: optionalUuid,
    store_id: optionalUuid,
    expected_date: z.string().optional().nullable(),
    terms: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const listPurchaseOrdersSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    supplier_id: optionalUuid,
    store_id: optionalUuid,
    status: z
      .enum([
        'draft',
        'approved',
        'sent',
        'partially_received',
        'received',
        'cancelled',
        'closed',
      ])
      .optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getPurchaseOrderSchema = z.object({
  params: z.object({ id: uuid }),
});

export const deletePurchaseOrderSchema = z.object({
  params: z.object({ id: uuid }),
});

export const approvePurchaseOrderSchema = z.object({
  params: z.object({ id: uuid }),
});

export const sendPurchaseOrderSchema = z.object({
  params: z.object({ id: uuid }),
});

export const cancelPurchaseOrderSchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Goods Receipts                                                    */
/* ------------------------------------------------------------------ */
export const createGoodsReceiptSchema = z.object({
  body: z.object({
    organization_id: uuid,
    facility_id: uuid,
    supplier_id: uuid,
    store_id: uuid,
    purchase_order_id: optionalUuid.nullable(),
    supplier_invoice_no: z.string().optional().nullable(),
    supplier_invoice_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(
      z.object({
        po_item_id: optionalUuid.nullable(),
        item_id: uuid,
        batch_no: z.string().min(1, 'Batch number is required'),
        manufactured_on: z.string().optional().nullable(),
        expiry_date: z.string().optional().nullable(),
        received_qty: z.number().positive('Received qty must be greater than 0'),
        free_qty: z.number().nonnegative().default(0),
        unit_cost: z.number().nonnegative('Unit cost must not be negative'),
        mrp: z.number().nonnegative().optional().nullable(),
        discount_amount: z.number().nonnegative().default(0),
        tax_group_id: optionalUuid.nullable(),
        tax_amount: z.number().nonnegative().default(0),
        line_total: z.number().nonnegative().default(0),
      })
    ).min(1, 'At least one item is required'),
  }),
});

export const listGoodsReceiptsSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    supplier_id: optionalUuid,
    store_id: optionalUuid,
    purchase_order_id: optionalUuid,
    status: z.enum(['draft', 'posted', 'cancelled']).optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getGoodsReceiptSchema = z.object({
  params: z.object({ id: uuid }),
});

export const postGoodsReceiptSchema = z.object({
  params: z.object({ id: uuid }),
});

export const cancelGoodsReceiptSchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Stock Transfers                                                   */
/* ------------------------------------------------------------------ */
export const createStockTransferSchema = z.object({
  body: z.object({
    organization_id: uuid,
    from_store_id: uuid,
    to_store_id: uuid,
    notes: z.string().optional().nullable(),
    items: z.array(
      z.object({
        item_id: uuid,
        requested_qty: z.number().positive('Requested qty must be greater than 0'),
      })
    ).min(1, 'At least one item is required'),
  }),
});

export const listStockTransfersSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    from_store_id: optionalUuid,
    to_store_id: optionalUuid,
    status: z
      .enum([
        'requested',
        'approved',
        'in_transit',
        'received',
        'rejected',
        'cancelled',
      ])
      .optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getStockTransferSchema = z.object({
  params: z.object({ id: uuid }),
});

export const approveStockTransferSchema = z.object({
  params: z.object({ id: uuid }),
});

export const receiveStockTransferSchema = z.object({
  params: z.object({ id: uuid }),
});

export const rejectStockTransferSchema = z.object({
  params: z.object({ id: uuid }),
});

export const cancelStockTransferSchema = z.object({
  params: z.object({ id: uuid }),
});

/* ------------------------------------------------------------------ */
/*  Reports                                                           */
/* ------------------------------------------------------------------ */
export const dashboardSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
  }),
});

export const expiryTrackerSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    store_id: optionalUuid,
    days_ahead: z.string().optional(),
  }),
});

export const lowStockSchema = z.object({
  query: z.object({
    organization_id: optionalUuid,
    facility_id: optionalUuid,
    store_id: optionalUuid,
  }),
});
