import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

const INV = ENDPOINTS.INVENTORY;

const handleList = async (path, params = {}) => {
  const res = await axiosInstance.get(path, { params });
  const body = res?.data ?? {};
  return {
    data: body.data ?? null,
    meta: body.meta ?? { page: 1, limit: 50, total: 0 }
  };
};

const handleItem = async (method, path, id, payload = null) => {
  const url = id ? `${path}/${id}` : path;
  let res;
  if (method === "GET") res = await axiosInstance.get(url);
  else if (method === "POST") res = await axiosInstance.post(url, payload);
  else if (method === "PUT") res = await axiosInstance.put(url, payload);
  else if (method === "DELETE") res = await axiosInstance.delete(url);
  const responseBody = res?.data ?? {};
  return responseBody.data ?? responseBody ?? null;
};

const handleAction = async (method, path, id, payload = null) => {
  const url = id ? `${path}/${id}` : path;
  let res;
  if (method === "POST") res = await axiosInstance.post(url, payload);
  const responseBody = res?.data ?? {};
  return responseBody.data ?? responseBody ?? null;
};

/* ------------------------------------------------------------------ */
/*  Suppliers                                                         */
/* ------------------------------------------------------------------ */
export const inventoryService = {
  // Suppliers
  getSuppliers: (params = {}) => handleList(INV.SUPPLIERS, params),
  getSupplier: (id) => handleItem("GET", INV.SUPPLIERS, id),
  createSupplier: (payload) => handleItem("POST", INV.SUPPLIERS, null, payload),
  updateSupplier: (id, payload) => handleItem("PUT", INV.SUPPLIERS, id, payload),
  deleteSupplier: (id) => handleItem("DELETE", INV.SUPPLIERS, id),

  // Categories
  getCategories: (params = {}) => handleList(INV.CATEGORIES, params),
  getCategory: (id) => handleItem("GET", INV.CATEGORIES, id),
  createCategory: (payload) => handleItem("POST", INV.CATEGORIES, null, payload),
  updateCategory: (id, payload) => handleItem("PUT", INV.CATEGORIES, id, payload),
  deleteCategory: (id) => handleItem("DELETE", INV.CATEGORIES, id),

  // Items
  getItems: (params = {}) => handleList(INV.ITEMS, params),
  getItem: (id) => handleItem("GET", INV.ITEMS, id),
  createItem: (payload) => handleItem("POST", INV.ITEMS, null, payload),
  updateItem: (id, payload) => handleItem("PUT", INV.ITEMS, id, payload),
  deleteItem: (id) => handleItem("DELETE", INV.ITEMS, id),

  // Stores
  getStores: (params = {}) => handleList(INV.STORES, params),
  getStore: (id) => handleItem("GET", INV.STORES, id),
  createStore: (payload) => handleItem("POST", INV.STORES, null, payload),
  updateStore: (id, payload) => handleItem("PUT", INV.STORES, id, payload),
  deleteStore: (id) => handleItem("DELETE", INV.STORES, id),

  // Stock Batches
  getStockBatches: (params = {}) => handleList(INV.STOCK_BATCHES, params),

  // Stock Movements
  getStockMovements: (params = {}) => handleList(INV.STOCK_MOVEMENTS, params),

  // Stock Adjustment
  adjustStock: (payload) =>
    handleItem("POST", INV.STOCK_ADJUSTMENT, null, payload),

  // Stock Write-off
  writeOffStock: (payload) =>
    handleItem("POST", INV.STOCK_WRITE_OFF, null, payload),

  // Purchase Orders
  getPurchaseOrders: (params = {}) => handleList(INV.PURCHASE_ORDERS, params),
  getPurchaseOrder: (id) => handleItem("GET", INV.PURCHASE_ORDERS, id),
  createPurchaseOrder: (payload) =>
    handleItem("POST", INV.PURCHASE_ORDERS, null, payload),
  updatePurchaseOrder: (id, payload) =>
    handleItem("PUT", INV.PURCHASE_ORDERS, id, payload),
  deletePurchaseOrder: (id) => handleItem("DELETE", INV.PURCHASE_ORDERS, id),
  approvePurchaseOrder: (id) =>
    handleAction("POST", INV.PURCHASE_ORDERS, `${id}/approve`),
  sendPurchaseOrder: (id) =>
    handleAction("POST", INV.PURCHASE_ORDERS, `${id}/send`),
  cancelPurchaseOrder: (id) =>
    handleAction("POST", INV.PURCHASE_ORDERS, `${id}/cancel`),

  // Goods Receipts
  getGoodsReceipts: (params = {}) => handleList(INV.GOODS_RECEIPTS, params),
  getGoodsReceipt: (id) => handleItem("GET", INV.GOODS_RECEIPTS, id),
  createGoodsReceipt: (payload) =>
    handleItem("POST", INV.GOODS_RECEIPTS, null, payload),
  postGoodsReceipt: (id) =>
    handleAction("POST", INV.GOODS_RECEIPTS, `${id}/post`),
  cancelGoodsReceipt: (id) =>
    handleAction("POST", INV.GOODS_RECEIPTS, `${id}/cancel`),

  // Stock Transfers
  getStockTransfers: (params = {}) => handleList(INV.STOCK_TRANSFERS, params),
  getStockTransfer: (id) => handleItem("GET", INV.STOCK_TRANSFERS, id),
  createStockTransfer: (payload) =>
    handleItem("POST", INV.STOCK_TRANSFERS, null, payload),
  approveStockTransfer: (id) =>
    handleAction("POST", INV.STOCK_TRANSFERS, `${id}/approve`),
  receiveStockTransfer: (id) =>
    handleAction("POST", INV.STOCK_TRANSFERS, `${id}/receive`),
  rejectStockTransfer: (id) =>
    handleAction("POST", INV.STOCK_TRANSFERS, `${id}/reject`),
  cancelStockTransfer: (id) =>
    handleAction("POST", INV.STOCK_TRANSFERS, `${id}/cancel`),

  // Reports
  getDashboard: (params = {}) => handleList(INV.DASHBOARD, params),
  getExpiryTracker: (params = {}) => handleList(INV.EXPIRY_TRACKER, params),
  getLowStock: (params = {}) => handleList(INV.LOW_STOCK, params),
};

export default inventoryService;
