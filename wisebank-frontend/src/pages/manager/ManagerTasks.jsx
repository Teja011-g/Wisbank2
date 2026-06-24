import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock,
  AlertCircle,
  RefreshCcw,
  BarChart3
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import RevealSection from "../../components/common/RevealSection";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getManagerDashboard } from "../../api/wisebankApi";

const PRIORITY_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Normal: "#2563eb"
};

const STATUS_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#0891b2"
];

function ManagerTasks() {
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  function formatAmount(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  async function fetchTasks() {
    try {
      setLoading(true);

      const response = await getManagerDashboard(currentUser.employee_code);

      setTasks(response.data.priority_tasks || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error(error);
      setTasks([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser?.employee_code) {
      fetchTasks();
    }
  }, [currentUser]);

  const highPriority = tasks.filter((task) => task.priority === "High").length;
  const mediumPriority = tasks.filter((task) => task.priority === "Medium").length;
  const normalPriority = tasks.filter((task) => task.priority === "Normal").length;

  const priorityChartData = useMemo(() => {
    return [
      { name: "High", value: highPriority },
      { name: "Medium", value: mediumPriority },
      { name: "Normal", value: normalPriority }
    ];
  }, [highPriority, mediumPriority, normalPriority]);

  const statusChartData = useMemo(() => {
    const statusCount = {};

    tasks.forEach((task) => {
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;
    });

    return Object.keys(statusCount).map((status) => ({
      name: status,
      count: statusCount[status]
    }));
  }, [tasks]);

  const totalPriorityTasks = priorityChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <div className="page">
      <div className="page-header dashboard-header-row">
        <div>
          <p className="page-eyebrow">Manager Tasks</p>
          <h1 className="page-title">Branch Task Center</h1>
          <p className="page-description">
            Track pending branch work, priority applications, and actions
            needing manager attention.
          </p>
        </div>

        <button className="small-btn secondary" onClick={fetchTasks}>
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <RevealSection>
          <StatCard
            title="Active Tasks"
            value={tasks.length}
            subtitle="Open branch work"
            icon={ClipboardList}
          />
        </RevealSection>

        <RevealSection>
          <StatCard
            title="High Priority"
            value={highPriority}
            subtitle="Manager review needed"
            icon={AlertCircle}
          />
        </RevealSection>

        <RevealSection>
          <StatCard
            title="Medium Priority"
            value={mediumPriority}
            subtitle="Risk completed items"
            icon={Clock}
          />
        </RevealSection>

        <RevealSection>
          <StatCard
            title="Pending Approval"
            value={summary.manager_review || 0}
            subtitle="Final decision queue"
            icon={BarChart3}
          />
        </RevealSection>
      </div>

      <div className="manager-dashboard-grid">
        <RevealSection>
          <div className="chart-card animated-chart-card">
            <div className="table-header">
              <div>
                <h3>Task Status Bar Graph</h3>
                <p>Dynamically changes based on current task workflow.</p>
              </div>
            </div>

            {statusChartData.length === 0 ? (
              <div className="empty-state-card">
                <h3>No chart data</h3>
                <p>Task status chart appears when branch tasks exist.</p>
              </div>
            ) : (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      radius={[10, 10, 0, 0]}
                      animationDuration={900}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </RevealSection>

        <RevealSection>
          <div className="chart-card animated-chart-card">
            <div className="table-header">
              <div>
                <h3>Priority Ring Graph</h3>
                <p>High, medium and normal priority task split.</p>
              </div>
            </div>

            {totalPriorityTasks === 0 ? (
              <div className="empty-state-card">
                <h3>No priority data</h3>
                <p>Priority ring appears when tasks are available.</p>
              </div>
            ) : (
              <>
                <div className="donut-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={72}
                        outerRadius={105}
                        paddingAngle={4}
                        animationDuration={900}
                      >
                        {priorityChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PRIORITY_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center">
                    <strong>{totalPriorityTasks}</strong>
                    <span>Total Tasks</span>
                  </div>
                </div>

                <div className="ring-legend">
                  {priorityChartData.map((item) => (
                    <div key={item.name}>
                      <span
                        style={{
                          background: PRIORITY_COLORS[item.name]
                        }}
                      />
                      <p>{item.name}</p>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </RevealSection>
      </div>

      <RevealSection>
        <div className="table-card">
          <div className="table-header">
            <div>
              <h3>Task Table</h3>
              <p>
                These are workflow tasks generated from your branch loan data.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state-card">
              <h3>Loading tasks...</h3>
              <p>Please wait while tasks are fetched.</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state-card">
              <h3>No active tasks</h3>
              <p>No pending branch tasks are available right now.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Customer</th>
                    <th>Loan Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Suitable Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.loan_code}>
                      <td>{task.loan_code}</td>
                      <td>{task.customer_name}</td>
                      <td>{task.loan_type}</td>
                      <td>{formatAmount(task.loan_amount)}</td>
                      <td>
                        <span className="status-badge status-submitted">
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`priority-pill ${
                            task.priority === "High"
                              ? "priority-high"
                              : task.priority === "Medium"
                              ? "priority-medium"
                              : "priority-normal"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        {task.status === "Manager Review"
                          ? "Approve or Reject from Loan Approvals"
                          : task.status === "Risk Completed"
                          ? "Wait for risk officer to forward"
                          : task.status === "Risk Pending"
                          ? "Risk officer review pending"
                          : task.status === "Verified"
                          ? "Loan officer should forward to risk"
                          : "Loan officer verification pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </RevealSection>
    </div>
  );
}

export default ManagerTasks;