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
  Search
} from "lucide-react";

import {
  getLoanOfficerTasks,
  getLoanOfficerSummary,
  claimLoanOfficerTask,
  verifyLoan,
  forwardToRisk
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

const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed"];

function LoanOfficerQueue() {
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

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function loadData() {
    if (!currentUser?.employee_code) return;

    try {
      setLoading(true);

      const [taskResponse, summaryResponse] = await Promise.all([
        getLoanOfficerTasks(currentUser.employee_code),
        getLoanOfficerSummary(currentUser.employee_code)
      ]);

      const taskList = taskResponse.data || [];

      setLoans(taskList);
      setSummary(summaryResponse.data || null);

      if (taskList.length > 0) {
        const oldSelected = taskList.find(
          (loan) => loan.loan_code === selectedLoan?.loan_code
        );

        setSelectedLoan(oldSelected || taskList[0]);
      } else {
        setSelectedLoan(null);
      }
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to load loan officer queue",
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
    return loan.assigned_loan_officer_code === currentUser?.employee_code;
  }

  function isUnclaimed(loan) {
    return !loan.assigned_loan_officer_code;
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

  function handleSelectLoan(loan) {
    setSelectedLoan(loan);

    setTimeout(() => {
      const detailBox = document.getElementById("loan-officer-selected-details");

      if (detailBox) {
        detailBox.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 100);
  }

  async function handleClaim(loanCode) {
    try {
      const response = await claimLoanOfficerTask(
        loanCode,
        currentUser.employee_code
      );

      showToast("Loan claimed successfully");
      setSelectedLoan(response.data);
      loadData();
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to claim loan",
        "error"
      );
    }
  }

  async function handleVerify(loanCode) {
    try {
      const response = await verifyLoan(loanCode, currentUser.employee_code);

      showToast("Loan verified successfully");
      setSelectedLoan(response.data);
      loadData();
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to verify loan",
        "error"
      );
    }
  }

  async function handleForward(loanCode) {
    try {
      await forwardToRisk(loanCode, currentUser.employee_code);

      showToast("Loan forwarded to risk team");
      setSelectedLoan(null);
      loadData();
    } catch (error) {
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
          <p className="page-eyebrow">Loan Officer</p>
          <h1>Loan Queue</h1>
          <p>
            View branch applications, claim one customer loan, verify details,
            and forward it to risk review.
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
          <p>Unclaimed applications</p>
        </div>

        <div className="stat-card">
          <span>Taken by me</span>
          <strong>{summary?.taken_by_me || 0}</strong>
          <p>Your active work</p>
        </div>

        <div className="stat-card">
          <span>Branch taken</span>
          <strong>{summary?.branch_taken || 0}</strong>
          <p>Claimed in this branch</p>
        </div>

        <div className="stat-card">
          <span>Verified</span>
          <strong>{summary?.verified || 0}</strong>
          <p>Ready for risk forwarding</p>
        </div>
      </section>

      <section className="dashboard-equal-two officer-chart-grid-clean">
        <div className="chart-card fixed-chart-card">
          <h3>Queue Distribution</h3>
          <p>Available, claimed, and verified applications.</p>

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
              <div className="empty-state">No queue data yet</div>
            )}
          </div>
        </div>

        <div className="chart-card fixed-chart-card">
          <h3>Branch Workload</h3>
          <p>Current work count by queue category.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="loan-officer-horizontal-layout">
        <div className="list-card fixed-list-card loan-officer-applications-box">
          <div className="loan-officer-applications-header-row">
            <div className="section-title">
              <ClipboardList size={20} />
              <h3>Applications</h3>
            </div>

            <span className="loan-officer-application-count">
              {filteredLoans.length} applications
            </span>
          </div>

          <section className="filter-toolbar compact-filter loan-officer-application-filter">
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
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
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

          <div className="loan-officer-applications-scroll-box">
            {loading ? (
              <div className="empty-state">Loading applications...</div>
            ) : filteredLoans.length === 0 ? (
              <div className="empty-state">No matching applications</div>
            ) : (
              <div className="loan-card-list loan-officer-application-row-list">
                {filteredLoans.map((loan) => (
                  <button
                    key={loan.loan_code}
                    className={
                      selectedLoan?.loan_code === loan.loan_code
                        ? "loan-select-card loan-officer-application-row active"
                        : "loan-select-card loan-officer-application-row"
                    }
                    onClick={() => handleSelectLoan(loan)}
                  >
                    <div className="loan-officer-row-main">
                      <strong>{loan.customer_name}</strong>
                      <span>{loan.loan_code}</span>
                    </div>

                    <div className="loan-officer-row-middle">
                      <span>{loan.customer_username || "Customer"}</span>
                      <em>{loan.loan_type || "Loan"}</em>
                    </div>

                    <div className="loan-officer-row-status">
                      <span>{loan.status}</span>
                      <em>
                        {isUnclaimed(loan)
                          ? "Available"
                          : isClaimedByMe(loan)
                          ? "Assigned to me"
                          : "Claimed"}
                      </em>
                    </div>

                    <div className="loan-officer-row-amount">
                      <p>₹{formatAmount(loan.loan_amount)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          id="loan-officer-selected-details"
          className="detail-card fixed-detail-card loan-officer-details-below-box"
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

                <div className="loan-officer-detail-actions-top">
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

              <div className="customer-profile-grid">
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
                  <BadgeCheck size={18} />
                  <span>Customer Code</span>
                  <strong>{selectedLoan.customer_code}</strong>
                </div>
              </div>

              <div className="loan-detail-box">
                <h4>Loan Details</h4>

                <p>
                  <strong>Type:</strong> {selectedLoan.loan_type}
                </p>

                <p>
                  <strong>Amount:</strong> ₹
                  {formatAmount(selectedLoan.loan_amount)}
                </p>

                <p>
                  <strong>Purpose:</strong> {selectedLoan.purpose}
                </p>

                <p>
                  <strong>Assigned Loan Officer:</strong>{" "}
                  {selectedLoan.assigned_loan_officer_name || "Not assigned"}
                </p>
              </div>

              <div className="officer-action-row">
                {isUnclaimed(selectedLoan) && (
                  <button
                    className="primary-btn"
                    onClick={() => handleClaim(selectedLoan.loan_code)}
                  >
                    <ShieldCheck size={18} />
                    Take Review
                  </button>
                )}

                {isClaimedByMe(selectedLoan) &&
                  selectedLoan.status === "Submitted" && (
                    <button
                      className="primary-btn"
                      onClick={() => handleVerify(selectedLoan.loan_code)}
                    >
                      <BadgeCheck size={18} />
                      Verify
                    </button>
                  )}

                {isClaimedByMe(selectedLoan) &&
                  selectedLoan.status === "Verified" && (
                    <button
                      className="primary-btn"
                      onClick={() => handleForward(selectedLoan.loan_code)}
                    >
                      <Send size={18} />
                      Forward to Risk
                    </button>
                  )}

                {!isUnclaimed(selectedLoan) && !isClaimedByMe(selectedLoan) && (
                  <div className="info-note-card">
                    This loan is already assigned to another loan officer.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default LoanOfficerQueue;