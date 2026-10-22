import { inventoryRepository } from './inventory.repository';

export class InventoryService {
  /* ================================================================== */
  /*  Item Categories                                                   */
  /* ================================================================== */

  async listSuppliers(params: any) {
    return inventoryRepository.listSuppliers(params);
  }

  async getSupplier(id: string) {
    return inventoryRepository.getSupplier(id);
  }

  async createSupplier(payload: any, createdBy?: string) {
    return inventoryRepository.createSupplier({
      ...payload,
      created_by: createdBy,
      updated_by: createdBy,
    });
  }

  async updateSupplier(id: string, payload: any, updatedBy?: string) {
    return inventoryRepository.updateSupplier(id, {
      ...payload,
      updated_by: updatedBy,
    });
  }

  async deleteSupplier(id: string) {
    return inventoryRepository.deleteSupplier(id);
  }

  /* ================================================================== */
  /*  Item Categories                                                   */
  /* ================================================================== */

  async listCategories(params: any) {
    return inventoryRepository.listCategories(params);
  }

  async getCategory(id: string) {
    return inventoryRepository.getCategory(id);
  }

  async createCategory(payload: any, createdBy?: string) {
    return inventoryRepository.createCategory({
      ...payload,
      created_by: createdBy,
      updated_by: createdBy,
    });
  }

  async updateCategory(id: string, payload: any, updatedBy?: string) {
    return inventoryRepository.updateCategory(id, {
      ...payload,
      updated_by: updatedBy,
    });
  }

  async deleteCategory(id: string) {
    return inventoryRepository.deleteCategory(id);
  }

  /* ================================================================== */
  /*  Items                                                             */
  /* ================================================================== */

  async listItems(params: any) {
    return inventoryRepository.listItems(params);
  }

  async getItem(id: string) {
    return inventoryRepository.getItem(id);
  }

  async createItem(payload: any, createdBy?: string) {
    return inventoryRepository.createItem({
      ...payload,
      created_by: createdBy,
      updated_by: createdBy,
    });
  }

  async updateItem(id: string, payload: any, updatedBy?: string) {
    return inventoryRepository.updateItem(id, {
      ...payload,
      updated_by: updatedBy,
    });
  }

  async deleteItem(id: string) {
    return inventoryRepository.deleteItem(id);
  }

  /* ================================================================== */
  /*  Stores                                                            */
  /* ================================================================== */

  async listStores(params: any) {
    return inventoryRepository.listStores(params);
  }

  async getStore(id: string) {
    return inventoryRepository.getStore(id);
  }

  async createStore(payload: any, createdBy?: string) {
    return inventoryRepository.createStore({
      ...payload,
      created_by: createdBy,
      updated_by: createdBy,
    });
  }

  async updateStore(id: string, payload: any, updatedBy?: string) {
    return inventoryRepository.updateStore(id, {
      ...payload,
      updated_by: updatedBy,
    });
  }

  async deleteStore(id: string) {
    return inventoryRepository.deleteStore(id);
  }

  /* ================================================================== */
  /*  Stock Batches                                                     */
  /* ================================================================== */

  async listStockBatches(params: any) {
    return inventoryRepository.listStockBatches(params);
  }

  /* ================================================================== */
  /*  Stock Movements                                                   */
  /* ================================================================== */

  async listStockMovements(params: any) {
    return inventoryRepository.listStockMovements(params);
  }

  /* ================================================================== */
  /*  Stock Adjustment                                                  */
  /* ================================================================== */

  async adjustStock(payload: any, movedBy?: string) {
    const { movement_type, quantity, ...rest } = payload;
    return inventoryRepository.createStockAdjustment({
      ...rest,
      movement_type,
      quantity,
      moved_by: movedBy,
    });
  }

  /* ================================================================== */
  /*  Stock Write-off                                                   */
  /* ================================================================== */

  async writeOffStock(payload: any, movedBy?: string) {
    const { reason, quantity, ...rest } = payload;
    return inventoryRepository.createStockWriteOff({
      ...rest,
      reason,
      quantity,
      moved_by: movedBy,
    });
  }

  /* ================================================================== */
  /*  Purchase Orders                                                   */
  /* ================================================================== */

  async listPurchaseOrders(params: any) {
    return inventoryRepository.listPurchaseOrders(params);
  }

  async getPurchaseOrder(id: string) {
    return inventoryRepository.getPurchaseOrder(id);
  }

  async createPurchaseOrder(payload: any, createdBy?: string) {
    return inventoryRepository.createPurchaseOrder({
      ...payload,
      created_by: createdBy,
    });
  }

  async updatePurchaseOrder(id: string, payload: any, updatedBy?: string) {
    return inventoryRepository.updatePurchaseOrder(id, {
      ...payload,
      updated_by: updatedBy,
    });
  }

  async deletePurchaseOrder(id: string) {
    return inventoryRepository.deletePurchaseOrder(id);
  }

  async approvePurchaseOrder(id: string, approvedBy?: string) {
    return inventoryRepository.approvePurchaseOrder(id, approvedBy);
  }

  async sendPurchaseOrder(id: string) {
    return inventoryRepository.sendPurchaseOrder(id);
  }

  async cancelPurchaseOrder(id: string) {
    return inventoryRepository.cancelPurchaseOrder(id);
  }

  /* ================================================================== */
  /*  Goods Receipts                                                    */
  /* ================================================================== */

  async listGoodsReceipts(params: any) {
    return inventoryRepository.listGoodsReceipts(params);
  }

  async getGoodsReceipt(id: string) {
    return inventoryRepository.getGoodsReceipt(id);
  }

  async createGoodsReceipt(payload: any, createdBy?: string) {
    return inventoryRepository.createGoodsReceipt({
      ...payload,
      created_by: createdBy,
    });
  }

  async postGoodsReceipt(id: string, postedBy?: string) {
    return inventoryRepository.postGoodsReceipt(id, postedBy);
  }

  async cancelGoodsReceipt(id: string) {
    return inventoryRepository.cancelGoodsReceipt(id);
  }

  /* ================================================================== */
  /*  Stock Transfers                                                   */
  /* ================================================================== */

  async listStockTransfers(params: any) {
    return inventoryRepository.listStockTransfers(params);
  }

  async getStockTransfer(id: string) {
    return inventoryRepository.getStockTransfer(id);
  }

  async createStockTransfer(payload: any, createdBy?: string) {
    return inventoryRepository.createStockTransfer({
      ...payload,
      created_by: createdBy,
    });
  }

  async approveStockTransfer(id: string, approvedBy?: string) {
    return inventoryRepository.approveStockTransfer(id, approvedBy);
  }

  async receiveStockTransfer(id: string, receivedBy?: string) {
    return inventoryRepository.receiveStockTransfer(id, receivedBy);
  }

  async rejectStockTransfer(id: string) {
    return inventoryRepository.rejectStockTransfer(id);
  }

  async cancelStockTransfer(id: string) {
    return inventoryRepository.cancelStockTransfer(id);
  }

  /* ================================================================== */
  /*  Reports                                                           */
  /* ================================================================== */

  async getDashboard(params: any) {
    return inventoryRepository.getDashboard(params);
  }

  async getExpiryTracker(params: any) {
    return inventoryRepository.getExpiryTracker(params);
  }

  async getLowStock(params: any) {
    return inventoryRepository.getLowStock(params);
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
