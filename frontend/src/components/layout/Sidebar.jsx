import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import sidebarConfig from "../../config/sidebarConfig";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useRole } from "../../hooks/useRole";
import { useModules } from "../../context/ModuleContext";
import Icon from "../common/Icon.jsx";
import codeShapeLogo from "../../assets/logos/codeshape-logo.png";
import "./Sidebar.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { roles } = useRole();
  const { isModuleEnabled } = useModules();
  const [openKey, setOpenKey] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return null;

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : user.role ? [user.role] : [];
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

  const isDeveloper = roles.includes('developer');

  /**
   * Layer 1: Module registry check (developer bypasses).
   * If a module is disabled globally, no one except the developer can see it.
   *
   * Layer 2: Existing role + permission check (unchanged).
   */
  const itemVisible = (item) => {
    // Layer 1: Module gate
    if (!isDeveloper && item.key && !isModuleEnabled(item.key)) {
      return false; // Module disabled globally → hide from everyone except developer
    }

    // Layer 2: Role-based gating
    const roleOk =
      !item.allowedRoles || item.allowedRoles.length === 0
        ? true
        : item.allowedRoles.some((r) => userRoles.includes(r));

    if (roleOk) return true;

    const hasExplicitPerm =
      item.allowedPermissions && item.allowedPermissions.length > 0;
    if (!hasExplicitPerm) return false;

    return item.allowedPermissions.some((p) => userPermissions.includes(p));
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
              const isOpen = openKey === item.key;

              if (!hasChildren) {
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={({ isActive }) => `sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
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
                    className={`sidebar__item sidebar__item--toggle ${isOpen ? "sidebar__item--open" : ""}`}
                    onClick={() => setOpenKey(isOpen ? null : item.key)}
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
                      {visibleChildren.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `sidebar__subitem ${isActive ? "sidebar__subitem--active" : ""}`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
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
