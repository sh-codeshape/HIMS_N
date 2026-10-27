"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const inventory_schema_1 = require("./inventory.schema");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const moduleGuard_1 = require("../../middleware/moduleGuard");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
const controller = inventory_controller_1.inventoryController;
/* ------------------------------------------------------------------ */
/*  Authenticate all inventory routes                                 */
/* ------------------------------------------------------------------ */
router.use(authenticate_1.authenticate);
router.use((0, moduleGuard_1.moduleGuard)('inventory'));
/* ------------------------------------------------------------------ */
/*  Suppliers                                                         */
/* ------------------------------------------------------------------ */
router.get('/suppliers', (0, validate_1.validate)(inventory_schema_1.listSuppliersSchema), controller.getSuppliers);
router.get('/suppliers/:id', (0, validate_1.validate)(inventory_schema_1.getSupplierSchema), controller.getSupplier);
router.post('/suppliers', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.createSupplierSchema), controller.createSupplier);
router.put('/suppliers/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.updateSupplierSchema), controller.updateSupplier);
router.delete('/suppliers/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.deleteSupplierSchema), controller.deleteSupplier);
/* ------------------------------------------------------------------ */
/*  Item Categories                                                   */
/* ------------------------------------------------------------------ */
router.get('/categories', (0, validate_1.validate)(inventory_schema_1.listItemCategoriesSchema), controller.getCategories);
router.get('/categories/:id', (0, validate_1.validate)(inventory_schema_1.getItemCategorySchema), controller.getCategory);
router.post('/categories', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.createItemCategorySchema), controller.createCategory);
router.put('/categories/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.updateItemCategorySchema), controller.updateCategory);
router.delete('/categories/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.deleteItemCategorySchema), controller.deleteCategory);
/* ------------------------------------------------------------------ */
/*  Items                                                             */
/* ------------------------------------------------------------------ */
router.get('/items', (0, validate_1.validate)(inventory_schema_1.listItemsSchema), controller.getItems);
router.get('/items/:id', (0, validate_1.validate)(inventory_schema_1.getItemSchema), controller.getItem);
router.post('/items', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.createItemSchema), controller.createItem);
router.put('/items/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.updateItemSchema), controller.updateItem);
router.delete('/items/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.deleteItemSchema), controller.deleteItem);
/* ------------------------------------------------------------------ */
/*  Stores                                                            */
/* ------------------------------------------------------------------ */
router.get('/stores', (0, validate_1.validate)(inventory_schema_1.listStoresSchema), controller.getStores);
router.get('/stores/:id', (0, validate_1.validate)(inventory_schema_1.getStoreSchema), controller.getStore);
router.post('/stores', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.createStoreSchema), controller.createStore);
router.put('/stores/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.updateStoreSchema), controller.updateStore);
router.delete('/stores/:id', (0, authorize_1.authorize)(['inventory:write']), (0, validate_1.validate)(inventory_schema_1.deleteStoreSchema), controller.deleteStore);
/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */
router.get('/stock-batches', (0, validate_1.validate)(inventory_schema_1.listStockBatchesSchema), controller.getStockBatches);
/* ------------------------------------------------------------------ */
/*  Stock Movements                                                   */
/* ------------------------------------------------------------------ */
router.get('/stock-movements', (0, validate_1.validate)(inventory_schema_1.listStockMovementsSchema), controller.getStockMovements);
/* ------------------------------------------------------------------ */
/*  Stock Adjustment                                                  */
/* ------------------------------------------------------------------ */
router.post('/stock-adjustment', (0, authorize_1.authorize)(['inventory:adjust']), (0, validate_1.validate)(inventory_schema_1.stockAdjustmentSchema), controller.adjustStock);
/* ------------------------------------------------------------------ */
/*  Stock Write-off                                                   */
/* ------------------------------------------------------------------ */
router.post('/stock-write-off', (0, authorize_1.authorize)(['inventory:adjust']), (0, validate_1.validate)(inventory_schema_1.stockWriteOffSchema), controller.writeOffStock);
/* ------------------------------------------------------------------ */
/*  Purchase Orders                                                   */
/* ------------------------------------------------------------------ */
router.get('/purchase-orders', (0, validate_1.validate)(inventory_schema_1.listPurchaseOrdersSchema), controller.getPurchaseOrders);
router.get('/purchase-orders/:id', (0, validate_1.validate)(inventory_schema_1.getPurchaseOrderSchema), controller.getPurchaseOrder);
router.post('/purchase-orders', (0, authorize_1.authorize)(['purchase_order:manage']), (0, validate_1.validate)(inventory_schema_1.createPurchaseOrderSchema), controller.createPurchaseOrder);
router.put('/purchase-orders/:id', (0, authorize_1.authorize)(['purchase_order:manage']), (0, validate_1.validate)(inventory_schema_1.updatePurchaseOrderSchema), controller.updatePurchaseOrder);
router.delete('/purchase-orders/:id', (0, authorize_1.authorize)(['purchase_order:manage']), (0, validate_1.validate)(inventory_schema_1.deletePurchaseOrderSchema), controller.deletePurchaseOrder);
router.post('/purchase-orders/:id/approve', (0, authorize_1.authorize)(['purchase_order:manage']), (0, validate_1.validate)(inventory_schema_1.approvePurchaseOrderSchema), controller.approvePurchaseOrder);
router.post('/purchase-orders/:id/send', (0, authorize_1.authorize)(['purchase_order:manage']), (0, validate_1.validate)(inventory_schema_1.sendPurchaseOrderSchema), controller.sendPurchaseOrder);
router.post('/purchase-orders/:id/cancel', (0, authorize_1.authorize)(['purchase_order:manage']), (0, validate_1.validate)(inventory_schema_1.cancelPurchaseOrderSchema), controller.cancelPurchaseOrder);
/* ------------------------------------------------------------------ */
/*  Goods Receipts                                                    */
/* ------------------------------------------------------------------ */
router.get('/goods-receipts', (0, validate_1.validate)(inventory_schema_1.listGoodsReceiptsSchema), controller.getGoodsReceipts);
router.get('/goods-receipts/:id', (0, validate_1.validate)(inventory_schema_1.getGoodsReceiptSchema), controller.getGoodsReceipt);
router.post('/goods-receipts', (0, authorize_1.authorize)(['goods_receipt:manage']), (0, validate_1.validate)(inventory_schema_1.createGoodsReceiptSchema), controller.createGoodsReceipt);
router.post('/goods-receipts/:id/post', (0, authorize_1.authorize)(['goods_receipt:manage']), (0, validate_1.validate)(inventory_schema_1.postGoodsReceiptSchema), controller.postGoodsReceipt);
router.post('/goods-receipts/:id/cancel', (0, authorize_1.authorize)(['goods_receipt:manage']), (0, validate_1.validate)(inventory_schema_1.cancelGoodsReceiptSchema), controller.cancelGoodsReceipt);
/* ------------------------------------------------------------------ */
/*  Stock Transfers                                                   */
/* ------------------------------------------------------------------ */
router.get('/stock-transfers', (0, validate_1.validate)(inventory_schema_1.listStockTransfersSchema), controller.getStockTransfers);
router.get('/stock-transfers/:id', (0, validate_1.validate)(inventory_schema_1.getStockTransferSchema), controller.getStockTransfer);
router.post('/stock-transfers', (0, authorize_1.authorize)(['stock_transfer:manage']), (0, validate_1.validate)(inventory_schema_1.createStockTransferSchema), controller.createStockTransfer);
router.post('/stock-transfers/:id/approve', (0, authorize_1.authorize)(['stock_transfer:manage']), (0, validate_1.validate)(inventory_schema_1.approveStockTransferSchema), controller.approveStockTransfer);
router.post('/stock-transfers/:id/receive', (0, authorize_1.authorize)(['stock_transfer:manage']), (0, validate_1.validate)(inventory_schema_1.receiveStockTransferSchema), controller.receiveStockTransfer);
router.post('/stock-transfers/:id/reject', (0, authorize_1.authorize)(['stock_transfer:manage']), (0, validate_1.validate)(inventory_schema_1.rejectStockTransferSchema), controller.rejectStockTransfer);
router.post('/stock-transfers/:id/cancel', (0, authorize_1.authorize)(['stock_transfer:manage']), (0, validate_1.validate)(inventory_schema_1.cancelStockTransferSchema), controller.cancelStockTransfer);
/* ------------------------------------------------------------------ */
/*  Reports                                                           */
/* ------------------------------------------------------------------ */
router.get('/dashboard', (0, validate_1.validate)(inventory_schema_1.dashboardSchema), controller.getDashboard);
router.get('/expiry-tracker', (0, validate_1.validate)(inventory_schema_1.expiryTrackerSchema), controller.getExpiryTracker);
router.get('/low-stock', (0, validate_1.validate)(inventory_schema_1.lowStockSchema), controller.getLowStock);
exports.inventoryRoutes = router;
