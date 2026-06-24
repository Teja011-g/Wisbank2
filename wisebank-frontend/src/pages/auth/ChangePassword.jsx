import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Landmark,
  LockKeyhole,
  ArrowRight,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  sendPasswordCode,
  verifyPasswordCode,
  resetPasswordWithCode
} from "../../api/wisebankApi";

function ChangePassword() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword)
  };

  const passwordScore = Object.values(passwordRules).filter(Boolean).length;
  const isPasswordStrong = passwordScore === 5;

  function getRoute(role) {
    const routes = {
      SUPER_ADMIN: "/super-admin/dashboard",
      ADMIN: "/admin/dashboard",
      BANK_MANAGER: "/manager/dashboard",
      LOAN_OFFICER: "/loan-officer/queue",
      RISK_OFFICER: "/risk-officer/review",
      CUSTOMER: "/customer/apply"
    };

    return routes[role] || "/";
  }

  function getReadableError(error) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const fieldName = Array.isArray(item.loc)
            ? item.loc.join(" → ")
            : "field";

          return `${fieldName}: ${item.msg}`;
        })
        .join(", ");
    }

    if (detail && typeof detail === "object") {
      return JSON.stringify(detail);
    }

    return error?.message || "Something went wrong.";
  }

  async function handleSendCode(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!currentUser) {
      setError("No user found. Please login again.");
      return;
    }

    if (!currentUser.email) {
      setError("No email found for this account. Ask admin to add email.");
      return;
    }

    try {
      setLoading(true);

      const response = await sendPasswordCode({
        email: currentUser.email
      });

      setMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!currentUser?.email) {
      setError("No email found. Please login again.");
      return;
    }

    if (!code.trim()) {
      setError("Enter verification code.");
      return;
    }

    try {
      setLoading(true);

      const response = await verifyPasswordCode({
        email: currentUser.email,
        code: code.trim()
      });

      setMessage(response.data.message);
      setStep(3);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!currentUser?.email) {
      setError("No email found. Please login again.");
      return;
    }

    if (!isPasswordStrong) {
      setError(
        "Password must contain minimum 8 characters, capital letter, small letter, number, and symbol."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPasswordWithCode({
        email: currentUser.email,
        code: code.trim(),
        new_password: newPassword
      });

      const updatedUser = response.data.user;

      if (!updatedUser?.role) {
        setError("Backend did not return user role. Please check reset password API.");
        return;
      }

      updateCurrentUser(updatedUser);

      const dashboardRoute = getRoute(updatedUser.role);

      navigate(dashboardRoute, { replace: true });
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  function RuleItem({ valid, text }) {
    return (
      <div className={valid ? "password-rule valid" : "password-rule"}>
        {valid ? <CheckCircle size={15} /> : <XCircle size={15} />}
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div className="classic-auth-page">
      <Link to="/" className="login-brand">
        <span>
          <Landmark size={24} />
        </span>
        WiseBank
      </Link>

      <div className="classic-auth-card">
        <div className="classic-auth-header">
          <div className="classic-auth-icon">
            <ShieldCheck size={28} />
          </div>

          <h1>Change Password</h1>
          <p>Verify your registered email and create your own password.</p>
        </div>

        {currentUser?.must_change_password === "Yes" && (
          <div className="form-info-box">
            You logged in with default password. Verify email and create your own password.
          </div>
        )}

        {currentUser && (
          <div className="form-info-box">
            Logged in as: <strong>{currentUser.name}</strong>
            <br />
            Username: <strong>{currentUser.username}</strong>
            <br />
            Role from login: <strong>{currentUser.role}</strong>
            <br />
            Email: <strong>{currentUser.email || "No email"}</strong>
          </div>
        )}

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <form className="classic-auth-form" onSubmit={handleSendCode}>
            <button className="primary-btn full-btn" type="submit" disabled={loading}>
              <Mail size={18} />
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="classic-auth-form" onSubmit={handleVerifyCode}>
            <div className="classic-field">
              <label>Verification Code</label>

              <div className="classic-input-line">
                <ShieldCheck size={17} />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6 digit code"
                />
              </div>
            </div>

            <button className="primary-btn full-btn" type="submit" disabled={loading}>
              {loading ? "Checking..." : "Verify Code"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="classic-auth-form" onSubmit={handleResetPassword}>
            <div className="classic-field">
              <label>New Password</label>

              <div className="classic-input-line">
                <LockKeyhole size={17} />

                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Example: Wise@1234"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="password-strength-card">
                <div className="password-strength-top">
                  <span>Password strength</span>
                  <strong>{passwordScore}/5</strong>
                </div>

                <div className="password-meter">
                  <div className={`password-meter-fill score-${passwordScore}`}></div>
                </div>

                <div className="password-rules-grid">
                  <RuleItem valid={passwordRules.length} text="Minimum 8 characters" />
                  <RuleItem valid={passwordRules.uppercase} text="One capital letter" />
                  <RuleItem valid={passwordRules.lowercase} text="One small letter" />
                  <RuleItem valid={passwordRules.number} text="One number" />
                  <RuleItem valid={passwordRules.symbol} text="One symbol" />
                </div>
              </div>
            </div>

            <div className="classic-field">
              <label>Confirm New Password</label>

              <div className="classic-input-line">
                <LockKeyhole size={17} />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              className="primary-btn full-btn"
              type="submit"
              disabled={loading || !isPasswordStrong}
            >
              {loading ? "Updating..." : "Update Password"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;