import React, {
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

import ProductBarChart from "../components/ProductBarChart";
import RevenuePieChart from "../components/RevenuePieChart";
import TopProducts from "../components/TopProducts";

import {
  Package,
  TrendingUp,
  AlertTriangle,
  BadgeIndianRupee,
} from "lucide-react";

import {
  getDashboardData,
  getTopProducts,
} from "../api/api";


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
// STORAGE KEY
// ============================================================

const YEAR_STORAGE_KEY = "selectedYear";


// ============================================================
// GET SAVED YEAR
// ============================================================

function getSavedYear() {

  try {

    const savedYear =
      localStorage.getItem(
        YEAR_STORAGE_KEY
      );

    if (
      savedYear &&
      YEARS.includes(
        String(savedYear)
      )
    ) {
      return String(savedYear);
    }

  } catch (error) {

    console.error(
      "Unable to read selected year:",
      error
    );

  }

  return "2024";
}


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
// PRODUCT ANALYTICS
// ============================================================

export default function ProductAnalytics() {

  // ==========================================================
  // SELECTED YEAR
  // ==========================================================

  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    getSavedYear()
  );


  // ==========================================================
  // PRODUCT STATISTICS
  // ==========================================================

  const [
    productStats,
    setProductStats,
  ] = useState({

    totalProducts: 0,

    bestSeller:
      "No data",

    revenue: 0,

  });


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
  // LISTEN FOR YEAR CHANGE FROM NAVBAR / OTHER PAGES
  // ==========================================================

  useEffect(() => {

    function handleYearChanged(
      event
    ) {

      const newYear =
        String(
          event?.detail || ""
        );


      if (
        YEARS.includes(newYear)
      ) {

        console.log(
          "Product Analytics received year:",
          newYear
        );


        setSelectedYear(
          newYear
        );

      }

    }


    function handleStorage(
      event
    ) {

      if (
        event.key !==
        YEAR_STORAGE_KEY
      ) {
        return;
      }


      const newYear =
        String(
          event.newValue || ""
        );


      if (
        YEARS.includes(newYear)
      ) {

        console.log(
          "Product Analytics storage year:",
          newYear
        );


        setSelectedYear(
          newYear
        );

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
  // LOAD PRODUCT KPI DATA
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadProductData() {

      setLoading(true);
      setError("");


      try {

        console.log(
          "================================="
        );

        console.log(
          "Loading Product Analytics"
        );

        console.log(
          "Selected dataset:",
          selectedYear
        );

        console.log(
          "================================="
        );


        // ----------------------------------------------------
        // DASHBOARD DATA FOR SELECTED YEAR
        // ----------------------------------------------------

        const dashboard =
          await getDashboardData(
            selectedYear
          );


        console.log(
          "Dashboard data:",
          dashboard
        );


        // ----------------------------------------------------
        // PRODUCTS FOR SELECTED YEAR
        // ----------------------------------------------------

        const topProductsResponse =
          await getTopProducts(
            selectedYear,
            10000
          );


        console.log(
          "Top products:",
          topProductsResponse
        );


        if (cancelled) {
          return;
        }


        // ----------------------------------------------------
        // EXTRACT PRODUCT ARRAY
        // ----------------------------------------------------

        const products =
          Array.isArray(
            topProductsResponse?.data
          )
            ? topProductsResponse.data
            : Array.isArray(
                topProductsResponse
              )
            ? topProductsResponse
            : [];


        console.log(
          `Products found for ${selectedYear}:`,
          products.length
        );


        // ----------------------------------------------------
        // UNIQUE PRODUCTS
        // ----------------------------------------------------

        const uniqueProducts =
          new Set();


        products.forEach(
          (product) => {

            const name =
              product?.name ??
              product?.product_name ??
              product?.Product_Name ??
              product?.productName;


            if (name) {

              uniqueProducts.add(
                String(name)
              );

            }

          }
        );


        // ----------------------------------------------------
        // BEST SELLER
        // ----------------------------------------------------

        let bestSeller =
          "No data";


        if (
          products.length > 0
        ) {

          const sorted =
            [...products].sort(
              (a, b) => {

                const salesA =
                  Number(
                    a?.sales ??
                    a?.Sales ??
                    0
                  );


                const salesB =
                  Number(
                    b?.sales ??
                    b?.Sales ??
                    0
                  );


                return (
                  salesB -
                  salesA
                );

              }
            );


          const best =
            sorted[0];


          bestSeller =
            best?.name ??
            best?.product_name ??
            best?.Product_Name ??
            best?.productName ??
            "No data";

        }


        // ----------------------------------------------------
        // REVENUE
        // ----------------------------------------------------

        const revenue =
          Number(
            dashboard?.data?.total_sales ??
            dashboard?.data?.totalSales ??
            dashboard?.data?.sales ??
            dashboard?.total_sales ??
            dashboard?.totalSales ??
            dashboard?.sales ??
            0
          );


        // ----------------------------------------------------
        // UPDATE STATE
        // ----------------------------------------------------

        setProductStats({

          totalProducts:
            uniqueProducts.size,

          bestSeller,

          revenue,

        });


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "Product Analytics API Error:",
          err
        );


        setError(
          err?.message ||
          `Unable to load product data for ${selectedYear}.`
        );


        setProductStats({

          totalProducts: 0,

          bestSeller:
            "No data",

          revenue: 0,

        });

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadProductData();


    return () => {

      cancelled = true;

    };

  }, [selectedYear]);


  // ==========================================================
  // YEAR CHANGE FROM NAVBAR
  // ==========================================================

  function handleYearChange(
    year
  ) {

    const newYear =
      String(year);


    if (
      !YEARS.includes(newYear)
    ) {
      return;
    }


    console.log(
      "Product Analytics year changed to:",
      newYear
    );


    // --------------------------------------------------------
    // SAVE YEAR
    // --------------------------------------------------------

    try {

      localStorage.setItem(
        YEAR_STORAGE_KEY,
        newYear
      );

    } catch (error) {

      console.error(
        "Unable to save selected year:",
        error
      );

    }


    // --------------------------------------------------------
    // UPDATE THIS PAGE
    // --------------------------------------------------------

    setSelectedYear(
      newYear
    );


    // --------------------------------------------------------
    // TELL OTHER COMPONENTS / PAGES
    // --------------------------------------------------------

    window.dispatchEvent(
      new CustomEvent(
        "yearChanged",
        {
          detail: newYear,
        }
      )
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="dashboard">

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <Sidebar />


      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <div className="main-content">

        {/* ==================================================
            NAVBAR
        ================================================== */}

        <Navbar
          selectedYear={
            selectedYear
          }
          onYearChange={
            handleYearChange
          }
        />


        {/* ==================================================
            PAGE TITLE
        ================================================== */}

        <h1
          style={{
            color: "white",
            marginBottom: "8px",
          }}
        >
          Product Analytics
        </h1>


        {/* ==================================================
            YEAR DESCRIPTION
        ================================================== */}

        <div
          style={{
            color: "#8fa3c0",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >

          Product analysis for{" "}

          <strong
            style={{
              color: "#8b5cf6",
            }}
          >
            {selectedYear}
          </strong>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            style={{
              marginBottom: "15px",
              padding:
                "10px 14px",
              border:
                "1px solid #7f1d1d",
              borderRadius: "8px",
              background:
                "rgba(127,29,29,.15)",
              color: "#fca5a5",
              fontSize: "13px",
            }}
          >

            {error}

          </div>

        )}


        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <div className="cards">

          {/* TOTAL PRODUCTS */}

          <StatCard
            title="Total Products"
            value={
              loading
                ? "..."
                : productStats
                    .totalProducts
                    .toLocaleString(
                      "en-IN"
                    )
            }
            growth="0"
            color="#3B82F6"
            icon={
              <Package
                color="white"
                size={28}
              />
            }
          />


          {/* BEST SELLER */}

          <StatCard
            title="Best Seller"
            value={
              loading
                ? "..."
                : productStats
                    .bestSeller
            }
            growth="0"
            color="#22C55E"
            icon={
              <TrendingUp
                color="white"
                size={28}
              />
            }
          />


          {/* LOW STOCK */}

          <StatCard
            title="Low Stock"
            value="N/A"
            growth="0"
            color="#EF4444"
            icon={
              <AlertTriangle
                color="white"
                size={28}
              />
            }
          />


          {/* REVENUE */}

          <StatCard
            title="Revenue"
            value={
              loading
                ? "..."
                : formatCurrency(
                    productStats
                      .revenue
                  )
            }
            growth="0"
            color="#F59E0B"
            icon={
              <BadgeIndianRupee
                color="white"
                size={28}
              />
            }
          />

        </div>


        {/* ==================================================
            PRODUCT CHARTS
        ================================================== */}

        <div className="dashboard-grid">

          {/* IMPORTANT:
              selectedYear is passed to chart
          */}

          <ProductBarChart
            year={
              selectedYear
            }
          />


          {/* IMPORTANT:
              selectedYear is passed to pie chart
          */}

          <RevenuePieChart
            year={
              selectedYear
            }
          />

        </div>


        {/* ==================================================
            TOP PRODUCTS
        ================================================== */}

        {/* IMPORTANT:
            selectedYear is passed to table
        */}

        <TopProducts
          year={
            selectedYear
          }
        />

      </div>

    </div>

  );

}