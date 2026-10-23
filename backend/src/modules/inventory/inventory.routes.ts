import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import {
  createItemCategorySchema,
  updateItemCategorySchema,
  listItemCategoriesSchema,
  getItemCategorySchema,
  deleteItemCategorySchema,
  createSupplierSchema,
  updateSupplierSchema,
  listSuppliersSchema,
  getSupplierSchema,
  deleteSupplierSchema,
  createItemSchema,
  updateItemSchema,
  listItemsSchema,
  getItemSchema,
  deleteItemSchema,
  createStoreSchema,
  updateStoreSchema,
  listStoresSchema,
  getStoreSchema,
  deleteStoreSchema,
  listStockBatchesSchema,
  listStockMovementsSchema,
  stockAdjustmentSchema,
  stockWriteOffSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrdersSchema,
  getPurchaseOrderSchema,
  deletePurchaseOrderSchema,
  approvePurchaseOrderSchema,
  sendPurchaseOrderSchema,
  cancelPurchaseOrderSchema,
  createGoodsReceiptSchema,
  listGoodsReceiptsSchema,
  getGoodsReceiptSchema,
  postGoodsReceiptSchema,
  cancelGoodsReceiptSchema,
  createStockTransferSchema,
  listStockTransfersSchema,
  getStockTransferSchema,
  approveStockTransferSchema,
  receiveStockTransferSchema,
  rejectStockTransferSchema,
  cancelStockTransferSchema,
  dashboardSchema,
  expiryTrackerSchema,
  lowStockSchema,
} from './inventory.schema';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { moduleGuard } from '../../middleware/moduleGuard';
import { validate } from '../../middleware/validate';

const router = Router();
const controller = inventoryController;

/* ------------------------------------------------------------------ */
/*  Authenticate all inventory routes                                 */
/* ------------------------------------------------------------------ */
router.use(authenticate);
router.use(moduleGuard('inventory'));

/* ------------------------------------------------------------------ */
/*  Suppliers                                                         */
/* ------------------------------------------------------------------ */
router.get(
  '/suppliers',
  validate(listSuppliersSchema),
  controller.getSuppliers
);

router.get(
  '/suppliers/:id',
  validate(getSupplierSchema),
  controller.getSupplier
);

router.post(
  '/suppliers',
  authorize(['inventory:write']),
  validate(createSupplierSchema),
  controller.createSupplier
);

router.put(
  '/suppliers/:id',
  authorize(['inventory:write']),
  validate(updateSupplierSchema),
  controller.updateSupplier
);

router.delete(
  '/suppliers/:id',
  authorize(['inventory:write']),
  validate(deleteSupplierSchema),
  controller.deleteSupplier
);

/* ------------------------------------------------------------------ */
/*  Item Categories                                                   */
/* ------------------------------------------------------------------ */
router.get(
  '/categories',
  validate(listItemCategoriesSchema),
  controller.getCategories
);

router.get(
  '/categories/:id',
  validate(getItemCategorySchema),
  controller.getCategory
);

router.post(
  '/categories',
  authorize(['inventory:write']),
  validate(createItemCategorySchema),
  controller.createCategory
);

router.put(
  '/categories/:id',
  authorize(['inventory:write']),
  validate(updateItemCategorySchema),
  controller.updateCategory
);

router.delete(
  '/categories/:id',
  authorize(['inventory:write']),
  validate(deleteItemCategorySchema),
  controller.deleteCategory
);

/* ------------------------------------------------------------------ */
/*  Items                                                             */
/* ------------------------------------------------------------------ */
router.get(
  '/items',
  validate(listItemsSchema),
  controller.getItems
);

router.get(
  '/items/:id',
  validate(getItemSchema),
  controller.getItem
);

router.post(
  '/items',
  authorize(['inventory:write']),
  validate(createItemSchema),
  controller.createItem
);

router.put(
  '/items/:id',
  authorize(['inventory:write']),
  validate(updateItemSchema),
  controller.updateItem
);

router.delete(
  '/items/:id',
  authorize(['inventory:write']),
  validate(deleteItemSchema),
  controller.deleteItem
);

/* ------------------------------------------------------------------ */
/*  Stores                                                            */
/* ------------------------------------------------------------------ */
router.get(
  '/stores',
  validate(listStoresSchema),
  controller.getStores
);

router.get(
  '/stores/:id',
  validate(getStoreSchema),
  controller.getStore
);

router.post(
  '/stores',
  authorize(['inventory:write']),
  validate(createStoreSchema),
  controller.createStore
);

router.put(
  '/stores/:id',
  authorize(['inventory:write']),
  validate(updateStoreSchema),
  controller.updateStore
);

router.delete(
  '/stores/:id',
  authorize(['inventory:write']),
  validate(deleteStoreSchema),
  controller.deleteStore
);

/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */
router.get(
  '/stock-batches',
  validate(listStockBatchesSchema),
  controller.getStockBatches
);

