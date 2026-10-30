"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowStockSchema = exports.expiryTrackerSchema = exports.dashboardSchema = exports.cancelStockTransferSchema = exports.rejectStockTransferSchema = exports.receiveStockTransferSchema = exports.approveStockTransferSchema = exports.getStockTransferSchema = exports.listStockTransfersSchema = exports.createStockTransferSchema = exports.cancelGoodsReceiptSchema = exports.postGoodsReceiptSchema = exports.getGoodsReceiptSchema = exports.listGoodsReceiptsSchema = exports.createGoodsReceiptSchema = exports.cancelPurchaseOrderSchema = exports.sendPurchaseOrderSchema = exports.approvePurchaseOrderSchema = exports.deletePurchaseOrderSchema = exports.getPurchaseOrderSchema = exports.listPurchaseOrdersSchema = exports.updatePurchaseOrderSchema = exports.createPurchaseOrderSchema = exports.deleteSupplierSchema = exports.getSupplierSchema = exports.listSuppliersSchema = exports.updateSupplierSchema = exports.createSupplierSchema = exports.stockWriteOffSchema = exports.stockAdjustmentSchema = exports.listStockMovementsSchema = exports.listStockBatchesSchema = exports.deleteStoreSchema = exports.getStoreSchema = exports.listStoresSchema = exports.updateStoreSchema = exports.createStoreSchema = exports.deleteItemSchema = exports.getItemSchema = exports.listItemsSchema = exports.updateItemSchema = exports.createItemSchema = exports.deleteItemCategorySchema = exports.getItemCategorySchema = exports.listItemCategoriesSchema = exports.updateItemCategorySchema = exports.createItemCategorySchema = void 0;
const zod_1 = require("zod");
/* ------------------------------------------------------------------ */
/*  Common reusable validators                                        */
/* ------------------------------------------------------------------ */
const uuid = zod_1.z.string().uuid('Invalid UUID');
// Treat empty strings (from optional query params) as undefined so UUID
// validation doesn't reject them when the caller omits the field.
const optionalUuid = zod_1.z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), zod_1.z.string().uuid('Invalid UUID').optional().nullable());
const orgUuid = zod_1.z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), zod_1.z.string().uuid('Invalid UUID').optional().nullable());
// Treat empty strings (from optional query params) as undefined so enum
// validation doesn't reject them when the caller omits the field.
const optional = (schema) => zod_1.z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), schema);
const positiveQty = zod_1.z.coerce
    .number()
    .positive('Quantity must be greater than 0')
    .optional();
const nonNegativeQty = zod_1.z.coerce
    .number()
    .nonnegative('Quantity must not be negative')
    .optional();
const name = zod_1.z.string().min(1, 'Name is required').max(100);
const code = zod_1.z.string().min(1, 'Code is required').max(50);
const description = zod_1.z.string().max(500).optional().nullable();
const isActive = zod_1.z.boolean().optional();
/* ------------------------------------------------------------------ */
/*  Item Categories                                                   */
/* ------------------------------------------------------------------ */
exports.createItemCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        parent_id: optionalUuid.nullable(),
        code,
        name,
        category_type: zod_1.z
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
exports.updateItemCategorySchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
    body: zod_1.z.object({
        parent_id: optionalUuid.nullable(),
        code: code.optional(),
        name: name.optional(),
        category_type: zod_1.z
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
exports.listItemCategoriesSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        is_active: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getItemCategorySchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.deleteItemCategorySchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Items                                                             */
/* ------------------------------------------------------------------ */
exports.createItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        category_id: optionalUuid.nullable(),
        manufacturer_id: optionalUuid.nullable(),
        tax_group_id: optionalUuid.nullable(),
        medical_code_id: optionalUuid.nullable(),
        service_id: optionalUuid.nullable(),
        code,
        name,
        generic_name: zod_1.z.string().optional().nullable(),
        brand_name: zod_1.z.string().optional().nullable(),
        item_type: zod_1.z
            .enum([
            'drug',
            'consumable',
            'implant',
            'reagent',
            'equipment',
            'general',
        ])
            .default('drug'),
        dosage_form: zod_1.z.string().optional().nullable(),
        strength: zod_1.z.string().optional().nullable(),
        route: zod_1.z.string().optional().nullable(),
        drug_schedule: zod_1.z
            .enum(['none', 'otc', 'h', 'h1', 'x', 'g'])
            .default('none'),
        requires_prescription: zod_1.z.boolean().default(false),
        is_controlled: zod_1.z.boolean().default(false),
        is_high_alert: zod_1.z.boolean().default(false),
        base_uom: zod_1.z.string().default('unit'),
        pack_size: zod_1.z.coerce.number().positive().default(1),
        hsn_code: zod_1.z.string().optional().nullable(),
        mrp: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        reorder_level: zod_1.z.coerce.number().nonnegative().default(0),
        reorder_quantity: zod_1.z.coerce.number().nonnegative().default(0),
        max_stock_level: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        track_batches: zod_1.z.boolean().default(true),
        track_expiry: zod_1.z.boolean().default(true),
        storage_conditions: zod_1.z.string().optional().nullable(),
        barcode: zod_1.z.string().optional().nullable(),
        is_active: isActive.default(true),
    }),
});
exports.updateItemSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
    body: zod_1.z.object({
        category_id: optionalUuid.nullable(),
        manufacturer_id: optionalUuid.nullable(),
        tax_group_id: optionalUuid.nullable(),
        code: code.optional(),
        name: name.optional(),
        item_type: zod_1.z
            .enum([
            'drug',
            'consumable',
            'implant',
            'reagent',
            'equipment',
            'general',
        ])
            .optional(),
        base_uom: zod_1.z.string().optional(),
        pack_size: zod_1.z.coerce.number().positive().optional(),
        mrp: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        reorder_level: zod_1.z.coerce.number().nonnegative().optional(),
        reorder_quantity: zod_1.z.coerce.number().nonnegative().optional(),
        max_stock_level: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        track_batches: zod_1.z.boolean().optional(),
        track_expiry: zod_1.z.boolean().optional(),
        is_active: isActive.optional(),
    }),
});
exports.listItemsSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        store_id: optionalUuid,
        category_id: optionalUuid,
        item_type: zod_1.z
            .enum([
            'drug',
            'consumable',
            'implant',
            'reagent',
            'equipment',
            'general',
        ])
            .optional(),
        is_active: zod_1.z.string().optional(),
        low_stock: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getItemSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.deleteItemSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Stores                                                            */
