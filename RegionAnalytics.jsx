import React, { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import RegionMap from "../components/RegionMap";
import SalesChart from "../components/SalesChart";

import {
  Globe,
  MapPinned,
  TrendingUp,
  BadgeIndianRupee,
} from "lucide-react";

import {
  getSalesByRegion,
  getDashboardData,
} from "../api/api";


// ============================================================
// YEARS
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
    const saved =
      localStorage.getItem(
        YEAR_STORAGE_KEY
      );

    if (
      saved &&
      YEARS.includes(String(saved))
    ) {
      return String(saved);
    }
  } catch (error) {
    console.error(
      "Could not read selected year:",
      error
    );
  }

  return "2024";
}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "₹0";
  }

  if (number >= 10000000) {
    return `₹${(
      number / 10000000
    ).toFixed(2)}Cr`;
  }

  if (number >= 1000000) {
    return `₹${(
      number / 1000000
    ).toFixed(2)}M`;
  }

  if (number >= 1000) {
    return `₹${(
      number / 1000
    ).toFixed(0)}K`;
  }

  return `₹${number.toLocaleString(
    "en-IN"
  )}`;
}


// ============================================================
// REGION ANALYTICS
// ============================================================

export default function RegionAnalytics() {

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
  // REGION DATA
  // ==========================================================

  const [
    regionData,
    setRegionData,
  ] = useState([]);


  // ==========================================================
  // KPI DATA
  // ==========================================================

  const [
    stats,
    setStats,
  ] = useState({
    regions: 0,
    topRegion: "No data",
    growth: 0,
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
  // LISTEN FOR YEAR CHANGES
  // ==========================================================

  useEffect(() => {

    function handleYearChanged(event) {

      const year =
        String(
          event?.detail || ""
        );

      if (
        YEARS.includes(year)
      ) {

        console.log(
          "RegionAnalytics received:",
          year
        );

        setSelectedYear(year);
      }
    }


    function handleStorage(event) {

      if (
        event.key !==
        YEAR_STORAGE_KEY
      ) {
        return;
      }

      const year =
        String(
          event.newValue || ""
        );

      if (
        YEARS.includes(year)
      ) {

        setSelectedYear(year);
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
  // LOAD REGION DATA
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    async function loadData() {

      setLoading(true);


      try {

        console.log(
          "================================="
        );

        console.log(
          "REGION ANALYTICS YEAR:",
          selectedYear
        );

        console.log(
          "================================="
        );


        // ----------------------------------------------------
        // REGION API
        // ----------------------------------------------------

        const regionResponse =
          await getSalesByRegion(
            selectedYear
          );


        console.log(
          "REGION RESPONSE:",
          regionResponse
        );


        // ----------------------------------------------------
        // DASHBOARD API
        // ----------------------------------------------------

        const dashboardResponse =
          await getDashboardData(
            selectedYear
          );


        console.log(
          "DASHBOARD RESPONSE:",
          dashboardResponse
        );


        if (cancelled) {
          return;
        }


        // ----------------------------------------------------
        // GET REGION ARRAY
        // ----------------------------------------------------

        let rows = [];


        if (
          Array.isArray(
            regionResponse?.data
          )
        ) {

          rows =
            regionResponse.data;

        } else if (
          Array.isArray(regionResponse)
        ) {

          rows =
            regionResponse;

        } else if (
          Array.isArray(
            regionResponse?.regions
          )
        ) {

          rows =
            regionResponse.regions;

        }


        // ----------------------------------------------------
        // NORMALIZE REGION DATA
        // ----------------------------------------------------

        const normalized =
          rows
            .map((item) => {

              const region =
                item?.region ??
                item?.Region ??
                item?.name ??
                item?.Name ??
                item?.country ??
                item?.Country ??
                "";


              const sales =
                Number(
                  item?.sales ??
                  item?.Sales ??
                  item?.total_sales ??
                  item?.totalSales ??
                  item?.value ??
                  0
                );


              return {
                region:
                  String(region),

                sales:
                  Number.isFinite(
                    sales
                  )
                    ? sales
                    : 0,
              };

            })
            .filter(
              (item) =>
                item.region &&
                item.sales > 0
            );


        console.log(
          `NORMALIZED REGIONS ${selectedYear}:`,
          normalized
        );


        setRegionData(
          normalized
        );


        // ----------------------------------------------------
        // TOP REGION
        // ----------------------------------------------------

        let topRegion =
          "No data";


        if (
          normalized.length > 0
        ) {

          const sorted =
            [...normalized].sort(
              (a, b) =>
                b.sales -
                a.sales
            );


          topRegion =
            sorted[0].region;
        }


        // ----------------------------------------------------
        // TOTAL REGIONS
        // ----------------------------------------------------

        const regionCount =
          normalized.length;


        // ----------------------------------------------------
        // REVENUE
        // ----------------------------------------------------

        const revenue =
          Number(
            dashboardResponse?.data?.total_sales ??
            dashboardResponse?.data?.totalSales ??
            dashboardResponse?.total_sales ??
            dashboardResponse?.totalSales ??
            dashboardResponse?.sales ??
            0
          );


        // ----------------------------------------------------
        // SET KPI
        // ----------------------------------------------------

        setStats({

          regions:
            regionCount,

          topRegion:
            topRegion,

          growth:
            Number(
              regionResponse?.growth_percentage ??
              regionResponse?.growth ??
              0
            ),

          revenue:
            revenue,

        });


      } catch (error) {

        console.error(
          "Region Analytics Error:",
          error
        );


        if (!cancelled) {

          setRegionData([]);

          setStats({
            regions: 0,
            topRegion: "No data",
            growth: 0,
            revenue: 0,
          });

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
  // YEAR CHANGE
  // ==========================================================

  function handleYearChange(year) {

    const newYear =
      String(year);


    if (
      !YEARS.includes(newYear)
    ) {
      return;
    }


    console.log(
      "Region Analytics changing to:",
      newYear
    );


    // Save year

    localStorage.setItem(
      YEAR_STORAGE_KEY,
      newYear
    );


    // Update page

    setSelectedYear(
      newYear
    );


    // Tell other pages

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

      {/* SIDEBAR */}

      <Sidebar />


      {/* MAIN */}

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
            TITLE
        ================================================== */}

        <h1
          style={{
            color: "white",
            marginBottom: "5px",
          }}
        >
          Region Analytics
        </h1>


        <p
          style={{
            color: "#8fa3c0",
            fontSize: "13px",
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Regional analysis for{" "}

          <span
            style={{
              color: "#8b5cf6",
              fontWeight: 700,
            }}
          >
            {selectedYear}
          </span>

        </p>


        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <div className="cards">

          <StatCard
            title="Regions"
            value={
              loading
                ? "..."
                : stats.regions
            }
            growth=""
            color="#3B82F6"
            icon={
              <Globe
                color="white"
                size={28}
              />
            }
          />

          <StatCard
            title="Top Region"
            value={
              loading
                ? "..."
                : stats.topRegion
            }
            growth=""
            color="#22C55E"
            icon={
              <MapPinned
                color="white"
                size={28}
              />
            }
          />

          <StatCard
            title="Year-over-YearGrowth"
            value={
              loading
                ? "..."
                : selectedYear === "2022"
                  ? "N/A"
                  : `${stats.growth > 0 ? "+" : ""}${stats.growth.toFixed(2)}%`
            }
            growth={
              selectedYear === "2022"
                ? "No previous year"
                : `${stats.growth > 0 ? "↑" : stats.growth < 0 ? "↓" : "→"} ${Math.abs(
                    stats.growth
                  ).toFixed(2)}% vs ${Number(selectedYear) - 1}`
            }
            color="#8B5CF6"
            icon={
              <TrendingUp
                color="white"
                size={28}
              />
            }
          />

          <StatCard
            title="Regional Revenue"
            value={
              loading
                ? "..."
                : formatMoney(
                    stats.revenue
                  )
            }
            growth=""
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
            MAP + SALES TREND
        ================================================== */}

        <div className="dashboard-grid">

          {/* IMPORTANT:
              Pass selectedYear
          */}

          <RegionMap
            year={
              selectedYear
            }
            data={
              regionData
            }
          />


          {/* IMPORTANT:
              Pass selectedYear
          */}

          <SalesChart
            year={
              selectedYear
            }
          />

        </div>

      </div>

    </div>

  );

}