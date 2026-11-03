import {
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SalesStats from "../components/SalesStats";
import SalesChart from "../components/SalesChart";
import ForecastChart from "../components/ForecastChart";


// ============================================================
// STORAGE KEY
// ============================================================

const YEAR_STORAGE_KEY =
  "selectedYear";


// ============================================================
// GET SAVED YEAR
// ============================================================

function getSavedYear() {

  const savedYear =
    localStorage.getItem(
      YEAR_STORAGE_KEY
    );


  if (
    ["2022", "2023", "2024", "2025"]
      .includes(savedYear)
  ) {

    return savedYear;

  }


  return "2024";
}


// ============================================================
// SALES ANALYTICS PAGE
// ============================================================

export default function SalesAnalytics() {

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
  // LISTEN FOR YEAR CHANGES
  // ==========================================================

  useEffect(() => {

    function handleYearChanged(
      event
    ) {

      const newYear =
        event?.detail;


      if (
        ["2022", "2023", "2024", "2025"]
          .includes(
            String(newYear)
          )
      ) {

        console.log(
          "Sales Analytics year changed:",
          newYear
        );


        setSelectedYear(
          String(newYear)
        );

      }

    }


    function handleStorage(
      event
    ) {

      if (
        event.key ===
        YEAR_STORAGE_KEY
      ) {

        const newYear =
          event.newValue;


        if (
          ["2022", "2023", "2024", "2025"]
            .includes(
              String(newYear)
            )
        ) {

          setSelectedYear(
            String(newYear)
          );

        }

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
  // YEAR CHANGE FROM NAVBAR
  // ==========================================================

  function handleYearChange(
    year
  ) {

    const newYear =
      String(year);


    console.log(
      "Sales Analytics selected year:",
      newYear
    );


    localStorage.setItem(
      YEAR_STORAGE_KEY,
      newYear
    );


    setSelectedYear(
      newYear
    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="dashboard">

      <Sidebar />


      <main className="main-content">

        <Navbar
          selectedYear={
            selectedYear
          }
          onYearChange={
            handleYearChange
          }
        />


        <h1
          style={{
            marginBottom: "15px",
            fontSize: "18px",
          }}
        >
          Sales Analytics
        </h1>


        {/* ==================================================
            STATS
        ================================================== */}

        <SalesStats
          year={
            selectedYear
          }
        />


        {/* ==================================================
            SALES CHART + FORECAST
        ================================================== */}

        <div className="dashboard-row row-one">

          <SalesChart
            year={
              selectedYear
            }
          />


          <ForecastChart
            year={
              selectedYear
            }
          />

        </div>

      </main>

    </div>

  );
}