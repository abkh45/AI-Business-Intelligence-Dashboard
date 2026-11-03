import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", sales: 120 },
  { month: "Feb", sales: 180 },
  { month: "Mar", sales: 240 },
  { month: "Apr", sales: 300 },
  { month: "May", sales: 260 },
  { month: "Jun", sales: 350 },
];

export default function ProductBarChart() {
  return (
    <div className="chart-card">
      <h3>Monthly Sales</h3>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="#2c3445" />

            <XAxis
              dataKey="month"
              stroke="#aaa"
            />

            <YAxis stroke="#aaa" />

            <Tooltip />

            <Bar
              dataKey="sales"
              fill="#8B5CF6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}