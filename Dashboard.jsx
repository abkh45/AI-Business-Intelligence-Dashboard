import {
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import SalesChart from "../components/SalesChart";
import RevenuePieChart from "../components/RevenuePieChart";
import RegionMap from "../components/RegionMap";
import TopProducts from "../components/TopProducts";
import InsightCard from "../components/InsightCard";
import ForecastChart from "../components/ForecastChart";

import {
  WalletCards,
  BadgeIndianRupee,
  ShoppingCart,
  Users,
  Tag,
} from "lucide-react";

import {
  getDashboardData,
} from "../api/api";

// ============================================================
// YEAR -> CSV DATASET
// ============================================================

const YEAR_DATASETS = {
  2022: "superstore_2022.csv",
  2023: "superstore_2023.csv",
  2024: "superstore_2024.csv",
  2025: "superstore_2025.csv",
};

// ============================================================
// FALLBACK DATA
// ============================================================

const fallbackData = {
  total_sales: 0,
  total_profit: 0,
  total_orders: 0,
  total_customers: 0,

  average_order_value: 0,

  sales_growth: 0,
  profit_growth: 0,
  orders_growth: 0,
  customers_growth: 0,
  average_order_growth: 0,

  earliest_date: null,
  latest_date: null,
};

// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {
  const number =
    Number(value) || 0;

  if (number >= 10000000) {
    return `₹${(
      number / 10000000
    ).toFixed(2)}Cr`;
  }

  if (number >= 1000000) {
    return `₹${(
      number / 1000000
    ).toFixed(2)}M`;
  }

  if (number >= 100000) {
    return `₹${(
      number / 100000
    ).toFixed(2)}L`;
  }

  if (number >= 1000) {
    return `₹${(
      number / 1000
    ).toFixed(1)}K`;
  }

  return `₹${number.toFixed(0)}`;
}

// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(
    Number(value) || 0
  );
}

// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  // ----------------------------------------------------------
  // SELECTED YEAR
  // ----------------------------------------------------------

  const [
    selectedYear,
    setSelectedYear,
  ] = useState("2024");

  // ----------------------------------------------------------
  // SELECTED DATASET
  // ----------------------------------------------------------

  const selectedDataset =
    YEAR_DATASETS[selectedYear];

  // ----------------------------------------------------------
  // KPI DATA
  // ----------------------------------------------------------

  const [
    data,
    setData,
  ] = useState(fallbackData);

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ----------------------------------------------------------
  // BACKEND ERROR
  // ----------------------------------------------------------

  const [
    backendError,
    setBackendError,
  ] = useState(false);

  // ==========================================================
  // LOAD KPI DATA WHEN YEAR CHANGES
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setBackendError(false);

        console.log(
          "========================================"
        );

        console.log(
          "DASHBOARD YEAR CHANGED"
        );

        console.log(
          "Selected year:",
          selectedYear
        );

        console.log(
          "Selected dataset:",
          selectedDataset
        );

        console.log(
          "========================================"
        );

        const response =
          await getDashboardData(
            selectedDataset
          );

        if (!mounted) {
          return;
        }

        if (response) {
          setData({
            ...fallbackData,
            ...response,

            // Support both names
            average_order_value:
              response.average_order_value ??
              response.avg_order_value ??
              0,

            sales_growth:
              response.sales_growth ??
              0,

            profit_growth:
              response.profit_growth ??
              0,

            orders_growth:
              response.orders_growth ??
              0,

            customers_growth:
              response.customers_growth ??
              0,

            average_order_growth:
              response.average_order_growth ??
              0,
          });
        }
      } catch (error) {
        console.error(
          "Dashboard API error:",
          error
        );

        if (mounted) {
          setBackendError(true);

          setData(
            fallbackData
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [
    selectedYear,
    selectedDataset,
  ]);

  // ==========================================================
  // YEAR CHANGE
  // ==========================================================

  function handleYearChange(year) {
    const yearString =
      String(year);

    console.log(
      "YEAR SELECTED:",
      yearString
    );

    if (
      YEAR_DATASETS[
        yearString
      ]
    ) {
      setSelectedYear(
        yearString
      );
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">

        {/* ===================================================
            NAVBAR
        =================================================== */}

        <Navbar
          selectedYear={
            selectedYear
          }
          onYearChange={
            handleYearChange
          }
        />

        {/* ===================================================
            BACKEND ERROR
        =================================================== */}

        {backendError && (
          <div
            style={{
              marginBottom: "15px",
              padding: "10px 14px",
              borderRadius: "8px",
              background:
                "rgba(255,80,100,0.08)",
              border:
                "1px solid rgba(255,80,100,0.25)",
              color: "#ff8095",
              fontSize: "13px",
            }}
          >
            ⚠️ Could not load dashboard
            data for{" "}
            <strong>
              {selectedYear}
            </strong>.
          </div>
        )}

        {/* ===================================================
            PAGE TITLE
        =================================================== */}

        <div
          style={{
            marginBottom: 16,
          }}
        >
          <h1>
            Welcome back, Admin! 👋
          </h1>

          <p
            style={{
              color: "#7186a3",
              marginTop: 4,
            }}
          >
            Here's what's happening
            with your business in{" "}
            <strong
              style={{
                color: "#9b6cff",
              }}
            >
              {selectedYear}
            </strong>
            .
          </p>

          <small
            style={{
              color: "#60758f",
            }}
          >
            Showing{" "}
            <strong>
              {selectedYear}
            </strong>{" "}
            data from{" "}
            <strong>
              {selectedDataset}
            </strong>
          </small>
        </div>

        {/* ===================================================
            KPI CARDS
        =================================================== */}

        <section className="stats-grid">

          <StatCard
            title="Total Sales"
            value={
              loading
                ? "Loading..."
                : formatMoney(
                    data.total_sales
                  )
            }
            growth={
              data.sales_growth
            }
            color="#6957F5"
            icon={
              <WalletCards
                size={25}
              />
            }
          />

          <StatCard
            title="Total Profit"
            value={
              loading
                ? "Loading..."
                : formatMoney(
                    data.total_profit
                  )
            }
            growth={
              data.profit_growth
            }
            color="#42C987"
            icon={
              <BadgeIndianRupee
                size={25}
              />
            }
          />

          <StatCard
            title="Total Orders"
            value={
              loading
                ? "Loading..."
                : formatNumber(
                    data.total_orders
                  )
            }
            growth={
              data.orders_growth
            }
            color="#3478F6"
            icon={
              <ShoppingCart
                size={25}
              />
            }
          />

          <StatCard
            title="Total Customers"
            value={
              loading
                ? "Loading..."
                : formatNumber(
                    data.total_customers
                  )
            }
            growth={
              data.customers_growth
            }
            color="#F59E0B"
            icon={
              <Users
                size={25}
              />
            }
          />

          <StatCard
            title="Avg Order Value"
            value={
              loading
                ? "Loading..."
                : formatMoney(
                    data.average_order_value
                  )
            }
            growth={
              data.average_order_growth
            }
            color="#E94D83"
            icon={
              <Tag
                size={25}
              />
            }
          />

        </section>

        {/* ===================================================
            ROW 1
            SALES TREND + PROFIT
        =================================================== */}

        <section
          className="dashboard-row row-one"
        >

          <SalesChart
            dataset={
              selectedDataset
            }
            year={
              selectedYear
            }
          />

          <RevenuePieChart
            dataset={
              selectedDataset
            }
            year={
              selectedYear
            }
          />

        </section>

        {/* ===================================================
            ROW 2
            REGION + PRODUCTS
        =================================================== */}

        <section
          className="dashboard-row row-two"
        >

          <RegionMap
            dataset={
              selectedDataset
            }
            year={
              selectedYear
            }
          />

          <TopProducts
            dataset={
              selectedDataset
            }
            year={
              selectedYear
            }
          />

        </section>

        {/* ===================================================
            ROW 3
            INSIGHTS + FORECAST
        =================================================== */}

        <section
          className="dashboard-row row-three"
        >

          <InsightCard
            dataset={
              selectedDataset
            }
            year={
              selectedYear
            }
          />

          <ForecastChart
            dataset={
              selectedDataset
            }
            year={
              selectedYear
            }
          />

        </section>

      </main>
    </div>
  );
}