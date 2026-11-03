import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import CustomerGrowthChart from "../components/CustomerGrowthChart";
import CustomerSegmentChart from "../components/CustomerSegmentChart";

import {
  Users,
  UserPlus,
  UserCheck,
  BadgeIndianRupee,
} from "lucide-react";

export default function CustomerAnalytics() {
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        {/* Navbar */}
        <Navbar />

        {/* Page Title */}
        <h1
          style={{
            color: "white",
            marginBottom: "20px",
          }}
        >
          Customer Analytics
        </h1>

        {/* KPI Cards */}
        <div className="cards">
          <StatCard
            title="Total Customers"
            value="8,450"
            growth="10.2"
            color="#3B82F6"
            icon={<Users color="white" size={28} />}
          />

          <StatCard
            title="New Customers"
            value="1,230"
            growth="15.4"
            color="#22C55E"
            icon={<UserPlus color="white" size={28} />}
          />

          <StatCard
            title="Returning"
            value="5,840"
            growth="7.8"
            color="#8B5CF6"
            icon={<UserCheck color="white" size={28} />}
          />

          <StatCard
            title="Customer Value"
            value="₹12.5K"
            growth="9.6"
            color="#F59E0B"
            icon={<BadgeIndianRupee color="white" size={28} />}
          />
        </div>

        {/* Charts */}
        <div className="dashboard-grid">
          <CustomerGrowthChart />
          <CustomerSegmentChart />
        </div>
      </div>
    </div>
  );
}