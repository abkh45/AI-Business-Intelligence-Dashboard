import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";


// ============================================================
// API
// ============================================================

const API_URL =
  "http://127.0.0.1:8000/api";


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(value) {

  const number = Number(value || 0);

  if (number >= 1000000) {
    return `₹${(
      number / 1000000
    ).toFixed(2)}M`;
  }

  if (number >= 1000) {
    return `₹${Math.round(
      number / 1000
    )}K`;
  }

  return `₹${Math.round(number)}`;
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(value) {

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}


// ============================================================
// GET API ROWS
// ============================================================

function extractRows(result) {

  if (Array.isArray(result)) {
    return result;
  }

  if (
    Array.isArray(
      result?.data
    )
  ) {
    return result.data;
  }

  if (
    Array.isArray(
      result?.forecast
    )
  ) {
    return result.forecast;
  }

  if (
    Array.isArray(
      result?.predictions
    )
  ) {
    return result.predictions;
  }

  return [];
}


// ============================================================
// GET SALES VALUE
// ============================================================

function getSalesValue(item) {

  const value =
    item?.sales ??
    item?.prediction ??
    item?.forecast ??
    item?.predicted_sales ??
    item?.predicted ??
    item?.value ??
    item?.amount ??
    0;

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


// ============================================================
// GET LABEL
// ============================================================

function getLabel(
  item,
  index,
  prefix = "Day"
) {

  if (item?.date) {

    return formatDate(
      item.date
    );
  }

  if (item?.label) {

    return String(
      item.label
    );
  }

  return `${prefix} ${
    index + 1
  }`;
}


// ============================================================
// FORECAST COMPONENT
// ============================================================

export default function ForecastChart({
  year,
}) {

  // ==========================================================
  // SELECTED DATASET
  // ==========================================================

  const selectedYear = String(year || "2024");

  const dataset =
    `superstore_${selectedYear}.csv`;


  // ==========================================================
  // STATE
  // ==========================================================

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    predictedTotal,
    setPredictedTotal,
  ] = useState(0);

  const [
    growthPercent,
    setGrowthPercent,
  ] = useState(0);


  // ==========================================================
  // LOAD FORECAST
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadForecast() {

      try {

        setLoading(true);

        setError("");

        setData([]);


        // ====================================================
        // GET ACTUAL DATA
        // ====================================================

        const actualUrl =
          `${API_URL}/sales-trend` +
          `?dataset=${encodeURIComponent(
            dataset
          )}` +
          `&period=all`;


        // ====================================================
        // GET FORECAST DATA
        // ====================================================

        const forecastUrl =
          `${API_URL}/sales-trend` +
          `?dataset=${encodeURIComponent(
            dataset
          )}` +
          `&period=future`;


        console.log(
          "FORECAST YEAR:",
          selectedYear
        );

        console.log(
          "FORECAST DATASET:",
          dataset
        );

        console.log(
          "ACTUAL URL:",
          actualUrl
        );

        console.log(
          "FORECAST URL:",
          forecastUrl
        );


        // ====================================================
        // REQUEST BOTH
        // ====================================================

        const [
          actualResponse,
          forecastResponse,
        ] = await Promise.all([

          fetch(
            actualUrl
          ),

          fetch(
            forecastUrl
          ),

        ]);


        if (
          !actualResponse.ok
        ) {

          throw new Error(
            `Historical sales API returned ${
              actualResponse.status
            }`
          );

        }


        if (
          !forecastResponse.ok
        ) {

          throw new Error(
            `Forecast API returned ${
              forecastResponse.status
            }`
          );

        }


        // ====================================================
        // JSON
        // ====================================================

        const actualResult =
          await actualResponse.json();

        const forecastResult =
          await forecastResponse.json();


        console.log(
          "ACTUAL RESPONSE:",
          actualResult
        );

        console.log(
          "FORECAST RESPONSE:",
          forecastResult
        );


        if (cancelled) {
          return;
        }


        // ====================================================
        // EXTRACT
        // ====================================================

        const actualRows =
          extractRows(
            actualResult
          );

        const forecastRows =
          extractRows(
            forecastResult
          );


        // ====================================================
        // CLEAN ACTUAL DATA
        // ====================================================

        const cleanActual =
          actualRows
            .map(
              (
                item,
                index
              ) => {

                return {

                  label:
                    getLabel(
                      item,
                      index,
                      "Day"
                    ),

                  sales:
                    getSalesValue(
                      item
                    ),

                  date:
                    item?.date ??
                    item?.label ??
                    null,

                };

              }
            )
            .filter(
              (item) =>
                item.sales >= 0
            );


        // ====================================================
        // LAST 30 ACTUAL DAYS
        // ====================================================

        const lastActual =
          cleanActual.slice(
            -30
          );


        // ====================================================
        // CLEAN FORECAST
        // ====================================================

        const cleanForecast =
          forecastRows
            .map(
              (
                item,
                index
              ) => {

                return {

                  label:
                    getLabel(
                      item,
                      index,
                      "Future"
                    ),

                  sales:
                    getSalesValue(
                      item
                    ),

                  date:
                    item?.date ??
                    item?.label ??
                    null,

                };

              }
            )
            .filter(
              (item) =>
                item.sales >= 0
            )
            .slice(
              0,
              30
            );


        // ====================================================
        // VALIDATION
        // ====================================================

        if (
          lastActual.length === 0
        ) {

          throw new Error(
            `No historical sales data found for ${dataset}`
          );

        }


        if (
          cleanForecast.length === 0
        ) {

          throw new Error(
            `No forecast data found for ${dataset}`
          );

        }


        // ====================================================
        // LAST ACTUAL VALUE
        // ====================================================

        const lastActualValue =
          Number(
            lastActual[
              lastActual.length - 1
            ].sales || 0
          );


        // ====================================================
        // BUILD DEMO-STYLE DATA
        //
        // PURPLE:
        // Last 30 actual points
        //
        // BLUE:
        // Next 30 forecast points
        //
        // One bridge point connects them.
        // ====================================================

        const chartData = [];


        // ====================================================
        // ACTUAL PURPLE SECTION
        // ====================================================

        lastActual.forEach(
          (
            item,
            index
          ) => {

            chartData.push({

              label:
                item.label,

              actual:
                item.sales,

              forecast:
                null,

              date:
                item.date,

            });

          }
        );


        // ====================================================
        // TRANSITION POINT
        //
        // Both values are equal here.
        // This creates the clean transition:
        //
        // PURPLE ─────────┐
        //                  └──────── BLUE
        // ====================================================

        if (
          lastActual.length > 0
        ) {

          const lastItem =
            lastActual[
              lastActual.length - 1
            ];

          chartData[
            chartData.length - 1
          ] = {

            label:
              lastItem.label,

            actual:
              lastActualValue,

            forecast:
              lastActualValue,

            date:
              lastItem.date,

          };

        }


        // ====================================================
        // BLUE FORECAST SECTION
        // ====================================================

        cleanForecast.forEach(
          (
            item,
            index
          ) => {

            chartData.push({

              label:
                item.label,

              actual:
                null,

              forecast:
                item.sales,

              date:
                item.date,

            });

          }
        );


        // ====================================================
        // FORECAST TOTAL
        // ====================================================

        const totalForecast =
          cleanForecast.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.sales || 0
              ),
            0
          );


        // ====================================================
        // ACTUAL TOTAL
        // ====================================================

        const totalActual =
          lastActual.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.sales || 0
              ),
            0
          );


        // ====================================================
        // GROWTH
        // ====================================================

        let growth = 0;

        if (
          totalActual > 0
        ) {

          growth =
            (
              (
                totalForecast -
                totalActual
              )
              /
              totalActual
            )
            * 100;

        }


        // ====================================================
        // SAVE
        // ====================================================

        setData(
          chartData
        );

        setPredictedTotal(
          totalForecast
        );

        setGrowthPercent(
          growth
        );


      } catch (err) {

        console.error(
          "Forecast error:",
          err
        );


        if (!cancelled) {

          setError(
            err?.message ||
            "Unable to load AI forecast."
          );

          setData([]);

        }


      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadForecast();


    return () => {

      cancelled = true;

    };

  }, [
    year,
    dataset,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="chart-card forecast-card"
      style={{
        position:
          "relative",
      }}
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="chart-header"
      >

        <div>

          <h3>
            Sales Forecast
          </h3>

          <p>
            AI prediction based on{" "}
            <strong>
              {dataset}
            </strong>
          </p>

        </div>


        <select
          className="chart-select"
          value="30"
          onChange={() => {}}
        >

          <option value="30">
            Next 30 Days
          </option>

        </select>

      </div>


      {/* ====================================================
          CHART
      ==================================================== */}

      <div
        style={{
          width:
            "100%",
          height:
            300,
        }}
      >

        {loading && (

          <div
            style={{
              height:
                "100%",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              color:
                "#94a3b8",
            }}
          >

            Loading AI forecast...

          </div>

        )}


        {!loading &&
          error && (

            <div
              style={{
                height:
                  "100%",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                color:
                  "#f87171",
                textAlign:
                  "center",
                padding:
                  20,
              }}
            >

              {error}

            </div>

          )}


        {!loading &&
          !error &&
          data.length === 0 && (

            <div
              style={{
                height:
                  "100%",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                color:
                  "#94a3b8",
              }}
            >

              No forecast data available.

            </div>

          )}


        {!loading &&
          !error &&
          data.length > 0 && (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart
                data={data}
                margin={{
                  top: 15,
                  right: 20,
                  left: 5,
                  bottom: 5,
                }}
              >

                {/* =================================================
                    GRADIENTS
                ================================================= */}

                <defs>

                  {/* PURPLE */}

                  <linearGradient
                    id={`purpleGradient-${selectedYear}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#9b6cff"
                      stopOpacity={0.40}
                    />

                    <stop
                      offset="100%"
                      stopColor="#9b6cff"
                      stopOpacity={0.02}
                    />

                  </linearGradient>


                  {/* BLUE */}

                  <linearGradient
                    id={`blueGradient-${selectedYear}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#38bdf8"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="100%"
                      stopColor="#38bdf8"
                      stopOpacity={0.02}
                    />

                  </linearGradient>

                </defs>


                {/* =================================================
                    GRID
                ================================================= */}

                <CartesianGrid
                  stroke="#24344d"
                  strokeDasharray="3 3"
                />


                {/* =================================================
                    X AXIS
                ================================================= */}

                <XAxis
                  dataKey="label"
                  tick={{
                    fill:
                      "#7890ad",
                    fontSize:
                      10,
                  }}
                  axisLine={{
                    stroke:
                      "#334155",
                  }}
                  tickLine={false}
                  minTickGap={25}
                />


                {/* =================================================
                    Y AXIS
                ================================================= */}

                <YAxis
                  tick={{
                    fill:
                      "#7890ad",
                    fontSize:
                      10,
                  }}
                  axisLine={{
                    stroke:
                      "#334155",
                  }}
                  tickLine={false}
                  tickFormatter={(
                    value
                  ) =>
                    formatMoney(
                      value
                    )
                  }
                  width={48}
                />


                {/* =================================================
                    TOOLTIP
                ================================================= */}

                <Tooltip
                  contentStyle={{
                    background:
                      "#101d31",
                    border:
                      "1px solid #293b57",
                    borderRadius:
                      8,
                    color:
                      "#fff",
                  }}
                  labelStyle={{
                    color:
                      "#cbd5e1",
                    marginBottom:
                      5,
                  }}
                  formatter={(
                    value,
                    name
                  ) => [

                    formatMoney(
                      value
                    ),

                    name ===
                    "Actual Sales"
                      ? "Actual Sales"
                      : "Forecast",

                  ]}
                />


                {/* =================================================
                    LEGEND
                ================================================= */}

                <Legend
                  verticalAlign="top"
                  align="right"
                  height={30}
                  iconType="line"
                  wrapperStyle={{
                    fontSize:
                      "10px",
                    color:
                      "#a5b4c7",
                  }}
                />


                {/* =================================================
                    PURPLE ACTUAL SALES
                ================================================= */}

                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Sales"
                  stroke="#9b6cff"
                  strokeWidth={2.7}
                  fill={`url(#purpleGradient-${selectedYear})`}
                  connectNulls={false}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth:
                      0,
                  }}
                  isAnimationActive={true}
                  animationDuration={900}
                />


                {/* =================================================
                    BLUE FORECAST
                ================================================= */}

                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#38bdf8"
                  strokeWidth={2.7}
                  strokeDasharray="7 5"
                  fill={`url(#blueGradient-${selectedYear})`}
                  connectNulls={false}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth:
                      0,
                  }}
                  isAnimationActive={true}
                  animationDuration={1100}
                />

              </AreaChart>

            </ResponsiveContainer>

          )}

      </div>


      {/* ====================================================
          PREDICTED SALES BOX
      ==================================================== */}

      {!loading &&
        !error &&
        data.length > 0 && (

          <div
            style={{
              position:
                "absolute",
              right:
                "30px",
              bottom:
                "45px",
              background:
                "#101d31",
              border:
                "1px solid #293b57",
              borderRadius:
                "8px",
              padding:
                "12px 14px",
              minWidth:
                "145px",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.25)",
              zIndex:
                5,
            }}
          >

            <div
              style={{
                color:
                  "#cbd5e1",
                fontSize:
                  "11px",
                marginBottom:
                  "4px",
              }}
            >
              Predicted Sales
            </div>


            <div
              style={{
                color:
                  "#ffffff",
                fontSize:
                  "18px",
                fontWeight:
                  700,
              }}
            >
              {formatMoney(
                predictedTotal
              )}
            </div>


            <div
              style={{
                marginTop:
                  "4px",
                color:
                  growthPercent >= 0
                    ? "#4ade80"
                    : "#f87171",
                fontSize:
                  "10px",
                fontWeight:
                  600,
              }}
            >

              {growthPercent >= 0
                ? "↑"
                : "↓"}{" "}

              {Math.abs(
                growthPercent
              ).toFixed(1)}%

              {" "}vs last 30 days

            </div>

          </div>

        )}


      {/* ====================================================
          FOOTER
      ==================================================== */}

      {!loading &&
        !error &&
        data.length > 0 && (

          <div
            style={{
              position:
                "absolute",
              left:
                "15px",
              bottom:
                "7px",
              color:
                "#536984",
              fontSize:
                "8px",
            }}
          >

            AI forecast • {selectedYear}

          </div>

        )}

    </div>

  );
}