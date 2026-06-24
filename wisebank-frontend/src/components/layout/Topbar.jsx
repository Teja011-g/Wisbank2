import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  UserRound,
  Landmark,
  Building2,
  BadgeCheck
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Topbar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const roleText = currentUser?.role
    ? currentUser.role.replaceAll("_", " ")
    : "Guest";

  const displayName = currentUser?.name || "WiseBank User";
  const displayUsername = currentUser?.username || currentUser?.bank_id || "No login ID";
  const branchName = currentUser?.branch_name || "WiseBank";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo-mini">
          <Landmark size={20} />
        </div>

        <div>
          <h2>{displayName}</h2>
          <p>
            <Building2 size={14} />
            {branchName}
          </p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-user-pill">
          <UserRound size={17} />

          <div>
            <strong>{displayUsername}</strong>
            <span>
              <BadgeCheck size={12} />
              {roleText}
            </span>
          </div>
        </div>

        <button className="topbar-icon-btn">
          <Bell size={18} />
        </button>

        <Link to="/profile" className="topbar-icon-btn">
          <UserRound size={18} />
        </Link>

        <button className="topbar-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;