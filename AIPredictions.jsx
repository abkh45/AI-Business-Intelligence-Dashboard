import React, { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ForecastChart from "../components/ForecastChart";

import {
  Brain,
  TrendingUp,
  Package,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

import { getPredictions } from "../api/api";


/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(value) {
  const number = Number(value || 0);

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


/* =========================================================
   PERCENT FORMAT
========================================================= */

function formatPercent(value) {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${number.toFixed(1)}%`;
  }

  return `${number.toFixed(1)}%`;
}


/* =========================================================
   AI PREDICTIONS PAGE
========================================================= */

const YEARS = [
  "2022",
  "2023",
  "2024",
  "2025",
];

const YEAR_STORAGE_KEY = "selectedYear";

function getSavedYear() {
  try {
    const savedYear = localStorage.getItem(YEAR_STORAGE_KEY);

    if (savedYear && YEARS.includes(String(savedYear))) {
      return String(savedYear);
    }
  } catch (err) {
    console.error("Could not read selected year:", err);
  }

  return "2024";
}


/* =========================================================
   AI PREDICTIONS PAGE
========================================================= */

export default function AIPredictions() {

  // IMPORTANT: selectedYear must be React state.
  // Reading localStorage directly does NOT re-render the page.
  const [selectedYear, setSelectedYear] = useState(getSavedYear);

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  /* =======================================================
     LISTEN FOR NAVBAR YEAR CHANGES
  ======================================================= */

  useEffect(() => {
    function handleYearChanged(event) {
      const year = String(event?.detail || "");

      if (YEARS.includes(year)) {
        console.log("AI Predictions year changed to:", year);
        setSelectedYear(year);
      }
    }

    window.addEventListener("yearChanged", handleYearChanged);

    return () => {
      window.removeEventListener("yearChanged", handleYearChanged);
    };
  }, []);


  /* =======================================================
     YEAR CHANGE FROM NAVBAR
  ======================================================= */

  function handleYearChange(year) {
    const newYear = String(year);

    if (!YEARS.includes(newYear)) {
      return;
    }

    console.log("AI Predictions changing dataset to:", newYear);

    try {
      localStorage.setItem(YEAR_STORAGE_KEY, newYear);
    } catch (err) {
      console.error("Unable to save selected year:", err);
    }

    // Update this page immediately.
    setSelectedYear(newYear);

    // Tell other pages/components in the same tab.
    window.dispatchEvent(
      new CustomEvent("yearChanged", {
        detail: newYear,
      })
    );
  }


  /* =======================================================
     LOAD PREDICTIONS
  ======================================================= */

  useEffect(() => {

    let cancelled = false;


    async function loadPredictions() {

      try {

        setLoading(true);

        setError("");


        console.log(
          "Loading AI predictions for:",
          selectedYear
        );


        const result =
          await getPredictions(
            selectedYear
          );


        if (cancelled) {
          return;
        }


        console.log(
          "AI prediction response:",
          result
        );


        setData(result);


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "AI Prediction Error:",
          err
        );


        setError(
          err?.message ||
          "Unable to load AI predictions."
        );


      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadPredictions();


    return () => {
      cancelled = true;
    };

  }, [selectedYear]);


  /* =======================================================
     LOADING
  ======================================================= */

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
              color: "white",
            }}
          >
            AI Predictions
          </h1>

          <div
            style={{
              marginTop: "20px",
              padding: "25px",
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "12px",
              color: "#8fa3c0",
            }}
          >
            Generating AI predictions...
          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

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
              color: "white",
            }}
          >
            AI Predictions
          </h1>

          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "12px",
              color: "#ff6b6b",
            }}
          >
            {error}
          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     SAFE DATA
  ======================================================= */

  const sales =
    data?.sales || {};

  const demand =
    data?.demand || {};

  const churn =
    data?.churn || {};

  const forecast =
    data?.forecast || [];


  // =======================================================
  // SAME 30-DAY VALUE AS THE SALES FORECAST CHART
  // =======================================================
  //
  // Primary source:
  //   backend next_30_days
  //
  // Fallback:
  //   sum the exact forecast points already returned to the
  //   ForecastChart. This prevents the card from ever showing
  //   ₹0 while the chart has valid forecast values.
  // =======================================================

  const forecast30Values = Array.isArray(forecast)
    ? forecast
        .slice(0, 30)
        .map((item) => {
          const value =
            item?.sales ??
            item?.predicted_sales ??
            item?.forecast ??
            item?.prediction ??
            item?.predicted ??
            item?.value ??
            0;

          const number = Number(value);
          return Number.isFinite(number) && number >= 0
            ? number
            : 0;
        })
    : [];

  const calculatedNext30Days = forecast30Values.reduce(
    (total, value) => total + value,
    0
  );

  const backendNext30Days = Number(
    sales?.next_30_days ??
    data?.next_30_days ??
    0
  );

  const next30Days =
    backendNext30Days > 0
      ? backendNext30Days
      : calculatedNext30Days;


  const backendSalesGrowth = Number(
    sales?.expected_growth_30_days ??
    data?.expected_growth_30_days ??
    0
  );

  const salesGrowth =
    Number.isFinite(backendSalesGrowth)
      ? backendSalesGrowth
      : 0;


  const confidence =
    sales?.confidence ??
    data?.confidence ??
    0;


  const highestMonth =
    sales?.highest_month ??
    data?.highest_month ??
    "-";


  const highestMonthSales =
    sales?.highest_month_sales ??
    data?.highest_month_sales ??
    0;


  const predictedDemand =
    demand?.predicted_demand ??
    demand?.next_month ??
    0;


  const demandGrowth =
    demand?.expected_growth ??
    demand?.growth ??
    0;


  const demandConfidence =
    demand?.confidence ??
    0;


  const churnRate =
    churn?.churn_rate ??
    churn?.rate ??
    0;


  const highRisk =
    churn?.high_risk_customers ??
    churn?.high_risk ??
    0;


  const churnConfidence =
    churn?.confidence ??
    0;


  const churnTrend =
    churn?.trend ??
    "Stable";


  /* =======================================================
     BUSINESS INSIGHTS
     
     ALWAYS CREATE 3 INSIGHTS:
     SALES
     DEMAND
     CHURN
  ======================================================= */

  const insights = [];


  /* SALES INSIGHT */

  if (Number(salesGrowth) > 5) {

    insights.push({
      type: "positive",

      text:
        `Sales are showing a positive growth trend of ${formatPercent(
          salesGrowth
        )}.`,
    });

  } else if (Number(salesGrowth) < -5) {

    insights.push({
      type: "warning",

      text:
        `Sales are showing a declining trend of ${Math.abs(
          Number(salesGrowth)
        ).toFixed(1)}%.`,
    });

  } else {

    insights.push({
      type: "info",

      text:
        "Sales are expected to remain relatively stable.",
    });

  }


  /* DEMAND INSIGHT */

  if (Number(demandGrowth) > 5) {

    insights.push({
      type: "positive",

      text:
        `Product demand is expected to increase by ${formatPercent(
          demandGrowth
        )}.`,
    });

  } else if (Number(demandGrowth) < -5) {

    insights.push({
      type: "warning",

      text:
        `Product demand is expected to decrease by ${Math.abs(
          Number(demandGrowth)
        ).toFixed(1)}%.`,
    });

  } else {

    insights.push({
      type: "info",

      text:
        "Product demand is expected to remain stable.",
    });

  }


  /* CHURN INSIGHT */

  if (Number(churnRate) >= 20) {

    insights.push({
      type: "warning",

      text:
        `Customer churn risk is high at ${Number(
          churnRate
        ).toFixed(1)}%. Retention action is recommended.`,
    });

  } else if (Number(churnRate) <= 5) {

    insights.push({
      type: "positive",

      text:
        `Customer retention is strong with a churn rate of ${Number(
          churnRate
        ).toFixed(1)}%.`,
    });

  } else {

    insights.push({
      type: "info",

      text:
        `Customer churn is currently ${Number(
          churnRate
        ).toFixed(1)}%.`,
    });

  }


  /* =======================================================
     INSIGHT ICON
  ======================================================= */

  function InsightIcon({ type }) {

    if (type === "positive") {

      return (
        <CheckCircle
          size={18}
          color="#22c55e"
        />
      );
    }


    if (type === "warning") {

      return (
        <AlertTriangle
          size={18}
          color="#ef4444"
        />
      );
    }


    return (
      <Lightbulb
        size={18}
        color="#8b5cf6"
      />
    );
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <div className="dashboard">

      <Sidebar />


      <div className="main-content">

        <Navbar
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />


        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >

          <h1
            style={{
              color: "white",
              margin: 0,
            }}
          >
            AI Predictions
          </h1>


          <p
            style={{
              color: "#8fa3c0",
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            Machine-learning predictions for sales,
            product demand and customer churn.
          </p>


          <p
            style={{
              color: "#8b5cf6",
              marginTop: "4px",
              fontSize: "12px",
            }}
          >
            Dataset:{" "}
            <strong>
              {data?.dataset ||
                `superstore_${selectedYear}.csv`}
            </strong>
          </p>

        </div>


        {/* =================================================
            MODEL STATUS
        ================================================= */}

        <div
          style={{
            background: "#101d31",
            border: "1px solid #263957",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#cbd5e1",
              fontSize: "13px",
            }}
          >

            <Brain
              size={18}
              color="#8b5cf6"
            />

            AI model trained using historical{" "}
            {selectedYear} data

          </div>


          <span
            style={{
              color: "#22c55e",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            ● Model Active
          </span>

        </div>


        {/* =================================================
            PREDICTION SUMMARY
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >

          {/* SALES */}

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "12px",
              padding: "20px",
            }}
          >

            <TrendingUp
              size={30}
              color="#8b5cf6"
            />

            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 600,
                marginTop: "12px",
              }}
            >
              Sales Prediction
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "27px",
                fontWeight: 700,
                marginTop: "6px",
              }}
            >
              {formatMoney(next30Days)}
            </div>

            <div
              style={{
                color: "#8fa3c0",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Expected next 30 days sales
            </div>

            <div
              style={{
                color:
                  Number(salesGrowth) >= 0
                    ? "#22c55e"
                    : "#ef4444",
                fontSize: "13px",
                marginTop: "10px",
                fontWeight: 600,
              }}
            >
              {formatPercent(salesGrowth)}
            </div>

          </div>


          {/* DEMAND */}

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "12px",
              padding: "20px",
            }}
          >

            <Package
              size={30}
              color="#3b82f6"
            />

            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 600,
                marginTop: "12px",
              }}
            >
              Demand Prediction
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "27px",
                fontWeight: 700,
                marginTop: "6px",
              }}
            >
              {Number(
                predictedDemand
              ).toLocaleString("en-IN")}
            </div>

            <div
              style={{
                color: "#8fa3c0",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Expected product demand
            </div>

            <div
              style={{
                color:
                  Number(demandGrowth) >= 0
                    ? "#22c55e"
                    : "#ef4444",
                fontSize: "13px",
                marginTop: "10px",
                fontWeight: 600,
              }}
            >
              {formatPercent(demandGrowth)}
            </div>

          </div>


          {/* CHURN */}

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "12px",
              padding: "20px",
            }}
          >

            <Users
              size={30}
              color="#ef4444"
            />

            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 600,
                marginTop: "12px",
              }}
            >
              Customer Churn
            </div>

            <div
              style={{
                color: "#ef4444",
                fontSize: "27px",
                fontWeight: 700,
                marginTop: "6px",
              }}
            >
              {Number(churnRate).toFixed(1)}%
            </div>

            <div
              style={{
                color: "#8fa3c0",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Customers at risk: {highRisk}
            </div>

            <div
              style={{
                color: "#ef4444",
                fontSize: "13px",
                marginTop: "10px",
                fontWeight: 600,
              }}
            >
              {churnTrend}
            </div>

          </div>

        </div>


        {/* =================================================
            SALES FORECAST
        ================================================= */}

        <div
          style={{
            background: "#101d31",
            border: "1px solid #263957",
            borderRadius: "12px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >

            <div>

              <h2
                style={{
                  color: "white",
                  fontSize: "17px",
                  margin: 0,
                }}
              >
                Sales Forecast
              </h2>

              <p
                style={{
                  color: "#8fa3c0",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                Predicted future sales based on historical{" "}
                {selectedYear} data.
              </p>

            </div>


            <div
              style={{
                color: "#8fa3c0",
                fontSize: "12px",
              }}
            >
              Confidence:{" "}
              <strong
                style={{
                  color: "#22c55e",
                }}
              >
                {confidence}%
              </strong>
            </div>

          </div>


          <ForecastChart
            data={forecast}
            year={selectedYear}
          />

        </div>


        {/* =================================================
            THREE SMALL METRIC CARDS
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >

          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "10px",
              padding: "18px",
            }}
          >

            <div
              style={{
                color: "#7190b5",
                fontSize: "11px",
              }}
            >
              Highest Sales Month
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 700,
                marginTop: "5px",
              }}
            >
              {highestMonth}
            </div>

            <div
              style={{
                color: "#8b5cf6",
                fontSize: "12px",
              }}
            >
              {formatMoney(
                highestMonthSales
              )}
            </div>

          </div>


          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "10px",
              padding: "18px",
            }}
          >

            <div
              style={{
                color: "#7190b5",
                fontSize: "11px",
              }}
            >
              Sales Model
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 700,
                marginTop: "5px",
              }}
            >
              Linear Regression
            </div>

            <div
              style={{
                color: "#8b5cf6",
                fontSize: "12px",
              }}
            >
              Historical trend analysis
            </div>

          </div>


          <div
            style={{
              background: "#101d31",
              border: "1px solid #263957",
              borderRadius: "10px",
              padding: "18px",
            }}
          >

            <div
              style={{
                color: "#7190b5",
                fontSize: "11px",
              }}
            >
              Forecast Horizon
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 700,
                marginTop: "5px",
              }}
            >
              12 Months
            </div>

            <div
              style={{
                color: "#8b5cf6",
                fontSize: "12px",
              }}
            >
              Future trend prediction
            </div>

          </div>

        </div>


        {/* =================================================
            AI BUSINESS INSIGHTS
        ================================================= */}

        <div
          style={{
            background: "#101d31",
            border: "1px solid #263957",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >

            <Lightbulb
              size={20}
              color="#8b5cf6"
            />

            <h2
              style={{
                color: "#ffffff",
                fontSize: "17px",
                margin: 0,
              }}
            >
              AI Business Insights
            </h2>

          </div>


          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            {insights.map(
              (insight, index) => (

                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    paddingBottom:
                      "8px",
                    borderBottom:
                      index <
                      insights.length - 1
                        ? "1px solid #1e304b"
                        : "none",
                  }}
                >

                  <InsightIcon
                    type={
                      insight.type
                    }
                  />

                  <span>
                    {insight.text}
                  </span>

                </div>

              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}