/* ------------------------------------------------------------------ */
exports.createStoreSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        facility_id: orgUuid,
        department_id: optionalUuid.nullable(),
        parent_store_id: optionalUuid.nullable(),
        code,
        name,
        store_type: zod_1.z
            .enum(['central', 'pharmacy', 'ward', 'ot', 'lab', 'other'])
            .default('pharmacy'),
        is_dispensing_point: zod_1.z.boolean().default(false),
        is_active: isActive.default(true),
    }),
});
exports.updateStoreSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
    body: zod_1.z.object({
        code: code.optional(),
        name: name.optional(),
        store_type: zod_1.z
            .enum(['central', 'pharmacy', 'ward', 'ot', 'lab', 'other'])
            .optional(),
        is_dispensing_point: zod_1.z.boolean().optional(),
        is_active: isActive.optional(),
    }),
});
exports.listStoresSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        store_type: zod_1.z
            .enum(['central', 'pharmacy', 'ward', 'ot', 'lab', 'other'])
            .optional(),
        is_active: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getStoreSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.deleteStoreSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */
exports.listStockBatchesSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        store_id: optionalUuid,
        item_id: optionalUuid,
        status: zod_1.z
            .enum([
            'active',
            'quarantined',
            'expired',
            'recalled',
            'depleted',
        ])
            .optional(),
        expiry_before: zod_1.z.string().optional(),
        expiry_after: zod_1.z.string().optional(),
        low_stock: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
/* ------------------------------------------------------------------ */
/*  Stock Movements                                                   */
/* ------------------------------------------------------------------ */
exports.listStockMovementsSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        store_id: optionalUuid,
        item_id: optionalUuid,
        batch_id: optionalUuid,
        movement_type: zod_1.z
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
        from_date: zod_1.z.string().optional(),
        to_date: zod_1.z.string().optional(),
        reference_type: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
