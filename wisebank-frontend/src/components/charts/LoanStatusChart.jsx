import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const data = [
  { status: "Submitted", count: 42 },
  { status: "Verified", count: 31 },
  { status: "Risk Review", count: 18 },
  { status: "Approved", count: 24 },
  { status: "Rejected", count: 9 }
];

function LoanStatusChart() {
  return (
    <div className="chart-card">
      <h3>Loan Status Overview</h3>
      <p>Current application distribution across workflow stages.</p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LoanStatusChart;