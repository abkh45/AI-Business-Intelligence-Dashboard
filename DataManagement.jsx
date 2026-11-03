import { useEffect, useRef, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  Database,
  HardDrive,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";

// ============================================================
// API
// ============================================================

const API_BASE = "http://127.0.0.1:8000/api";

// ============================================================
// YEARS
// ============================================================

const YEARS = ["2022", "2023", "2024", "2025"];
const YEAR_STORAGE_KEY = "selectedYear";

// ============================================================
// GET SAVED YEAR
// ============================================================

function getSavedYear() {
  const saved = localStorage.getItem(YEAR_STORAGE_KEY);

  if (YEARS.includes(saved)) {
    return saved;
  }

  return "2024";
}

// ============================================================
// DATA MANAGEMENT PAGE
// ============================================================

export default function DataManagement() {
  const fileInputRef = useRef(null);

  const [selectedYear, setSelectedYear] = useState(getSavedYear());

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [datasetInfo, setDatasetInfo] = useState(null);

  // ----------------------------------------------------------
  // LOAD DATASET INFORMATION
  // ----------------------------------------------------------

  async function loadDatasetInfo(year = selectedYear) {
    try {
      setError("");

      const [dashboardResponse, productsResponse, trendResponse] =
        await Promise.all([
          fetch(
            `${API_BASE}/dashboard?dataset=${encodeURIComponent(year)}`
          ),
          fetch(
            `${API_BASE}/top-products?year=${encodeURIComponent(
              year
            )}&limit=100`
          ),
          fetch(
            `${API_BASE}/sales-trend?dataset=${encodeURIComponent(
              year
            )}&period=all`
          ),
        ]);

      if (!dashboardResponse.ok) {
        throw new Error("Failed to load dataset information.");
      }

      const dashboard = await dashboardResponse.json();

      let products = [];
      if (productsResponse.ok) {
        const productData = await productsResponse.json();
        products = Array.isArray(productData?.data)
          ? productData.data
          : [];
      }

      let forecast = [];
      if (trendResponse.ok) {
        const trendData = await trendResponse.json();
        forecast = Array.isArray(trendData?.data)
          ? trendData.data
          : [];
      }

      setDatasetInfo({
        year,
        rows:
          dashboard?.records ??
          dashboard?.total_rows ??
          dashboard?.total_orders ??
          0,

        customers:
          dashboard?.total_customers ??
          0,

        products: products.length,

        forecast: forecast.length,

        // Keep the UI stable until a real storage endpoint is added.
        storage:
          dashboard?.storage ??
          dashboard?.storage_used ??
          "0.2 MB",
      });
    } catch (err) {
      console.error(
        "Could not load dataset information:",
        err
      );

      setError(
        err?.message ||
          "Could not load dataset information."
      );
    }
  }

  // ----------------------------------------------------------
  // LISTEN FOR YEAR CHANGES
  // ----------------------------------------------------------

  useEffect(() => {
    function handleYearChanged(event) {
      const year = String(event?.detail || "");

      if (YEARS.includes(year)) {
        setSelectedYear(year);
        loadDatasetInfo(year);
      }
    }

    function handleStorage(event) {
      if (
        event.key === YEAR_STORAGE_KEY &&
        YEARS.includes(event.newValue)
      ) {
        setSelectedYear(event.newValue);
        loadDatasetInfo(event.newValue);
      }
    }

    window.addEventListener(
      "yearChanged",
      handleYearChanged
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    loadDatasetInfo(getSavedYear());

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

  // ----------------------------------------------------------
  // YEAR CHANGE
  // ----------------------------------------------------------

  function handleYearChange(year) {
    const newYear = String(year);

    if (!YEARS.includes(newYear)) {
      return;
    }

    localStorage.setItem(
      YEAR_STORAGE_KEY,
      newYear
    );

    setSelectedYear(newYear);

    window.dispatchEvent(
      new CustomEvent("yearChanged", {
        detail: newYear,
      })
    );

    loadDatasetInfo(newYear);
  }

  // ----------------------------------------------------------
  // OPEN FILE SELECTOR
  // ----------------------------------------------------------

  function openFilePicker() {
    setMessage("");
    setError("");
    fileInputRef.current?.click();
  }

  // ----------------------------------------------------------
  // UPLOAD DATASET
  // ----------------------------------------------------------

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    const allowedExtensions = [
      ".csv",
      ".xlsx",
      ".xls",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some(
      (extension) => fileName.endsWith(extension)
    );

    if (!isAllowed) {
      setError(
        "Please upload a CSV, XLSX, or XLS file."
      );

      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/upload-dataset?year=${encodeURIComponent(
          selectedYear
        )}`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Dataset upload failed."
        );
      }

      setMessage(
        `Successfully uploaded ${file.name} for ${selectedYear}. ` +
          `${data?.rows ?? data?.records ?? 0} rows imported.`
      );

      await loadDatasetInfo(selectedYear);
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err?.message ||
          "Could not upload dataset."
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  }

  // ----------------------------------------------------------
  // REFRESH
  // ----------------------------------------------------------

  async function refreshData() {
    setMessage("");
    setError("");

    await loadDatasetInfo(selectedYear);

    setMessage(
      `Dataset information refreshed for ${selectedYear}.`
    );
  }

  // ----------------------------------------------------------
  // EXPORT DATA
  // ----------------------------------------------------------

  async function exportData() {
    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_BASE}/export-data?dataset=${encodeURIComponent(
          selectedYear
        )}`
      );

      if (!response.ok) {
        throw new Error("Export failed.");
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `superstore_${selectedYear}.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(
        `Dataset exported for ${selectedYear}.`
      );
    } catch (err) {
      console.error("Export error:", err);

      setError(
        "Export is not available yet."
      );
    }
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  const info = datasetInfo || {};

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main-content">
        <Navbar
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "15px",
          }}
        >
          <div>
            <h1
              style={{
                color: "white",
                marginBottom: "4px",
              }}
            >
              Data Management
            </h1>

            <p>
              Manage datasets for{" "}
              <strong>
                superstore_{selectedYear}.csv
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="support-btn"
            onClick={refreshData}
            disabled={uploading}
            style={{
              width: "auto",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* ====================================================
            HIDDEN FILE INPUT
        ==================================================== */}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{
            display: "none",
          }}
        />

        {/* ====================================================
            ACTION BUTTONS
        ==================================================== */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <button
            type="button"
            className="save-btn"
            onClick={openFilePicker}
            disabled={uploading}
          >
            <Upload size={16} />

            {uploading
              ? "Uploading..."
              : "Import Dataset"}
          </button>

          <button
            type="button"
            className="support-btn"
            onClick={exportData}
            disabled={uploading}
            style={{
              width: "auto",
            }}
          >
            <Download size={16} />
            Export Data
          </button>
        </div>

        {/* ====================================================
            MESSAGES
        ==================================================== */}

        {message && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "15px",
              borderRadius: "8px",
              border:
                "1px solid rgba(34,197,94,.35)",
              background:
                "rgba(34,197,94,.08)",
              color: "#22c55e",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "15px",
              borderRadius: "8px",
              border:
                "1px solid rgba(239,68,68,.35)",
              background:
                "rgba(239,68,68,.08)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {/* ====================================================
            STAT CARDS
            Matches the second screenshot:
            Datasets
            Storage Used
            Imports
            Exports
        ==================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "0",
            marginBottom: "15px",
          }}
        >
          {/* DATASETS */}

          <div
            className="chart-card"
            style={{
              minHeight: "90px",
              borderRadius: "12px 0 0 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                className="stat-icon"
                style={{
                  background:
                    "rgba(59,130,246,.18)",
                  color: "#3b82f6",
                }}
              >
                <Database size={22} />
              </div>

              <div>
                <p>Datasets</p>

                <h2>4</h2>

                <small>
                  Available years
                </small>
              </div>
            </div>
          </div>

          {/* STORAGE */}

          <div
            className="chart-card"
            style={{
              minHeight: "90px",
              borderRadius: "0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                className="stat-icon"
                style={{
                  background:
                    "rgba(139,92,246,.18)",
                  color: "#8b5cf6",
                }}
              >
                <HardDrive size={22} />
              </div>

              <div>
                <p>Storage Used</p>

                <h2>
                  {info.storage || "0.2 MB"}
                </h2>

                <small>
                  +0.0% vs last month
                </small>
              </div>
            </div>
          </div>

          {/* IMPORTS */}

          <div
            className="chart-card"
            style={{
              minHeight: "90px",
              borderRadius: "0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                className="stat-icon"
                style={{
                  background:
                    "rgba(34,197,94,.18)",
                  color: "#22c55e",
                }}
              >
                <Upload size={22} />
              </div>

              <div>
                <p>Imports</p>

                <h2>0</h2>

                <small>
                  +0.0% vs last month
                </small>
              </div>
            </div>
          </div>

          {/* EXPORTS */}

          <div
            className="chart-card"
            style={{
              minHeight: "90px",
              borderRadius: "0 12px 12px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                className="stat-icon"
                style={{
                  background:
                    "rgba(245,158,11,.18)",
                  color: "#f59e0b",
                }}
              >
                <Download size={22} />
              </div>

              <div>
                <p>Exports</p>

                <h2>0</h2>

                <small>
                  +0.0% vs last month
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            DATASET TABLE
        ==================================================== */}

        <div className="chart-card">
          <div
            className="card-header"
            style={{
              marginBottom: "8px",
            }}
          >
            <div>
              <h3>
                Available Datasets
              </h3>

              <p
                style={{
                  marginTop: "2px",
                }}
              >
                Dataset information for{" "}
                {selectedYear}
              </p>
            </div>
          </div>

          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table className="product-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Records</th>
                  <th>Size</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Sales Data</td>

                  <td>
                    {info.rows ?? 0}
                  </td>

                  <td>0.0 MB</td>

                  <td
                    style={{
                      color: "#22C55E",
                    }}
                  >
                    ✓ Active
                  </td>
                </tr>

                <tr>
                  <td>Customer Data</td>

                  <td>
                    {info.customers ?? 0}
                  </td>

                  <td>0.2 MB</td>

                  <td
                    style={{
                      color: "#22C55E",
                    }}
                  >
                    ✓ Active
                  </td>
                </tr>

                <tr>
                  <td>Product Data</td>

                  <td>
                    {info.products ?? 0}
                  </td>

                  <td>0.0 MB</td>

                  <td
                    style={{
                      color: "#22C55E",
                    }}
                  >
                    ✓ Active
                  </td>
                </tr>

                <tr>
                  <td>Forecast Dataset</td>

                  <td>
                    {info.forecast ?? 0}
                  </td>

                  <td>0.0 MB</td>

                  <td
                    style={{
                      color: "#22C55E",
                    }}
                  >
                    ✓ Ready
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