/* ------------------------------------------------------------------ */
/*  Stock Adjustment                                                  */
/* ------------------------------------------------------------------ */
exports.stockAdjustmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        store_id: uuid,
        item_id: uuid,
        batch_id: uuid,
        movement_type: zod_1.z.enum([
            'adjustment_in',
            'adjustment_out',
        ]),
        quantity: zod_1.z.coerce.number().positive('Quantity must be greater than 0'),
        unit_cost: zod_1.z.coerce.number().nonnegative().optional().nullable(),
        reference_type: zod_1.z.string().optional().nullable(),
        reference_id: optionalUuid.nullable(),
        notes: zod_1.z.string().optional().nullable(),
    }),
});
/* ------------------------------------------------------------------ */
/*  Stock Write-off                                                   */
/* ------------------------------------------------------------------ */
exports.stockWriteOffSchema = zod_1.z.object({
    body: zod_1.z.object({
        store_id: uuid,
        item_id: uuid,
        batch_id: uuid,
        quantity: zod_1.z.coerce.number().positive('Quantity must be greater than 0'),
        reason: zod_1.z
            .enum(['expired', 'damaged'])
            .default('damaged'),
        notes: zod_1.z.string().optional().nullable(),
    }),
});
/* ------------------------------------------------------------------ */
/*  Suppliers                                                         */
/* ------------------------------------------------------------------ */
exports.createSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        code,
        name,
        contact_person: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        gstin: zod_1.z.string().optional().nullable(),
        drug_license_no: zod_1.z.string().optional().nullable(),
        payment_terms_days: zod_1.z.coerce.number().nonnegative().default(30),
        bank_details: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).default({}),
        is_active: isActive.default(true),
    }),
});
exports.updateSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
    body: zod_1.z.object({
        code: code.optional(),
        name: name.optional(),
        contact_person: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        gstin: zod_1.z.string().optional().nullable(),
        drug_license_no: zod_1.z.string().optional().nullable(),
        payment_terms_days: zod_1.z.coerce.number().nonnegative().optional(),
        bank_details: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        is_active: isActive.optional(),
    }),
});
exports.listSuppliersSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        is_active: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.deleteSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Purchase Orders                                                   */
/* ------------------------------------------------------------------ */
exports.createPurchaseOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        facility_id: orgUuid,
        supplier_id: uuid,
        store_id: uuid,
        order_date: zod_1.z.string().optional(),
        expected_date: zod_1.z.string().optional().nullable(),
        terms: zod_1.z.string().optional().nullable(),
        notes: zod_1.z.string().optional().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            item_id: uuid,
            ordered_qty: zod_1.z.coerce.number().positive('Ordered qty must be greater than 0'),
            unit_cost: zod_1.z.coerce.number().nonnegative('Unit cost must not be negative'),
            discount_percent: zod_1.z.coerce.number().nonnegative().default(0),
            tax_group_id: optionalUuid.nullable(),
            tax_amount: zod_1.z.coerce.number().nonnegative().default(0),
            line_total: zod_1.z.coerce.number().nonnegative().default(0),
        })).min(1, 'At least one item is required'),
    }),
});
exports.updatePurchaseOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
    body: zod_1.z.object({
        supplier_id: optionalUuid,
        store_id: optionalUuid,
        expected_date: zod_1.z.string().optional().nullable(),
        terms: zod_1.z.string().optional().nullable(),
        notes: zod_1.z.string().optional().nullable(),
    }),
});
exports.listPurchaseOrdersSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        supplier_id: optionalUuid,
        store_id: optionalUuid,
        status: zod_1.z
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
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getPurchaseOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.deletePurchaseOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.approvePurchaseOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.sendPurchaseOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.cancelPurchaseOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Goods Receipts                                                    */
/* ------------------------------------------------------------------ */
exports.createGoodsReceiptSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        facility_id: orgUuid,
        supplier_id: uuid,
        store_id: uuid,
        purchase_order_id: optionalUuid.nullable(),
        supplier_invoice_no: zod_1.z.string().optional().nullable(),
        supplier_invoice_date: zod_1.z.string().optional().nullable(),
        notes: zod_1.z.string().optional().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            po_item_id: optionalUuid.nullable(),
            item_id: uuid,
            batch_no: zod_1.z.string().min(1, 'Batch number is required'),
            manufactured_on: zod_1.z.string().optional().nullable(),
            expiry_date: zod_1.z.string().optional().nullable(),
            received_qty: zod_1.z.coerce.number().positive('Received qty must be greater than 0'),
            free_qty: zod_1.z.coerce.number().nonnegative().default(0),
            unit_cost: zod_1.z.coerce.number().nonnegative('Unit cost must not be negative'),
            mrp: zod_1.z.coerce.number().nonnegative().optional().nullable(),
            discount_amount: zod_1.z.coerce.number().nonnegative().default(0),
            tax_group_id: optionalUuid.nullable(),
            tax_amount: zod_1.z.coerce.number().nonnegative().default(0),
            line_total: zod_1.z.coerce.number().nonnegative().default(0),
        })).min(1, 'At least one item is required'),
    }),
});
exports.listGoodsReceiptsSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        supplier_id: optionalUuid,
        store_id: optionalUuid,
        purchase_order_id: optionalUuid,
        status: zod_1.z.enum(['draft', 'posted', 'cancelled']).optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getGoodsReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.postGoodsReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.cancelGoodsReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Stock Transfers                                                   */
/* ------------------------------------------------------------------ */
exports.createStockTransferSchema = zod_1.z.object({
    body: zod_1.z.object({
        organization_id: orgUuid,
        from_store_id: uuid,
        to_store_id: uuid,
        notes: zod_1.z.string().optional().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            item_id: uuid,
            requested_qty: zod_1.z.coerce.number().positive('Requested qty must be greater than 0'),
        })).min(1, 'At least one item is required'),
    }),
});
exports.listStockTransfersSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        from_store_id: optionalUuid,
        to_store_id: optionalUuid,
        status: zod_1.z
            .enum([
            'requested',
            'approved',
            'in_transit',
            'received',
            'rejected',
            'cancelled',
        ])
            .optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }),
});
exports.getStockTransferSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.approveStockTransferSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.receiveStockTransferSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.rejectStockTransferSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
exports.cancelStockTransferSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid }),
});
/* ------------------------------------------------------------------ */
/*  Reports                                                           */
/* ------------------------------------------------------------------ */
exports.dashboardSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
    }),
});
exports.expiryTrackerSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        store_id: optionalUuid,
        days_ahead: zod_1.z.string().optional(),
    }),
});
exports.lowStockSchema = zod_1.z.object({
    query: zod_1.z.object({
        organization_id: optionalUuid,
        facility_id: optionalUuid,
        store_id: optionalUuid,
    }),
});
