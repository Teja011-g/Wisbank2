import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  UserRound,
  Phone,
  Building2,
  BadgeCheck,
  ShieldCheck,
  Send,
  Brain,
  Search
} from "lucide-react";

import {
  getRiskTasks,
  getRiskOfficerSummary,
  claimRiskOfficerTask,
  predictRisk,
  forwardToManager
} from "../../api/wisebankApi";

import { useAuth } from "../../context/AuthContext";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const CHART_COLORS = ["#7c3aed", "#2563eb", "#f59e0b", "#16a34a"];

function RiskOfficerReview() {
  const { currentUser } = useAuth();

  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    assignment: "all",
    amount: "all"
  });

  const [formData, setFormData] = useState({
    no_of_dependents: 0,
    education: "Graduate",
    self_employed: "No",
    income_annum: "",
    loan_amount: "",
    loan_term: "",
    cibil_score: "",
    residential_assets_value: "",
    commercial_assets_value: "",
    luxury_assets_value: "",
    bank_asset_value: ""
  });

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function syncFormWithLoan(loan) {
    if (!loan) return;

    setFormData((prev) => ({
      ...prev,
      no_of_dependents: loan.no_of_dependents || prev.no_of_dependents,
      education: loan.education || prev.education,
      self_employed: loan.self_employed || prev.self_employed,
      income_annum: loan.income_annum || "",
      loan_amount: loan.loan_amount || "",
      loan_term: loan.loan_term || "",
      cibil_score: loan.cibil_score || "",
      residential_assets_value: loan.residential_assets_value || "",
      commercial_assets_value: loan.commercial_assets_value || "",
      luxury_assets_value: loan.luxury_assets_value || "",
      bank_asset_value: loan.bank_asset_value || ""
    }));
  }

  async function loadData() {
    if (!currentUser?.employee_code) return;

    try {
      setLoading(true);

      const [taskResponse, summaryResponse] = await Promise.all([
        getRiskTasks(currentUser.employee_code),
        getRiskOfficerSummary(currentUser.employee_code)
      ]);

      const taskList = taskResponse.data || [];

      setLoans(taskList);
      setSummary(summaryResponse.data || null);

      if (taskList.length > 0) {
        const oldSelected =
          taskList.find((loan) => loan.loan_code === selectedLoan?.loan_code) ||
          taskList[0];

        setSelectedLoan(oldSelected);
        syncFormWithLoan(oldSelected);
      } else {
        setSelectedLoan(null);
      }
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to load risk queue",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentUser]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function isClaimedByMe(loan) {
    if (!loan) return false;
    return loan.assigned_risk_officer_code === currentUser?.employee_code;
  }

  function isUnclaimed(loan) {
    if (!loan) return false;
    return !loan.assigned_risk_officer_code;
  }

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN");
  }

  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        const searchText = `
          ${loan.customer_name}
          ${loan.customer_username}
          ${loan.customer_code}
          ${loan.loan_code}
          ${loan.loan_type}
          ${loan.status}
        `.toLowerCase();

        if (!searchText.includes(filters.search.toLowerCase())) {
          return false;
        }

        if (filters.status !== "all" && loan.status !== filters.status) {
          return false;
        }

        if (filters.assignment === "available" && !isUnclaimed(loan)) {
          return false;
        }

        if (filters.assignment === "mine" && !isClaimedByMe(loan)) {
          return false;
        }

        if (filters.amount === "below5" && Number(loan.loan_amount) >= 500000) {
          return false;
        }

        if (filters.amount === "above5" && Number(loan.loan_amount) < 500000) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [loans, filters, currentUser]);

  const chartData = summary?.chart || [];
  const visibleChartData = chartData.filter((item) => Number(item.value) > 0);
  const hasChartData = visibleChartData.length > 0;

  const riskReport = selectedLoan?.risk_report || null;

  const canGenerateRiskReport =
    selectedLoan &&
    isClaimedByMe(selectedLoan) &&
    selectedLoan.status === "Risk Pending";

  const canForwardToManager =
    selectedLoan &&
    isClaimedByMe(selectedLoan) &&
    selectedLoan.status === "Risk Completed" &&
    riskReport?.risk_level;

  function handleSelectLoan(loan) {
    setSelectedLoan(loan);
    syncFormWithLoan(loan);

    setTimeout(() => {
      const detailBox = document.getElementById("risk-selected-details");
      if (detailBox) {
        detailBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleClaim(loanCode) {
    try {
      const response = await claimRiskOfficerTask(
        loanCode,
        currentUser.employee_code
      );

      showToast("Risk review claimed successfully");
      setSelectedLoan(response.data);

      setLoans((prev) =>
        prev.map((loan) =>
          loan.loan_code === response.data.loan_code ? response.data : loan
        )
      );

      await loadData();
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to claim risk review",
        "error"
      );
    }
  }

  async function handlePredict(e) {
    e.preventDefault();

    if (!selectedLoan) return;

    if (!isClaimedByMe(selectedLoan)) {
      showToast("Claim this risk review before generating report", "error");
      return;
    }

    if (selectedLoan.status !== "Risk Pending") {
      showToast("Only risk pending loans can be predicted", "error");
      return;
    }

    try {
      const payload = {
        no_of_dependents: Number(formData.no_of_dependents),
        education: formData.education,
        self_employed: formData.self_employed,
        income_annum: Number(formData.income_annum),
        loan_amount: Number(formData.loan_amount),
        loan_term: Number(formData.loan_term),
        cibil_score: Number(formData.cibil_score),
        residential_assets_value: Number(formData.residential_assets_value),
        commercial_assets_value: Number(formData.commercial_assets_value),
        luxury_assets_value: Number(formData.luxury_assets_value),
        bank_asset_value: Number(formData.bank_asset_value)
      };

      const response = await predictRisk(
        selectedLoan.loan_code,
        currentUser.employee_code,
        payload
      );

      const updatedLoan = response.data;

      showToast("Risk report generated successfully");
      setSelectedLoan(updatedLoan);

      setLoans((prev) =>
        prev.map((loan) =>
          loan.loan_code === updatedLoan.loan_code ? updatedLoan : loan
        )
      );

      await loadData();
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Risk prediction failed",
        "error"
      );
    }
  }

  async function handleForward(loanCode) {
    if (!canForwardToManager) {
      showToast("Generate risk report before forwarding to manager", "error");
      return;
    }

    try {
      await forwardToManager(loanCode, currentUser.employee_code);

      showToast("Loan forwarded to manager");
      setSelectedLoan(null);
      await loadData();
    } catch (error) {
      console.log("Forward error:", error.response?.data);

      showToast(
        error.response?.data?.detail || "Unable to forward loan",
        "error"
      );
    }
  }

  return (
    <div className="page-section officer-queue-page">
      {toast && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">Risk Officer</p>
          <h1>Risk Review</h1>
          <p>
            Claim branch risk reviews, enter CIBIL and asset details, then
            forward completed reports to the manager.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadData}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Available</span>
          <strong>{summary?.available || 0}</strong>
          <p>Unclaimed risk reviews</p>
        </div>

        <div className="stat-card">
          <span>Taken by me</span>
          <strong>{summary?.taken_by_me || 0}</strong>
          <p>Your active reviews</p>
        </div>

        <div className="stat-card">
          <span>Branch taken</span>
          <strong>{summary?.branch_taken || 0}</strong>
          <p>Claimed in this branch</p>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <strong>{summary?.completed || 0}</strong>
          <p>Ready for manager</p>
        </div>
      </section>

      <section className="dashboard-equal-two officer-chart-grid-clean">
        <div className="chart-card fixed-chart-card">
          <h3>Risk Queue Distribution</h3>
          <p>Available, claimed, and completed risk reviews.</p>

          <div className="chart-body">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visibleChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {visibleChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No risk queue data yet</div>
            )}
          </div>
        </div>

        <div className="chart-card fixed-chart-card">
          <h3>Risk Workload</h3>
          <p>Current risk count by review category.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="risk-officer-horizontal-layout">
        <div className="list-card fixed-list-card risk-applications-horizontal-box">
          <div className="risk-applications-header-row">
            <div className="section-title">
              <ClipboardList size={20} />
              <h3>Risk Applications</h3>
            </div>

            <span className="risk-application-count">
              {filteredLoans.length} applications
            </span>
          </div>

          <section className="filter-toolbar compact-filter risk-application-filter">
            <div className="filter-search">
              <Search size={16} />

              <input
                placeholder="Search customer, username, loan code"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Risk Pending">Risk Pending</option>
              <option value="Risk Completed">Risk Completed</option>
            </select>

            <select
              value={filters.assignment}
              onChange={(e) => updateFilter("assignment", e.target.value)}
            >
              <option value="all">All Assignments</option>
              <option value="available">Available</option>
              <option value="mine">Assigned to me</option>
            </select>

            <select
              value={filters.amount}
              onChange={(e) => updateFilter("amount", e.target.value)}
            >
              <option value="all">All Amounts</option>
              <option value="below5">Below ₹5L</option>
              <option value="above5">₹5L and above</option>
            </select>
          </section>

          <div className="risk-applications-scroll-box">
            {loading ? (
              <div className="empty-state">Loading risk applications...</div>
            ) : filteredLoans.length === 0 ? (
              <div className="empty-state">No matching risk applications</div>
            ) : (
              <div className="loan-card-list risk-application-row-list">
                {filteredLoans.map((loan) => (
                  <button
                    key={loan.loan_code}
                    className={
                      selectedLoan?.loan_code === loan.loan_code
                        ? "loan-select-card risk-application-row active"
                        : "loan-select-card risk-application-row"
                    }
                    onClick={() => handleSelectLoan(loan)}
                  >
                    <div className="risk-row-main">
                      <strong>{loan.customer_name}</strong>
                      <span>{loan.loan_code}</span>
                    </div>

                    <div className="risk-row-middle">
                      <span>{loan.customer_username || "Customer"}</span>
                      <em>{loan.loan_type || "Loan"}</em>
                    </div>

                    <div className="risk-row-amount">
                      <p>₹{formatAmount(loan.loan_amount)}</p>
                      <em>
                        {isUnclaimed(loan)
                          ? "Available"
                          : isClaimedByMe(loan)
                          ? "Assigned to me"
                          : "Claimed"}
                      </em>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          id="risk-selected-details"
          className="detail-card fixed-detail-card risk-details-below-horizontal"
        >
          {!selectedLoan ? (
            <div className="empty-state">Select a loan to view details</div>
          ) : (
            <>
              <div className="detail-card-header">
                <div>
                  <h3>{selectedLoan.customer_name}</h3>
                  <p>
                    {selectedLoan.loan_code} • {selectedLoan.status}
                  </p>
                </div>

                <button
                  type="button"
                  className="small-btn secondary"
                  onClick={() => setSelectedLoan(null)}
                >
                  Back to Customers
                </button>
              </div>

              <div className="customer-profile-grid">
                <div>
                  <UserRound size={18} />
                  <span>Customer Username</span>
                  <strong>{selectedLoan.customer_username || "-"}</strong>
                </div>

                <div>
                  <Phone size={18} />
                  <span>Phone</span>
                  <strong>
                    {selectedLoan.phone || selectedLoan.customer_phone || "-"}
                  </strong>
                </div>

                <div>
                  <Building2 size={18} />
                  <span>Branch</span>
                  <strong>{selectedLoan.branch_name || "-"}</strong>
                </div>

                <div>
                  <BadgeCheck size={18} />
                  <span>Loan Type</span>
                  <strong>{selectedLoan.loan_type || "Loan"}</strong>
                </div>
              </div>

              <div className="selected-risk-summary">
                <div>
                  <span>Income</span>
                  <strong>₹{formatAmount(selectedLoan.income_annum)}</strong>
                </div>

                <div>
                  <span>Loan Amount</span>
                  <strong>₹{formatAmount(selectedLoan.loan_amount)}</strong>
                </div>

                <div>
                  <span>Loan Term</span>
                  <strong>{selectedLoan.loan_term || "-"} years</strong>
                </div>
              </div>

              {!isClaimedByMe(selectedLoan) && isUnclaimed(selectedLoan) && (
                <button
                  type="button"
                  className="primary-btn full-btn"
                  onClick={() => handleClaim(selectedLoan.loan_code)}
                >
                  <ShieldCheck size={18} />
                  Claim Risk Review
                </button>
              )}

              <form
                className="risk-form-card compact-risk-form"
                onSubmit={handlePredict}
              >
                <div className="section-title">
                  <Brain size={20} />
                  <h3>Risk Inputs</h3>
                </div>

                <div className="input-grid risk-form-grid">
                  <div className="input-group">
                    <label>Dependents</label>
                    <input
                      type="number"
                      name="no_of_dependents"
                      value={formData.no_of_dependents}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Education</label>
                    <select
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                    >
                      <option value="Graduate">Graduate</option>
                      <option value="Not Graduate">Not Graduate</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Self Employed</label>
                    <select
                      name="self_employed"
                      value={formData.self_employed}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Income Annum</label>
                    <input
                      type="number"
                      name="income_annum"
                      value={formData.income_annum}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Loan Amount</label>
                    <input
                      type="number"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Loan Term</label>
                    <input
                      type="number"
                      name="loan_term"
                      value={formData.loan_term}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>CIBIL Score</label>
                    <input
                      type="number"
                      name="cibil_score"
                      value={formData.cibil_score}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Residential Assets</label>
                    <input
                      type="number"
                      name="residential_assets_value"
                      value={formData.residential_assets_value}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Commercial Assets</label>
                    <input
                      type="number"
                      name="commercial_assets_value"
                      value={formData.commercial_assets_value}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Luxury Assets</label>
                    <input
                      type="number"
                      name="luxury_assets_value"
                      value={formData.luxury_assets_value}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Bank Assets</label>
                    <input
                      type="number"
                      name="bank_asset_value"
                      value={formData.bank_asset_value}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="detail-action-row">
                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={!canGenerateRiskReport}
                  >
                    <Brain size={18} />
                    Generate Risk Report
                  </button>

                  <button
                    type="button"
                    className="primary-btn success"
                    disabled={!canForwardToManager}
                    onClick={() => handleForward(selectedLoan.loan_code)}
                  >
                    <Send size={18} />
                    Forward to Manager
                  </button>
                </div>
              </form>

              {riskReport && (
                <div className="prediction-result-card">
                  <div className="prediction-main">
                    <div>
                      <h2>{riskReport.prediction_status || "Prediction Ready"}</h2>
                      <p>{riskReport.suggested_status || "Risk report generated"}</p>
                    </div>

                    <span
                      className={`risk-pill ${
                        riskReport.risk_level === "Low Risk"
                          ? "risk-low"
                          : riskReport.risk_level === "Medium Risk"
                          ? "risk-medium"
                          : "risk-high"
                      }`}
                    >
                      {riskReport.risk_level || "Risk Generated"}
                    </span>
                  </div>

                  <div className="prediction-grid">
                    <div>
                      <span>Approved Probability</span>
                      <strong>{riskReport.approved_probability || 0}%</strong>
                    </div>

                    <div>
                      <span>Rejected Probability</span>
                      <strong>{riskReport.rejected_probability || 0}%</strong>
                    </div>

                    <div>
                      <span>Risk Score</span>
                      <strong>{riskReport.risk_score || 0}</strong>
                    </div>
                  </div>

                  {riskReport.risk_reasons && (
                    <div className="risk-reasons">
                      <h4>Risk Reasons</h4>
                      <p>{riskReport.risk_reasons}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default RiskOfficerReview;