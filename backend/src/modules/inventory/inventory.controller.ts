import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../shared/utils/response';
import { inventoryService } from './inventory.service';

const num = (v: any, def: number): number => {
  if (v === undefined || v === null) return def;
  const arr = Array.isArray(v) ? v : [v];
  const parsed = parseInt(arr[0], 10);
  return Number.isNaN(parsed) ? def : parsed;
};

const str = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const arr = Array.isArray(v) ? v : [v];
  return String(arr[0]);
};

export class InventoryController {
  /* ================================================================== */
  /*  Suppliers                                                         */
  /* ================================================================== */

  getSuppliers = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listSuppliers(req.query);
    sendPaginated(res, data, meta);
  };

  getSupplier = async (req: Request, res: Response) => {
    const supplier = await inventoryService.getSupplier(String(req.params.id));
    sendSuccess(res, supplier, 'Supplier retrieved successfully');
  };

  createSupplier = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const supplier = await inventoryService.createSupplier(req.body, userId);
    sendSuccess(res, supplier, 'Supplier created successfully', 201);
  };

  updateSupplier = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const supplier = await inventoryService.updateSupplier(String(req.params.id), req.body, userId);
    sendSuccess(res, supplier, 'Supplier updated successfully');
  };

  deleteSupplier = async (req: Request, res: Response) => {
    await inventoryService.deleteSupplier(String(req.params.id));
    sendSuccess(res, { id: req.params.id }, 'Supplier deleted successfully');
  };

  /* ================================================================== */
  /*  Item Categories                                                   */
  /* ================================================================== */

  getCategories = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listCategories({
      organization_id: str(req.query.organization_id),
      is_active: str(req.query.is_active),
      search: str(req.query.search),
      page: num(req.query.page, 1),
      limit: num(req.query.limit, 50),
    });
    sendPaginated(res, data, meta);
  };

  getCategory = async (req: Request, res: Response) => {
    const category = await inventoryService.getCategory(String(String(req.params.id)));
    sendSuccess(res, category, 'Item category retrieved successfully');
  };

  createCategory = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const category = await inventoryService.createCategory(req.body, userId);
    sendSuccess(res, category, 'Item category created successfully', 201);
  };

  updateCategory = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const category = await inventoryService.updateCategory(String(String(req.params.id)), req.body, userId);
    sendSuccess(res, category, 'Item category updated successfully');
  };

  deleteCategory = async (req: Request, res: Response) => {
    await inventoryService.deleteCategory(String(String(req.params.id)));
    sendSuccess(res, { id: String(req.params.id) }, 'Item category deleted successfully');
  };

  /* ================================================================== */
  /*  Items                                                             */
  /* ================================================================== */

  getItems = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listItems({
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
    sendPaginated(res, data, meta);
  };

  getItem = async (req: Request, res: Response) => {
    const item = await inventoryService.getItem(String(req.params.id));
    sendSuccess(res, item, 'Item retrieved successfully');
  };

  createItem = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const item = await inventoryService.createItem(req.body, userId);
    sendSuccess(res, item, 'Item created successfully', 201);
  };

  updateItem = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const item = await inventoryService.updateItem(String(req.params.id), req.body, userId);
    sendSuccess(res, item, 'Item updated successfully');
  };

  deleteItem = async (req: Request, res: Response) => {
    await inventoryService.deleteItem(String(req.params.id));
    sendSuccess(res, { id: String(req.params.id) }, 'Item deleted successfully');
  };

  /* ================================================================== */
  /*  Stores                                                            */
  /* ================================================================== */

  getStores = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listStores({
      organization_id: str(req.query.organization_id),
      facility_id: str(req.query.facility_id),
      store_type: str(req.query.store_type),
      is_active: str(req.query.is_active),
      page: num(req.query.page, 1),
      limit: num(req.query.limit, 50),
    });
    sendPaginated(res, data, meta);
  };

  getStore = async (req: Request, res: Response) => {
    const store = await inventoryService.getStore(String(req.params.id));
    sendSuccess(res, store, 'Store retrieved successfully');
  };

  createStore = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const store = await inventoryService.createStore(req.body, userId);
    sendSuccess(res, store, 'Store created successfully', 201);
  };

  updateStore = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const store = await inventoryService.updateStore(String(req.params.id), req.body, userId);
    sendSuccess(res, store, 'Store updated successfully');
  };

  deleteStore = async (req: Request, res: Response) => {
    await inventoryService.deleteStore(String(req.params.id));
    sendSuccess(res, { id: String(req.params.id) }, 'Store deleted successfully');
  };

  /* ================================================================== */
  /*  Stock Batches                                                     */
  /* ================================================================== */

  getStockBatches = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listStockBatches({
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
    sendPaginated(res, data, meta);
  };

  /* ================================================================== */
  /*  Stock Movements                                                   */
  /* ================================================================== */

  getStockMovements = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listStockMovements({
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
    sendPaginated(res, data, meta);
  };

  /* ================================================================== */
  /*  Stock Adjustment                                                  */
  /* ================================================================== */

  adjustStock = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const movement = await inventoryService.adjustStock(req.body, userId);
    sendSuccess(res, movement, 'Stock adjusted successfully', 201);
  };

  /* ================================================================== */
  /*  Stock Write-off                                                   */
  /* ================================================================== */

  writeOffStock = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const movement = await inventoryService.writeOffStock(req.body, userId);
    sendSuccess(res, movement, 'Stock written off successfully', 201);
  };

  /* ================================================================== */
  /*  Purchase Orders                                                   */
  /* ================================================================== */

  getPurchaseOrders = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listPurchaseOrders(req.query);
    sendPaginated(res, data, meta);
  };

  getPurchaseOrder = async (req: Request, res: Response) => {
    const po = await inventoryService.getPurchaseOrder(String(req.params.id));
    sendSuccess(res, po, 'Purchase order retrieved successfully');
  };

  createPurchaseOrder = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const po = await inventoryService.createPurchaseOrder(req.body, userId);
    sendSuccess(res, po, 'Purchase order created successfully', 201);
  };

  updatePurchaseOrder = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const po = await inventoryService.updatePurchaseOrder(String(req.params.id), req.body, userId);
    sendSuccess(res, po, 'Purchase order updated successfully');
  };

  deletePurchaseOrder = async (req: Request, res: Response) => {
    await inventoryService.deletePurchaseOrder(String(req.params.id));
    sendSuccess(res, { id: req.params.id }, 'Purchase order deleted successfully');
  };

  approvePurchaseOrder = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const po = await inventoryService.approvePurchaseOrder(String(req.params.id), userId);
    sendSuccess(res, po, 'Purchase order approved successfully');
  };

  sendPurchaseOrder = async (req: Request, res: Response) => {
    const po = await inventoryService.sendPurchaseOrder(String(req.params.id));
    sendSuccess(res, po, 'Purchase order sent successfully');
  };

  cancelPurchaseOrder = async (req: Request, res: Response) => {
    const po = await inventoryService.cancelPurchaseOrder(String(req.params.id));
    sendSuccess(res, po, 'Purchase order cancelled successfully');
  };

  /* ================================================================== */
  /*  Goods Receipts                                                    */
  /* ================================================================== */

  getGoodsReceipts = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listGoodsReceipts(req.query);
    sendPaginated(res, data, meta);
  };

  getGoodsReceipt = async (req: Request, res: Response) => {
    const gr = await inventoryService.getGoodsReceipt(String(req.params.id));
    sendSuccess(res, gr, 'Goods receipt retrieved successfully');
  };

  createGoodsReceipt = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const gr = await inventoryService.createGoodsReceipt(req.body, userId);
    sendSuccess(res, gr, 'Goods receipt created successfully', 201);
  };

  postGoodsReceipt = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await inventoryService.postGoodsReceipt(String(req.params.id), userId);
    sendSuccess(res, result, 'Goods receipt posted successfully');
  };

  cancelGoodsReceipt = async (req: Request, res: Response) => {
    const gr = await inventoryService.cancelGoodsReceipt(String(req.params.id));
    sendSuccess(res, gr, 'Goods receipt cancelled successfully');
  };

  /* ================================================================== */
  /*  Stock Transfers                                                   */
  /* ================================================================== */

  getStockTransfers = async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listStockTransfers(req.query);
    sendPaginated(res, data, meta);
  };

  getStockTransfer = async (req: Request, res: Response) => {
    const tr = await inventoryService.getStockTransfer(String(req.params.id));
    sendSuccess(res, tr, 'Stock transfer retrieved successfully');
  };

  createStockTransfer = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const tr = await inventoryService.createStockTransfer(req.body, userId);
    sendSuccess(res, tr, 'Stock transfer created successfully', 201);
  };

  approveStockTransfer = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const tr = await inventoryService.approveStockTransfer(String(req.params.id), userId);
    sendSuccess(res, tr, 'Stock transfer approved successfully');
  };

  receiveStockTransfer = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await inventoryService.receiveStockTransfer(String(req.params.id), userId);
    sendSuccess(res, result, 'Stock transfer received successfully');
  };

  rejectStockTransfer = async (req: Request, res: Response) => {
    const tr = await inventoryService.rejectStockTransfer(String(req.params.id));
    sendSuccess(res, tr, 'Stock transfer rejected successfully');
  };

  cancelStockTransfer = async (req: Request, res: Response) => {
    const tr = await inventoryService.cancelStockTransfer(String(req.params.id));
    sendSuccess(res, tr, 'Stock transfer cancelled successfully');
  };

  /* ================================================================== */
  /*  Reports                                                           */
  /* ================================================================== */

  getDashboard = async (req: Request, res: Response) => {
    const data = await inventoryService.getDashboard(req.query);
    sendSuccess(res, data, 'Dashboard data retrieved successfully');
  };

  getExpiryTracker = async (req: Request, res: Response) => {
    const data = await inventoryService.getExpiryTracker(req.query);
    sendSuccess(res, data, 'Expiry tracker retrieved successfully');
  };

  getLowStock = async (req: Request, res: Response) => {
    const data = await inventoryService.getLowStock(req.query);
    sendSuccess(res, data, 'Low stock report retrieved successfully');
  };
}

export const inventoryController = new InventoryController();
export default inventoryController;
