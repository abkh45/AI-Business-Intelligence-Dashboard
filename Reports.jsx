
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

import {
  FileText,
  CalendarDays,
  BadgeIndianRupee,
  Download,
  Loader2,
  CheckCircle,
  TrendingUp,
  Package,
} from "lucide-react";

import {
  getDashboardData,
  getSalesTrend,
  getTopProducts,
  getBusinessInsights,
  getPredictions,
} from "../api/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const YEARS = ["2022", "2023", "2024", "2025"];
const YEAR_KEY = "selectedYear";
const COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#22c55e", "#ec4899"];

function getSavedYear() {
  try {
    const saved = localStorage.getItem(YEAR_KEY);
    if (YEARS.includes(String(saved))) return String(saved);
  } catch (error) {
    console.error(error);
  }
  return "2024";
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function money(value) {
  const amount = number(value);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function getSales(data) {
  return number(
    data?.total_sales ??
    data?.totalSales ??
    data?.total_revenue ??
    data?.revenue ??
    data?.sales
  );
}

function getProfit(data) {
  return number(
    data?.total_profit ??
    data?.totalProfit ??
    data?.profit
  );
}

function getOrders(data) {
  return number(
    data?.total_orders ??
    data?.totalOrders ??
    data?.orders
  );
}

function getCustomers(data) {
  return number(
    data?.total_customers ??
    data?.totalCustomers ??
    data?.customers
  );
}

function saveFile(filename, content, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function escapeCSV(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// These two report endpoints provide full category totals and monthly unique orders.
async function fetchReportEndpoint(path, selectedYear) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/${path}?dataset=${encodeURIComponent(selectedYear)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }
  return response.json();
}

const panelStyle = {
  background: "#111c2e",
  border: "1px solid #26364d",
  borderRadius: "12px",
  padding: "18px",
  minWidth: 0,
};

const titleStyle = {
  color: "#e7edf7",
  fontSize: "15px",
  fontWeight: 600,
  margin: "0 0 18px",
};

export default function Reports() {
  const [year, setYear] = useState(getSavedYear);
  const [dashboard, setDashboard] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [products, setProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [ordersTrend, setOrdersTrend] = useState([]);
  const [insights, setInsights] = useState(null);
  const [predictions, setPredictions] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleYearEvent = (event) => {
      const nextYear = String(event.detail || "");
      if (YEARS.includes(nextYear)) setYear(nextYear);
    };

    const handleStorage = (event) => {
      if (event.key && event.key !== YEAR_KEY) return;
      const nextYear = String(event.newValue || "");
      if (YEARS.includes(nextYear)) setYear(nextYear);
    };

    window.addEventListener("yearChanged", handleYearEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("yearChanged", handleYearEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  async function loadData(selectedYear, isRefresh = false) {
    setError("");
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const results = await Promise.allSettled([
        getDashboardData(selectedYear),
        getSalesTrend(selectedYear, "all"),
        getTopProducts(selectedYear, 10),
        getBusinessInsights(selectedYear),
        getPredictions(selectedYear),
        fetchReportEndpoint("sales-category", selectedYear),
        fetchReportEndpoint("orders-trend", selectedYear),
      ]);

      const [dash, trend, product, insight, prediction, category, orderTrend] = results;

      if (dash.status === "fulfilled") {
        setDashboard(dash.value);
      } else {
        setDashboard(null);
        console.error("Dashboard API:", dash.reason);
      }

      if (trend.status === "fulfilled") {
        const response = trend.value;
        setSalesTrend(
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
        );
      } else {
        setSalesTrend([]);
        console.error("Sales trend API:", trend.reason);
      }

      if (product.status === "fulfilled") {
        const response = product.value;
        setProducts(
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
        );
      } else {
        setProducts([]);
        console.error("Products API:", product.reason);
      }

      setInsights(
        insight.status === "fulfilled" ? insight.value : null
      );

      setPredictions(
        prediction.status === "fulfilled" ? prediction.value : null
      );

      if (category.status === "fulfilled") {
        const response = category.value;
        setCategorySales(
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
        );
      } else {
        setCategorySales([]);
        console.error("Sales by category API:", category.reason);
      }

      if (orderTrend.status === "fulfilled") {
        const response = orderTrend.value;
        setOrdersTrend(
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
        );
      } else {
        setOrdersTrend([]);
        console.error("Orders trend API:", orderTrend.reason);
      }

      if (
        dash.status === "rejected" &&
        trend.status === "rejected" &&
        product.status === "rejected"
      ) {
        setError(
          "Could not load report data. Check that your FastAPI backend is running."
        );
      }
    } catch (err) {
      console.error("Reports error:", err);
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData(year);
  }, [year]);

  function changeYear(event) {
    const nextYear = event.target.value;
    setYear(nextYear);

    try {
      localStorage.setItem(YEAR_KEY, nextYear);
    } catch (error) {
      console.error(error);
    }

    window.dispatchEvent(
      new CustomEvent("yearChanged", { detail: nextYear })
    );
  }

  const sales = getSales(dashboard);
  const profit = getProfit(dashboard);
  const orders = getOrders(dashboard);
  const customers = getCustomers(dashboard);

  const monthlyData = salesTrend.map((item, index) => ({
    month:
      item.label ||
      item.month ||
      item.date ||
      `Period ${index + 1}`,
    sales: number(item.sales ?? item.total_sales ?? item.revenue),
    orders: number(item.orders ?? item.total_orders),
  }));

  const productData = products
    .map((item) => ({
      product:
        item.product_name ||
        item.product ||
        item.name ||
        "Product",
      sales: number(item.sales ?? item.total_sales ?? item.revenue),
      profit: number(item.profit ?? item.total_profit),
      category: item.category || "Other",
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Category totals come from all rows in the dataset, not just the top 5 products.
  const categoryData = categorySales.map((item) => ({
    name: item.category || item.name || "Other",
    value: number(item.sales ?? item.total_sales ?? item.value),
  }));

  // Export helpers only. Dashboard chart data and rendering are unchanged.
  function downloadExcel(filename, sheetName, rows) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  }

  function getMonthKey(value) {
    if (value == null || value === "") return null;
    const text = String(value).trim();
    const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})/);
    if (isoMatch) return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, "0")}`;
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
    }
    return null;
  }

  function getMonthLabel(key, fallback) {
    if (!key || !/^\d{4}-\d{2}$/.test(key)) return fallback || key || "Unknown";
    const [yearPart, monthPart] = key.split("-").map(Number);
    return new Date(yearPart, monthPart - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function downloadSalesReport() {
    // Aggregate daily sales into months for the downloaded report only.
    const monthlyTotals = new Map();
    salesTrend.forEach((item, index) => {
      const rawLabel = item.date || item.label || item.month || `Period ${index + 1}`;
      const key = getMonthKey(rawLabel) || String(rawLabel);
      const current = monthlyTotals.get(key) || { key, label: getMonthLabel(getMonthKey(rawLabel), rawLabel), sales: 0 };
      current.sales += number(item.sales ?? item.total_sales ?? item.revenue);
      monthlyTotals.set(key, current);
    });

    // Use the dedicated monthly orders endpoint so the export does not turn
    // missing daily order fields into zeroes when monthly counts are available.
    const orderTotals = new Map();
    ordersTrend.forEach((item) => {
      const rawLabel = item.month || item.label || item.date;
      const key = getMonthKey(rawLabel) || (rawLabel == null ? null : String(rawLabel));
      if (key != null) {
        orderTotals.set(key, number(item.orders ?? item.total_orders ?? item.order_count));
      }
    });

    const rows = Array.from(monthlyTotals.values())
      .sort((a, b) => String(a.key).localeCompare(String(b.key)))
      .map((item) => ({
        Month: item.label,
        Sales: Number(item.sales.toFixed(2)),
        Orders: orderTotals.has(item.key)
          ? orderTotals.get(item.key)
          : number(monthlyData.find((row) => String(row.month) === String(item.key) || String(row.month) === item.label)?.orders),
      }));

    if (!rows.length) {
      window.alert("No sales data is available to export for the selected year.");
      return;
    }
    downloadExcel(`Sales_Report_${year}.xlsx`, "Sales Report", rows);
  }

  async function downloadProductReport() {
    // Fetch a larger product list for export; chart data remains limited to top 5.
    let exportProducts = products;
    try {
      const response = await getTopProducts(year, 100000);
      const returned = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      if (returned.length) exportProducts = returned;
    } catch (err) {
      console.error("Could not fetch full product list for export:", err);
    }

    const rows = exportProducts.map((item) => ({
      Product: item.product_name || item.product || item.name || "Product",
      Category: item.category || "Other",
      Sales: number(item.sales ?? item.total_sales ?? item.revenue),
      Profit: number(item.profit ?? item.total_profit),
    }));

    if (!rows.length) {
      window.alert("No product data is available to export for the selected year.");
      return;
    }
    downloadExcel(`Product_Report_${year}.xlsx`, "Product Report", rows);
  }

  function downloadSummary() {
    const rows = [
      { Metric: "Year", Value: year },
      { Metric: "Total Sales", Value: sales },
      { Metric: "Total Profit", Value: profit },
      { Metric: "Total Orders", Value: orders },
      { Metric: "Total Customers", Value: customers },
    ];

    downloadExcel(`Business_Report_${year}.xlsx`, "Business Summary", rows);
  }

  const forecastSales =
    predictions?.sales?.next_month ??
    predictions?.next_month ??
    null;

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Navbar selectedYear={year} onYearChange={(value) => {
            const next = String(value);
            if (YEARS.includes(next)) {
              setYear(next);
              localStorage.setItem(YEAR_KEY, next);
            }
          }} />
          <h1 style={{ color: "white" }}>Reports</h1>
          <div style={{ ...panelStyle, color: "#a5b4fc" }}>
            <Loader2 size={18} className="spin" /> Loading report data for {year}...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main-content">
        <Navbar
          selectedYear={year}
          onYearChange={(value) => {
            const next = String(value);
            if (YEARS.includes(next)) {
              setYear(next);
              localStorage.setItem(YEAR_KEY, next);
            }
          }}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1 style={{ color: "#f8fafc", margin: "0 0 5px" }}>
              Reports
            </h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>
              Interactive business intelligence reports
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <label style={{ color: "#cbd5e1", fontSize: "13px" }}>
              Year{" "}
              <select
                value={year}
                onChange={changeYear}
                style={{
                  marginLeft: "8px",
                  padding: "9px 12px",
                  borderRadius: "7px",
                  background: "#111c2e",
                  color: "white",
                  border: "1px solid #334155",
                }}
              >
                {YEARS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <button
              onClick={() => loadData(year, true)}
              disabled={refreshing}
              style={{
                border: 0,
                borderRadius: "7px",
                padding: "9px 14px",
                background: "#7048e8",
                color: "white",
                cursor: "pointer",
              }}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh Data"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#3b1720",
              border: "1px solid #7f1d1d",
              color: "#fecaca",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* KPI CARDS */}
        <div className="cards">
          <StatCard
            title="Total Sales"
            value={money(sales)}
            growth="0"
            color="#22c55e"
            icon={<TrendingUp color="white" size={26} />}
          />
          <StatCard
            title="Total Profit"
            value={money(profit)}
            growth="0"
            color="#3b82f6"
            icon={<BadgeIndianRupee color="white" size={26} />}
          />
          <StatCard
            title="Total Orders"
            value={orders.toLocaleString("en-IN")}
            growth="0"
            color="#8b5cf6"
            icon={<FileText color="white" size={26} />}
          />
          <StatCard
            title="Total Customers"
            value={customers.toLocaleString("en-IN")}
            growth="0"
            color="#f97316"
            icon={<CalendarDays color="white" size={26} />}
          />
        </div>

        {/* CHART ROW 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          <section style={panelStyle}>
            <h3 style={titleStyle}>Sales Trend by Month</h3>
            {monthlyData.length ? (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={monthlyData}>
                    <CartesianGrid stroke="#26364d" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: "#9caec5", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9caec5", fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      dataKey="sales"
                      name="Total Sales"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>No sales trend data returned by the API.</p>
            )}
          </section>

          <section style={panelStyle}>
            <h3 style={titleStyle}>Top 5 Products by Sales</h3>
            {productData.length ? (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={productData}
                    layout="vertical"
                    margin={{ left: 10, right: 15 }}
                  >
                    <CartesianGrid stroke="#26364d" strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fill: "#9caec5", fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="product"
                      width={110}
                      tick={{ fill: "#cbd5e1", fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="sales"
                      name="Sales"
                      fill="#3b82f6"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>No product data returned by the API.</p>
            )}
          </section>
        </div>

        {/* CHART ROW 2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <section style={panelStyle}>
            <h3 style={titleStyle}>Sales by Category</h3>
            {categoryData.length ? (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>
                No category sales data returned. Check the /api/sales-category endpoint.
              </p>
            )}
          </section>

          <section style={panelStyle}>
            <h3 style={titleStyle}>Orders Trend by Month</h3>
            {ordersTrend.length > 0 ? (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={ordersTrend}>
                    <CartesianGrid stroke="#26364d" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: "#9caec5", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9caec5", fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      dataKey="orders"
                      name="Total Orders"
                      stroke="#a78bfa"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>
                No monthly order data returned. Check the /api/orders-trend endpoint.
              </p>
            )}
          </section>
        </div>

        {/* FORECAST SUMMARY */}
        <section style={{ ...panelStyle, marginTop: "16px" }}>
          <h3 style={titleStyle}>AI Forecast Summary</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <p style={{ color: "#94a3b8", fontSize: "12px" }}>Selected Year</p>
              <h3 style={{ color: "#f8fafc", margin: 0 }}>{year}</h3>
            </div>

            <div>
              <p style={{ color: "#94a3b8", fontSize: "12px" }}>Predicted Next-Month Sales</p>
              <h3 style={{ color: "#22c55e", margin: 0 }}>
                {forecastSales != null ? money(forecastSales) : "Not available"}
              </h3>
            </div>

            <div>
              <p style={{ color: "#94a3b8", fontSize: "12px" }}>Forecast Growth</p>
              <h3 style={{ color: "#60a5fa", margin: 0 }}>
                {predictions?.sales?.expected_growth != null
                  ? `${predictions.sales.expected_growth}%`
                  : predictions?.expected_growth != null
                  ? `${predictions.expected_growth}%`
                  : "Not available"}
              </h3>
            </div>

            <div>
              <p style={{ color: "#94a3b8", fontSize: "12px" }}>Business Insights</p>
              <h3 style={{ color: "#f8fafc", margin: 0 }}>
                {insights ? "Available" : "Not available"}
              </h3>
            </div>
          </div>

          {insights && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                color: "#cbd5e1",
                fontSize: "12px",
                marginTop: "18px",
                fontFamily: "inherit",
              }}
            >
              {typeof insights === "string"
                ? insights
                : insights.summary || insights.message || ""}
            </pre>
          )}
        </section>

        {/* DOWNLOADABLE REPORTS */}
        <section style={{ ...panelStyle, marginTop: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <h3 style={{ ...titleStyle, marginBottom: "5px" }}>
                Available Reports
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
                Download reports for {year}
              </p>
            </div>
          </div>

          {[
            {
              name: "Business Summary",
              description: "Sales, profit, orders and customers",
              action: downloadSummary,
              icon: <FileText size={18} />,
            },
            {
              name: "Sales Report",
              description: "Monthly sales trend",
              action: downloadSalesReport,
              icon: <TrendingUp size={18} />,
            },
            {
              name: "Product Report",
              description: "Top products and their sales",
              action: downloadProductReport,
              icon: <Package size={18} />,
            },
          ].map((report) => (
            <div
              key={report.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "13px 0",
                borderTop: "1px solid #26364d",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "#a78bfa" }}>{report.icon}</span>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
                    {report.name}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "3px" }}>
                    {report.description}
                  </div>
                </div>
              </div>

              <button
                onClick={report.action}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#26364d",
                  color: "#e2e8f0",
                  border: "1px solid #3b4d65",
                  borderRadius: "6px",
                  padding: "8px 11px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                <Download size={14} />
                Download Excel
              </button>
            </div>
          ))}
        </section>

        <p
          style={{
            color: "#64748b",
            fontSize: "11px",
            marginTop: "16px",
          }}
        >
          <CheckCircle size={12} style={{ verticalAlign: "middle", marginRight: "5px" }} />
          Report data is requested from your FastAPI backend. Displayed values depend on
          the fields returned by your API.
        </p>
      </div>
    </div>
  );
}
