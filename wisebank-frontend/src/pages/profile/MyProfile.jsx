import { useState } from "react";
import {
  UserRound,
  BadgeCheck,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  sendPasswordCode,
  verifyPasswordCode,
  resetPasswordWithCode
} from "../../api/wisebankApi";

function MyProfile() {
  const { currentUser, updateCurrentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSendCode() {
    setError("");
    setMessage("");

    if (!currentUser?.email) {
      setError("No email found for this account. Ask admin to add email.");
      return;
    }

    try {
      const response = await sendPasswordCode({
        email: currentUser.email
      });

      setMessage(response.data.message);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.detail || "Unable to send code");
    }
  }

  async function handleVerifyCode() {
    setError("");
    setMessage("");

    try {
      const response = await verifyPasswordCode({
        email: currentUser.email,
        code
      });

      setMessage(response.data.message);
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.detail || "Invalid verification code");
    }
  }

  async function handleResetPassword() {
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      const response = await resetPasswordWithCode({
        email: currentUser.email,
        code,
        new_password: newPassword
      });

      updateCurrentUser(response.data.user);

      setMessage(response.data.message);
      setStep(1);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error.response?.data?.detail || "Unable to change password");
    }
  }

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">My Account</p>
          <h1>Profile</h1>
          <p>View account details and change password using email verification.</p>
        </div>
      </div>

      <section className="profile-grid">
        <div className="dashboard-card profile-main-card">
          <div className="profile-avatar-large">
            <UserRound size={42} />
          </div>

          <h2>{currentUser?.name}</h2>
          <p>{currentUser?.role?.replaceAll("_", " ")}</p>

          <div className="profile-info-list">
            <div>
              <BadgeCheck size={18} />
              <span>Username</span>
              <strong>{currentUser?.username}</strong>
            </div>

            <div>
              <BadgeCheck size={18} />
              <span>Bank ID</span>
              <strong>{currentUser?.bank_id || "Not available"}</strong>
            </div>

            <div>
              <Building2 size={18} />
              <span>Branch</span>
              <strong>{currentUser?.branch_name || "All Branches"}</strong>
            </div>

            <div>
              <Mail size={18} />
              <span>Email</span>
              <strong>{currentUser?.email || "No email added"}</strong>
            </div>

            <div>
              <Phone size={18} />
              <span>Phone</span>
              <strong>{currentUser?.phone || "No phone added"}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card profile-password-card">
          <div className="section-title">
            <LockKeyhole size={20} />
            <h3>Change Password</h3>
          </div>

          <p className="muted-text">
            A verification code will be sent to your registered email.
          </p>

          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}

          {step === 1 && (
            <button
              className="primary-btn full-btn"
              onClick={handleSendCode}
              disabled={!currentUser?.email}
            >
              <ShieldCheck size={18} />
              Send Verification Code
            </button>
          )}

          {step === 2 && (
            <div className="classic-auth-form">
              <div className="classic-field">
                <label>Verification Code</label>

                <div className="classic-input-line">
                  <ShieldCheck size={17} />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                  />
                </div>
              </div>

              <button className="primary-btn full-btn" onClick={handleVerifyCode}>
                Verify Code
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="classic-auth-form">
              <div className="classic-field">
                <label>New Password</label>

                <div className="classic-input-line">
                  <LockKeyhole size={17} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Example: Wise@1234"
                  />

                  <button
                    type="button"
                    className="password-eye-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="classic-field">
                <label>Confirm Password</label>

                <div className="classic-input-line">
                  <LockKeyhole size={17} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
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

              <button className="primary-btn full-btn" onClick={handleResetPassword}>
                Update Password
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default MyProfile;