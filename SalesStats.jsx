import StatCard from "./StatCard";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
} from "lucide-react";

export default function SalesStats() {
  return (
    <div className="cards">

      <StatCard
        title="Today's Sales"
        value="₹245K"
        growth="12"
        color="#8B5CF6"
        icon={<DollarSign color="white" size={28} />}
      />

      <StatCard
        title="Orders"
        value="1,280"
        growth="8"
        color="#3B82F6"
        icon={<ShoppingCart color="white" size={28} />}
      />

      <StatCard
        title="Customers"
        value="842"
        growth="15"
        color="#22C55E"
        icon={<Users color="white" size={28} />}
      />

      <StatCard
        title="Growth"
        value="18.3%"
        growth="2"
        color="#F59E0B"
        icon={<TrendingUp color="white" size={28} />}
      />

    </div>
  );
}