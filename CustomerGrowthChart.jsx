import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "Jan", customers: 1200 },
  { month: "Feb", customers: 1500 },
  { month: "Mar", customers: 1800 },
  { month: "Apr", customers: 2300 },
  { month: "May", customers: 2800 },
  { month: "Jun", customers: 3400 },
  { month: "Jul", customers: 4200 },
  { month: "Aug", customers: 5100 },
  { month: "Sep", customers: 6100 },
  { month: "Oct", customers: 7000 },
  { month: "Nov", customers: 7700 },
  { month: "Dec", customers: 8450 },
];

export default function CustomerGrowthChart() {
  return (
    <div className="chart-card">
      <div className="card-header">
        <h3>Customer Growth</h3>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="customer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#2a3345" />

          <XAxis dataKey="month" stroke="#9ca3af" />

          <YAxis stroke="#9ca3af" />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="customers"
            stroke="#8B5CF6"
            strokeWidth={3}
            fill="url(#customer)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}