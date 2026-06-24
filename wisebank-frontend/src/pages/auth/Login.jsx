import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark,
  LockKeyhole,
  UserRound,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getRoute(user) {
    if (user.must_change_password === "Yes") {
      return "/change-password";
    }

    const routes = {
      SUPER_ADMIN: "/super-admin/dashboard",
      ADMIN: "/admin/dashboard",
      BANK_MANAGER: "/manager/dashboard",
      LOAN_OFFICER: "/loan-officer/queue",
      RISK_OFFICER: "/risk-officer/review",
      CUSTOMER: "/customer/apply"
    };

    return routes[user.role] || "/";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!loginId.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await login(loginId, password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      navigate(getRoute(result.user), { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="classic-auth-card login-modal-card">
      <div className="classic-auth-header">
        <div className="classic-auth-icon">
          <Landmark size={26} />
        </div>

        <h1>Login</h1>
        <p>Use your username or Bank ID to continue.</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="classic-auth-form" onSubmit={handleSubmit}>
        <div className="classic-field">
          <label>Username or Bank ID</label>

          <div className="classic-input-line">
            <UserRound size={17} />
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Enter username or Bank ID"
            />
          </div>
        </div>

        <div className="classic-field">
          <label>Password</label>

          <div className="classic-input-line">
            <LockKeyhole size={17} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />

            <button
              type="button"
              className="password-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          className="primary-btn full-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Checking..." : "Login"}
          <ArrowRight size={18} />
        </button>
      </form>

      <div className="classic-auth-footer">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/register">Create customer account</Link>
      </div>
    </div>
  );
}

export default Login;