import { useEffect, useState } from "react";

import {
  TrendingUp,
  PieChart,
  AlertTriangle,
  Target,
  ArrowRight,
  Loader2,
  X,
  CheckCircle2,
  Info,
  AlertCircle,
} from "lucide-react";


// ============================================================
// API
// ============================================================

const API_URL =
  "http://127.0.0.1:8000/api";


// ============================================================
// GET ICON
// ============================================================

function getInsightIcon(status, index) {
  const value = String(
    status || ""
  ).toLowerCase();

  if (
    value.includes("positive") ||
    value.includes("growth") ||
    value.includes("increase")
  ) {
    return TrendingUp;
  }

  if (
    value.includes("warning") ||
    value.includes("risk")
  ) {
    return AlertTriangle;
  }

  if (
    value.includes("alert") ||
    value.includes("attention")
  ) {
    return Target;
  }

  if (
    value.includes("info") ||
    value.includes("information")
  ) {
    return PieChart;
  }

  const icons = [
    TrendingUp,
    PieChart,
    AlertTriangle,
    Target,
  ];

  return icons[
    index % icons.length
  ];
}


// ============================================================
// GET STATUS CLASS
// ============================================================

function getStatusClass(status) {
  const value = String(
    status || "Info"
  ).toLowerCase();

  if (
    value.includes("positive") ||
    value.includes("growth") ||
    value.includes("increase")
  ) {
    return "positive";
  }

  if (
    value.includes("warning") ||
    value.includes("risk")
  ) {
    return "warning";
  }

  if (
    value.includes("alert") ||
    value.includes("attention")
  ) {
    return "alert";
  }

  return "info";
}


// ============================================================
// NORMALIZE API RESPONSE
// ============================================================

function normalizeInsights(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.insights
    )
  ) {
    return response.insights;
  }

  return [];
}


// ============================================================
// COMPONENT
// ============================================================

