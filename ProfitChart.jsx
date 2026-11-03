import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { getProfitByCategory } from "../api/api";

// =========================================================
// COLORS
// =========================================================

const COLORS = [
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#22C55E",
  "#06B6D4",
  "#A855F7",
];

// =========================================================
// FORMAT CURRENCY
// =========================================================

function formatCurrency(value) {
  const number = Number(value) || 0;

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(2)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(2)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(2)}K`;
  }

  return `₹${number.toLocaleString("en-IN")}`;
}

// =========================================================
// TOOLTIP
// =========================================================

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div
      style={{
        background: "#18243A",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "12px 16px",
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontSize: "14px",
          fontWeight: "700",
          marginBottom: "6px",
        }}
      >
        {item.name}
      </div>

      <div
        style={{
          color: "#A78BFA",
          fontSize: "16px",
          fontWeight: "700",
        }}
      >
        {formatCurrency(item.value)}
      </div>

      <div
        style={{
          color: "#94A3B8",
          fontSize: "12px",
          marginTop: "4px",
        }}
      >
        {item.percentage.toFixed(1)}%
      </div>
    </div>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function ProfitChart({
  dataset = "superstore_2025",
}) {
  const [period, setPeriod] =
    useState("this-month");

  const [profitData, setProfitData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadProfitData() {
      try {
        setLoading(true);
        setError("");

        console.log(
          "Loading profit data:",
          dataset,
          period
        );

        const response =
          await getProfitByCategory(
            dataset,
            period
          );

        console.log(
          "Profit API Response:",
          response
        );

        if (!mounted) return;

        let rows = [];

        // Backend:
        // {
        //   profit_by_category: [...]
        // }

        if (
          response &&
          Array.isArray(
            response.profit_by_category
          )
        ) {
          rows =
            response.profit_by_category;
        } else if (
          Array.isArray(response)
        ) {
          rows = response;
        } else if (
          response &&
          Array.isArray(response.data)
        ) {
          rows = response.data;
        } else if (
          response &&
          Array.isArray(response.results)
        ) {
          rows = response.results;
        }

        console.log(
          "Profit rows:",
          rows
        );

        const formatted = rows
          .map((item, index) => {
            const name =
              item.category ??
              item.Category ??
              item.name ??
              item.label ??
              `Category ${index + 1}`;

            const value = Number(
              item.profit ??
                item.total_profit ??
                item.totalProfit ??
                item.value ??
                item.amount ??
                0
            );

            return {
              id: index,
              name: String(name),
              value:
                Number.isFinite(value)
                  ? value
                  : 0,
            };
          })
          .filter(
            (item) => item.value > 0
          );

        const total = formatted.reduce(
          (sum, item) =>
            sum + item.value,
          0
        );

        const finalData =
          formatted.map((item) => ({
            ...item,

            percentage:
              total > 0
                ? (item.value / total) *
                  100
                : 0,
          }));

        console.log(
          "Final Profit Data:",
          finalData
        );

        setProfitData(finalData);
      } catch (err) {
        console.error(
          "Profit Category API Error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load profit data"
          );

          setProfitData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfitData();

    return () => {
      mounted = false;
    };
  }, [dataset, period]);

  // =======================================================
  // TOTAL PROFIT
  // =======================================================

  const totalProfit = useMemo(() => {
    return profitData.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );
  }, [profitData]);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "330px",
        background: "#151E2F",
        borderRadius: "18px",
        padding: "20px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#FFFFFF",
            fontSize: "17px",
            fontWeight: "700",
          }}
        >
          Profit by Category
        </h2>

        <select
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value)
          }
          style={{
            background: "#18243A",
            color: "#FFFFFF",
            border:
              "1px solid #334155",
            borderRadius: "8px",
            padding: "7px 11px",
            fontSize: "12px",
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

          <option value="last-year">
            Last Year
          </option>

          <option value="all">
            All Data
          </option>
        </select>
      </div>

      {/* LOADING */}

      {loading && (
        <div
          style={{
            height: "270px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            color: "#94A3B8",
            fontSize: "14px",
          }}
        >
          Loading profit data...
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div
          style={{
            height: "270px",
            display: "flex",
            flexDirection:
              "column",
            alignItems: "center",
            justifyContent:
              "center",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              color: "#F87171",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Unable to load profit data
          </div>

          <div
            style={{
              color: "#94A3B8",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* NO DATA */}

      {!loading &&
        !error &&
        profitData.length === 0 && (
          <div
            style={{
              height: "270px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              color: "#64748B",
              fontSize: "14px",
            }}
          >
            No profit data available.
          </div>
        )}

      {/* CHART */}

      {!loading &&
        !error &&
        profitData.length > 0 && (
          <div
            style={{
              width: "100%",
              height: "280px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* DONUT */}

            <div
              style={{
                width: "53%",
                height: "100%",
                position: "relative",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={profitData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={2}
                    stroke="#151E2F"
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationDuration={700}
                  >
                    {profitData.map(
                      (
                        entry,
                        index
                      ) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    content={
                      <CustomTooltip />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER VALUE */}

              <div
                style={{
                  position:
                    "absolute",
                  top: "50%",
                  left: "50%",
                  transform:
                    "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents:
                    "none",
                  width: "120px",
                }}
              >
                <div
                  style={{
                    color: "#FFFFFF",
                    fontSize: "21px",
                    fontWeight: "800",
                    lineHeight: "1.2",
                  }}
                >
                  {formatCurrency(
                    totalProfit
                  )}
                </div>

                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: "10px",
                    marginTop: "4px",
                  }}
                >
                  Total Profit
                </div>
              </div>
            </div>

            {/* LEGEND */}

            <div
              style={{
                width: "47%",
                display: "flex",
                flexDirection:
                  "column",
                gap: "13px",
                paddingRight: "8px",
              }}
            >
              {profitData.map(
                (item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "10px minmax(70px, 1fr) auto auto",
                      alignItems:
                        "center",
                      columnGap: "8px",
                    }}
                  >
                    {/* DOT */}

                    <div
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius:
                          "50%",
                        background:
                          COLORS[
                            index %
                              COLORS.length
                          ],
                      }}
                    />

                    {/* CATEGORY */}

                    <div
                      style={{
                        color: "#E2E8F0",
                        fontSize: "12px",
                        fontWeight: "500",
                        whiteSpace:
                          "nowrap",
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {item.name}
                    </div>

                    {/* VALUE */}

                    <div
                      style={{
                        color: "#CBD5E1",
                        fontSize: "12px",
                        fontWeight: "600",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {formatCurrency(
                        item.value
                      )}
                    </div>

                    {/* PERCENTAGE */}

                    <div
                      style={{
                        color: "#94A3B8",
                        fontSize: "11px",
                        minWidth: "38px",
                        textAlign:
                          "right",
                      }}
                    >
                      {item.percentage.toFixed(
                        1
                      )}
                      %
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
}