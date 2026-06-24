import { useEffect, useMemo, useState } from "react";
import {
  FileBarChart,
  RefreshCw,
  Search,
  ShieldCheck,
  Building2,
  UserRound,
  IndianRupee,
  AlertTriangle
} from "lucide-react";

import {
  getRiskReports,
  getBranches
} from "../../api/wisebankApi";

import { useAuth } from "../../context/AuthContext";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

function RiskReports() {
  const { currentUser } = useAuth();

  const [reports, setReports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    branch: "all",
    risk: "all",
    amount: "all"
  });

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadReports() {
    try {
      setLoading(true);

      const params = {};

      if (currentUser?.role === "RISK_OFFICER") {
        params.employee_code = currentUser.employee_code;
        params.role = currentUser.role;
      }

      if (
        currentUser?.role !== "ADMIN" &&
        currentUser?.role !== "SUPER_ADMIN" &&
        currentUser?.branch_code
      ) {
        params.branch_code = currentUser.branch_code;
      }

      const response = await getRiskReports(params);
      const reportList = response.data || [];

      setReports(reportList);

      if (reportList.length > 0) {
        setSelectedReport(reportList[0]);
      } else {
        setSelectedReport(null);
      }
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Unable to load risk reports",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBranches() {
    try {
      const response = await getBranches();
      setBranches(response.data || []);
    } catch {
      setBranches([]);
    }
  }

  useEffect(() => {
    loadReports();
    loadBranches();
  }, [currentUser]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        const text = `
          ${report.loan_code}
          ${report.customer_name}
          ${report.customer_username}
          ${report.branch_name}
          ${report.risk_level}
          ${report.created_by_name}
        `.toLowerCase();

        if (!text.includes(filters.search.toLowerCase())) return false;

        if (filters.branch !== "all" && report.branch_code !== filters.branch) {
          return false;
        }

        if (filters.risk !== "all" && report.risk_level !== filters.risk) {
          return false;
        }

        if (filters.amount === "below5" && Number(report.loan_amount) >= 500000) {
          return false;
        }

        if (filters.amount === "above5" && Number(report.loan_amount) < 500000) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [reports, filters]);

  const riskLevelData = [
    {
      name: "Low Risk",
      value: filteredReports.filter((item) => item.risk_level === "Low Risk").length
    },
    {
      name: "Medium Risk",
      value: filteredReports.filter((item) => item.risk_level === "Medium Risk").length
    },
    {
      name: "High Risk",
      value: filteredReports.filter((item) => item.risk_level === "High Risk").length
    }
  ];

  const probabilityData = filteredReports.slice(0, 8).map((report) => ({
    loan: report.loan_code,
    approved: Number(report.approved_probability || 0),
    rejected: Number(report.rejected_probability || 0)
  }));

  const trendData = filteredReports
    .slice()
    .reverse()
    .slice(-8)
    .map((report, index) => ({
      name: `R${index + 1}`,
      score: Number(report.risk_score || 0)
    }));

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN");
  }

  function riskClass(level) {
    if (level === "Low Risk") return "success";
    if (level === "Medium Risk") return "warning";
    if (level === "High Risk") return "danger";
    return "neutral";
  }

  const totalReports = filteredReports.length;
  const avgRiskScore =
    totalReports > 0
      ? Math.round(
          filteredReports.reduce(
            (sum, item) => sum + Number(item.risk_score || 0),
            0
          ) / totalReports
        )
      : 0;

  return (
    <div className="page-section risk-report-page">
      {toast && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">Risk Analytics</p>
          <h1>Risk Reports</h1>
          <p>
            View risk reports generated by risk officers. Higher officers can
            review branch-wise risk performance and employee activity.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadReports}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="stats-grid same-row-grid">
        <div className="stat-card">
          <span>Total Reports</span>
          <strong>{totalReports}</strong>
          <p>Reports matching current filters</p>
        </div>

        <div className="stat-card">
          <span>Average Risk Score</span>
          <strong>{avgRiskScore}</strong>
          <p>Mean score from visible reports</p>
        </div>

        <div className="stat-card">
          <span>Low Risk</span>
          <strong>
            {filteredReports.filter((item) => item.risk_level === "Low Risk").length}
          </strong>
          <p>Safer applications</p>
        </div>

        <div className="stat-card">
          <span>High Risk</span>
          <strong>
            {filteredReports.filter((item) => item.risk_level === "High Risk").length}
          </strong>
          <p>Needs deeper review</p>
        </div>
      </section>

      <section className="dashboard-equal-two same-row-grid">
        <div className="chart-card fixed-chart-card">
          <h3>Risk Level Split</h3>
          <p>Reports grouped by risk category.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskLevelData.filter((item) => item.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  {riskLevelData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card fixed-chart-card">
          <h3>Approval vs Rejection Probability</h3>
          <p>Latest visible reports by loan code.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probabilityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="loan" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" fill="#16a34a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="rejected" fill="#dc2626" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="dashboard-equal-two same-row-grid">
        <div className="chart-card fixed-chart-card">
          <h3>Risk Score Trend</h3>
          <p>Recent risk score movement.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card fixed-chart-card">
          <h3>Risk Review Ownership</h3>
          <p>Selected report and officer details.</p>

          {selectedReport ? (
            <div className="risk-report-focus-card">
              <div>
                <ShieldCheck size={28} />
                <span>{selectedReport.risk_level}</span>
                <strong>{selectedReport.loan_code}</strong>
              </div>

              <p>
                Generated by <strong>{selectedReport.created_by_name}</strong>{" "}
                for <strong>{selectedReport.customer_name}</strong>.
              </p>

              <div className="risk-focus-grid">
                <div>
                  <span>Approved</span>
                  <strong>{selectedReport.approved_probability}%</strong>
                </div>

                <div>
                  <span>Rejected</span>
                  <strong>{selectedReport.rejected_probability}%</strong>
                </div>

                <div>
                  <span>Risk Score</span>
                  <strong>{selectedReport.risk_score}</strong>
                </div>

                <div>
                  <span>Amount</span>
                  <strong>₹{formatAmount(selectedReport.loan_amount)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">No report selected</div>
          )}
        </div>
      </section>

      <section className="filter-toolbar full-filter-row">
        <div className="filter-search">
          <Search size={16} />
          <input
            placeholder="Search loan, customer, officer, branch"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {(currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") && (
          <select
            value={filters.branch}
            onChange={(e) => updateFilter("branch", e.target.value)}
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.branch_code} value={branch.branch_code}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.risk}
          onChange={(e) => updateFilter("risk", e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="Low Risk">Low Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="High Risk">High Risk</option>
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

      <section className="report-work-grid same-row-grid">
        <div className="list-card fixed-list-card">
          <div className="section-title">
            <FileBarChart size={20} />
            <h3>Reports</h3>
          </div>

          {loading ? (
            <div className="empty-state">Loading risk reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">No risk reports found</div>
          ) : (
            <div className="loan-card-list">
              {filteredReports.map((report) => (
                <button
                  key={report.id}
                  className={
                    selectedReport?.id === report.id
                      ? "loan-select-card active"
                      : "loan-select-card"
                  }
                  onClick={() => setSelectedReport(report)}
                >
                  <div>
                    <strong>{report.customer_name}</strong>
                    <span>{report.loan_code}</span>
                  </div>

                  <div>
                    <p>{report.risk_level}</p>
                    <em>{report.created_by_name}</em>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-card fixed-detail-card">
          {!selectedReport ? (
            <div className="empty-state">Select report to view details</div>
          ) : (
            <>
              <div className="detail-card-header">
                <div>
                  <h3>{selectedReport.customer_name}</h3>
                  <p>{selectedReport.loan_code}</p>
                </div>

                <span className={`customer-final-status ${riskClass(selectedReport.risk_level)}`}>
                  <AlertTriangle size={17} />
                  {selectedReport.risk_level}
                </span>
              </div>

              <div className="customer-profile-grid">
                <div>
                  <UserRound size={18} />
                  <span>Customer</span>
                  <strong>{selectedReport.customer_username}</strong>
                </div>

                <div>
                  <Building2 size={18} />
                  <span>Branch</span>
                  <strong>{selectedReport.branch_name}</strong>
                </div>

                <div>
                  <IndianRupee size={18} />
                  <span>Loan Amount</span>
                  <strong>₹{formatAmount(selectedReport.loan_amount)}</strong>
                </div>

                <div>
                  <ShieldCheck size={18} />
                  <span>Risk Officer</span>
                  <strong>{selectedReport.created_by_name}</strong>
                </div>
              </div>

              <div className="review-data-list report-detail-list">
                <div>
                  <span>Prediction</span>
                  <strong>{selectedReport.prediction_status}</strong>
                </div>

                <div>
                  <span>Suggested Status</span>
                  <strong>{selectedReport.suggested_status}</strong>
                </div>

                <div>
                  <span>Approved Probability</span>
                  <strong>{selectedReport.approved_probability}%</strong>
                </div>

                <div>
                  <span>Rejected Probability</span>
                  <strong>{selectedReport.rejected_probability}%</strong>
                </div>

                <div>
                  <span>Total Assets</span>
                  <strong>₹{formatAmount(selectedReport.total_assets_value)}</strong>
                </div>

                <div>
                  <span>Risk Score</span>
                  <strong>{selectedReport.risk_score}</strong>
                </div>

                <div className="full-row">
                  <span>Risk Reasons</span>
                  <strong>{selectedReport.risk_reasons || "No reasons recorded"}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default RiskReports;