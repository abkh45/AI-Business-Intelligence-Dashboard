import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { name: "Premium", value: 35 },
  { name: "Regular", value: 40 },
  { name: "New", value: 15 },
  { name: "Inactive", value: 10 },
];

const COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
];

export default function CustomerSegmentChart() {
  return (
    <div className="chart-card">
      <div className="card-header">
        <h3>Customer Segments</h3>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}