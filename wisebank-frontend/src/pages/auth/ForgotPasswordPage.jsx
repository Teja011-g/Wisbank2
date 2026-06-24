import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark,
  Mail,
  LockKeyhole,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

import {
  sendPasswordCode,
  verifyPasswordCode,
  resetPasswordWithCode
} from "../../api/wisebankApi";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await sendPasswordCode({
        email
      });

      setMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.detail || "Unable to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await verifyPasswordCode({
        email,
        code
      });

      setMessage(response.data.message);
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.detail || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPasswordWithCode({
        email,
        code,
        new_password: newPassword
      });

      navigate("/", { replace: true });
    } catch (error) {
      setError(error.response?.data?.detail || "Unable to reset password");
    } finally {
      setLoading(false);
    }
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
            <ShieldCheck size={26} />
          </div>

          <h1>Reset Password</h1>
          <p>
            Verify your registered email and set a new password.
          </p>
        </div>

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <form className="classic-auth-form" onSubmit={handleSendCode}>
            <div className="classic-field">
              <label>Registered Email</label>
              <div className="classic-input-line">
                <Mail size={17} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered email"
                />
              </div>
            </div>

            <button className="primary-btn full-btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
              <ArrowRight size={18} />
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
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Example: Teja@1234"
                />
              </div>
            </div>

            <div className="classic-field">
              <label>Confirm Password</label>
              <div className="classic-input-line">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button className="primary-btn full-btn" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;