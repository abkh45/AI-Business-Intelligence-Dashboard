import React, {
  useEffect,
  useState,
} from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import { getProfitByCategory } from "../api/api";


// ============================================================
// COLORS
// ============================================================

const COLORS = [
  "#3B82F6",
  "#EC4899",
  "#22C55E",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
  "#14B8A6",
];


// ============================================================
// AVAILABLE YEARS
// ============================================================

const YEARS = [
  "2022",
  "2023",
  "2024",
  "2025",
];


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(value) {

  const number =
    Number(value || 0);

  if (
    !Number.isFinite(number)
  ) {
    return "₹0";
  }


  if (
    number >= 10000000
  ) {

    return `₹${(
      number / 10000000
    ).toFixed(2)}Cr`;

  }


  if (
    number >= 1000000
  ) {

    return `₹${(
      number / 1000000
    ).toFixed(2)}M`;

  }


  if (
    number >= 1000
  ) {

    return `₹${(
      number / 1000
    ).toFixed(0)}K`;

  }


  return `₹${number.toLocaleString(
    "en-IN"
  )}`;

}


// ============================================================
// GET CATEGORY NAME
// ============================================================

function getCategoryName(item) {

  return (
    item?.category ??
    item?.Category ??
    item?.category_name ??
    item?.Category_Name ??
    item?.name ??
    item?.Name ??
    "Unknown"
  );

}


// ============================================================
// GET PROFIT VALUE
// ============================================================

function getProfitValue(item) {

  return Number(
    item?.profit ??
    item?.Profit ??
    item?.total_profit ??
    item?.totalProfit ??
    item?.value ??
    0
  );

}


// ============================================================
// REVENUE / PROFIT PIE CHART
// ============================================================

