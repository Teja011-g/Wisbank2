import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  ClipboardList,
  BadgeCheck,
  ShieldCheck,
  UserCheck,
  XCircle,
  CheckCircle,
  Clock,
  Building2,
  IndianRupee
} from "lucide-react";

import { getCustomerLoans } from "../../api/wisebankApi";
import { useAuth } from "../../context/AuthContext";

function CustomerStatusPage() {
  const { currentUser } = useAuth();

  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    amount: "all"
  });

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function loadLoans() {
    if (!currentUser?.customer_code) return;

    try {
      setLoading(true);

      const response = await getCustomerLoans(currentUser.customer_code);
      const loanList = response.data || [];

      setLoans(loanList);

      if (loanList.length > 0) {
        const oldSelected = loanList.find(
          (loan) => loan.loan_code === selectedLoan?.loan_code
        );

        setSelectedLoan(oldSelected || loanList[0]);
      } else {
        setSelectedLoan(null);
      }
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to load loan status",
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
          ${loan.loan_code}
          ${loan.loan_type}
          ${loan.purpose}
          ${loan.status}
        `.toLowerCase();

        if (!searchText.includes(filters.search.toLowerCase())) {
          return false;
        }

        if (filters.status !== "all" && loan.status !== filters.status) {
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
  }, [loans, filters]);

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN");
  }

  function formatDate(value) {
    if (!value) return "Time not available";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusClass(status) {
    if (status === "Approved") return "success";
    if (status === "Rejected") return "danger";
    if (status === "Manager Review") return "warning";
    if (status === "Risk Completed") return "purple";
    if (status === "Risk Pending") return "info";
    if (status === "Verified") return "info";
    return "neutral";
  }

  function getStatusIcon(status) {
    if (status === "Approved") return <CheckCircle size={18} />;
    if (status === "Rejected") return <XCircle size={18} />;
    if (status === "Manager Review") return <UserCheck size={18} />;
    if (status === "Risk Completed") return <ShieldCheck size={18} />;
    if (status === "Risk Pending") return <ShieldCheck size={18} />;
    if (status === "Verified") return <BadgeCheck size={18} />;
    return <Clock size={18} />;
  }

  function getStepStatus(loan, step) {
    const order = [
      "Submitted",
      "Verified",
      "Risk Pending",
      "Risk Completed",
      "Manager Review",
      "Approved",
      "Rejected"
    ];

    const currentIndex = order.indexOf(loan.status);
    const stepIndex = order.indexOf(step);

    if (loan.status === "Rejected" && step === "Rejected") return "done";
    if (loan.status === "Approved" && step === "Approved") return "done";
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";

    return "pending";
  }

  function handleSelectLoan(loan) {
    setSelectedLoan(loan);

    setTimeout(() => {
      const detailBox = document.getElementById("customer-selected-details");
      if (detailBox) {
        detailBox.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 100);
  }

  const chartData = [
    {
      label: "Total",
      value: loans.length
    },
    {
      label: "Approved",
      value: loans.filter((loan) => loan.status === "Approved").length
    },
    {
      label: "Rejected",
      value: loans.filter((loan) => loan.status === "Rejected").length
    },
    {
      label: "In Progress",
      value: loans.filter(
        (loan) => loan.status !== "Approved" && loan.status !== "Rejected"
      ).length
    }
  ];

  return (
    <div className="page-section customer-status-page">
      {toast && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">Customer Portal</p>
          <h1>Loan Status</h1>
          <p>
            Track your loan applications from submission to final manager
            decision.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadLoans}>
          <RefreshCw size={16} />
          Refresh Status
        </button>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Applications</span>
          <strong>{chartData[0].value}</strong>
          <p>All loan requests submitted by you</p>
        </div>

        <div className="stat-card">
          <span>Approved</span>
          <strong>{chartData[1].value}</strong>
          <p>Loans approved by branch manager</p>
        </div>

        <div className="stat-card">
          <span>Rejected</span>
          <strong>{chartData[2].value}</strong>
          <p>Loans rejected by branch manager</p>
        </div>

        <div className="stat-card">
          <span>In Progress</span>
          <strong>{chartData[3].value}</strong>
          <p>Currently under bank review</p>
        </div>
      </section>

      <section className="customer-status-visual-card">
        <div>
          <h3>Application Summary</h3>
          <p>Final results update here after manager approval or rejection.</p>
        </div>

        <div className="customer-status-mini-bars">
          {chartData.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="customer-status-main-layout">
        <div className="list-card fixed-list-card customer-applications-wide-card">
          <div className="customer-applications-header-row">
            <div className="section-title">
              <ClipboardList size={20} />
              <h3>My Applications</h3>
            </div>

            <span className="customer-application-count">
              {filteredLoans.length} applications
            </span>
          </div>

          <section className="filter-toolbar compact-filter customer-application-filter">
            <div className="filter-search">
              <Search size={16} />
              <input
                placeholder="Search loan code, type, purpose, status"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
              <option value="Risk Pending">Risk Pending</option>
              <option value="Risk Completed">Risk Completed</option>
              <option value="Manager Review">Manager Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
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

          <div className="customer-application-scroll-box">
            {loading ? (
              <div className="empty-state">Loading your applications...</div>
            ) : filteredLoans.length === 0 ? (
              <div className="empty-state">No matching applications found</div>
            ) : (
              <div className="loan-card-list customer-application-row-list">
                {filteredLoans.map((loan) => (
                  <button
                    key={loan.loan_code}
                    className={
                      selectedLoan?.loan_code === loan.loan_code
                        ? "loan-select-card customer-application-row active"
                        : "loan-select-card customer-application-row"
                    }
                    onClick={() => handleSelectLoan(loan)}
                  >
                    <div className="customer-row-main">
                      <strong>{loan.loan_type}</strong>
                      <span>{loan.loan_code}</span>
                    </div>

                    <div className="customer-row-purpose">
                      <span>{loan.purpose || "Loan Purpose"}</span>
                      <em>{loan.branch_name || "Branch"}</em>
                    </div>

                    <div className="customer-row-status">
                      <span
                        className={`customer-status-small-pill ${getStatusClass(
                          loan.status
                        )}`}
                      >
                        {loan.status}
                      </span>
                    </div>

                    <div className="customer-row-amount">
                      <p>₹{formatAmount(loan.loan_amount)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          id="customer-selected-details"
          className="detail-card fixed-detail-card customer-selected-details-wide-card"
        >
          {!selectedLoan ? (
            <div className="empty-state">Select a loan to view status</div>
          ) : (
            <>
              <div className="detail-card-header">
                <div>
                  <h3>{selectedLoan.loan_type}</h3>
                  <p>{selectedLoan.loan_code}</p>
                </div>

                <span
                  className={`customer-final-status ${getStatusClass(
                    selectedLoan.status
                  )}`}
                >
                  {getStatusIcon(selectedLoan.status)}
                  {selectedLoan.status}
                </span>
              </div>

              <div className="customer-profile-grid">
                <div>
                  <IndianRupee size={18} />
                  <span>Loan Amount</span>
                  <strong>₹{formatAmount(selectedLoan.loan_amount)}</strong>
                </div>

                <div>
                  <Building2 size={18} />
                  <span>Branch</span>
                  <strong>{selectedLoan.branch_name}</strong>
                </div>

                <div>
                  <ClipboardList size={18} />
                  <span>Purpose</span>
                  <strong>{selectedLoan.purpose}</strong>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>Risk Level</span>
                  <strong>
                    {selectedLoan.risk_report?.risk_level || "Not generated"}
                  </strong>
                </div>
              </div>

              {selectedLoan.manager_decision_reason && (
                <div className="customer-result-box info">
                  <ClipboardList size={22} />
                  <div>
                    <h4>Manager Decision Reason</h4>
                    <p>{selectedLoan.manager_decision_reason}</p>
                  </div>
                </div>
              )}

              {selectedLoan.status === "Approved" && (
                <div className="customer-result-box success">
                  <CheckCircle size={22} />
                  <div>
                    <h4>Loan Approved</h4>
                    <p>
                      Your application has been approved by{" "}
                      {selectedLoan.approved_by_name || "the branch manager"}.
                    </p>
                  </div>
                </div>
              )}

              {selectedLoan.status === "Rejected" && (
                <div className="customer-result-box danger">
                  <XCircle size={22} />
                  <div>
                    <h4>Loan Rejected</h4>
                    <p>
                      Your application has been rejected by{" "}
                      {selectedLoan.approved_by_name || "the branch manager"}.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {selectedLoan && (
          <div className="customer-tracking-combined-card">
            <div className="tracking-section-header">
              <div>
                <h3>Loan Tracking</h3>
                <p>Progress and activity trail for this application.</p>
              </div>

              <span
                className={`customer-final-status ${getStatusClass(
                  selectedLoan.status
                )}`}
              >
                {getStatusIcon(selectedLoan.status)}
                {selectedLoan.status}
              </span>
            </div>

            <div className="customer-progress-connected-section">
              <h4>Loan Progress</h4>

              <div className="customer-connected-progress">
                <div className={getStepStatus(selectedLoan, "Submitted")}>
                  <span></span>
                  <p>Submitted</p>
                </div>

                <div className={getStepStatus(selectedLoan, "Verified")}>
                  <span></span>
                  <p>Loan Officer Verified</p>
                </div>

                <div className={getStepStatus(selectedLoan, "Risk Pending")}>
                  <span></span>
                  <p>Risk Review Started</p>
                </div>

                <div className={getStepStatus(selectedLoan, "Risk Completed")}>
                  <span></span>
                  <p>Risk Completed</p>
                </div>

                <div className={getStepStatus(selectedLoan, "Manager Review")}>
                  <span></span>
                  <p>Manager Review</p>
                </div>

                {selectedLoan.status === "Approved" && (
                  <div className="done">
                    <span></span>
                    <p>Approved</p>
                  </div>
                )}

                {selectedLoan.status === "Rejected" && (
                  <div className="rejected">
                    <span></span>
                    <p>Rejected</p>
                  </div>
                )}
              </div>
            </div>

            {selectedLoan.history && selectedLoan.history.length > 0 && (
              <div className="customer-history-connected-section">
                <div className="history-title">
                  <ClipboardList size={18} />
                  <div>
                    <h4>Loan History</h4>
                    <p>Complete activity trail for this application.</p>
                  </div>
                </div>

                <div className="customer-connected-history-list">
                  {selectedLoan.history.map((item) => (
                    <div className="history-item" key={item.id}>
                      <div className="history-dot"></div>

                      <div className="history-content">
                        <strong>{item.action}</strong>
                        <p>{item.details || "No details recorded"}</p>
                        <span>
                          {item.performed_by_name || "System"} •{" "}
                          {item.role || "System"} • {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerStatusPage;