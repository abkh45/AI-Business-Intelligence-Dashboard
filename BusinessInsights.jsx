import React, { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

import {
  Lightbulb,
  TrendingUp,
  BadgeIndianRupee,
  Brain,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";

import {
  getBusinessInsights,
  getPredictions,
} from "../api/api";

// ============================================================
// DATASETS / YEARS
// ============================================================

const YEARS = ["2022", "2023", "2024", "2025"];

const YEAR_STORAGE_KEY = "selectedYear";

// ============================================================
// GET SAVED YEAR
// ============================================================

function getSavedYear() {
  try {
    const saved = localStorage.getItem(YEAR_STORAGE_KEY);

    if (saved && YEARS.includes(String(saved))) {
      return String(saved);
    }
  } catch (error) {
    console.error("Could not read selected year:", error);
  }

  return "2024";
}

// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "—";
  }

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(2)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(2)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(1)}K`;
  }

  return `₹${number.toFixed(0)}`;
}

// ============================================================
// FORMAT PERCENT
// ============================================================

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.0%";
  }

  if (number > 0) {
    return `+${number.toFixed(1)}%`;
  }

  return `${number.toFixed(1)}%`;
}

// ============================================================
// EXTRACT INSIGHTS
// ============================================================

function extractInsights(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.insights)) {
    return result.insights;
  }

  return [];
}

// ============================================================
// BUSINESS INSIGHTS
// ============================================================

export default function BusinessInsights() {
  // ==========================================================
  // SELECTED YEAR
  // ==========================================================

  const [selectedYear, setSelectedYear] = useState(
    getSavedYear()
  );

  // ==========================================================
  // DATA
  // ==========================================================

  const [insightData, setInsightData] = useState(null);

  const [predictionData, setPredictionData] = useState(null);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // ERROR
  // ==========================================================

  const [error, setError] = useState("");

  // ==========================================================
  // YEAR CHANGE
  // ==========================================================

  function handleYearChange(year) {
    const newYear = String(year);

    if (!YEARS.includes(newYear)) {
      console.warn("Invalid year:", newYear);
      return;
    }

    console.log(
      "Business Insights year changed to:",
      newYear
    );

    // Save globally
    localStorage.setItem(
      YEAR_STORAGE_KEY,
      newYear
    );

    // Update this page
    setSelectedYear(newYear);

    // Tell other components/pages
    window.dispatchEvent(
      new CustomEvent("yearChanged", {
        detail: newYear,
      })
    );
  }

  // ==========================================================
  // LISTEN FOR YEAR CHANGES
  // ==========================================================

  useEffect(() => {
    function handleYearChanged(event) {
      const year = String(
        event?.detail || ""
      );

      if (!YEARS.includes(year)) {
        return;
      }

      console.log(
        "BusinessInsights received year:",
        year
      );

      setSelectedYear(year);
    }

    function handleStorage(event) {
      if (
        event.key !== YEAR_STORAGE_KEY
      ) {
        return;
      }

      const year = String(
        event.newValue || ""
      );

      if (!YEARS.includes(year)) {
        return;
      }

      setSelectedYear(year);
    }

    window.addEventListener(
      "yearChanged",
      handleYearChanged
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "yearChanged",
        handleYearChanged
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  // ==========================================================
  // LOAD DATA FOR SELECTED YEAR
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        console.log(
          "================================="
        );

        console.log(
          "Loading Business Insights"
        );

        console.log(
          "Selected Year:",
          selectedYear
        );

        console.log(
          "Dataset:",
          `superstore_${selectedYear}.csv`
        );

        console.log(
          "================================="
        );

        // IMPORTANT:
        // Both APIs receive selectedYear.
        const [
          insightsResult,
          predictionsResult,
        ] = await Promise.all([
          getBusinessInsights(
            selectedYear
          ),

          getPredictions(
            selectedYear
          ),
        ]);

        console.log(
          "BUSINESS INSIGHTS RESPONSE:",
          insightsResult
        );

        console.log(
          "PREDICTIONS RESPONSE:",
          predictionsResult
        );

        if (cancelled) {
          return;
        }

        setInsightData(
          insightsResult
        );

        setPredictionData(
          predictionsResult
        );
      } catch (err) {
        console.error(
          "Business Insights Error:",
          err
        );

        if (!cancelled) {
          setInsightData(null);
          setPredictionData(null);

          setError(
            err?.message ||
              `Unable to load business insights for ${selectedYear}.`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // ==========================================================
  // INSIGHTS
  // ==========================================================

  const insights = extractInsights(
    insightData
  );

  // ==========================================================
  // PREDICTIONS
  // ==========================================================

  const salesPrediction =
    predictionData?.sales || {};

  // ==========================================================
  // EXPECTED REVENUE
  // ==========================================================

  const expectedRevenueValue = Number(
    salesPrediction?.next_month ??
      predictionData?.next_month ??
      0
  );

  const expectedRevenue =
    expectedRevenueValue > 0
      ? formatMoney(
          expectedRevenueValue
        )
      : "—";

  // ==========================================================
  // EXPECTED GROWTH
  // ==========================================================

  const expectedGrowth = Number(
    salesPrediction?.expected_growth ??
      predictionData?.expected_growth ??
      0
  );

  // ==========================================================
  // AI CONFIDENCE
  // ==========================================================

  const confidenceValue = Number(
    salesPrediction?.confidence ??
      predictionData?.confidence ??
      0
  );

  const aiConfidence =
    confidenceValue > 0
      ? `${confidenceValue.toFixed(1)}%`
      : "—";

  // ==========================================================
  // INSIGHT COUNTS
  // ==========================================================

  const aiInsightsCount =
    insights.length;

  const growthOpportunities =
    insights.filter((item) => {
      const status = String(
        item?.status ||
          item?.type ||
          ""
      ).toLowerCase();

      return (
        status === "positive" ||
        status === "opportunity"
      );
    }).length;

  // ==========================================================
  // STATUS ICON
  // ==========================================================

  function getInsightIcon(item) {
    const status = String(
      item?.status ||
        item?.type ||
        "info"
    ).toLowerCase();

    if (
      status === "positive" ||
      status === "opportunity"
    ) {
      return (
        <TrendingUp
          size={17}
          color="#22c55e"
        />
      );
    }

    if (status === "warning") {
      return (
        <AlertTriangle
          size={17}
          color="#f59e0b"
        />
      );
    }

    return (
      <Info
        size={17}
        color="#3b82f6"
      />
    );
  }

  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  function getStatusLabel(item) {
    const status = String(
      item?.status ||
        item?.type ||
        "Info"
    );

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="main-content">
          <Navbar
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />

          <h1
            style={{
              color: "#ffffff",
              marginBottom: "20px",
            }}
          >
            Business Insights
          </h1>

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "12px",
              padding: "30px",
              color: "#8fa3c0",
            }}
          >
            Loading AI business insights
            for{" "}
            <strong
              style={{
                color: "#8b5cf6",
              }}
            >
              {selectedYear}
            </strong>
            ...
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="dashboard">
        <Sidebar />

        <div className="main-content">
          <Navbar
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />

          <h1
            style={{
              color: "#ffffff",
              marginBottom: "20px",
            }}
          >
            Business Insights
          </h1>

          <div
            style={{
              background: "#101d31",
              border: "1px solid #7f1d1d",
              borderRadius: "12px",
              padding: "20px",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main-content">

        {/* ====================================================
            NAVBAR
        ==================================================== */}

        <Navbar
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />

        {/* ====================================================
            TITLE
        ==================================================== */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              margin: 0,
            }}
          >
            Business Insights
          </h1>

          <p
            style={{
              color: "#7186a3",
              fontSize: "12px",
              marginTop: "5px",
            }}
          >
            AI-powered analysis for{" "}
            <strong
              style={{
                color: "#8b5cf6",
              }}
            >
              superstore_{selectedYear}.csv
            </strong>
          </p>
        </div>

        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <div className="cards">

          <StatCard
            title="All Insights"
            value={aiInsightsCount}
            growth="0"
            color="#8B5CF6"
            icon={
              <Lightbulb
                color="white"
                size={28}
              />
            }
          />

          <StatCard
            title="Growth Opportunities"
            value={growthOpportunities}
            growth="0"
            color="#22C55E"
            icon={
              <TrendingUp
                color="white"
                size={28}
              />
            }
          />

          <StatCard
            title="Expected Revenue"
            value={expectedRevenue}
            growth={
              expectedRevenueValue > 0
                ? expectedGrowth.toFixed(1)
                : "0"
            }
            color="#3B82F6"
            icon={
              <BadgeIndianRupee
                color="white"
                size={28}
              />
            }
          />

          <StatCard
            title="AI Confidence"
            value={aiConfidence}
            growth="0"
            color="#F59E0B"
            icon={
              <Brain
                color="white"
                size={28}
              />
            }
          />

        </div>

        {/* ====================================================
            AI BUSINESS INSIGHTS
        ==================================================== */}

        <div
          style={{
            background: "#101d31",
            border: "1px solid #263957",
            borderRadius: "12px",
            marginTop: "15px",
            overflow: "hidden",
          }}
        >

          {/* HEADER */}

          <div
            style={{
              padding: "15px 16px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>

              <h2
                style={{
                  color: "#ffffff",
                  fontSize: "15px",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                AI Business Insights
              </h2>

              <p
                style={{
                  color: "#7186a3",
                  fontSize: "9px",
                  margin: "3px 0 0",
                }}
              >
                AI analysis based on{" "}
                <strong
                  style={{
                    color: "#8fa3c0",
                  }}
                >
                  superstore_{selectedYear}.csv
                </strong>
              </p>

            </div>

            <span
              style={{
                color: "#7186a3",
                border:
                  "1px solid #263957",
                borderRadius: "5px",
                padding: "3px 7px",
                fontSize: "9px",
              }}
            >
              {selectedYear}
            </span>

          </div>

          {/* INSIGHTS */}

          <div
            style={{
              padding: "0 14px",
            }}
          >

            {insights.length === 0 ? (
              <div
                style={{
                  padding: "25px 10px",
                  textAlign: "center",
                  color: "#7186a3",
                  fontSize: "12px",
                }}
              >
                No business insights
                available for{" "}
                {selectedYear}.
              </div>
            ) : (
              insights
                .slice(0, 4)
                .map((item, index) => {

                  const status =
                    String(
                      item?.status ||
                        item?.type ||
                        ""
                    ).toLowerCase();

                  const statusColor =
                    status === "positive" ||
                    status === "opportunity"
                      ? "#22c55e"
                      : status === "warning"
                      ? "#f59e0b"
                      : "#3b82f6";

                  return (
                    <div
                      key={`${selectedYear}-${index}-${item?.text || ""}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minHeight: "41px",
                        borderTop:
                          index === 0
                            ? "none"
                            : "1px solid #1d2c43",
                      }}
                    >

                      {/* ICON */}

                      <div
                        style={{
                          width: "23px",
                          height: "23px",
                          minWidth: "23px",
                          borderRadius: "5px",
                          background:
                            "rgba(59,130,246,0.10)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getInsightIcon(item)}
                      </div>

                      {/* TEXT */}

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <p
                          style={{
                            color: "#d8e0ec",
                            fontSize: "11px",
                            fontWeight: 500,
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {item?.text ||
                            item?.message ||
                            "Business insight available."}
                        </p>
                      </div>

                      {/* STATUS */}

                      <span
                        style={{
                          color: statusColor,
                          border:
                            "1px solid currentColor",
                          borderRadius: "12px",
                          padding: "3px 8px",
                          fontSize: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getStatusLabel(item)}
                      </span>

                    </div>
                  );
                })
            )}

          </div>

          {/* VIEW ALL */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "12px",
              color: "#8b5cf6",
              fontSize: "10px",
              fontWeight: 500,
            }}
          >
            View All Insights

            <ArrowRight size={12} />
          </div>

        </div>

        {/* ====================================================
            PREDICTION SUMMARY
        ==================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "15px",
            marginTop: "15px",
          }}
        >

          {/* EXPECTED GROWTH */}

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "10px",
              padding: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <TrendingUp
                size={17}
                color="#22c55e"
              />

              <span
                style={{
                  color: "#7186a3",
                  fontSize: "10px",
                }}
              >
                Expected Sales Growth
              </span>
            </div>

            <div
              style={{
                color:
                  expectedGrowth >= 0
                    ? "#22c55e"
                    : "#ef4444",
                fontSize: "20px",
                fontWeight: 700,
                marginTop: "7px",
              }}
            >
              {formatPercent(
                expectedGrowth
              )}
            </div>
          </div>

          {/* CONFIDENCE */}

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "10px",
              padding: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle
                size={17}
                color="#22c55e"
              />

              <span
                style={{
                  color: "#7186a3",
                  fontSize: "10px",
                }}
              >
                Prediction Model Confidence
              </span>
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: 700,
                marginTop: "7px",
              }}
            >
              {aiConfidence}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}