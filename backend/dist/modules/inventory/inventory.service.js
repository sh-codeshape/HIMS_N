"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const inventory_repository_1 = require("./inventory.repository");
class InventoryService {
    /* ================================================================== */
    /*  Item Categories                                                   */
    /* ================================================================== */
    async listSuppliers(params) {
        return inventory_repository_1.inventoryRepository.listSuppliers(params);
    }
    async getSupplier(id) {
        return inventory_repository_1.inventoryRepository.getSupplier(id);
    }
    async createSupplier(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createSupplier({
            ...payload,
            created_by: createdBy,
            updated_by: createdBy,
        });
    }
    async updateSupplier(id, payload, updatedBy) {
        return inventory_repository_1.inventoryRepository.updateSupplier(id, {
            ...payload,
            updated_by: updatedBy,
        });
    }
    async deleteSupplier(id) {
        return inventory_repository_1.inventoryRepository.deleteSupplier(id);
    }
    /* ================================================================== */
    /*  Item Categories                                                   */
    /* ================================================================== */
    async listCategories(params) {
        return inventory_repository_1.inventoryRepository.listCategories(params);
    }
    async getCategory(id) {
        return inventory_repository_1.inventoryRepository.getCategory(id);
    }
    async createCategory(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createCategory({
            ...payload,
            created_by: createdBy,
            updated_by: createdBy,
        });
    }
    async updateCategory(id, payload, updatedBy) {
        return inventory_repository_1.inventoryRepository.updateCategory(id, {
            ...payload,
            updated_by: updatedBy,
        });
    }
    async deleteCategory(id) {
        return inventory_repository_1.inventoryRepository.deleteCategory(id);
    }
    /* ================================================================== */
    /*  Items                                                             */
    /* ================================================================== */
    async listItems(params) {
        return inventory_repository_1.inventoryRepository.listItems(params);
    }
    async getItem(id) {
        return inventory_repository_1.inventoryRepository.getItem(id);
    }
    async createItem(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createItem({
            ...payload,
            created_by: createdBy,
            updated_by: createdBy,
        });
    }
    async updateItem(id, payload, updatedBy) {
        return inventory_repository_1.inventoryRepository.updateItem(id, {
            ...payload,
            updated_by: updatedBy,
        });
    }
    async deleteItem(id) {
        return inventory_repository_1.inventoryRepository.deleteItem(id);
    }
    /* ================================================================== */
    /*  Stores                                                            */
    /* ================================================================== */
    async listStores(params) {
        return inventory_repository_1.inventoryRepository.listStores(params);
    }
    async getStore(id) {
        return inventory_repository_1.inventoryRepository.getStore(id);
    }
    async createStore(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createStore({
            ...payload,
            created_by: createdBy,
            updated_by: createdBy,
        });
    }
    async updateStore(id, payload, updatedBy) {
        return inventory_repository_1.inventoryRepository.updateStore(id, {
            ...payload,
            updated_by: updatedBy,
        });
    }
    async deleteStore(id) {
        return inventory_repository_1.inventoryRepository.deleteStore(id);
    }
    /* ================================================================== */
    /*  Stock Batches                                                     */
    /* ================================================================== */
    async listStockBatches(params) {
        return inventory_repository_1.inventoryRepository.listStockBatches(params);
    }
    /* ================================================================== */
    /*  Stock Movements                                                   */
    /* ================================================================== */
    async listStockMovements(params) {
        return inventory_repository_1.inventoryRepository.listStockMovements(params);
    }
    /* ================================================================== */
    /*  Stock Adjustment                                                  */
    /* ================================================================== */
    async adjustStock(payload, movedBy) {
        const { movement_type, quantity, ...rest } = payload;
        return inventory_repository_1.inventoryRepository.createStockAdjustment({
            ...rest,
            movement_type,
            quantity,
            moved_by: movedBy,
        });
    }
    /* ================================================================== */
    /*  Stock Write-off                                                   */
    /* ================================================================== */
    async writeOffStock(payload, movedBy) {
        const { reason, quantity, ...rest } = payload;
        return inventory_repository_1.inventoryRepository.createStockWriteOff({
            ...rest,
            reason,
            quantity,
            moved_by: movedBy,
        });
    }
    /* ================================================================== */
    /*  Purchase Orders                                                   */
    /* ================================================================== */
    async listPurchaseOrders(params) {
        return inventory_repository_1.inventoryRepository.listPurchaseOrders(params);
    }
    async getPurchaseOrder(id) {
        return inventory_repository_1.inventoryRepository.getPurchaseOrder(id);
    }
    async createPurchaseOrder(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createPurchaseOrder({
            ...payload,
            created_by: createdBy,
        });
    }
    async updatePurchaseOrder(id, payload, updatedBy) {
        return inventory_repository_1.inventoryRepository.updatePurchaseOrder(id, {
            ...payload,
            updated_by: updatedBy,
        });
    }
    async deletePurchaseOrder(id) {
        return inventory_repository_1.inventoryRepository.deletePurchaseOrder(id);
    }
    async approvePurchaseOrder(id, approvedBy) {
        return inventory_repository_1.inventoryRepository.approvePurchaseOrder(id, approvedBy);
    }
    async sendPurchaseOrder(id) {
        return inventory_repository_1.inventoryRepository.sendPurchaseOrder(id);
    }
    async cancelPurchaseOrder(id) {
        return inventory_repository_1.inventoryRepository.cancelPurchaseOrder(id);
    }
    /* ================================================================== */
    /*  Goods Receipts                                                    */
    /* ================================================================== */
    async listGoodsReceipts(params) {
        return inventory_repository_1.inventoryRepository.listGoodsReceipts(params);
    }
    async getGoodsReceipt(id) {
        return inventory_repository_1.inventoryRepository.getGoodsReceipt(id);
    }
    async createGoodsReceipt(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createGoodsReceipt({
            ...payload,
            created_by: createdBy,
        });
    }
    async postGoodsReceipt(id, postedBy) {
        return inventory_repository_1.inventoryRepository.postGoodsReceipt(id, postedBy);
    }
    async cancelGoodsReceipt(id) {
        return inventory_repository_1.inventoryRepository.cancelGoodsReceipt(id);
    }
    /* ================================================================== */
    /*  Stock Transfers                                                   */
    /* ================================================================== */
    async listStockTransfers(params) {
        return inventory_repository_1.inventoryRepository.listStockTransfers(params);
    }
    async getStockTransfer(id) {
        return inventory_repository_1.inventoryRepository.getStockTransfer(id);
    }
    async createStockTransfer(payload, createdBy) {
        return inventory_repository_1.inventoryRepository.createStockTransfer({
            ...payload,
            created_by: createdBy,
        });
    }
    async approveStockTransfer(id, approvedBy) {
        return inventory_repository_1.inventoryRepository.approveStockTransfer(id, approvedBy);
    }
    async receiveStockTransfer(id, receivedBy) {
        return inventory_repository_1.inventoryRepository.receiveStockTransfer(id, receivedBy);
    }
    async rejectStockTransfer(id) {
        return inventory_repository_1.inventoryRepository.rejectStockTransfer(id);
    }
    async cancelStockTransfer(id) {
        return inventory_repository_1.inventoryRepository.cancelStockTransfer(id);
    }
    /* ================================================================== */
    /*  Reports                                                           */
    /* ================================================================== */
    async getDashboard(params) {
        return inventory_repository_1.inventoryRepository.getDashboard(params);
    }
    async getExpiryTracker(params) {
        return inventory_repository_1.inventoryRepository.getExpiryTracker(params);
    }
    async getLowStock(params) {
        return inventory_repository_1.inventoryRepository.getLowStock(params);
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
exports.default = exports.inventoryService;
