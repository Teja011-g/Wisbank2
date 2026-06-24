import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Landmark,
  LayoutDashboard,
  UsersRound,
  Building2,
  ClipboardList,
  ShieldCheck,
  FileBarChart,
  UserRound,
  LogOut,
  UserCog,
  BadgeCheck,
  Menu,
  X
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const role = currentUser?.role || "GUEST";
  const roleText = role.replaceAll("_", " ");
  const displayName = currentUser?.name || "WiseBank User";

  const displayId =
    currentUser?.bank_id ||
    currentUser?.employee_code ||
    currentUser?.customer_code ||
    "WB-USER";

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  const adminBranchLabel =
    currentUser?.role === "ADMIN" && currentUser?.can_create_branch !== "Yes"
      ? "Branches View"
      : "Branches";

  const navConfig = {
    SUPER_ADMIN: [
      { label: "Dashboard", path: "/super-admin/dashboard", icon: LayoutDashboard },
      { label: "Admin Management", path: "/super-admin/admins", icon: UserCog },
      { label: "Branches", path: "/admin/branches", icon: Building2 },
      { label: "Employees", path: "/admin/employees", icon: UsersRound },
      { label: "Reports", path: "/manager/risk-reports", icon: FileBarChart },
      { label: "Profile", path: "/profile", icon: UserRound }
    ],

    ADMIN: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { label: adminBranchLabel, path: "/admin/branches", icon: Building2 },
      { label: "Employees", path: "/admin/employees", icon: UsersRound },
      { label: "Audit Logs", path: "/manager/tasks", icon: ClipboardList },
      { label: "Profile", path: "/profile", icon: UserRound }
    ],

    BANK_MANAGER: [
      { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
      { label: "Approvals", path: "/manager/approvals", icon: BadgeCheck },
      { label: "Branch Tasks", path: "/manager/tasks", icon: ClipboardList },
      { label: "Risk Reports", path: "/manager/risk-reports", icon: FileBarChart },
      { label: "Profile", path: "/profile", icon: UserRound }
    ],

    LOAN_OFFICER: [
      { label: "Loan Queue", path: "/loan-officer/queue", icon: ClipboardList },
      { label: "Profile", path: "/profile", icon: UserRound }
    ],

    RISK_OFFICER: [
      { label: "Risk Review", path: "/risk-officer/review", icon: ShieldCheck },
      { label: "Risk Reports", path: "/risk-officer/reports", icon: FileBarChart },
      { label: "Profile", path: "/profile", icon: UserRound }
    ],

    CUSTOMER: [
      { label: "Apply Loan", path: "/customer/apply", icon: ClipboardList },
      { label: "Loan Status", path: "/customer/status", icon: FileBarChart },
      { label: "Profile", path: "/profile", icon: UserRound }
    ]
  };

  const navItems = navConfig[role] || [];

  return (
    <>
      {!mobileOpen && (
        <button
          className="mobile-sidebar-toggle-floating"
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>
      )}

      <aside className={mobileOpen ? "app-sidebar mobile-open" : "app-sidebar"}>
        <div className="mobile-sidebar-topbar">
          <div className="mobile-sidebar-brand">
            <Landmark size={22} />
            <div>
              <strong>WiseBank</strong>
              <span>{roleText}</span>
            </div>
          </div>

          <button
            className="mobile-sidebar-toggle"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-scroll-area">
          <div>
            <div className="sidebar-brand">
              <div className="sidebar-brand-icon">
                <Landmark size={25} />
              </div>

              <div>
                <h1>WiseBank</h1>
                <p>Banking System</p>
              </div>
            </div>

            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar">
                <UserRound size={22} />
              </div>

              <div>
                <h3>{displayName}</h3>
                <p>{displayId}</p>
                <span>{roleText}</span>
              </div>
            </div>

            <nav className="sidebar-nav">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={`${item.label}-${item.path}`}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      isActive ? "sidebar-link active" : "sidebar-link"
                    }
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;