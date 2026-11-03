import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getSalesTrend } from "../api/api";


export default function SalesChart({ year }) {
  const [period, setPeriod] = useState("this-month");

  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  /*
   * Fetch whenever:
   *
   * year changes
   * OR
   * period changes
   */
  useEffect(() => {
    let cancelled = false;

    async function loadSalesTrend() {
      if (!year) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        console.log(
          "Loading sales trend:",
          year,
          period
        );

        const result = await getSalesTrend(
          year,
          period
        );

        if (cancelled) {
          return;
        }

        /*
         * Backend response:
         *
         * {
         *   dataset: "superstore_2024.csv",
         *   year: 2024,
         *   period: "this-month",
         *   data: [...]
         * }
         */

        const data = Array.isArray(result?.data)
          ? result.data
          : [];

        setChartData(data);

      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Sales Trend API Error:",
          err
        );

        setChartData([]);

        setError(
          err?.message ||
          "Unable to load sales trend."
        );

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSalesTrend();

    return () => {
      cancelled = true;
    };

  }, [year, period]);


  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#ffffff",
            }}
          >
            Sales Trend
          </h2>

          <div
            style={{
              marginTop: "3px",
              color: "#8fa3c0",
              fontSize: "13px",
            }}
          >
            Historical sales for {year}
          </div>
        </div>


        {/* PERIOD DROPDOWN */}
        <select
          value={period}
          onChange={(e) => {
            const newPeriod = e.target.value;

            console.log(
              "Period changed:",
              newPeriod
            );

            setPeriod(newPeriod);
          }}
          style={{
            background: "#101f35",
            color: "#ffffff",
            border: "1px solid #29415f",
            borderRadius: "6px",
            padding: "7px 12px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="this-month">
            This Month
          </option>

          <option value="last-month">
            Last Month
          </option>

          <option value="future">
            Future
          </option>
        </select>

      </div>


      {/* LOADING */}
      {loading && (
        <div
          style={{
            height: "260px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#8fa3c0",
          }}
        >
          Loading {year} sales data...
        </div>
      )}


      {/* ERROR */}
      {!loading && error && (
        <div
          style={{
            height: "260px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#ff6b6b",
            textAlign: "center",
            padding: "20px",
          }}
        >
          {error}
        </div>
      )}


      {/* NO DATA */}
      {!loading &&
        !error &&
        chartData.length === 0 && (
          <div
            style={{
              height: "260px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#8fa3c0",
            }}
          >
            No sales data available.
          </div>
        )}


      {/* CHART */}
      {!loading &&
        !error &&
        chartData.length > 0 && (

          <ResponsiveContainer
            width="100%"
            height={270}
          >

            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 5,
              }}
            >

              <defs>
                <linearGradient
                  id="salesGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.45}
                  />

                  <stop
                    offset="100%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>


              <CartesianGrid
                stroke="#22344f"
                strokeDasharray="3 3"
              />


              <XAxis
                dataKey="label"
                tick={{
                  fill: "#7190b5",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#22344f",
                }}
                tickLine={false}
              />


              <YAxis
                tick={{
                  fill: "#7190b5",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `₹${(
                      value / 1000000
                    ).toFixed(1)}M`;
                  }

                  if (value >= 1000) {
                    return `₹${(
                      value / 1000
                    ).toFixed(0)}K`;
                  }

                  return `₹${value}`;
                }}
              />


              <Tooltip
                contentStyle={{
                  background: "#0d1b2f",
                  border: "1px solid #29415f",
                  borderRadius: "6px",
                  color: "#ffffff",
                }}
                formatter={(value) => [
                  `₹${Number(value).toLocaleString(
                    "en-IN"
                  )}`,
                  "Sales",
                ]}
              />


              <Area
                type="monotone"
                dataKey="sales"
                stroke="#9b6cff"
                strokeWidth={2}
                fill="url(#salesGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                }}
              />

            </AreaChart>

          </ResponsiveContainer>
        )}

    </div>
  );
}