export default function RevenuePieChart({
  year = "2024",
}) {

  // ==========================================================
  // DATA
  // ==========================================================

  const [
    chartData,
    setChartData,
  ] = useState([]);


  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(false);


  // ==========================================================
  // ERROR
  // ==========================================================

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // TOTAL PROFIT
  // ==========================================================

  const [
    totalProfit,
    setTotalProfit,
  ] = useState(0);


  // ==========================================================
  // LOAD PROFIT CATEGORY DATA
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadProfitCategory() {

      setLoading(true);
      setError("");


      try {

        const selectedYear =
          YEARS.includes(
            String(year)
          )
            ? String(year)
            : "2024";


        console.log(
          "================================="
        );

        console.log(
          "Loading Profit By Category"
        );

        console.log(
          "Selected year:",
          selectedYear
        );

        console.log(
          "================================="
        );


        // ====================================================
        // API REQUEST
        // ====================================================

        const response =
          await getProfitByCategory(
            selectedYear
          );


        console.log(
          "Profit category API response:",
          response
        );


        if (cancelled) {
          return;
        }


        // ====================================================
        // EXTRACT DATA
        // ====================================================

        let rows = [];


        if (
          Array.isArray(
            response?.data
          )
        ) {

          rows =
            response.data;

        } else if (
          Array.isArray(response)
        ) {

          rows =
            response;

        } else if (
          Array.isArray(
            response?.categories
          )
        ) {

          rows =
            response.categories;

        } else if (
          Array.isArray(
            response?.results
          )
        ) {

          rows =
            response.results;

        }


        console.log(
          "Profit category rows:",
          rows
        );


        // ====================================================
        // NORMALIZE DATA
        // ====================================================

        const normalized =
          rows
            .map(
              (item) => {

                const category =
                  getCategoryName(
                    item
                  );


                const profit =
                  getProfitValue(
                    item
                  );


                return {
                  name:
                    category,

                  category:
                    category,

                  value:
                    Number.isFinite(
                      profit
                    )
                      ? profit
                      : 0,

                  profit:
                    Number.isFinite(
                      profit
                    )
                      ? profit
                      : 0,
                };

              }
            )
            .filter(
              (item) =>
                item.value !== 0
            );


        console.log(
          "Normalized profit data:",
          normalized
        );


        // ====================================================
        // TOTAL PROFIT
        // ====================================================

        const calculatedTotal =
          normalized.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.value || 0
              ),
            0
          );


        setChartData(
          normalized
        );


        setTotalProfit(
          calculatedTotal
        );

      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "Profit Category API Error:",
          err
        );


        setChartData([]);


        setTotalProfit(0);


        setError(
          err?.message ||
          `Unable to load profit data for ${year}.`
        );

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadProfitCategory();


    return () => {

      cancelled = true;

    };

  }, [year]);


  // ==========================================================
  // CALCULATE PERCENTAGE
  // ==========================================================

  const dataWithPercentage =
    chartData.map(
      (item) => {

        const percentage =
          totalProfit !== 0
            ? (
                Number(
                  item.value
                ) /
                totalProfit
              ) *
              100
            : 0;


        return {
          ...item,

          percentage,
        };

      }
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        width: "100%",
        minHeight: "360px",
        background: "#101d31",
        border:
          "1px solid #293b57",
        borderRadius: "10px",
        padding: "14px",
        boxSizing:
          "border-box",
      }}
    >

      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Profit by Category
          </h2>


          <div
            style={{
              marginTop: "3px",
              color: "#8fa3c0",
              fontSize: "12px",
            }}
          >
            Profit distribution for{" "}

            <span
              style={{
                color: "#8b5cf6",
                fontWeight: 700,
              }}
            >
              {year}
            </span>

          </div>

        </div>


        {/* YEAR BADGE */}

        <div
          style={{
            padding:
              "4px 8px",
            border:
              "1px solid #29415f",
            borderRadius: "5px",
            color: "#8fa3c0",
            fontSize: "10px",
          }}
        >
          {year}
        </div>

      </div>


      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (

        <div
          style={{
            height: "280px",
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            color: "#8fa3c0",
            fontSize: "13px",
          }}
        >

          Loading profit data for{" "}
          {year}...

        </div>

      )}


      {/* ==================================================
          ERROR
      ================================================== */}

      {!loading &&
        error && (

          <div
            style={{
              height: "280px",
              display: "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              color: "#ff6b6b",
              textAlign:
                "center",
              padding: "20px",
              boxSizing:
                "border-box",
              fontSize: "13px",
            }}
          >

            {error}

          </div>

        )}


      {/* ==================================================
          NO DATA
      ================================================== */}

      {!loading &&
        !error &&
        dataWithPercentage.length ===
          0 && (

          <div
            style={{
              height: "280px",
              display: "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              color: "#8fa3c0",
              fontSize: "13px",
            }}
          >

            No profit data available
            for {year}.

          </div>

        )}


      {/* ==================================================
          CHART
      ================================================== */}

      {!loading &&
        !error &&
        dataWithPercentage.length >
          0 && (

          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems:
                "center",
            }}
          >

            {/* ============================================
                PIE
            ============================================ */}

            <div
              style={{
                width: "55%",
                height: "100%",
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      dataWithPercentage
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >

                    {dataWithPercentage.map(
                      (
                        entry,
                        index
                      ) => (

                        <Cell
                          key={
                            `${entry.name}-${index}`
                          }
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
                    formatter={(
                      value,
                      name
                    ) => [

                      formatCurrency(
                        value
                      ),

                      name,

                    ]}
                    contentStyle={{
                      background:
                        "#0d1b2f",
                      border:
                        "1px solid #29415f",
                      borderRadius:
                        "6px",
                      color:
                        "#ffffff",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>


              {/* CENTER TOTAL */}

              <div
                style={{
                  position:
                    "relative",
                  marginTop:
                    "-190px",
                  textAlign:
                    "center",
                  pointerEvents:
                    "none",
                }}
              >

                <div
                  style={{
                    color:
                      "#ffffff",
                    fontSize:
                      "16px",
                    fontWeight:
                      700,
                  }}
                >
                  {formatCurrency(
                    totalProfit
                  )}
                </div>


                <div
                  style={{
                    color:
                      "#8fa3c0",
                    fontSize:
                      "10px",
                    marginTop:
                      "3px",
                  }}
                >
                  Total Profit
                </div>

              </div>

            </div>


            {/* ============================================
                LEGEND
            ============================================ */}

            <div
              style={{
                width: "45%",
                paddingLeft:
                  "8px",
                boxSizing:
                  "border-box",
              }}
            >

              {dataWithPercentage.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={
                      `${item.name}-${index}`
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "7px",
                      marginBottom:
                        "12px",
                    }}
                  >

                    {/* DOT */}

                    <span
                      style={{
                        width:
                          "6px",
                        height:
                          "6px",
                        minWidth:
                          "6px",
                        borderRadius:
                          "50%",
                        background:
                          COLORS[
                            index %
                              COLORS.length
                          ],
                        display:
                          "inline-block",
                      }}
                    />


                    {/* CATEGORY */}

                    <span
                      style={{
                        color:
                          "#dbe7f5",
                        fontSize:
                          "11px",
                        flex: 1,
                      }}
                    >
                      {item.name}
                    </span>


                    {/* PROFIT */}

                    <span
                      style={{
                        color:
                          "#ffffff",
                        fontSize:
                          "11px",
                        fontWeight:
                          600,
                      }}
                    >
                      {formatCurrency(
                        item.value
                      )}
                    </span>


                    {/* PERCENTAGE */}

                    <span
                      style={{
                        color:
                          "#8fa3c0",
                        fontSize:
                          "10px",
                        width:
                          "38px",
                        textAlign:
                          "right",
                      }}
                    >
                      {item.percentage.toFixed(
                        1
                      )}
                      %
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

        )}

    </div>

  );

}