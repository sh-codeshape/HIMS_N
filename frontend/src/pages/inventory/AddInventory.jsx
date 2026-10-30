import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";

// Operational Components
import GoodsReceipts from "./GoodsReceipts.jsx";
import PurchaseOrders from "./PurchaseOrders.jsx";
import StockAdjustment from "./StockAdjustment.jsx";
import StockTransfers from "./StockTransfers.jsx";

export default function AddInventory() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected action: 'grn' (default) | 'adjust' | 'po' | 'transfer'
  const currentAction = searchParams.get("action") || "grn";

  const setAction = (actionKey) => {
    setSearchParams({ action: actionKey });
  };

  const navActions = [
    {
      key: "grn",
      label: "Receive Delivery (GRN)",
      icon: "LuPackageCheck",
      color: "text-emerald-600",
      activeBg: "bg-emerald-600 text-white",
    },
    {
      key: "adjust",
      label: "Stock Adjustment (+/-)",
      icon: "LuSliders",
      color: "text-amber-600",
      activeBg: "bg-amber-600 text-white",
    },
    {
      key: "po",
      label: "Purchase Order (PO)",
      icon: "LuClipboardList",
      color: "text-blue-600",
      activeBg: "bg-blue-600 text-white",
    },
    {
      key: "transfer",
      label: "Internal Transfer",
      icon: "LuArrowLeftRight",
      color: "text-indigo-600",
      activeBg: "bg-indigo-600 text-white",
    },
  ];

  return (
    <PageContainer
      title="Add & Receive Inventory"
      subtitle="Log incoming supplier shipments, make count adjustments, or create purchase orders"
    >
      {/* Sleek, Low-Friction Segmented Action Tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 mb-6 flex flex-wrap gap-1 items-center">
        {navActions.map((act) => {
          const isActive = currentAction === act.key;
          return (
            <button
              key={act.key}
              type="button"
              onClick={() => setAction(act.key)}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? `${act.activeBg} shadow-sm font-bold`
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon name={act.icon} size={15} />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Operational Container */}
      <div className="transition-opacity duration-200">
        {currentAction === "grn" && (
          <GoodsReceipts embedded={true} initialOpenModal={false} />
        )}

        {currentAction === "adjust" && (
          <StockAdjustment embedded={true} />
        )}

        {currentAction === "po" && (
          <PurchaseOrders embedded={true} initialOpenModal={false} />
        )}

        {currentAction === "transfer" && (
          <StockTransfers embedded={true} />
        )}
      </div>
    </PageContainer>
  );
}
