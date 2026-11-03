// ============================================================
// API CONFIG
// ============================================================

const API_BASE_URL =
  "http://127.0.0.1:8000/api";


// ============================================================
// GENERIC REQUEST HELPER
// ============================================================

async function request(
  endpoint,
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(
          key,
          String(value)
        );
      }
    }
  );


  const queryString =
    query.toString();


  const url = queryString
    ? `${API_BASE_URL}${endpoint}?${queryString}`
    : `${API_BASE_URL}${endpoint}`;


  console.log(
    "================================"
  );

  console.log(
    "API REQUEST:",
    url
  );

  console.log(
    "================================"
  );


  const response =
    await fetch(url);


  if (!response.ok) {

    let errorMessage =
      `API Error ${response.status}`;


    try {

      const errorData =
        await response.json();


      if (errorData?.detail) {

        errorMessage =
          typeof errorData.detail ===
          "string"
            ? errorData.detail
            : JSON.stringify(
                errorData.detail
              );

      }

    } catch {
      // Ignore JSON parsing error
    }


    throw new Error(
      errorMessage
    );
  }


  const data =
    await response.json();


  console.log(
    "API RESPONSE:",
    endpoint,
    data
  );


  return data;
}


// ============================================================
// DATASET HELPER
//
// IMPORTANT:
// 2022 -> superstore_2022.csv
// 2023 -> superstore_2023.csv
// 2024 -> superstore_2024.csv
// 2025 -> superstore_2025.csv
//
// The backend receives only the year here.
// ============================================================

function normalizeDataset(
  dataset
) {

  if (
    dataset === undefined ||
    dataset === null ||
    dataset === ""
  ) {
    return "2024";
  }


  // If someone passes 2024
  // as a number
  const year =
    String(dataset)
      .trim()
      .replace(
        "superstore_",
        ""
      )
      .replace(
        ".csv",
        ""
      );


  return year;
}


// ============================================================
// DASHBOARD DATA
//
// GET:
// /api/dashboard?dataset=2022
// /api/dashboard?dataset=2023
// /api/dashboard?dataset=2024
// /api/dashboard?dataset=2025
// ============================================================

export async function getDashboardData(
  dataset = "2024"
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/dashboard",
    {
      dataset: year,
    }
  );
}


// ============================================================
// SALES TREND
//
// GET:
// /api/sales-trend?dataset=2022&period=all
//
// IMPORTANT:
// The selected year is sent to the backend.
// ============================================================

export async function getSalesTrend(
  dataset = "2024",
  period = "all"
) {

  const year =
    normalizeDataset(dataset);


  console.log(
    "getSalesTrend()",
    {
      year,
      period,
    }
  );


  return request(
    "/sales-trend",
    {
      dataset: year,
      period,
    }
  );
}


// ============================================================
// PROFIT BY CATEGORY
// ============================================================

export async function getProfitByCategory(
  dataset = "2024"
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/profit-category",
    {
      dataset: year,
    }
  );
}


// ============================================================
// TOP PRODUCTS
// ============================================================

export async function getTopProducts(
  dataset = "2024",
  limit = 10
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/top-products",
    {
      dataset: year,
      limit,
    }
  );
}


// ============================================================
// SALES BY REGION
// ============================================================

export async function getSalesByRegion(
  dataset = "2024"
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/sales-region",
    {
      dataset: year,
    }
  );
}


// ============================================================
// BUSINESS INSIGHTS
// ============================================================

export async function getBusinessInsights(
  dataset = "2024"
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/insights",
    {
      dataset: year,
    }
  );
}


// ============================================================
// AI PREDICTIONS
// ============================================================

export async function getPredictions(
  dataset = "2024"
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/predictions",
    {
      dataset: year,
    }
  );
}


// ============================================================
// FORECAST
// ============================================================

export async function getForecast(
  dataset = "2024"
) {

  const year =
    normalizeDataset(dataset);


  return request(
    "/forecast",
    {
      dataset: year,
    }
  );
}


// ============================================================
// BACKEND HEALTH
// ============================================================

export async function getBackendHealth() {

  return request(
    "/health"
  );
}


// ============================================================
// SALES TREND DATA HELPER
// ============================================================

export async function getSalesTrendData(
  dataset = "2024",
  period = "all"
) {

  const response =
    await getSalesTrend(
      dataset,
      period
    );


  return Array.isArray(
    response?.data
  )
    ? response.data
    : [];
}


// ============================================================
// THIS MONTH
// ============================================================

export async function getThisMonthSales(
  dataset = "2024"
) {

  return getSalesTrendData(
    dataset,
    "this-month"
  );
}


// ============================================================
// LAST MONTH
// ============================================================

export async function getLastMonthSales(
  dataset = "2024"
) {

  return getSalesTrendData(
    dataset,
    "last-month"
  );
}


// ============================================================
// FUTURE
// ============================================================

export async function getFutureSales(
  dataset = "2024"
) {

  return getSalesTrendData(
    dataset,
    "future"
  );
}


// ============================================================
// ALL DATA
//
// THIS IS WHAT SALES ANALYTICS SHOULD USE
// WHEN YOU WANT THE COMPLETE SELECTED YEAR.
// ============================================================

export async function getAllSales(
  dataset = "2024"
) {

  return getSalesTrendData(
    dataset,
    "all"
  );
}


// ============================================================
// NORMALIZE SALES TREND DATA
// ============================================================

export function normalizeSalesTrendData(
  response
) {

  const rows =
    Array.isArray(
      response?.data
    )
      ? response.data
      : [];


  return rows.map(
    (item, index) => {

      const sales =
        Number(
          item?.sales ?? 0
        );


      return {

        label:
          item?.label ??
          item?.date ??
          `Point ${index + 1}`,

        date:
          item?.date ??
          item?.label ??
          `Point ${index + 1}`,

        sales:
          Number.isFinite(sales)
            ? sales
            : 0,

        type:
          item?.type ??
          "actual",
      };

    }
  );
}


// ============================================================
// GRAPH DATA
// ============================================================

export async function getGraphData(
  dataset = "2024",
  period = "all"
) {

  const response =
    await getSalesTrend(
      dataset,
      period
    );


  return {

    ...response,

    data:
      normalizeSalesTrendData(
        response
      ),

  };
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

const api = {

  getDashboardData,

  getSalesTrend,

  getProfitByCategory,

  getTopProducts,

  getSalesByRegion,

  getBusinessInsights,

  getPredictions,

  getForecast,

  getBackendHealth,

  getSalesTrendData,

  getThisMonthSales,

  getLastMonthSales,

  getFutureSales,

  getAllSales,

  normalizeSalesTrendData,

  getGraphData,

};


export default api;