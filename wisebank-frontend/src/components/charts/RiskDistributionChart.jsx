import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const data = [
  { name: "Low Risk", value: 56 },
  { name: "Medium Risk", value: 28 },
  { name: "High Risk", value: 16 }
];

const COLORS = ["#16a34a", "#f59e0b", "#dc2626"];

function RiskDistributionChart() {
  return (
    <div className="chart-card">
      <h3>Risk Distribution</h3>
      <p>ML-based customer risk category summary.</p>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={95}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RiskDistributionChart;