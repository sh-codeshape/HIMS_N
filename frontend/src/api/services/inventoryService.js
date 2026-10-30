import axiosInstance from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";
import { jwtDecode } from "jwt-decode";

const INV = ENDPOINTS.INVENTORY;

/**
 * Helper to safely extract current active organization ID and facility ID from localStorage / token
 */
export const getActiveOrgId = () => {
  try {
    const rawUser = localStorage.getItem("hims_user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.organization_id) return u.organization_id;
      if (u.organizationId) return u.organizationId;
    }
    const token = localStorage.getItem("hims_token");
    if (token) {
      const d = jwtDecode(token);
      return d.organization_id || d.organizationId || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

export const getActiveFacilityId = () => {
  try {
    const rawUser = localStorage.getItem("hims_user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.facility_id) return u.facility_id;
      if (u.facilityId) return u.facilityId;
    }
    const token = localStorage.getItem("hims_token");
    if (token) {
      const d = jwtDecode(token);
      return d.facility_id || d.facilityId || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

const handleList = async (path, params = {}) => {
  // Strip empty string query params so backend doesn't receive invalid UUID filters
  const cleanParams = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== "" && v !== null && v !== undefined) {
      cleanParams[k] = v;
    }
  }
  const res = await axiosInstance.get(path, { params: cleanParams });
  const body = res?.data ?? {};
  return {
    data: body.data ?? null,
    meta: body.meta ?? { page: 1, limit: 50, total: 0 },
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
/*  Inventory Service with Auto-Sanitization                           */
/* ------------------------------------------------------------------ */
export const inventoryService = {
  // Suppliers
  getSuppliers: (params = {}) => handleList(INV.SUPPLIERS, params),
  getSupplier: (id) => handleItem("GET", INV.SUPPLIERS, id),
  createSupplier: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const clean = {
      ...payload,
      organization_id: orgId,
      payment_terms_days: Number(payload.payment_terms_days) || 30,
      contact_person: payload.contact_person || null,
      phone: payload.phone || null,
      email: payload.email || null,
      address: payload.address || null,
      gstin: payload.gstin || null,
      drug_license_no: payload.drug_license_no || null,
    };
    return handleItem("POST", INV.SUPPLIERS, null, clean);
  },
  updateSupplier: (id, payload) => {
    const clean = { ...payload };
    if ("payment_terms_days" in clean) clean.payment_terms_days = Number(clean.payment_terms_days) || 30;
    return handleItem("PUT", INV.SUPPLIERS, id, clean);
  },
  deleteSupplier: (id) => handleItem("DELETE", INV.SUPPLIERS, id),

  // Categories
  getCategories: (params = {}) => handleList(INV.CATEGORIES, params),
  getCategory: (id) => handleItem("GET", INV.CATEGORIES, id),
  createCategory: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const clean = {
      ...payload,
      organization_id: orgId,
      parent_id: payload.parent_id || null,
    };
    return handleItem("POST", INV.CATEGORIES, null, clean);
  },
  updateCategory: (id, payload) => {
    const clean = { ...payload };
    if ("parent_id" in clean && !clean.parent_id) clean.parent_id = null;
    return handleItem("PUT", INV.CATEGORIES, id, clean);
  },
  deleteCategory: (id) => handleItem("DELETE", INV.CATEGORIES, id),

  // Items Master
  getItems: (params = {}) => handleList(INV.ITEMS, params),
  getItem: (id) => handleItem("GET", INV.ITEMS, id),
  createItem: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const clean = {
      ...payload,
      organization_id: orgId,
      category_id: payload.category_id || null,
      manufacturer_id: payload.manufacturer_id || null,
      tax_group_id: payload.tax_group_id || null,
      generic_name: payload.generic_name || null,
      brand_name: payload.brand_name || null,
      reorder_level: Number(payload.reorder_level) || 0,
      reorder_quantity: Number(payload.reorder_quantity) || 0,
      pack_size: Number(payload.pack_size) || 1,
      mrp: payload.mrp ? Number(payload.mrp) : null,
    };
    return handleItem("POST", INV.ITEMS, null, clean);
  },
  updateItem: (id, payload) => {
    const clean = { ...payload };
    if ("reorder_level" in clean) clean.reorder_level = Number(clean.reorder_level) || 0;
    if ("reorder_quantity" in clean) clean.reorder_quantity = Number(clean.reorder_quantity) || 0;
    if ("category_id" in clean && !clean.category_id) clean.category_id = null;
    if ("pack_size" in clean) clean.pack_size = Number(clean.pack_size) || 1;
    if ("mrp" in clean) clean.mrp = clean.mrp ? Number(clean.mrp) : null;
    return handleItem("PUT", INV.ITEMS, id, clean);
  },
  deleteItem: (id) => handleItem("DELETE", INV.ITEMS, id),

  // Stores
  getStores: (params = {}) => handleList(INV.STORES, params),
  getStore: (id) => handleItem("GET", INV.STORES, id),
  createStore: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const facId = payload.facility_id || getActiveFacilityId();
    const clean = {
      ...payload,
      organization_id: orgId,
      facility_id: facId,
      department_id: payload.department_id || null,
      parent_store_id: payload.parent_store_id || null,
    };
    return handleItem("POST", INV.STORES, null, clean);
  },
  updateStore: (id, payload) => {
    const clean = { ...payload };
    if ("parent_store_id" in clean && !clean.parent_store_id) clean.parent_store_id = null;
    return handleItem("PUT", INV.STORES, id, clean);
  },
  deleteStore: (id) => handleItem("DELETE", INV.STORES, id),

  // Stock Batches
  getStockBatches: (params = {}) => handleList(INV.STOCK_BATCHES, params),

  // Stock Movements
  getStockMovements: (params = {}) => handleList(INV.STOCK_MOVEMENTS, params),

  // Stock Adjustment
  adjustStock: (payload) => {
    const clean = {
      ...payload,
      quantity: Number(payload.quantity) || 0,
      unit_cost: payload.unit_cost ? Number(payload.unit_cost) : null,
    };
    return handleItem("POST", INV.STOCK_ADJUSTMENT, null, clean);
  },

  // Stock Write-off
  writeOffStock: (payload) =>
    handleItem("POST", INV.STOCK_WRITE_OFF, null, payload),

  // Purchase Orders
  getPurchaseOrders: (params = {}) => handleList(INV.PURCHASE_ORDERS, params),
  getPurchaseOrder: (id) => handleItem("GET", INV.PURCHASE_ORDERS, id),
  createPurchaseOrder: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const clean = {
      ...payload,
      organization_id: orgId,
      expected_date: payload.expected_date || null,
      notes: payload.notes || null,
      items: (payload.items || []).map((it) => ({
        item_id: it.item_id,
        ordered_qty: Number(it.ordered_qty) || 0,
        unit_cost: Number(it.unit_cost) || 0,
        discount_percent: Number(it.discount_percent) || 0,
        tax_amount: Number(it.tax_amount) || 0,
        line_total: Number(it.line_total) || (Number(it.ordered_qty) * Number(it.unit_cost)),
      })),
    };
    return handleItem("POST", INV.PURCHASE_ORDERS, null, clean);
  },
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
  createGoodsReceipt: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const clean = {
      ...payload,
      organization_id: orgId,
      purchase_order_id: payload.purchase_order_id || null,
      supplier_invoice_no: payload.supplier_invoice_no || null,
      items: (payload.items || []).map((it) => ({
        item_id: it.item_id,
        batch_no: it.batch_no,
        received_qty: Number(it.received_qty) || 0,
        free_qty: Number(it.free_qty) || 0,
        unit_cost: Number(it.unit_cost) || 0,
        mrp: it.mrp ? Number(it.mrp) : null,
        line_total: Number(it.line_total) || (Number(it.received_qty) * Number(it.unit_cost)),
        expiry_date: it.expiry_date || null,
      })),
    };
    return handleItem("POST", INV.GOODS_RECEIPTS, null, clean);
  },
  postGoodsReceipt: (id) =>
    handleAction("POST", INV.GOODS_RECEIPTS, `${id}/post`),
  cancelGoodsReceipt: (id) =>
    handleAction("POST", INV.GOODS_RECEIPTS, `${id}/cancel`),

  // Stock Transfers
  getStockTransfers: (params = {}) => handleList(INV.STOCK_TRANSFERS, params),
  getStockTransfer: (id) => handleItem("GET", INV.STOCK_TRANSFERS, id),
  createStockTransfer: (payload) => {
    const orgId = payload.organization_id || getActiveOrgId();
    const clean = {
      ...payload,
      organization_id: orgId,
      notes: payload.notes || null,
      items: (payload.items || []).map((it) => ({
        item_id: it.item_id,
        requested_qty: Number(it.requested_qty) || 0,
      })),
    };
    return handleItem("POST", INV.STOCK_TRANSFERS, null, clean);
  },
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