/* ------------------------------------------------------------------ */
/*  Stock Movements                                                   */
/* ------------------------------------------------------------------ */
router.get(
  '/stock-movements',
  validate(listStockMovementsSchema),
  controller.getStockMovements
);

/* ------------------------------------------------------------------ */
/*  Stock Adjustment                                                  */
/* ------------------------------------------------------------------ */
router.post(
  '/stock-adjustment',
  authorize(['inventory:adjust']),
  validate(stockAdjustmentSchema),
  controller.adjustStock
);

/* ------------------------------------------------------------------ */
/*  Stock Write-off                                                   */
/* ------------------------------------------------------------------ */
router.post(
  '/stock-write-off',
  authorize(['inventory:adjust']),
  validate(stockWriteOffSchema),
  controller.writeOffStock
);

/* ------------------------------------------------------------------ */
/*  Purchase Orders                                                   */
/* ------------------------------------------------------------------ */
router.get(
  '/purchase-orders',
  validate(listPurchaseOrdersSchema),
  controller.getPurchaseOrders
);

router.get(
  '/purchase-orders/:id',
  validate(getPurchaseOrderSchema),
  controller.getPurchaseOrder
);

router.post(
  '/purchase-orders',
  authorize(['purchase_order:manage']),
  validate(createPurchaseOrderSchema),
  controller.createPurchaseOrder
);

router.put(
  '/purchase-orders/:id',
  authorize(['purchase_order:manage']),
  validate(updatePurchaseOrderSchema),
  controller.updatePurchaseOrder
);

router.delete(
  '/purchase-orders/:id',
  authorize(['purchase_order:manage']),
  validate(deletePurchaseOrderSchema),
  controller.deletePurchaseOrder
);

router.post(
  '/purchase-orders/:id/approve',
  authorize(['purchase_order:manage']),
  validate(approvePurchaseOrderSchema),
  controller.approvePurchaseOrder
);

router.post(
  '/purchase-orders/:id/send',
  authorize(['purchase_order:manage']),
  validate(sendPurchaseOrderSchema),
  controller.sendPurchaseOrder
);

router.post(
  '/purchase-orders/:id/cancel',
  authorize(['purchase_order:manage']),
  validate(cancelPurchaseOrderSchema),
  controller.cancelPurchaseOrder
);

/* ------------------------------------------------------------------ */
/*  Goods Receipts                                                    */
/* ------------------------------------------------------------------ */
router.get(
  '/goods-receipts',
  validate(listGoodsReceiptsSchema),
  controller.getGoodsReceipts
);

router.get(
  '/goods-receipts/:id',
  validate(getGoodsReceiptSchema),
  controller.getGoodsReceipt
);

router.post(
  '/goods-receipts',
  authorize(['goods_receipt:manage']),
  validate(createGoodsReceiptSchema),
  controller.createGoodsReceipt
);

router.post(
  '/goods-receipts/:id/post',
  authorize(['goods_receipt:manage']),
  validate(postGoodsReceiptSchema),
  controller.postGoodsReceipt
);

router.post(
  '/goods-receipts/:id/cancel',
  authorize(['goods_receipt:manage']),
  validate(cancelGoodsReceiptSchema),
  controller.cancelGoodsReceipt
);

/* ------------------------------------------------------------------ */
/*  Stock Transfers                                                   */
/* ------------------------------------------------------------------ */
router.get(
  '/stock-transfers',
  validate(listStockTransfersSchema),
  controller.getStockTransfers
);

router.get(
  '/stock-transfers/:id',
  validate(getStockTransferSchema),
  controller.getStockTransfer
);

router.post(
  '/stock-transfers',
  authorize(['stock_transfer:manage']),
  validate(createStockTransferSchema),
  controller.createStockTransfer
);

router.post(
  '/stock-transfers/:id/approve',
  authorize(['stock_transfer:manage']),
  validate(approveStockTransferSchema),
  controller.approveStockTransfer
);

router.post(
  '/stock-transfers/:id/receive',
  authorize(['stock_transfer:manage']),
  validate(receiveStockTransferSchema),
  controller.receiveStockTransfer
);

router.post(
  '/stock-transfers/:id/reject',
  authorize(['stock_transfer:manage']),
  validate(rejectStockTransferSchema),
  controller.rejectStockTransfer
);

router.post(
  '/stock-transfers/:id/cancel',
  authorize(['stock_transfer:manage']),
  validate(cancelStockTransferSchema),
  controller.cancelStockTransfer
);

/* ------------------------------------------------------------------ */
/*  Reports                                                           */
/* ------------------------------------------------------------------ */
router.get(
  '/dashboard',
  validate(dashboardSchema),
  controller.getDashboard
);

router.get(
  '/expiry-tracker',
  validate(expiryTrackerSchema),
  controller.getExpiryTracker
);

router.get(
  '/low-stock',
  validate(lowStockSchema),
  controller.getLowStock
);

export const inventoryRoutes = router;
