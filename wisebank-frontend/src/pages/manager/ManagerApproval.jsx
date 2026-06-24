import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Building2,
  ClipboardList,
  IndianRupee,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound
} from "lucide-react";

import { getManagerLoans, managerDecision } from "../../api/wisebankApi";

import { useAuth } from "../../context/AuthContext";

function ManagerApproval() {
  const { currentUser } = useAuth();

  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    amount: "all",
    risk: "all"
  });

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function loadLoans() {
    if (!currentUser?.employee_code) return;

    try {
      setLoading(true);

      const response = await getManagerLoans(currentUser.employee_code);
      const loanList = response.data || [];

      setLoans(loanList);

      if (loanList.length > 0) {
        const existingSelected = loanList.find(
          (loan) => loan.loan_code === selectedLoan?.loan_code
        );

        setSelectedLoan(existingSelected || loanList[0]);
      } else {
        setSelectedLoan(null);
      }
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to load manager approvals",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoans();
  }, [currentUser]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
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
        `.toLowerCase();

        if (!searchText.includes(filters.search.toLowerCase())) {
          return false;
        }

        if (filters.amount === "below5" && Number(loan.loan_amount) >= 500000) {
          return false;
        }

        if (filters.amount === "above5" && Number(loan.loan_amount) < 500000) {
          return false;
        }

        const riskLevel = loan.risk_report?.risk_level || "";

        if (filters.risk !== "all" && riskLevel !== filters.risk) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [loans, filters]);

  function handleSelectLoan(loan) {
    setSelectedLoan(loan);
    setDecisionReason("");

    setTimeout(() => {
      const detailBox = document.getElementById("manager-selected-details");

      if (detailBox) {
        detailBox.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 100);
  }

  async function handleDecision(loanCode, decision) {
    const reason = decisionReason.trim();

    if (reason.length < 10) {
      showToast(
        "Please enter a proper decision justification with at least 10 characters.",
        "error"
      );
      return;
    }

    try {
      await managerDecision(loanCode, currentUser.employee_code, {
        decision,
        reason
      });

      showToast(
        decision === "approve"
          ? "Loan approved successfully with justification"
          : decision === "reject"
          ? "Loan rejected successfully with justification"
          : "Loan marked for manual review with justification"
      );

      setDecisionReason("");
      setSelectedLoan(null);
      loadLoans();
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to update loan decision",
        "error"
      );
    }
  }

  function getRiskClass(riskLevel) {
    if (!riskLevel) return "neutral";

    const value = riskLevel.toLowerCase();

    if (value.includes("low")) return "success";
    if (value.includes("medium")) return "warning";
    if (value.includes("high")) return "danger";

    return "neutral";
  }

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN");
  }

  return (
    <div className="page-section manager-approval-page">
      {toast && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">Branch Manager</p>
          <h1>Loan Approvals</h1>
          <p>
            Review risk-completed loan applications from{" "}
            {currentUser?.branch_name || "your branch"} and make the final
            approve or reject decision.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadLoans}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="stats-grid manager-approval-stats">
        <div className="stat-card">
          <span>Pending Approval</span>
          <strong>{loans.length}</strong>
          <p>Loans waiting for manager decision</p>
        </div>

        <div className="stat-card">
          <span>Low Risk</span>
          <strong>
            {
              loans.filter((loan) =>
                loan.risk_report?.risk_level?.toLowerCase().includes("low")
              ).length
            }
          </strong>
          <p>Applications with safer risk score</p>
        </div>

        <div className="stat-card">
          <span>Medium Risk</span>
          <strong>
            {
              loans.filter((loan) =>
                loan.risk_report?.risk_level?.toLowerCase().includes("medium")
              ).length
            }
          </strong>
          <p>Applications needing careful review</p>
        </div>

        <div className="stat-card">
          <span>High Risk</span>
          <strong>
            {
              loans.filter((loan) =>
                loan.risk_report?.risk_level?.toLowerCase().includes("high")
              ).length
            }
          </strong>
          <p>Applications with higher rejection risk</p>
        </div>
      </section>

      <section className="manager-horizontal-layout">
        <div className="list-card manager-applications-horizontal-box">
          <div className="manager-applications-header-row">
            <div className="section-title">
              <ClipboardList size={20} />
              <h3>Applications</h3>
            </div>

            <span className="manager-application-count">
              {filteredLoans.length} applications
            </span>
          </div>

          <section className="filter-toolbar compact-filter manager-application-filter">
            <div className="filter-search">
              <Search size={16} />
              <input
                placeholder="Search customer, username, loan code"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>

            <select
              value={filters.amount}
              onChange={(e) => updateFilter("amount", e.target.value)}
            >
              <option value="all">All Amounts</option>
              <option value="below5">Below ₹5L</option>
              <option value="above5">₹5L and above</option>
            </select>

            <select
              value={filters.risk}
              onChange={(e) => updateFilter("risk", e.target.value)}
            >
              <option value="all">All Risk Levels</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="High Risk">High Risk</option>
            </select>
          </section>

          <div className="manager-applications-scroll-box">
            {loading ? (
              <div className="empty-state">Loading manager approvals...</div>
            ) : filteredLoans.length === 0 ? (
              <div className="empty-state">
                No manager approval applications found
              </div>
            ) : (
              <div className="loan-card-list manager-application-row-list">
                {filteredLoans.map((loan) => (
                  <button
                    key={loan.loan_code}
                    className={
                      selectedLoan?.loan_code === loan.loan_code
                        ? "loan-select-card manager-application-row active"
                        : "loan-select-card manager-application-row"
                    }
                    onClick={() => handleSelectLoan(loan)}
                  >
                    <div className="manager-row-main">
                      <strong>{loan.customer_name}</strong>
                      <span>{loan.loan_code}</span>
                    </div>

                    <div className="manager-row-middle">
                      <span>{loan.customer_username || "Customer"}</span>
                      <em>{loan.loan_type || "Loan"}</em>
                    </div>

                    <div className="manager-row-risk">
                      <span
                        className={`risk-text ${getRiskClass(
                          loan.risk_report?.risk_level
                        )}`}
                      >
                        {loan.risk_report?.risk_level || "Risk Completed"}
                      </span>
                      <em>
                        Score: {loan.risk_report?.risk_score || 0}
                      </em>
                    </div>

                    <div className="manager-row-amount">
                      <p>₹{formatAmount(loan.loan_amount)}</p>
                      <em>{loan.status}</em>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          id="manager-selected-details"
          className="detail-card manager-approval-detail-card manager-details-below-horizontal"
        >
          {!selectedLoan ? (
            <div className="empty-state">Select a loan to view details</div>
          ) : (
            <>
              <div className="detail-card-header">
                <div>
                  <h3>{selectedLoan.customer_name}</h3>
                  <p>{selectedLoan.loan_code}</p>
                </div>

                <div className="manager-detail-actions-top">
                  <span className="status-pill active">
                    {selectedLoan.status}
                  </span>

                  <button
                    type="button"
                    className="small-btn secondary"
                    onClick={() => setSelectedLoan(null)}
                  >
                    Back to Applications
                  </button>
                </div>
              </div>

              <div className="customer-profile-grid manager-profile-grid">
                <div>
                  <UserRound size={18} />
                  <span>Username</span>
                  <strong>
                    {selectedLoan.customer_username || "Not available"}
                  </strong>
                </div>

                <div>
                  <Phone size={18} />
                  <span>Phone</span>
                  <strong>
                    {selectedLoan.customer_phone || "Not available"}
                  </strong>
                </div>

                <div>
                  <Building2 size={18} />
                  <span>Branch</span>
                  <strong>{selectedLoan.branch_name}</strong>
                </div>

                <div>
                  <IndianRupee size={18} />
                  <span>Loan Amount</span>
                  <strong>₹{formatAmount(selectedLoan.loan_amount)}</strong>
                </div>
              </div>

              <div className="manager-review-grid">
                <div className="manager-review-card">
                  <div className="manager-review-card-title">
                    <ClipboardList size={18} />
                    <h4>Loan Details</h4>
                  </div>

                  <div className="review-data-list">
                    <div>
                      <span>Loan Type</span>
                      <strong>{selectedLoan.loan_type}</strong>
                    </div>

                    <div>
                      <span>Purpose</span>
                      <strong>{selectedLoan.purpose}</strong>
                    </div>

                    <div>
                      <span>Loan Officer</span>
                      <strong>
                        {selectedLoan.assigned_loan_officer_name ||
                          selectedLoan.verified_by_name ||
                          "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>Risk Officer</span>
                      <strong>
                        {selectedLoan.assigned_risk_officer_name ||
                          selectedLoan.risk_reviewed_by_name ||
                          "Not available"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="manager-review-card">
                  <div className="manager-review-card-title">
                    <ShieldCheck size={18} />
                    <h4>Risk Report</h4>
                  </div>

                  {selectedLoan.risk_report ? (
                    <div className="review-data-list">
                      <div>
                        <span>Prediction</span>
                        <strong>
                          {selectedLoan.risk_report.prediction_status ||
                            "Generated"}
                        </strong>
                      </div>

                      <div>
                        <span>Approved Probability</span>
                        <strong>
                          {selectedLoan.risk_report.approved_probability || 0}%
                        </strong>
                      </div>

                      <div>
                        <span>Rejected Probability</span>
                        <strong>
                          {selectedLoan.risk_report.rejected_probability || 0}%
                        </strong>
                      </div>

                      <div>
                        <span>Risk Score</span>
                        <strong>
                          {selectedLoan.risk_report.risk_score || 0}
                        </strong>
                      </div>

                      <div>
                        <span>Risk Level</span>
                        <strong
                          className={`risk-text ${getRiskClass(
                            selectedLoan.risk_report.risk_level
                          )}`}
                        >
                          {selectedLoan.risk_report.risk_level ||
                            "Not available"}
                        </strong>
                      </div>

                      <div>
                        <span>Suggested Status</span>
                        <strong>
                          {selectedLoan.risk_report.suggested_status ||
                            "Manual Review"}
                        </strong>
                      </div>

                      <div className="full-row">
                        <span>Risk Reasons</span>
                        <strong>
                          {selectedLoan.risk_report.risk_reasons ||
                            "No reasons recorded"}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">Risk report not available</div>
                  )}
                </div>
              </div>

              <div className="manager-final-decision-card">
                <div className="decision-info-panel">
                  <div className="decision-icon-box">
                    <BadgeCheck size={24} />
                  </div>

                  <div>
                    <h3>Final Manager Decision</h3>
                    <p>
                      Review the loan details, risk report, and officer remarks
                      before making the final decision. Your decision
                      justification will be visible to the customer.
                    </p>
                  </div>
                </div>

                <div className="decision-action-panel">
                  <div className="decision-justification-box">
                    <label>Decision Justification</label>
                    <textarea
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="Example: Customer has strong CIBIL score, stable income, and acceptable loan-to-income ratio."
                    />
                    <span>
                      Minimum 10 characters required before submitting a
                      decision.
                    </span>
                  </div>

                  <div className="manager-decision-button-grid">
                    <button
                      className="decision-btn approve"
                      disabled={decisionReason.trim().length < 10}
                      onClick={() =>
                        handleDecision(selectedLoan.loan_code, "approve")
                      }
                    >
                      <BadgeCheck size={18} />
                      Approve
                    </button>

                    <button
                      className="decision-btn reject"
                      disabled={decisionReason.trim().length < 10}
                      onClick={() =>
                        handleDecision(selectedLoan.loan_code, "reject")
                      }
                    >
                      <Ban size={18} />
                      Reject
                    </button>

                    <button
                      className="decision-btn manual"
                      disabled={decisionReason.trim().length < 10}
                      onClick={() =>
                        handleDecision(selectedLoan.loan_code, "manual_review")
                      }
                    >
                      <ShieldCheck size={18} />
                      Manual Review
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManagerApproval;