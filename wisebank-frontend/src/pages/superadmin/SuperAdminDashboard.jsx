import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  UsersRound,
  Landmark,
  ClipboardList,
  RefreshCw,
  Search
} from "lucide-react";

import { getSuperAdminDashboard } from "../../api/wisebankApi";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

function SuperAdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    sort: "loans"
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      const response = await getSuperAdminDashboard();
      setDashboard(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  const branchData = dashboard?.branch_performance || [];

  const filteredBranchData = useMemo(() => {
    return branchData
      .filter((branch) =>
        branch.branch_name.toLowerCase().includes(filters.search.toLowerCase())
      )
      .sort((a, b) => Number(b[filters.sort]) - Number(a[filters.sort]));
  }, [branchData, filters]);

  const roleData = dashboard?.role_distribution || [];

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Super Admin</p>
          <h1>System Dashboard</h1>
          <p>
            Monitor all branches, customers, employees, loan performance and
            role distribution.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="stats-grid same-row-grid">
        <div className="stat-card">
          <span>Branches</span>
          <strong>{dashboard?.total_branches || 0}</strong>
          <p>Total active branches</p>
        </div>

        <div className="stat-card">
          <span>Employees</span>
          <strong>{dashboard?.total_employees || 0}</strong>
          <p>All bank staff</p>
        </div>

        <div className="stat-card">
          <span>Customers</span>
          <strong>{dashboard?.total_customers || 0}</strong>
          <p>Registered customers</p>
        </div>

        <div className="stat-card">
          <span>Loans</span>
          <strong>{dashboard?.total_loans || 0}</strong>
          <p>Total loan applications</p>
        </div>
      </section>

      <section className="dashboard-equal-two same-row-grid">
        <div className="chart-card fixed-chart-card">
          <h3>Branch Loans</h3>
          <p>Loan volume by branch.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBranchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branch_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="loans" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card fixed-chart-card">
          <h3>Customer Growth by Branch</h3>
          <p>Customers registered under each branch.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredBranchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branch_name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="dashboard-equal-two same-row-grid">
        <div className="chart-card fixed-chart-card">
          <h3>Approval Rate</h3>
          <p>Branch approval percentage.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBranchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="branch_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approval_rate" fill="#f59e0b" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card fixed-chart-card">
          <h3>Employee Role Split</h3>
          <p>Employees grouped by role.</p>

          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData.filter((item) => item.count > 0)}
                  dataKey="count"
                  nameKey="role"
                  innerRadius={68}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  {roleData.map((item, index) => (
                    <Cell key={item.role} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="filter-toolbar full-filter-row">
        <div className="filter-search">
          <Search size={16} />
          <input
            placeholder="Search branch"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        <select
          value={filters.sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
        >
          <option value="loans">Sort by Loans</option>
          <option value="customers">Sort by Customers</option>
          <option value="approved">Sort by Approved</option>
          <option value="rejected">Sort by Rejected</option>
          <option value="approval_rate">Sort by Approval Rate</option>
        </select>
      </section>

      <section className="table-card same-row-card">
        <div className="section-title">
          <Building2 size={20} />
          <h3>Branch Performance</h3>
        </div>

        {loading ? (
          <div className="empty-state">Loading dashboard...</div>
        ) : (
          <div className="responsive-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Customers</th>
                  <th>Loans</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th>Approval Rate</th>
                </tr>
              </thead>

              <tbody>
                {filteredBranchData.map((branch) => (
                  <tr key={branch.branch_code}>
                    <td>
                      <strong>{branch.branch_name}</strong>
                      <span>{branch.branch_code}</span>
                    </td>
                    <td>{branch.customers}</td>
                    <td>{branch.loans}</td>
                    <td>{branch.approved}</td>
                    <td>{branch.rejected}</td>
                    <td>{branch.approval_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SuperAdminDashboard;