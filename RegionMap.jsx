import React, { useEffect, useMemo, useState } from "react";

import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

// ============================================================
// API
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ============================================================
// FORMAT MONEY
// ============================================================

const formatMoney = (value) => {
  const number = Number(value) || 0;

  if (number >= 1000000000) {
    return `₹${(number / 1000000000).toFixed(2)}B`;
  }

  if (number >= 1000000) {
    return `₹${(number / 1000000).toFixed(2)}M`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(0)}K`;
  }

  return `₹${Math.round(number).toLocaleString("en-IN")}`;
};

// ============================================================
// COUNTRY NAME NORMALIZER
// ============================================================

const normalizeCountryName = (name) => {
  const value = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const aliases = {
    "united states of america": "united states",
    usa: "united states",
    "u.s.a.": "united states",
    "u.s.": "united states",
    "us": "united states",

    "united kingdom": "united kingdom",
    uk: "united kingdom",
    "great britain": "united kingdom",

    uae: "united arab emirates",

    czechia: "czech republic",

    "south korea": "south korea",
    "republic of korea": "south korea",

    russia: "russia",
    "russian federation": "russia",

    "viet nam": "vietnam",

    iran: "iran",

    bolivia: "bolivia",

    venezuela: "venezuela",

    "lao pdr": "laos",
    "lao people's democratic republic": "laos",

    "democratic republic of the congo":
      "democratic republic of the congo",

    "republic of congo": "republic of the congo",

    "ivory coast": "cote d'ivoire",
    "côte d'ivoire": "cote d'ivoire",

    "myanmar (burma)": "myanmar",

    swaziland: "eswatini",

    macedonia: "north macedonia",

    "tanzania": "tanzania",

    "east timor": "timor-leste",
  };

  return aliases[value] || value;
};

// ============================================================
// REGION / COUNTRY MAP
// ============================================================

export default function RegionMap({ year }) {
  const [countryData, setCountryData] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD COUNTRY SALES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadCountryData = async () => {
      try {
        setLoading(true);
        setError("");
        setTooltip(null);

        const selectedYear = String(year || "2024");

        const url =
          `${API_BASE_URL}/api/sales-by-country` +
          `?year=${encodeURIComponent(selectedYear)}`;

        console.log(
          `[RegionMap] Loading country sales for ${selectedYear}`
        );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Sales by Country API Error: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          `[RegionMap] API response for ${selectedYear}:`,
          result
        );

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // SUPPORT DIFFERENT RESPONSE FORMATS
        // ------------------------------------------------------

        let rows = [];

        if (Array.isArray(result?.data)) {
          rows = result.data;
        } else if (Array.isArray(result?.sales_by_country)) {
          rows = result.sales_by_country;
        } else if (Array.isArray(result)) {
          rows = result;
        }

        // ------------------------------------------------------
        // NORMALIZE DATA
        // ------------------------------------------------------

        const normalizedRows = rows
          .map((item) => {
            const country =
              item?.country ??
              item?.Country ??
              item?.name ??
              item?.Name ??
              "";

            const sales = Number(
              item?.sales ??
                item?.Sales ??
                item?.value ??
                0
            );

            const profit = Number(
              item?.profit ??
                item?.Profit ??
                0
            );

            const orders = Number(
              item?.orders ??
                item?.Orders ??
                0
            );

            return {
              country: String(country).trim(),

              sales: Number.isFinite(sales)
                ? sales
                : 0,

              profit: Number.isFinite(profit)
                ? profit
                : 0,

              orders: Number.isFinite(orders)
                ? orders
                : 0,
            };
          })
          .filter(
            (item) =>
              item.country &&
              Number.isFinite(item.sales)
          );

        console.log(
          `[RegionMap] Normalized data for ${selectedYear}:`,
          normalizedRows
        );

        setCountryData(normalizedRows);
      } catch (err) {
        console.error(
          "[RegionMap] Error:",
          err
        );

        if (!cancelled) {
          setCountryData([]);

          setError(
            err?.message ||
              "Unable to load sales map."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCountryData();

    return () => {
      cancelled = true;
    };
  }, [year]);

  // ==========================================================
  // COUNTRY LOOKUP
  // ==========================================================

  const salesMap = useMemo(() => {
    const map = {};

    countryData.forEach((item) => {
      if (!item?.country) {
        return;
      }

      const key = normalizeCountryName(
        item.country
      );

      map[key] = {
        country: item.country,
        sales: Number(item.sales) || 0,
        profit: Number(item.profit) || 0,
        orders: Number(item.orders) || 0,
      };
    });

    return map;
  }, [countryData]);

  // ==========================================================
  // SALES VALUES
  // ==========================================================

  const salesValues = useMemo(() => {
    return countryData
      .map(
        (item) =>
          Number(item.sales) || 0
      )
      .filter(
        (value) => value > 0
      );
  }, [countryData]);

  // ==========================================================
  // MIN SALES
  // ==========================================================

  const minSales = useMemo(() => {
    if (!salesValues.length) {
      return 0;
    }

    return Math.min(...salesValues);
  }, [salesValues]);

  // ==========================================================
  // MAX SALES
  // ==========================================================

  const maxSales = useMemo(() => {
    if (!salesValues.length) {
      return 1;
    }

    return Math.max(...salesValues);
  }, [salesValues]);

  // ==========================================================
  // COLOR INTERPOLATION
  // ==========================================================

  const interpolateColor = (
    color1,
    color2,
    amount
  ) => {
    const hexToRgb = (hex) => {
      const clean = hex.replace("#", "");

      return {
        r: parseInt(
          clean.substring(0, 2),
          16
        ),

        g: parseInt(
          clean.substring(2, 4),
          16
        ),

        b: parseInt(
          clean.substring(4, 6),
          16
        ),
      };
    };

    const rgbToHex = (rgb) => {
      const toHex = (value) =>
        Math.round(value)
          .toString(16)
          .padStart(2, "0");

      return (
        "#" +
        toHex(rgb.r) +
        toHex(rgb.g) +
        toHex(rgb.b)
      );
    };

    const start = hexToRgb(color1);
    const end = hexToRgb(color2);

    return rgbToHex({
      r:
        start.r +
        (end.r - start.r) * amount,

      g:
        start.g +
        (end.g - start.g) * amount,

      b:
        start.b +
        (end.b - start.b) * amount,
    });
  };

  // ==========================================================
  // COUNTRY COLOR
  // ==========================================================

  const getCountryColor = (countryName) => {
    const key =
      normalizeCountryName(countryName);

    const country = salesMap[key];

    // No data
    if (!country) {
      return "#16253A";
    }

    const sales =
      Number(country.sales) || 0;

    // Zero / negative sales
    if (sales <= 0) {
      return "#16253A";
    }

    // --------------------------------------------------------
    // NORMALIZE BETWEEN MIN AND MAX
    // --------------------------------------------------------

    let intensity = 0.5;

    if (maxSales > minSales) {
      intensity =
        (sales - minSales) /
        (maxSales - minSales);
    }

    intensity = Math.max(
      0,
      Math.min(1, intensity)
    );

    // Make smaller differences more visible
    intensity = Math.pow(
      intensity,
      0.65
    );

    // --------------------------------------------------------
    // LOW -> CYAN
    // MID -> BLUE
    // HIGH -> PURPLE
    // --------------------------------------------------------

    if (intensity <= 0.5) {
      return interpolateColor(
        "#22B8E6",
        "#6366F1",
        intensity * 2
      );
    }

    return interpolateColor(
      "#6366F1",
      "#A855F7",
      (intensity - 0.5) * 2
    );
  };

  // ==========================================================
  // CARD
  // ==========================================================

  return (
    <div
      className="region-map-card"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "320px",
        position: "relative",
        overflow: "hidden",
        background: "#111C2E",
        borderRadius: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          left: "20px",
          top: "16px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: "17px",
            fontWeight: 700,
            lineHeight: "1.2",
          }}
        >
          Sales by Region
        </div>

        <div
          style={{
            marginTop: "3px",
            color: "#7185A3",
            fontSize: "11px",
          }}
        >
          Sales distribution for {year || "2024"}
        </div>
      </div>

      {/* ======================================================
          YEAR
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          right: "18px",
          top: "16px",
          zIndex: 20,
          border: "1px solid #263956",
          borderRadius: "5px",
          padding: "5px 10px",
          color: "#9FB0C8",
          fontSize: "10px",
          fontWeight: 500,
        }}
      >
        {year || "2024"}
      </div>

      {/* ======================================================
          MAP
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "48px",
          bottom: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 145,
            center: [10, 15],
          }}
          width={900}
          height={500}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        >
          <ZoomableGroup
            zoom={1}
            minZoom={1}
            maxZoom={3}
            center={[10, 15]}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName =
                    geo?.properties?.name ||
                    "";

                  const key =
                    normalizeCountryName(
                      countryName
                    );

                  const country =
                    salesMap[key];

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(
                        countryName
                      )}
                      stroke="#1F3048"
                      strokeWidth={0.6}
                      style={{
                        default: {
                          outline: "none",
                          transition:
                            "fill 0.35s ease, stroke 0.2s ease",
                        },

                        hover: {
                          fill: country
                            ? "#C084FC"
                            : "#1B2B43",

                          outline: "none",

                          cursor: country
                            ? "pointer"
                            : "default",
                        },

                        pressed: {
                          outline: "none",
                        },
                      }}
                      onMouseEnter={() => {
                        if (!country) {
                          return;
                        }

                        setTooltip({
                          country:
                            country.country,

                          sales:
                            country.sales,

                          profit:
                            country.profit,

                          orders:
                            country.orders,
                        });
                      }}
                      onMouseLeave={() => {
                        setTooltip(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94A3B8",
            fontSize: "13px",
            background:
              "rgba(17,28,46,0.65)",
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          Loading sales map...
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading && error && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            textAlign: "center",
            color: "#FCA5A5",
            fontSize: "12px",
            lineHeight: 1.5,
            zIndex: 25,
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          EMPTY DATA
      ====================================================== */}

      {!loading &&
        !error &&
        countryData.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "55%",
              transform:
                "translate(-50%, -50%)",
              color: "#94A3B8",
              fontSize: "12px",
              zIndex: 25,
              textAlign: "center",
            }}
          >
            No sales data available
            for {year || "2024"}.
          </div>
        )}

      {/* ======================================================
          HIGH / LOW LEGEND
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          left: "20px",
          bottom: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          color: "#CBD5E1",
          fontSize: "10px",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <span
          style={{
            marginBottom: "5px",
            fontWeight: 600,
          }}
        >
          High
        </span>

        <div
          style={{
            width: "10px",
            height: "85px",
            borderRadius: "8px",
            background:
              "linear-gradient(to bottom, #A855F7, #6366F1, #22B8E6)",
            boxShadow:
              "0 0 8px rgba(168,85,247,0.25)",
          }}
        />

        <span
          style={{
            marginTop: "5px",
          }}
        >
          Low
        </span>
      </div>

      {/* ======================================================
          TOOLTIP
      ====================================================== */}

      {tooltip && (
        <div
          style={{
            position: "absolute",
            right: "18px",
            top: "55px",
            minWidth: "165px",
            padding: "12px 15px",
            background: "#172235",
            border: "1px solid #334155",
            borderRadius: "10px",
            color: "#FFFFFF",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "7px",
            }}
          >
            {tooltip.country}
          </div>

          <div
            style={{
              fontSize: "10px",
              color: "#94A3B8",
            }}
          >
            Sales
          </div>

          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#A78BFA",
              marginBottom: "7px",
            }}
          >
            {formatMoney(
              tooltip.sales
            )}
          </div>

          <div
            style={{
              fontSize: "10px",
              color: "#94A3B8",
            }}
          >
            Profit:{" "}
            {formatMoney(
              tooltip.profit
            )}
          </div>

          <div
            style={{
              fontSize: "10px",
              color: "#94A3B8",
              marginTop: "4px",
            }}
          >
            Orders:{" "}
            {Number(
              tooltip.orders
            ).toLocaleString("en-IN")}
          </div>
        </div>
      )}
    </div>
  );
}