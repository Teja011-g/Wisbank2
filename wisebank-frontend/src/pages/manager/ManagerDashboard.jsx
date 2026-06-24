import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  IndianRupee,
  UsersRound,
  Activity,
  RefreshCcw,
  AlertCircle
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getManagerDashboard,
  getManagerLoans,
  getRiskReports,
  getEmployees
} from "../../api/wisebankApi";

function ManagerDashboard() {
  const { currentUser } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [riskReports, setRiskReports] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function loadDashboard() {
    if (!currentUser?.employee_code) {
      setError("Manager employee code missing. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [dashboardResponse, loansResponse, reportsResponse, employeeResponse] =
        await Promise.all([
          getManagerDashboard(currentUser.employee_code),
          getManagerLoans(currentUser.employee_code),
          getRiskReports({
            branch_code: currentUser.branch_code
          }),
          getEmployees()
        ]);

      setDashboardData(dashboardResponse.data || {});
      setLoans(loansResponse.data || []);
      setRiskReports(reportsResponse.data || []);
      setEmployees(employeeResponse.data || []);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const branchLoans = useMemo(() => {
    return loans.filter((loan) => loan.branch_code === currentUser?.branch_code);
  }, [loans, currentUser]);

  const branchEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.branch_code === currentUser?.branch_code &&
        employee.role !== "CUSTOMER"
    );
  }, [employees, currentUser]);

  const totals = useMemo(() => {
    const sourceLoans = branchLoans.length > 0 ? branchLoans : loans;

    const totalApplications =
      Number(dashboardData?.total_applications) ||
      Number(dashboardData?.totalApplications) ||
      sourceLoans.length;

    const pendingApproval =
      Number(dashboardData?.pending_approval) ||
      Number(dashboardData?.pendingApproval) ||
      sourceLoans.filter(
        (loan) =>
          loan.status === "Forwarded To Manager" ||
          loan.status === "Risk Review" ||
          loan.status === "Pending Approval"
      ).length;

    const approvedLoans =
      Number(dashboardData?.approved_loans) ||
      Number(dashboardData?.approvedLoans) ||
      sourceLoans.filter((loan) => loan.status === "Approved").length;

    const rejectedLoans =
      Number(dashboardData?.rejected_loans) ||
      Number(dashboardData?.rejectedLoans) ||
      sourceLoans.filter((loan) => loan.status === "Rejected").length;

    const riskCompleted =
      Number(dashboardData?.risk_completed) ||
      Number(dashboardData?.riskCompleted) ||
      riskReports.length;

    const totalLoanValue =
      Number(dashboardData?.total_loan_value) ||
      Number(dashboardData?.totalLoanValue) ||
      sourceLoans.reduce(
        (sum, loan) => sum + Number(loan.loan_amount || 0),
        0
      );

    const pendingValue =
      Number(dashboardData?.pending_value) ||
      Number(dashboardData?.pendingValue) ||
      sourceLoans
        .filter(
          (loan) =>
            loan.status !== "Approved" &&
            loan.status !== "Rejected"
        )
        .reduce((sum, loan) => sum + Number(loan.loan_amount || 0), 0);

    return {
      totalApplications,
      pendingApproval,
      riskCompleted,
      approvedLoans,
      rejectedLoans,
      totalLoanValue,
      pendingValue,
      employees: branchEmployees.length
    };
  }, [dashboardData, branchLoans, loans, riskReports, branchEmployees]);

  return (
    <div className="page-section">
      <div className="page-header manager-hero-header">
        <div>
          <p className="page-eyebrow">Branch Manager</p>
          <h1>Loan Operations Dashboard</h1>
          <p>
            Real data for {currentUser?.branch_name}. Pending approvals,
            employee work, risk reports and recent activity.
          </p>
        </div>

        <button className="secondary-btn" onClick={loadDashboard}>
          <RefreshCcw size={18} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="auth-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="stats-grid manager-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <span>Total Applications</span>
          <strong>{totals.totalApplications}</strong>
          <p>{currentUser?.branch_name}</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <span>Pending Approval</span>
          <strong>{totals.pendingApproval}</strong>
          <p>Waiting for manager decision</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShieldCheck size={24} />
          </div>
          <span>Risk Completed</span>
          <strong>{totals.riskCompleted}</strong>
          <p>Risk reports generated</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <span>Approved Loans</span>
          <strong>{totals.approvedLoans}</strong>
          <p>Final approved</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <span>Rejected Loans</span>
          <strong>{totals.rejectedLoans}</strong>
          <p>Final rejected</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IndianRupee size={24} />
          </div>
          <span>Total Loan Value</span>
          <strong>₹{Number(totals.totalLoanValue).toLocaleString()}</strong>
          <p>Branch loan amount</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <span>Pending Value</span>
          <strong>₹{Number(totals.pendingValue).toLocaleString()}</strong>
          <p>Not finalized yet</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UsersRound size={24} />
          </div>
          <span>Employees</span>
          <strong>{totals.employees}</strong>
          <p>Active branch staff</p>
        </div>
      </section>

      <section className="dashboard-grid two-card-grid">
        <div className="dashboard-card">
          <div className="section-title">
            <FileText size={20} />
            <h3>Recent Branch Loans</h3>
          </div>

          {branchLoans.length === 0 && (
            <div className="empty-state">
              <FileText size={36} />
              <h3>No loans found</h3>
              <p>No customer applications found for this manager branch.</p>
            </div>
          )}

          {branchLoans.length > 0 && (
            <div className="task-list">
              {branchLoans.slice(0, 6).map((loan) => (
                <div key={loan.loan_code} className="task-card">
                  <div className="task-card-top">
                    <strong>{loan.loan_code}</strong>
                    <span>{loan.status}</span>
                  </div>

                  <p>{loan.customer_name}</p>

                  <div className="task-meta">
                    <span>{loan.loan_type}</span>
                    <span>₹{Number(loan.loan_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="section-title">
            <ShieldCheck size={20} />
            <h3>Recent Risk Reports</h3>
          </div>

          {riskReports.length === 0 && (
            <div className="empty-state">
              <ShieldCheck size={36} />
              <h3>No risk reports</h3>
              <p>Risk Officer reports will appear here.</p>
            </div>
          )}

          {riskReports.length > 0 && (
            <div className="task-list">
              {riskReports.slice(0, 6).map((report) => (
                <div key={report.id || report.loan_code} className="task-card">
                  <div className="task-card-top">
                    <strong>{report.loan_code}</strong>
                    <span>{report.risk_level}</span>
                  </div>

                  <p>Prediction: {report.prediction_status}</p>

                  <div className="task-meta">
                    <span>Risk Score: {report.risk_score}</span>
                    <span>{report.created_by_name || "Risk Officer"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManagerDashboard;