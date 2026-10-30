import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer.jsx";
import { toast } from "react-hot-toast";
import { inventoryService } from "../../api/services/inventoryService";
import ipdService from "../../api/services/ipdService";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Button from "../../components/common/Button.jsx";
import Icon from "../../components/common/Icon.jsx";

const STATUS_CONFIG = {
  available: { label: "Available", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  occupied: { label: "Occupied", bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  cleaning: { label: "Cleaning", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  maintenance: { label: "Maintenance", bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  blocked: { label: "Blocked", bg: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-500" },
  reserved: { label: "Reserved", bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
};

export default function AssetManagement({ embedded = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState([]);
  const [beds, setBeds] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all"); // 'all' | 'beds' | 'medical'
  const [statusFilter, setStatusFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Selected asset modal
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    loadAllAssets();
  }, []);

  const loadAllAssets = async () => {
    try {
      setLoading(true);
      const [itemsRes, bedsRes, catsRes] = await Promise.all([
        inventoryService.getItems({ item_type: "equipment", limit: 200 }),
        ipdService.getBedMatrix(),
        ipdService.getBedCategories(),
      ]);

      const loadedItems = itemsRes?.data || [];
      const loadedBeds = Array.isArray(bedsRes) ? bedsRes : bedsRes?.data || [];
      const loadedCats = Array.isArray(catsRes) ? catsRes : catsRes?.data || [];

      setItems(loadedItems);
      setBeds(loadedBeds);
      setCategories(loadedCats);
    } catch (err) {
      console.error("Failed to load asset data", err);
      toast.error("Failed to load assets and equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBeds = async () => {
    try {
      setSyncing(true);
      const res = await ipdService.syncInventoryBeds();
      toast.success(
        res?.message || "Successfully synced IPD beds with Inventory Equipment items!",
        { icon: "🔄" }
      );
      await loadAllAssets();
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync beds with inventory");
    } finally {
      setSyncing(false);
    }
  };

  // Combine inventory items and beds into a unified asset list
  const unifiedAssets = useMemo(() => {
    const bedMap = new Map();
    beds.forEach((b) => {
      bedMap.set(b.id, b);
      if (b.bed_no) {
        bedMap.set(b.bed_no, b);
        bedMap.set(`EQ-BED-${String(b.bed_no).replace(/\s+/g, "-").toUpperCase()}`, b);
      }
    });

    const list = [];
    const processedBedIds = new Set();

    // 1. Process items from inventory
    items.forEach((item) => {
      const custom = typeof item.custom_fields === "object" && item.custom_fields !== null ? item.custom_fields : {};
      const linkedBedId = custom.bed_id;
      const linkedBed = linkedBedId ? bedMap.get(linkedBedId) : (item.code ? bedMap.get(item.code) : null);

      if (linkedBed) {
        processedBedIds.add(linkedBed.id);
      }

      const isBed = item.code?.startsWith("EQ-BED-") || custom.is_bed_asset || !!linkedBed;

      list.push({
        id: item.id,
        assetCode: item.code,
        name: item.name,
        isBedAsset: isBed,
        genericName: item.generic_name || (isBed ? "Inpatient Hospital Bed" : "Medical Equipment"),
        categoryName: custom.category_name || linkedBed?.category_name || item.category_name || "General Equipment",
        floor: custom.floor || linkedBed?.floor || "Ground Floor",
        wardName: custom.ward_name || linkedBed?.ward_name || "—",
        roomNo: custom.room_no || linkedBed?.room_name || "—",
        bedNo: custom.bed_no || linkedBed?.bed_no || item.code?.replace("EQ-BED-", ""),
        status: linkedBed?.current_status || linkedBed?.status || custom.status || (item.is_active ? "available" : "blocked"),
        dailyRate: linkedBed?.bed_charge_rate || null,
        serviceName: linkedBed?.bed_charge_service_name || null,
        features: linkedBed?.features || custom.features || {},
        patient: linkedBed?.patient_first_name
          ? {
              name: `${linkedBed.patient_first_name} ${linkedBed.patient_last_name || ""}`.trim(),
              uhid: linkedBed.patient_uhid,
              gender: linkedBed.gender,
              admittedAt: linkedBed.admitted_at,
              admissionId: linkedBed.admission_id,
            }
          : null,
        rawItem: item,
        rawBed: linkedBed,
      });
    });

    // 2. Add any active beds not yet reflected in items list
    beds.forEach((b) => {
      if (!processedBedIds.has(b.id)) {
        list.push({
          id: b.id,
          assetCode: `EQ-BED-${String(b.bed_no || "").replace(/\s+/g, "-").toUpperCase()}`,
          name: `Hospital Bed - ${b.bed_no} (${b.category_name || "Standard"})`,
          isBedAsset: true,
          genericName: "Inpatient Hospital Bed",
          categoryName: b.category_name || "General Category",
          floor: b.floor || "Ground Floor",
          wardName: b.ward_name || "—",
          roomNo: b.room_name || "—",
          bedNo: b.bed_no,
          status: b.current_status || b.status || "available",
          dailyRate: b.bed_charge_rate || null,
          serviceName: b.bed_charge_service_name || null,
          features: b.features || {},
          patient: b.patient_first_name
            ? {
                name: `${b.patient_first_name} ${b.patient_last_name || ""}`.trim(),
                uhid: b.patient_uhid,
                gender: b.gender,
                admittedAt: b.admitted_at,
                admissionId: b.admission_id,
              }
            : null,
          rawItem: null,
          rawBed: b,
        });
      }
    });

    return list;
  }, [items, beds]);

  // Derived unique floors
  const floors = useMemo(() => {
    const set = new Set();
    unifiedAssets.forEach((a) => {
      if (a.floor) set.add(a.floor);
    });
    return Array.from(set);
  }, [unifiedAssets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return unifiedAssets.filter((a) => {
      if (assetTypeFilter === "beds" && !a.isBedAsset) return false;
      if (assetTypeFilter === "medical" && a.isBedAsset) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (floorFilter && a.floor !== floorFilter) return false;
      if (categoryFilter && a.categoryName !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchCode = a.assetCode?.toLowerCase().includes(q);
        const matchName = a.name?.toLowerCase().includes(q);
        const matchWard = a.wardName?.toLowerCase().includes(q);
        const matchBed = a.bedNo?.toLowerCase().includes(q);
        const matchPatient = a.patient?.name?.toLowerCase().includes(q) || a.patient?.uhid?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchWard && !matchBed && !matchPatient) return false;
      }
      return true;
    });
  }, [unifiedAssets, assetTypeFilter, statusFilter, floorFilter, categoryFilter, search]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = unifiedAssets.length;
    const bedsCount = unifiedAssets.filter((a) => a.isBedAsset).length;
    const occupied = unifiedAssets.filter((a) => a.status === "occupied").length;
    const available = unifiedAssets.filter((a) => a.status === "available").length;
    const maintenance = unifiedAssets.filter((a) => a.status === "maintenance" || a.status === "cleaning").length;
    const dailyBillingPotential = unifiedAssets.reduce((sum, a) => sum + Number(a.dailyRate || 0), 0);

    return { total, bedsCount, occupied, available, maintenance, dailyBillingPotential };
  }, [unifiedAssets]);

  if (loading && !embedded) {
    return (
      <PageContainer title="Asset Management" subtitle="Inventory & Hospital Equipment Master">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={embedded ? undefined : "Asset & Equipment Management"}
      subtitle={embedded ? undefined : "Modular tracking of IPD hospital beds, biomedical equipment, and linked daily charge tariffs."}
      embedded={embedded}
    >
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            Inventory Module
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Live Synchronization with Inpatient Bed Master
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncBeds}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm disabled:opacity-60"
          >
            <Icon name="LuRefreshCw" size={14} className={syncing ? "animate-spin text-blue-600" : ""} />
            {syncing ? "Syncing..." : "Sync Beds with Inventory"}
          </button>
          <button
            onClick={() => navigate("/ward/floor-map")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Icon name="LuLayoutGrid" size={14} />
            Floor Bed Map
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Assets</span>
            <Icon name="LuBoxes" size={16} className="text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Fixed & movable</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">IPD Hospital Beds</span>
            <Icon name="LuBed" size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-700">{stats.bedsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all floors</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Occupied / In Use</span>
            <Icon name="LuUserCheck" size={16} className="text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-800">{stats.occupied}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active patients</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Available</span>
            <Icon name="LuCheckCircle2" size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.available}</div>
          <div className="text-[11px] text-emerald-600/70 mt-0.5">Ready for allotment</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Maintenance / Cleaning</span>
            <Icon name="LuWrench" size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.maintenance}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Under sanitation</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Daily Revenue Cap.</span>
            <Icon name="LuIndianRupee" size={16} className="text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-700">₹{stats.dailyBillingPotential.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Per day capacity</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by Asset Tag (e.g. EQ-BED-101), Bed No, Ward, or Patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full md:w-44">
          <Select value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value)}>
            <option value="all">All Equipment Types</option>
            <option value="beds">IPD Hospital Beds</option>
            <option value="medical">Biomedical Equipment</option>
          </Select>
        </div>

        <div className="w-full md:w-36">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
            <option value="blocked">Blocked</option>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
            <option value="">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>

        {(search || statusFilter || floorFilter || categoryFilter || assetTypeFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setFloorFilter("");
              setCategoryFilter("");
              setAssetTypeFilter("all");
            }}
            className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Asset Tag / Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Asset Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Location (Floor / Ward / Room)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Daily Tariff
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Icon name="LuFolderSearch" size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No assets found matching the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const statusInfo = STATUS_CONFIG[asset.status] || STATUS_CONFIG.available;
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-semibold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100 inline-block">
                          {asset.assetCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">{asset.name}</div>
                        <div className="text-xs text-slate-400">
                          {asset.isBedAsset ? `Bed No: ${asset.bedNo}` : asset.genericName}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium text-xs">
                          {asset.wardName} {asset.roomNo !== "—" ? `• Room ${asset.roomNo}` : ""}
                        </div>
                        <div className="text-[11px] text-slate-400">{asset.floor}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {asset.categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {asset.dailyRate ? (
                          <div>
                            <span className="font-semibold text-slate-800 text-xs">
                              ₹{Number(asset.dailyRate).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400"> / day</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {asset.features?.oxygen && (
                            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                              O₂
                            </span>
                          )}
                          {asset.features?.ventilator && (
                            <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                              Ventilator
                            </span>
                          )}
                          {asset.features?.monitor && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                              Monitor
                            </span>
                          )}
                          {!asset.features?.oxygen && !asset.features?.ventilator && !asset.features?.monitor && (
                            <span className="text-[10px] text-slate-400">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Details Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Icon name={selectedAsset.isBedAsset ? "LuBed" : "LuBox"} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{selectedAsset.name}</h3>
                  <p className="font-mono text-xs text-blue-600">{selectedAsset.assetCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <Icon name="LuX" size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Location Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Asset Location
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Floor</span>
                    <span className="font-semibold">{selectedAsset.floor || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ward</span>
                    <span className="font-semibold">{selectedAsset.wardName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Room / Bed</span>
                    <span className="font-semibold">
                      {selectedAsset.roomNo} / {selectedAsset.bedNo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Tariff Linkage */}
              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider mb-2">
                  Billing & Tariff Master Linkage
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Linked Service</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAsset.serviceName || "Daily Bed Charge Service"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Daily Rate</span>
                    <span className="font-bold text-purple-800 text-sm">
                      {selectedAsset.dailyRate ? `₹${Number(selectedAsset.dailyRate).toLocaleString()} / day` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Occupancy if Occupied */}
              {selectedAsset.patient ? (
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-2">
                    Current Patient Occupant
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Patient Name</span>
                      <span className="font-semibold text-blue-900">{selectedAsset.patient.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">UHID</span>
                      <span className="font-mono font-medium">{selectedAsset.patient.uhid}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-emerald-800 flex items-center gap-2">
                  <Icon name="LuCheckCircle" size={16} className="text-emerald-600" />
                  <span>Bed is vacant and available for patient allotment.</span>
                </div>
              )}

              {/* Medical Features */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Equipped Medical Features
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedAsset.features || {})
                    .filter(([k, v]) => v && k !== "inventory_item_id")
                    .map(([k]) => (
                      <span
                        key={k}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium capitalize"
                      >
                        ✓ {k.replace(/_/g, " ")}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedAsset(null);
                  navigate("/ward/floor-map");
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Icon name="LuExternalLink" size={14} /> View on Floor Map
              </button>
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
