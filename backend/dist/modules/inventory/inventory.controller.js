"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const response_1 = require("../../shared/utils/response");
const inventory_service_1 = require("./inventory.service");
const num = (v, def) => {
    if (v === undefined || v === null)
        return def;
    const arr = Array.isArray(v) ? v : [v];
    const parsed = parseInt(arr[0], 10);
    return Number.isNaN(parsed) ? def : parsed;
};
const str = (v) => {
    if (v === undefined || v === null)
        return undefined;
    const arr = Array.isArray(v) ? v : [v];
    return String(arr[0]);
};
class InventoryController {
    /* ================================================================== */
    /*  Suppliers                                                         */
    /* ================================================================== */
    getSuppliers = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listSuppliers(req.query);
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getSupplier = async (req, res) => {
        const supplier = await inventory_service_1.inventoryService.getSupplier(String(req.params.id));
        (0, response_1.sendSuccess)(res, supplier, 'Supplier retrieved successfully');
    };
    createSupplier = async (req, res) => {
        const userId = req.user?.userId;
        const supplier = await inventory_service_1.inventoryService.createSupplier(req.body, userId);
        (0, response_1.sendSuccess)(res, supplier, 'Supplier created successfully', 201);
    };
    updateSupplier = async (req, res) => {
        const userId = req.user?.userId;
        const supplier = await inventory_service_1.inventoryService.updateSupplier(String(req.params.id), req.body, userId);
        (0, response_1.sendSuccess)(res, supplier, 'Supplier updated successfully');
    };
    deleteSupplier = async (req, res) => {
        await inventory_service_1.inventoryService.deleteSupplier(String(req.params.id));
        (0, response_1.sendSuccess)(res, { id: req.params.id }, 'Supplier deleted successfully');
    };
    /* ================================================================== */
    /*  Item Categories                                                   */
    /* ================================================================== */
    getCategories = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listCategories({
            organization_id: str(req.query.organization_id),
            is_active: str(req.query.is_active),
            search: str(req.query.search),
            page: num(req.query.page, 1),
            limit: num(req.query.limit, 50),
        });
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getCategory = async (req, res) => {
        const category = await inventory_service_1.inventoryService.getCategory(String(String(req.params.id)));
        (0, response_1.sendSuccess)(res, category, 'Item category retrieved successfully');
    };
    createCategory = async (req, res) => {
        const userId = req.user?.userId;
        const category = await inventory_service_1.inventoryService.createCategory(req.body, userId);
        (0, response_1.sendSuccess)(res, category, 'Item category created successfully', 201);
    };
    updateCategory = async (req, res) => {
        const userId = req.user?.userId;
        const category = await inventory_service_1.inventoryService.updateCategory(String(String(req.params.id)), req.body, userId);
        (0, response_1.sendSuccess)(res, category, 'Item category updated successfully');
    };
    deleteCategory = async (req, res) => {
        await inventory_service_1.inventoryService.deleteCategory(String(String(req.params.id)));
        (0, response_1.sendSuccess)(res, { id: String(req.params.id) }, 'Item category deleted successfully');
    };
    /* ================================================================== */
    /*  Items                                                             */
    /* ================================================================== */
    getItems = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listItems({
            organization_id: str(req.query.organization_id),
            facility_id: str(req.query.facility_id),
            store_id: str(req.query.store_id),
            category_id: str(req.query.category_id),
            item_type: str(req.query.item_type),
            is_active: str(req.query.is_active),
            low_stock: str(req.query.low_stock),
            search: str(req.query.search),
            page: num(req.query.page, 1),
            limit: num(req.query.limit, 50),
        });
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getItem = async (req, res) => {
        const item = await inventory_service_1.inventoryService.getItem(String(req.params.id));
        (0, response_1.sendSuccess)(res, item, 'Item retrieved successfully');
    };
    createItem = async (req, res) => {
        const userId = req.user?.userId;
        const item = await inventory_service_1.inventoryService.createItem(req.body, userId);
        (0, response_1.sendSuccess)(res, item, 'Item created successfully', 201);
    };
    updateItem = async (req, res) => {
        const userId = req.user?.userId;
        const item = await inventory_service_1.inventoryService.updateItem(String(req.params.id), req.body, userId);
        (0, response_1.sendSuccess)(res, item, 'Item updated successfully');
    };
    deleteItem = async (req, res) => {
        await inventory_service_1.inventoryService.deleteItem(String(req.params.id));
        (0, response_1.sendSuccess)(res, { id: String(req.params.id) }, 'Item deleted successfully');
    };
    /* ================================================================== */
    /*  Stores                                                            */
    /* ================================================================== */
    getStores = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listStores({
            organization_id: str(req.query.organization_id),
            facility_id: str(req.query.facility_id),
            store_type: str(req.query.store_type),
            is_active: str(req.query.is_active),
            page: num(req.query.page, 1),
            limit: num(req.query.limit, 50),
        });
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getStore = async (req, res) => {
        const store = await inventory_service_1.inventoryService.getStore(String(req.params.id));
        (0, response_1.sendSuccess)(res, store, 'Store retrieved successfully');
    };
    createStore = async (req, res) => {
        const userId = req.user?.userId;
        const store = await inventory_service_1.inventoryService.createStore(req.body, userId);
        (0, response_1.sendSuccess)(res, store, 'Store created successfully', 201);
    };
    updateStore = async (req, res) => {
        const userId = req.user?.userId;
        const store = await inventory_service_1.inventoryService.updateStore(String(req.params.id), req.body, userId);
        (0, response_1.sendSuccess)(res, store, 'Store updated successfully');
    };
    deleteStore = async (req, res) => {
        await inventory_service_1.inventoryService.deleteStore(String(req.params.id));
        (0, response_1.sendSuccess)(res, { id: String(req.params.id) }, 'Store deleted successfully');
    };
    /* ================================================================== */
    /*  Stock Batches                                                     */
    /* ================================================================== */
    getStockBatches = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listStockBatches({
            organization_id: str(req.query.organization_id),
            facility_id: str(req.query.facility_id),
            store_id: str(req.query.store_id),
            item_id: str(req.query.item_id),
            status: str(req.query.status),
            expiry_before: str(req.query.expiry_before),
            expiry_after: str(req.query.expiry_after),
            low_stock: str(req.query.low_stock),
            search: str(req.query.search),
            page: num(req.query.page, 1),
            limit: num(req.query.limit, 50),
        });
        (0, response_1.sendPaginated)(res, data, meta);
    };
    /* ================================================================== */
    /*  Stock Movements                                                   */
    /* ================================================================== */
    getStockMovements = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listStockMovements({
            organization_id: str(req.query.organization_id),
            facility_id: str(req.query.facility_id),
            store_id: str(req.query.store_id),
            item_id: str(req.query.item_id),
            batch_id: str(req.query.batch_id),
            movement_type: str(req.query.movement_type),
            from_date: str(req.query.from_date),
            to_date: str(req.query.to_date),
            reference_type: str(req.query.reference_type),
            page: num(req.query.page, 1),
            limit: num(req.query.limit, 50),
        });
        (0, response_1.sendPaginated)(res, data, meta);
    };
    /* ================================================================== */
    /*  Stock Adjustment                                                  */
    /* ================================================================== */
    adjustStock = async (req, res) => {
        const userId = req.user?.userId;
        const movement = await inventory_service_1.inventoryService.adjustStock(req.body, userId);
        (0, response_1.sendSuccess)(res, movement, 'Stock adjusted successfully', 201);
    };
    /* ================================================================== */
    /*  Stock Write-off                                                   */
    /* ================================================================== */
    writeOffStock = async (req, res) => {
        const userId = req.user?.userId;
        const movement = await inventory_service_1.inventoryService.writeOffStock(req.body, userId);
        (0, response_1.sendSuccess)(res, movement, 'Stock written off successfully', 201);
    };
    /* ================================================================== */
    /*  Purchase Orders                                                   */
    /* ================================================================== */
    getPurchaseOrders = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listPurchaseOrders(req.query);
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getPurchaseOrder = async (req, res) => {
        const po = await inventory_service_1.inventoryService.getPurchaseOrder(String(req.params.id));
        (0, response_1.sendSuccess)(res, po, 'Purchase order retrieved successfully');
    };
    createPurchaseOrder = async (req, res) => {
        const userId = req.user?.userId;
        const po = await inventory_service_1.inventoryService.createPurchaseOrder(req.body, userId);
        (0, response_1.sendSuccess)(res, po, 'Purchase order created successfully', 201);
    };
    updatePurchaseOrder = async (req, res) => {
        const userId = req.user?.userId;
        const po = await inventory_service_1.inventoryService.updatePurchaseOrder(String(req.params.id), req.body, userId);
        (0, response_1.sendSuccess)(res, po, 'Purchase order updated successfully');
    };
    deletePurchaseOrder = async (req, res) => {
        await inventory_service_1.inventoryService.deletePurchaseOrder(String(req.params.id));
        (0, response_1.sendSuccess)(res, { id: req.params.id }, 'Purchase order deleted successfully');
    };
    approvePurchaseOrder = async (req, res) => {
        const userId = req.user?.userId;
        const po = await inventory_service_1.inventoryService.approvePurchaseOrder(String(req.params.id), userId);
        (0, response_1.sendSuccess)(res, po, 'Purchase order approved successfully');
    };
    sendPurchaseOrder = async (req, res) => {
        const po = await inventory_service_1.inventoryService.sendPurchaseOrder(String(req.params.id));
        (0, response_1.sendSuccess)(res, po, 'Purchase order sent successfully');
    };
    cancelPurchaseOrder = async (req, res) => {
        const po = await inventory_service_1.inventoryService.cancelPurchaseOrder(String(req.params.id));
        (0, response_1.sendSuccess)(res, po, 'Purchase order cancelled successfully');
    };
    /* ================================================================== */
    /*  Goods Receipts                                                    */
    /* ================================================================== */
    getGoodsReceipts = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listGoodsReceipts(req.query);
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getGoodsReceipt = async (req, res) => {
        const gr = await inventory_service_1.inventoryService.getGoodsReceipt(String(req.params.id));
        (0, response_1.sendSuccess)(res, gr, 'Goods receipt retrieved successfully');
    };
    createGoodsReceipt = async (req, res) => {
        const userId = req.user?.userId;
        const gr = await inventory_service_1.inventoryService.createGoodsReceipt(req.body, userId);
        (0, response_1.sendSuccess)(res, gr, 'Goods receipt created successfully', 201);
    };
    postGoodsReceipt = async (req, res) => {
        const userId = req.user?.userId;
        const result = await inventory_service_1.inventoryService.postGoodsReceipt(String(req.params.id), userId);
        (0, response_1.sendSuccess)(res, result, 'Goods receipt posted successfully');
    };
    cancelGoodsReceipt = async (req, res) => {
        const gr = await inventory_service_1.inventoryService.cancelGoodsReceipt(String(req.params.id));
        (0, response_1.sendSuccess)(res, gr, 'Goods receipt cancelled successfully');
    };
    /* ================================================================== */
    /*  Stock Transfers                                                   */
    /* ================================================================== */
    getStockTransfers = async (req, res) => {
        const { data, meta } = await inventory_service_1.inventoryService.listStockTransfers(req.query);
        (0, response_1.sendPaginated)(res, data, meta);
    };
    getStockTransfer = async (req, res) => {
        const tr = await inventory_service_1.inventoryService.getStockTransfer(String(req.params.id));
        (0, response_1.sendSuccess)(res, tr, 'Stock transfer retrieved successfully');
    };
    createStockTransfer = async (req, res) => {
        const userId = req.user?.userId;
        const tr = await inventory_service_1.inventoryService.createStockTransfer(req.body, userId);
        (0, response_1.sendSuccess)(res, tr, 'Stock transfer created successfully', 201);
    };
    approveStockTransfer = async (req, res) => {
        const userId = req.user?.userId;
        const tr = await inventory_service_1.inventoryService.approveStockTransfer(String(req.params.id), userId);
        (0, response_1.sendSuccess)(res, tr, 'Stock transfer approved successfully');
    };
    receiveStockTransfer = async (req, res) => {
        const userId = req.user?.userId;
        const result = await inventory_service_1.inventoryService.receiveStockTransfer(String(req.params.id), userId);
        (0, response_1.sendSuccess)(res, result, 'Stock transfer received successfully');
    };
    rejectStockTransfer = async (req, res) => {
        const tr = await inventory_service_1.inventoryService.rejectStockTransfer(String(req.params.id));
        (0, response_1.sendSuccess)(res, tr, 'Stock transfer rejected successfully');
    };
    cancelStockTransfer = async (req, res) => {
        const tr = await inventory_service_1.inventoryService.cancelStockTransfer(String(req.params.id));
        (0, response_1.sendSuccess)(res, tr, 'Stock transfer cancelled successfully');
    };
    /* ================================================================== */
    /*  Reports                                                           */
    /* ================================================================== */
    getDashboard = async (req, res) => {
        const data = await inventory_service_1.inventoryService.getDashboard(req.query);
        (0, response_1.sendSuccess)(res, data, 'Dashboard data retrieved successfully');
    };
    getExpiryTracker = async (req, res) => {
        const data = await inventory_service_1.inventoryService.getExpiryTracker(req.query);
        (0, response_1.sendSuccess)(res, data, 'Expiry tracker retrieved successfully');
    };
    getLowStock = async (req, res) => {
        const data = await inventory_service_1.inventoryService.getLowStock(req.query);
        (0, response_1.sendSuccess)(res, data, 'Low stock report retrieved successfully');
    };
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
exports.default = exports.inventoryController;
