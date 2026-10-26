import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import sidebarConfig from "../../config/sidebarConfig";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useRole } from "../../hooks/useRole";
import { useModules } from "../../context/ModuleContext";
import Icon from "../common/Icon.jsx";
import codeShapeLogo from "../../assets/logos/codeshape-logo.png";
import "./Sidebar.css";

export default function Sidebar() {     
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { roles } = useRole();
  const { isModuleEnabled } = useModules();

  const isPathActive = (targetPath) => {
    if (!targetPath) return false;
    const current = location.pathname.toLowerCase();
    const target = targetPath.toLowerCase();
    if (current === target) return true;
    if (target !== "/" && current.startsWith(target + "/")) return true;
    if (target === "/laboratory/report-summary" && current === "/laboratory/report-entry") return true;
    return false;
  };

  const isGroupActive = (item) => {
    if (item.children?.length) {
      if (item.children.some((child) => isPathActive(child.path))) return true;
      const firstSegment = location.pathname.split("/")[1]?.toLowerCase();
      if (firstSegment) {
        const childSegments = item.children
          .map((c) => c.path.split("/")[1]?.toLowerCase())
          .filter(Boolean);
        if (childSegments.includes(firstSegment)) return true;
      }
    }
    if (item.path && isPathActive(item.path)) return true;
    return false;
  };

  const getActiveGroupKey = () => {
    for (const item of sidebarConfig) {
      if (item.children?.length && isGroupActive(item)) {
        return item.key;
      }
    }
    return null;
  };

  const [openKey, setOpenKey] = useState(() => getActiveGroupKey());
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const activeKey = getActiveGroupKey();
    if (activeKey) {
      setOpenKey(activeKey);
    }
  }, [location.pathname]);

  if (!user) return null;

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : user.role ? [user.role] : [];
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

  const isDeveloper = roles.includes('developer');

  const domainMap = {
    registration: ["registration", "patient"],
    opd: ["opd", "appointment", "clinical"],
    ipd: ["ipd", "bed", "admission"],
    ward: ["ward", "bed", "ipd"],
    billing: ["billing", "invoice", "payment", "charge", "discount", "creditnote", "cashsession"],
    billinginvoices: ["billing", "invoice", "payment", "charge", "discount", "creditnote"],
    patients: ["patient", "patients", "clinical"],
    staff: ["staff", "users", "roles"],
    pharmacy: ["pharmacy"],
    laboratory: ["laboratory", "lab"],
    radiology: ["radiology", "imaging"],
    inventory: ["inventory", "purchase", "grn"],
    emergency: ["emergency"],
    reports: ["report", "reports"],
    medicalreports: ["report", "reports", "clinical"],
    masterreports: ["report", "reports"],
    followup: ["appointment", "opd", "clinical"],
  };

  /**
   * Layer 1: Module registry check (developer bypasses).
   * If a module is disabled globally, no one except the developer can see it.
   *
   * Layer 2: RBAC role + permission check with domain fallback.
   */
  const itemVisible = (item) => {
    // Layer 1: Module gate
    if (!isDeveloper && item.key && !isModuleEnabled(item.key)) {
      return false; // Module disabled globally → hide from everyone except developer
    }

    if (isDeveloper || userRoles.includes("super_admin") || !!user.is_superadmin) {
      return true;
    }

    // If item has children, it is visible if at least one child is visible
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => {
        const childWithKey = { ...child, key: child.key || item.key };
        return itemVisible(childWithKey);
      });
    }

    // Role-based check
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (item.allowedRoles.some((r) => userRoles.includes(r))) {
        return true;
      }
    }

    // Explicit permission check
    if (item.allowedPermissions && item.allowedPermissions.length > 0) {
      if (item.allowedPermissions.some((p) => userPermissions.includes(p))) {
        return true;
      }
    }

    // Module domain check for custom roles
    if (item.key) {
      const moduleKey = item.key.toLowerCase();
      const prefixes = domainMap[moduleKey];
      if (prefixes) {
        const hasModulePerm = userPermissions.some((p) => {
          const prefix = p.split(".")[0].toLowerCase();
          return prefixes.includes(prefix);
        });
        if (hasModulePerm) return true;
      }
    }

    // If item requires no specific roles and no specific permissions (e.g. Dashboard)
    if (
      (!item.allowedRoles || item.allowedRoles.length === 0) &&
      (!item.allowedPermissions || item.allowedPermissions.length === 0)
    ) {
      return true;
    }

    return false;
  };

  // Only show menu items this user is allowed to see.
  const visibleItems = sidebarConfig.filter((item) => itemVisible(item));

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <>
      <aside className="sidebar">
        {/* Hospital Brand Area */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-logo-circle">
            <img src={codeShapeLogo} alt="CodeShape Logo" className="sidebar__logo-img" />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-hospital">Narayan Hospital</span>
            <span className="sidebar__brand-system">Hospital Management System</span>
          </div>
        </div>

        {/* Scrollable Nav Menu */}
        <div className="sidebar__scrollable custom-scrollbar">
          <nav className="sidebar__nav">
            {visibleItems.map((item) => {
              const hasChildren = !!item.children?.length;
              const visibleChildren = hasChildren
                ? item.children.filter((c) => {
                    // Children inherit module gate from parent group key
                    const childWithKey = { ...c, key: c.key || item.key };
                    return itemVisible(childWithKey);
                  })
                : [];
              const groupActive = isGroupActive(item);
              const isOpen = openKey === item.key;

              if (!hasChildren) {
                const itemActive = isPathActive(item.path);
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={({ isActive }) => `sidebar__item ${isActive || itemActive ? "sidebar__item--active" : ""}`}
                  >
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }

              return (
                <div key={item.key} className="sidebar__group">
                  <button
                    type="button"
                    className={`sidebar__item sidebar__item--toggle ${isOpen ? "sidebar__item--open" : ""} ${groupActive ? "sidebar__item--active" : ""}`}
                    onClick={() => {
                      const nextOpen = isOpen ? null : item.key;
                      setOpenKey(nextOpen);
                      if (item.key === "laboratory" && !groupActive && item.children?.[0]?.path) {
                        navigate(item.children[0].path);
                      }
                    }}
                  >
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                    <Icon 
                      name="LuChevronDown" 
                      className="sidebar__chevron" 
                      size={18} 
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} 
                    />
                  </button>

                  {isOpen && (
                    <div className="sidebar__submenu">
                      {visibleChildren.map((child) => {
                        const childActive = isPathActive(child.path);
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `sidebar__subitem ${isActive || childActive ? "sidebar__subitem--active" : ""}`
                            }
                          >
                            {child.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="sidebar__footer">
          <button 
            type="button" 
            className="sidebar__logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <Icon name="LuLogOut" size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Real-time Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-card">
            <div className="logout-modal-icon">
              <Icon name="LuLogOut" size={32} />
            </div>
            <h3 className="logout-modal-title">Sign Out?</h3>
            <p className="logout-modal-text">
              Are you sure you want to log out of the HIMS Portal? You will need to re-enter your credentials to access your workspace.
            </p>
            <div className="logout-modal-actions">
              <button 
                type="button" 
                className="logout-modal-btn logout-modal-btn--cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="logout-modal-btn logout-modal-btn--confirm"
                onClick={handleConfirmLogout}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