export default function AIInsights({
  year = "2024",
}) {

  // ==========================================================
  // DATASET
  // ==========================================================

  const dataset =
    `superstore_${year}.csv`;


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    insights,
    setInsights,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showAll,
    setShowAll,
  ] = useState(false);


  // ==========================================================
  // LOAD INSIGHTS
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadInsights() {

      try {

        setLoading(true);

        setError("");

        setInsights([]);


        const url =
          `${API_URL}/insights` +
          `?dataset=${encodeURIComponent(
            dataset
          )}`;


        console.log(
          "AI INSIGHTS REQUEST:",
          url
        );


        const response =
          await fetch(url);


        if (!response.ok) {

          throw new Error(
            `Insights API returned ${response.status}`
          );

        }


        const result =
          await response.json();


        console.log(
          "AI INSIGHTS RESPONSE:",
          result
        );


        if (cancelled) {
          return;
        }


        const rows =
          normalizeInsights(
            result
          );


        const formatted =
          rows
            .map(
              (
                item,
                index
              ) => {

                let text = "";

                if (
                  typeof item ===
                  "string"
                ) {

                  text = item;

                } else {

                  text =
                    item?.text ??
                    item?.message ??
                    item?.insight ??
                    item?.description ??
                    "";

                }


                const status =
                  item?.status ??
                  item?.type ??
                  item?.category ??
                  "Info";


                return {

                  text:
                    String(
                      text
                    ),

                  status:
                    String(
                      status
                    ),

                  className:
                    getStatusClass(
                      status
                    ),

                  icon:
                    getInsightIcon(
                      status,
                      index
                    ),

                };

              }
            )
            .filter(
              (item) =>
                item.text.trim() !== ""
            );


        setInsights(
          formatted
        );


      } catch (err) {

        console.error(
          "AI Insights Error:",
          err
        );


        if (!cancelled) {

          setError(
            "Unable to load AI business insights."
          );

          setInsights([]);

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadInsights();


    return () => {

      cancelled = true;

    };

  }, [
    year,
    dataset,
  ]);


  // ==========================================================
  // CLOSE MODAL WITH ESCAPE
  // ==========================================================

  useEffect(() => {

    function handleEscape(event) {

      if (
        event.key === "Escape"
      ) {

        setShowAll(false);

      }

    }


    if (showAll) {

      document.addEventListener(
        "keydown",
        handleEscape
      );

    }


    return () => {

      document.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [showAll]);


  // ==========================================================
  // BODY SCROLL
  // ==========================================================

  useEffect(() => {

    if (showAll) {

      document.body.style.overflow =
        "hidden";

    } else {

      document.body.style.overflow =
        "";

    }


    return () => {

      document.body.style.overflow =
        "";

    };

  }, [showAll]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          MAIN INSIGHTS CARD
      ====================================================== */}

      <div
        className="chart-card insights-card"
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          className="chart-header"
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
          }}
        >

          <div>

            <h3>
              AI Business Insights
            </h3>

            <p
              style={{
                margin:
                  "3px 0 0",
                color:
                  "#7185a3",
                fontSize:
                  "10px",
              }}
            >
              AI analysis based on{" "}

              <strong
                style={{
                  color:
                    "#94a3b8",
                }}
              >
                {dataset}
              </strong>

            </p>

          </div>


          {/* YEAR BADGE */}

          <div
            style={{
              border:
                "1px solid #293b57",
              borderRadius:
                "5px",
              padding:
                "4px 9px",
              color:
                "#9fb0c8",
              fontSize:
                "9px",
            }}
          >
            {year}
          </div>

        </div>


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div
            style={{
              minHeight:
                "190px",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap:
                "8px",
              color:
                "#7185a3",
              fontSize:
                "11px",
            }}
          >

            <Loader2
              size={16}
              style={{
                animation:
                  "spin 1s linear infinite",
              }}
            />

            Generating AI insights...

          </div>

        )}


        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading &&
          error && (

            <div
              style={{
                minHeight:
                  "190px",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                color:
                  "#f87171",
                fontSize:
                  "11px",
                textAlign:
                  "center",
                padding:
                  "20px",
              }}
            >

              {error}

            </div>

          )}


        {/* ====================================================
            NO DATA
        ==================================================== */}

        {!loading &&
          !error &&
          insights.length === 0 && (

            <div
              style={{
                minHeight:
                  "190px",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                color:
                  "#7185a3",
                fontSize:
                  "11px",
              }}
            >

              No business insights
              available.

            </div>

          )}


        {/* ====================================================
            INSIGHT LIST
        ==================================================== */}

        {!loading &&
          !error &&
          insights.length > 0 && (

            <div
              className="insights-list"
            >

              {insights.map(
                (
                  item,
                  index
                ) => {

                  const Icon =
                    item.icon;

                  return (

                    <div
                      className="insight-row"
                      key={
                        `${item.text}-${index}`
                      }
                    >

                      {/* ICON */}

                      <div
                        className={
                          `insight-icon ${item.className}`
                        }
                      >

                        <Icon
                          size={20}
                        />

                      </div>


                      {/* TEXT */}

                      <p>
                        {item.text}
                      </p>


                      {/* STATUS */}

                      <span
                        className={
                          `insight-status ${item.className}`
                        }
                      >

                        {item.status}

                      </span>

                    </div>

                  );

                }
              )}

            </div>

          )}


        {/* ====================================================
            VIEW ALL BUTTON
        ==================================================== */}

        {!loading &&
          !error &&
          insights.length > 0 && (

            <button
              className="all-insights"
              type="button"
              onClick={() =>
                setShowAll(true)
              }
            >

              View All Insights

              <ArrowRight
                size={16}
              />

            </button>

          )}

      </div>


      {/* ======================================================
          ALL INSIGHTS MODAL
      ====================================================== */}

      {showAll && (

        <div
          onClick={() =>
            setShowAll(false)
          }
          style={{
            position:
              "fixed",
            inset:
              0,
            zIndex:
              99999,
            background:
              "rgba(2, 8, 23, 0.78)",
            backdropFilter:
              "blur(8px)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px",
          }}
        >

          {/* ==================================================
              MODAL
          ================================================== */}

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width:
                "min(720px, 95vw)",
              maxHeight:
                "85vh",
              overflow:
                "hidden",
              background:
                "#0d1a2d",
              border:
                "1px solid #263b59",
              borderRadius:
                "16px",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.55)",
            }}
          >

            {/* ================================================
                MODAL HEADER
            ================================================ */}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                padding:
                  "20px 22px",
                borderBottom:
                  "1px solid #20324b",
              }}
            >

              <div>

                <h2
                  style={{
                    margin:
                      0,
                    color:
                      "#f8fafc",
                    fontSize:
                      "20px",
                    fontWeight:
                      700,
                  }}
                >
                  AI Business Insights
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#7185a3",
                    fontSize:
                      "12px",
                  }}
                >
                  Complete business analysis
                  for{" "}

                  <strong
                    style={{
                      color:
                        "#a78bfa",
                    }}
                  >
                    {year}
                  </strong>
                </p>

              </div>


              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setShowAll(false)
                }
                style={{
                  width:
                    "34px",
                  height:
                    "34px",
                  border:
                    "1px solid #293b57",
                  borderRadius:
                    "8px",
                  background:
                    "#101f34",
                  color:
                    "#94a3b8",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  cursor:
                    "pointer",
                }}
              >

                <X
                  size={18}
                />

              </button>

            </div>


            {/* ================================================
                MODAL BODY
            ================================================ */}

            <div
              style={{
                padding:
                  "18px 22px 22px",
                maxHeight:
                  "calc(85vh - 100px)",
                overflowY:
                  "auto",
              }}
            >

              {/* SUMMARY */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(4, 1fr)",
                  gap:
                    "10px",
                  marginBottom:
                    "18px",
                }}
              >

                {/* POSITIVE */}

                <div
                  style={{
                    background:
                      "rgba(34,197,94,0.08)",
                    border:
                      "1px solid rgba(34,197,94,0.18)",
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "6px",
                      color:
                        "#4ade80",
                      fontSize:
                        "10px",
                    }}
                  >

                    <CheckCircle2
                      size={13}
                    />

                    Positive

                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#f8fafc",
                      fontSize:
                        "18px",
                    }}
                  >
                    {
                      insights.filter(
                        (item) =>
                          item.className ===
                          "positive"
                      ).length
                    }
                  </strong>

                </div>


                {/* INFO */}

                <div
                  style={{
                    background:
                      "rgba(59,130,246,0.08)",
                    border:
                      "1px solid rgba(59,130,246,0.18)",
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "6px",
                      color:
                        "#60a5fa",
                      fontSize:
                        "10px",
                    }}
                  >

                    <Info
                      size={13}
                    />

                    Info

                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#f8fafc",
                      fontSize:
                        "18px",
                    }}
                  >
                    {
                      insights.filter(
                        (item) =>
                          item.className ===
                          "info"
                      ).length
                    }
                  </strong>

                </div>


                {/* WARNING */}

                <div
                  style={{
                    background:
                      "rgba(245,158,11,0.08)",
                    border:
                      "1px solid rgba(245,158,11,0.18)",
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "6px",
                      color:
                        "#fbbf24",
                      fontSize:
                        "10px",
                    }}
                  >

                    <AlertTriangle
                      size={13}
                    />

                    Warning

                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#f8fafc",
                      fontSize:
                        "18px",
                    }}
                  >
                    {
                      insights.filter(
                        (item) =>
                          item.className ===
                          "warning"
                      ).length
                    }
                  </strong>

                </div>


                {/* ALERT */}

                <div
                  style={{
                    background:
                      "rgba(239,68,68,0.08)",
                    border:
                      "1px solid rgba(239,68,68,0.18)",
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "6px",
                      color:
                        "#f87171",
                      fontSize:
                        "10px",
                    }}
                  >

                    <AlertCircle
                      size={13}
                    />

                    Alert

                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#f8fafc",
                      fontSize:
                        "18px",
                    }}
                  >
                    {
                      insights.filter(
                        (item) =>
                          item.className ===
                          "alert"
                      ).length
                    }
                  </strong>

                </div>

              </div>


              {/* ==============================================
                  ALL INSIGHTS
              ============================================== */}

              <div>

                {insights.map(
                  (
                    item,
                    index
                  ) => {

                    const Icon =
                      item.icon;

                    return (

                      <div
                        key={
                          `modal-${index}`
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "14px",
                          padding:
                            "15px",
                          marginBottom:
                            "9px",
                          background:
                            "#101f34",
                          border:
                            "1px solid #20344f",
                          borderRadius:
                            "10px",
                        }}
                      >

                        {/* ICON */}

                        <div
                          className={
                            `insight-icon ${item.className}`
                          }
                          style={{
                            flexShrink:
                              0,
                          }}
                        >

                          <Icon
                            size={20}
                          />

                        </div>


                        {/* CONTENT */}

                        <div
                          style={{
                            flex:
                              1,
                          }}
                        >

                          <div
                            style={{
                              color:
                                "#e2e8f0",
                              fontSize:
                                "13px",
                              lineHeight:
                                "1.5",
                            }}
                          >
                            {item.text}
                          </div>

                          <div
                            style={{
                              marginTop:
                                "5px",
                              color:
                                "#64748b",
                              fontSize:
                                "10px",
                            }}
                          >
                            Insight #{index + 1}
                          </div>

                        </div>


                        {/* STATUS */}

                        <span
                          className={
                            `insight-status ${item.className}`
                          }
                          style={{
                            flexShrink:
                              0,
                          }}
                        >

                          {item.status}

                        </span>

                      </div>

                    );

                  }
                )}

              </div>


              {/* ==============================================
                  FOOTER
              ============================================== */}

              <div
                style={{
                  marginTop:
                    "15px",
                  paddingTop:
                    "14px",
                  borderTop:
                    "1px solid #20324b",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >

                <span
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "10px",
                  }}
                >
                  🤖 Generated from{" "}
                  {dataset}
                </span>


                <button
                  type="button"
                  onClick={() =>
                    setShowAll(false)
                  }
                  style={{
                    padding:
                      "8px 16px",
                    border:
                      "1px solid #334a69",
                    borderRadius:
                      "7px",
                    background:
                      "#172943",
                    color:
                      "#cbd5e1",
                    cursor:
                      "pointer",
                    fontSize:
                      "11px",
                  }}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}