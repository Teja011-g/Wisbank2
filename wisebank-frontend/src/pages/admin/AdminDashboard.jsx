import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import {
  Building2,
  UsersRound,
  Landmark,
  FileText,
  RefreshCcw,
  Search,
  ArrowUpDown,
  AlertCircle,
  BarChart3
} from "lucide-react";

import {
  getAdminDashboard,
  getBranches,
  getEmployees
} from "../../api/wisebankApi";

import { useAuth } from "../../context/AuthContext";

import "../../styles/admin-dashboard.css";

function AdminDashboard() {
  const { currentUser } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("loans");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getReadableError(error) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") return detail;

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

    if (detail && typeof detail === "object") return JSON.stringify(detail);

    return error?.message || "Something went wrong.";
  }

  function getNumber(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return Number(value) || 0;
      }
    }

    return 0;
  }

  function getViewerCode() {
    return (
      currentUser?.employee_code ||
      currentUser?.user_code ||
      currentUser?.bank_id ||
      null
    );
  }

  function isBranchAssignedAdmin() {
    return (
      currentUser?.role === "ADMIN" &&
      currentUser?.branch_code &&
      currentUser?.branch_name !== "All Branches"
    );
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const viewerCode = getViewerCode();

      const [dashboardResponse, branchResponse, employeeResponse] =
        await Promise.all([
          getAdminDashboard(viewerCode),
          getBranches(),
          getEmployees(viewerCode)
        ]);

      const allBranches = branchResponse.data || [];

      if (isBranchAssignedAdmin()) {
        setBranches(
          allBranches.filter(
            (branch) => branch.branch_code === currentUser.branch_code
          )
        );
      } else {
        setBranches(allBranches);
      }

      setDashboardData(dashboardResponse.data || {});
      setEmployees(employeeResponse.data || []);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [currentUser]);

  function getBranchStatsFromBackend(branchCode) {
    const branchStats =
      dashboardData?.branches ||
      dashboardData?.branch_summary ||
      dashboardData?.branchSummary ||
      dashboardData?.branch_wise_summary ||
      dashboardData?.branchWiseSummary ||
      [];

    return branchStats.find(
      (item) =>
        item.branch_code === branchCode ||
        item.branchCode === branchCode ||
        item.code === branchCode
    );
  }

  const branchSummary = useMemo(() => {
    return branches.map((branch) => {
      const backendStats = getBranchStatsFromBackend(branch.branch_code);

      const branchEmployees = employees.filter(
        (employee) => employee.branch_code === branch.branch_code
      );

      const employeesCount =
        getNumber(
          backendStats?.employees,
          backendStats?.employee_count,
          backendStats?.employeeCount,
          backendStats?.total_employees,
          backendStats?.totalEmployees
        ) ||
        branchEmployees.filter((employee) => employee.role !== "CUSTOMER")
          .length;

      const customersCount = getNumber(
        backendStats?.customers,
        backendStats?.customer_count,
        backendStats?.customerCount,
        backendStats?.total_customers,
        backendStats?.totalCustomers
      );

      const loansCount = getNumber(
        backendStats?.loans,
        backendStats?.loan_count,
        backendStats?.loanCount,
        backendStats?.total_loans,
        backendStats?.totalLoans,
        backendStats?.applications,
        backendStats?.total_applications
      );

      const approvedCount = getNumber(
        backendStats?.approved,
        backendStats?.approved_loans,
        backendStats?.approvedLoans,
        backendStats?.approved_count,
        backendStats?.approvedCount
      );

      const rejectedCount = getNumber(
        backendStats?.rejected,
        backendStats?.rejected_loans,
        backendStats?.rejectedLoans,
        backendStats?.rejected_count,
        backendStats?.rejectedCount
      );

      const pendingCount =
        getNumber(
          backendStats?.pending,
          backendStats?.pending_loans,
          backendStats?.pendingLoans,
          backendStats?.pending_count,
          backendStats?.pendingCount
        ) || Math.max(loansCount - approvedCount - rejectedCount, 0);

      return {
        branch_code: branch.branch_code,
        branch_name: branch.branch_name,
        city: branch.city || "-",
        state: branch.state || "-",
        employees: employeesCount,
        customers: customersCount,
        loans: loansCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pending: pendingCount
      };
    });
  }, [branches, employees, dashboardData]);

  const sortedBranches = useMemo(() => {
    const sorted = [...branchSummary];

    sorted.sort((a, b) => {
      if (sortBy === "loans") return b.loans - a.loans;
      if (sortBy === "customers") return b.customers - a.customers;
      if (sortBy === "employees") return b.employees - a.employees;
      if (sortBy === "approved") return b.approved - a.approved;
      if (sortBy === "rejected") return b.rejected - a.rejected;
      if (sortBy === "pending") return b.pending - a.pending;

      return a.branch_name.localeCompare(b.branch_name);
    });

    return sorted;
  }, [branchSummary, sortBy]);

  const filteredBranches = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return sortedBranches.filter((branch) => {
      return (
        branch.branch_name.toLowerCase().includes(search) ||
        branch.branch_code.toLowerCase().includes(search) ||
        branch.city.toLowerCase().includes(search)
      );
    });
  }, [sortedBranches, searchTerm]);

  const totals = useMemo(() => {
    return branchSummary.reduce(
      (acc, branch) => {
        acc.branches += 1;
        acc.employees += branch.employees;
        acc.customers += branch.customers;
        acc.loans += branch.loans;
        acc.approved += branch.approved;
        acc.rejected += branch.rejected;
        acc.pending += branch.pending;

        return acc;
      },
      {
        branches: 0,
        employees: 0,
        customers: 0,
        loans: 0,
        approved: 0,
        rejected: 0,
        pending: 0
      }
    );
  }, [branchSummary]);

  const maxLoanStatusValue = useMemo(() => {
    const values = filteredBranches.flatMap((branch) => [
      branch.approved,
      branch.rejected,
      branch.pending
    ]);

    return Math.max(...values, 1);
  }, [filteredBranches]);

  const branchChartData = filteredBranches.map((branch) => ({
    branch: branch.branch_name,
    employees: branch.employees,
    customers: branch.customers,
    loans: branch.loans
  }));

  const branchChartHeight = Math.max(340, branchChartData.length * 92);

  function getBarWidth(value, maxValue) {
    if (!value) return "0%";
    return `${Math.max((Number(value) / maxValue) * 100, 4)}%`;
  }

  return (
    <div className="page-section admin-dashboard-page">
      <div className="page-header admin-main-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1>Operations Admin</h1>
          <p>Branch workload and loan status overview.</p>
        </div>

        <button className="admin-refresh-btn" onClick={loadDashboard}>
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

      <section className="stats-grid admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <span>Total Branches</span>
          <strong>{totals.branches}</strong>
          <p>Active service locations</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UsersRound size={24} />
          </div>
          <span>Total Employees</span>
          <strong>{totals.employees}</strong>
          <p>Active operations staff</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Landmark size={24} />
          </div>
          <span>Total Customers</span>
          <strong>{totals.customers}</strong>
          <p>Registered customers</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <span>Total Loans</span>
          <strong>{totals.loans}</strong>
          <p>
            Approved {totals.approved} / Rejected {totals.rejected}
          </p>
        </div>
      </section>

      <section className="admin-chart-grid">
        <div className="dashboard-card admin-recharts-card">
          <div className="section-title">
            <BarChart3 size={20} />
            <h3>Branch Workload Bar Graph</h3>
          </div>

          <p className="muted-text admin-chart-note">
            Employees, customers and loans per branch. If branches increase, this
            chart scrolls vertically inside the card.
          </p>

          <div className="admin-recharts-scroll-box">
            {branchChartData.length === 0 ? (
              <div className="admin-empty-chart">
                <Building2 size={38} />
                <h3>No branch data</h3>
                <p>Create branches to see workload chart.</p>
              </div>
            ) : (
              <div
                className="admin-recharts-inner"
                style={{ height: `${branchChartHeight}px` }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={branchChartData}
                    layout="vertical"
                    margin={{ top: 20, right: 26, left: 105, bottom: 42 }}
                    barCategoryGap={18}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="branch"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={34} />
                    <Bar
                      dataKey="employees"
                      name="Employees"
                      fill="#16a34a"
                      radius={[0, 8, 8, 0]}
                    />
                    <Bar
                      dataKey="customers"
                      name="Customers"
                      fill="#2563eb"
                      radius={[0, 8, 8, 0]}
                    />
                    <Bar
                      dataKey="loans"
                      name="Loans"
                      fill="#7c3aed"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card admin-bar-card">
          <div className="section-title">
            <BarChart3 size={20} />
            <h3>Loan Status Bar Graph</h3>
          </div>

          <p className="muted-text admin-chart-note">
            Approved, rejected and pending loans per branch.
          </p>

          <div className="admin-bar-scroll-box">
            {filteredBranches.map((branch) => (
              <div className="admin-branch-bar-card" key={branch.branch_code}>
                <div className="admin-branch-bar-header">
                  <div>
                    <strong>{branch.branch_name}</strong>
                    <span>{branch.branch_code}</span>
                  </div>

                  <p>{branch.loans} Loans</p>
                </div>

                <div className="admin-multi-bar-row">
                  <span>Approved</span>
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill approved-fill"
                      style={{
                        width: getBarWidth(branch.approved, maxLoanStatusValue)
                      }}
                    ></div>
                  </div>
                  <strong>{branch.approved}</strong>
                </div>

                <div className="admin-multi-bar-row">
                  <span>Rejected</span>
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill rejected-fill"
                      style={{
                        width: getBarWidth(branch.rejected, maxLoanStatusValue)
                      }}
                    ></div>
                  </div>
                  <strong>{branch.rejected}</strong>
                </div>

                <div className="admin-multi-bar-row">
                  <span>Pending</span>
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill pending-fill"
                      style={{
                        width: getBarWidth(branch.pending, maxLoanStatusValue)
                      }}
                    ></div>
                  </div>
                  <strong>{branch.pending}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-card admin-filter-card">
        <div className="admin-filter-row">
          <div className="admin-search-box">
            <Search size={19} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search branch"
            />
          </div>

          <div className="admin-select-box">
            <ArrowUpDown size={19} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="loans">Sort by Loans</option>
              <option value="customers">Sort by Customers</option>
              <option value="employees">Sort by Employees</option>
              <option value="approved">Sort by Approved</option>
              <option value="rejected">Sort by Rejected</option>
              <option value="pending">Sort by Pending</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </section>

      <section className="dashboard-card admin-table-card">
        <div className="section-title">
          <Building2 size={20} />
          <h3>All Branch Summary</h3>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>City</th>
                <th>Employees</th>
                <th>Customers</th>
                <th>Loans</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Pending</th>
              </tr>
            </thead>

            <tbody>
              {filteredBranches.map((branch) => (
                <tr key={branch.branch_code}>
                  <td>
                    <strong>{branch.branch_name}</strong>
                    <br />
                    <span>{branch.branch_code}</span>
                  </td>

                  <td>{branch.city}</td>
                  <td>{branch.employees}</td>
                  <td>{branch.customers}</td>
                  <td>{branch.loans}</td>

                  <td>
                    <span className="mini-status approved-mini">
                      {branch.approved}
                    </span>
                  </td>

                  <td>
                    <span className="mini-status rejected-mini">
                      {branch.rejected}
                    </span>
                  </td>

                  <td>
                    <span className="mini-status pending-mini">
                      {branch.pending}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBranches.length === 0 && (
          <div className="admin-empty-chart">
            <Building2 size={38} />
            <h3>No branch found</h3>
            <p>Try another search term.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;