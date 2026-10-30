import React from "react";
import { useSearchParams } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer.jsx";
import Icon from "../../components/common/Icon.jsx";

// Setup Components
import Items from "./Items.jsx";
import Categories from "./Categories.jsx";
import Stores from "./Stores.jsx";
import Suppliers from "./Suppliers.jsx";
import AssetManagement from "./AssetManagement.jsx";

export default function InventorySettings() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected tab: 'items' (default) | 'categories' | 'stores' | 'suppliers' | 'assets'
  const currentTab = searchParams.get("tab") || "items";

  const setTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  const tabs = [
    {
      key: "items",
      label: "Items Master",
      description: "Manage catalog items, drugs, generic names & UOM",
      icon: "LuBoxes",
    },
    {
      key: "categories",
      label: "Categories",
      description: "Category hierarchy for drugs & consumables",
      icon: "LuFolderTree",
    },
    {
      key: "stores",
      label: "Stores & Warehouses",
      description: "Hospital store locations & dispensing points",
      icon: "LuWarehouse",
    },
    {
      key: "suppliers",
      label: "Suppliers",
      description: "Vendor registry, drug licenses & payment terms",
      icon: "LuTruck",
    },
    {
      key: "assets",
      label: "Assets & Equipment",
      description: "Medical equipment & inpatient bed synchronization",
      icon: "LuBedDouble",
    },
  ];

  return (
    <PageContainer
      title="Inventory Settings & Masters"
      subtitle="Initial setup, master catalogs, and location configurations for the hospital inventory system"
    >
      {/* Settings Navigation Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Settings Tabs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={`whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm rounded-t-lg transition-all flex items-center gap-2 ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-blue-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon name={tab.icon} size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Embedded Master Screens */}
      <div className="transition-opacity duration-200">
        {currentTab === "items" && <Items embedded={true} />}
        {currentTab === "categories" && <Categories embedded={true} />}
        {currentTab === "stores" && <Stores embedded={true} />}
        {currentTab === "suppliers" && <Suppliers embedded={true} />}
        {currentTab === "assets" && <AssetManagement embedded={true} />}
      </div>
    </PageContainer>
  );
}
