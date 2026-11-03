const API_BASE_URL = "http://127.0.0.1:8000";

// ============================================================
// DATASET STORAGE
// ============================================================

export function getSelectedDataset() {
  return localStorage.getItem("selectedDataset") || "superstore_2025";
}

export function setSelectedDataset(dataset) {
  localStorage.setItem("selectedDataset", dataset);
}

// ============================================================
// DATASETS
// ============================================================

export async function getDatasets() {
  const response = await fetch(`${API_BASE_URL}/api/datasets`);

  if (!response.ok) {
    throw new Error(`Failed to load datasets: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardData(dataset = null) {
  const selectedDataset = dataset || getSelectedDataset();

  const url =
    `${API_BASE_URL}/api/dashboard` +
    `?dataset=${encodeURIComponent(selectedDataset)}`;

  console.log("Dashboard API:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load dashboard data: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// GENERIC API HELPER
// ============================================================

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export { API_BASE_URL };