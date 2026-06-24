import { useEffect, useState } from "react";
import {
  Landmark,
  IndianRupee,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Building2,
  UserRound
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { applyLoan, getBranches } from "../../api/wisebankApi";

function CustomerApplyPage() {
  const { currentUser } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [createdLoan, setCreatedLoan] = useState(null);

  const [formData, setFormData] = useState({
    loan_type: "Personal Loan",
    loan_amount: "",
    purpose: "",
    branch_code: currentUser?.branch_code || "",
    branch_name: currentUser?.branch_name || ""
  });

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

  async function loadBranches() {
    try {
      setLoadingBranches(true);

      const response = await getBranches();

      setBranches(response.data || []);
    } catch (error) {
      setBranches([]);
      setError(getReadableError(error));
    } finally {
      setLoadingBranches(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

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

  function validateForm() {
    if (!currentUser) {
      return "Please login again.";
    }

    if (currentUser.role !== "CUSTOMER") {
      return "Only customers can apply for loans.";
    }

    if (!currentUser.customer_code) {
      return "Customer code missing. Please logout and login again as customer.";
    }

    if (!currentUser.username) {
      return "Customer username missing. Please logout and login again.";
    }

    if (!formData.branch_code) {
      return "Please select branch.";
    }

    if (!formData.branch_name) {
      return "Branch name missing. Please select branch again.";
    }

    if (!formData.loan_type) {
      return "Please select loan type.";
    }

    if (!formData.loan_amount) {
      return "Please enter loan amount.";
    }

    if (Number(formData.loan_amount) <= 0) {
      return "Loan amount must be greater than 0.";
    }

    if (!formData.purpose.trim()) {
      return "Please enter loan purpose.";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setCreatedLoan(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customer_code: currentUser.customer_code,
        customer_username: currentUser.username,
        username: currentUser.username,

        customer_name: currentUser.name,
        name: currentUser.name,

        customer_phone: currentUser.phone || "",
        phone: currentUser.phone || "",

        branch_code: formData.branch_code,
        branch_name: formData.branch_name,

        loan_type: formData.loan_type,
        loan_amount: Number(formData.loan_amount),
        purpose: formData.purpose.trim()
      };

      const response = await applyLoan(payload);

      setCreatedLoan(response.data);

      setSuccess(
        response.data?.message || "Loan application submitted successfully."
      );

      setFormData((prev) => ({
        ...prev,
        loan_type: "Personal Loan",
        loan_amount: "",
        purpose: ""
      }));
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Customer</p>
          <h1>Apply for Loan</h1>
          <p>
            Submit your loan request. Loan officer, risk officer and manager will
            process it step by step.
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="section-title">
          <Landmark size={22} />
          <h3>Loan Application Form</h3>
        </div>

        {currentUser && (
          <div className="info-grid">
            <div className="info-card">
              <UserRound size={18} />
              <span>Customer</span>
              <strong>{currentUser.name}</strong>
            </div>

            <div className="info-card">
              <Building2 size={18} />
              <span>Current Branch</span>
              <strong>{currentUser.branch_name || "Not selected"}</strong>
            </div>
          </div>
        )}

        {success && (
          <div className="auth-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {createdLoan?.loan_code && (
          <div className="form-info-box">
            Loan Code: <strong>{createdLoan.loan_code}</strong>. You can check
            status from Customer Status page.
          </div>
        )}

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="classic-auth-form" onSubmit={handleSubmit}>
          <div className="classic-form-grid">
            <div className="classic-field">
              <label>Branch</label>

              <div className="classic-input-line">
                <Building2 size={17} />

                <select
                  name="branch_code"
                  value={formData.branch_code}
                  onChange={handleChange}
                  disabled={loadingBranches}
                >
                  <option value="">
                    {loadingBranches ? "Loading branches..." : "Select branch"}
                  </option>

                  {branches.map((branch) => (
                    <option key={branch.branch_code} value={branch.branch_code}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="classic-field">
              <label>Loan Type</label>

              <div className="classic-input-line">
                <FileText size={17} />

                <select
                  name="loan_type"
                  value={formData.loan_type}
                  onChange={handleChange}
                >
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Home Loan">Home Loan</option>
                  <option value="Education Loan">Education Loan</option>
                  <option value="Vehicle Loan">Vehicle Loan</option>
                  <option value="Business Loan">Business Loan</option>
                </select>
              </div>
            </div>

            <div className="classic-field">
              <label>Loan Amount</label>

              <div className="classic-input-line">
                <IndianRupee size={17} />

                <input
                  name="loan_amount"
                  type="number"
                  value={formData.loan_amount}
                  onChange={handleChange}
                  placeholder="Enter loan amount"
                  min="1"
                />
              </div>
            </div>

            <div className="classic-field full-width-field">
              <label>Purpose</label>

              <div className="classic-input-line">
                <FileText size={17} />

                <input
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Example: Home renovation, education, business"
                />
              </div>
            </div>
          </div>

          <button
            className="primary-btn full-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Application"}
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerApplyPage;