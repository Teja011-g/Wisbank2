import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark,
  UserRound,
  Phone,
  Mail,
  LockKeyhole,
  Building2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";

import { getBranches, registerCustomer } from "../../api/wisebankApi";

function RegisterPage() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    branch_code: "",
    branch_name: ""
  });

  const passwordRules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password)
  };

  const passwordScore = Object.values(passwordRules).filter(Boolean).length;
  const isPasswordStrong = passwordScore === 5;

  async function loadBranches() {
    try {
      const response = await getBranches();
      setBranches(response.data || []);
    } catch {
      setBranches([]);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "username") {
      setFormData((prev) => ({
        ...prev,
        username: value.toLowerCase().replace(/\s/g, "")
      }));
      return;
    }

    if (name === "branch_code") {
      const selectedBranch = branches.find(
        (branch) => branch.branch_code === value
      );

      setFormData((prev) => ({
        ...prev,
        branch_code: selectedBranch?.branch_code || "",
        branch_name: selectedBranch?.branch_name || ""
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.branch_code
    ) {
      setError("Please fill full name, username, email, password and branch.");
      return;
    }

    if (!isPasswordStrong) {
      setError("Password must follow all strength rules.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      await registerCustomer({
        name: formData.name.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        branch_code: formData.branch_code,
        branch_name: formData.branch_name
      });

      navigate("/", { replace: true });
    } catch (error) {
      setError(error.response?.data?.detail || "Registration failed");
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
    <div className="classic-auth-page register-page">
      <Link to="/" className="login-brand">
        <span>
          <Landmark size={24} />
        </span>
        WiseBank
      </Link>

      <div className="classic-auth-card register-wide-card">
        <div className="classic-auth-header">
          <div className="classic-auth-icon">
            <UserRound size={26} />
          </div>

          <h1>Create Customer Account</h1>
          <p>
            Register with basic details and select your nearest branch to apply
            for loans.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="classic-auth-form" onSubmit={handleSubmit}>
          <div className="classic-form-grid">
            <div className="classic-field">
              <label>Full Name</label>

              <div className="classic-input-line">
                <UserRound size={17} />

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="classic-field">
              <label>Username</label>

              <div className="classic-input-line">
                <UserRound size={17} />

                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Example: teja_customer"
                />
              </div>
            </div>

            <div className="classic-field">
              <label>Phone Optional</label>

              <div className="classic-input-line">
                <Phone size={17} />

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Mobile number optional"
                />
              </div>
            </div>

            <div className="classic-field">
              <label>Email</label>

              <div className="classic-input-line">
                <Mail size={17} />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="classic-field">
              <label>Branch</label>

              <div className="classic-input-line">
                <Building2 size={17} />

                <select
                  name="branch_code"
                  value={formData.branch_code}
                  onChange={handleChange}
                >
                  <option value="">Select branch</option>

                  {branches.map((branch) => (
                    <option key={branch.branch_code} value={branch.branch_code}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="classic-field">
              <label>Password</label>

              <div className="classic-input-line">
                <LockKeyhole size={17} />

                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Example: Teja@123"
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="classic-field">
              <label>Confirm Password</label>

              <div className="classic-input-line">
                <LockKeyhole size={17} />

                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>
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

          <button
            className="primary-btn full-btn"
            type="submit"
            disabled={loading || !isPasswordStrong}
          >
            {loading ? "Creating..." : "Create Account"}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;