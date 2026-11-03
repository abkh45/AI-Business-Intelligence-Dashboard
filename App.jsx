import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import SalesAnalytics from "./pages/SaleAnalytics";
import CustomerAnalytics from "./pages/CustomerAnalytics";
import ProductAnalytics from "./pages/ProductAnalytics";
import RegionAnalytics from "./pages/RegionAnalytics";
import AIPredictions from "./pages/AIPredictions";
import BusinessInsights from "./pages/BusinessInsights";
import Reports from "./pages/Reports";
import DataManagement from "./pages/DataManagement";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";

import Login from "./pages/Login";
import Register from "./pages/Register";


// ============================================================
// AUTH CHECK
// ============================================================

function isLoggedIn() {
  return localStorage.getItem("ai_bi_logged_in") === "true";
}


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// ============================================================
// PUBLIC ROUTE
// ============================================================

function PublicRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return children;
}


// ============================================================
// APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />


        {/* ==================================================
            REGISTER
        ================================================== */}

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            SALES
        ================================================== */}

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <SalesAnalytics />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            CUSTOMERS
        ================================================== */}

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <CustomerAnalytics />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            PRODUCTS
        ================================================== */}

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductAnalytics />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            REGIONS
        ================================================== */}

        <Route
          path="/regions"
          element={
            <ProtectedRoute>
              <RegionAnalytics />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            AI PREDICTIONS
        ================================================== */}

        <Route
          path="/ai-predictions"
          element={
            <ProtectedRoute>
              <AIPredictions />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            BUSINESS INSIGHTS
        ================================================== */}

        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <BusinessInsights />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            REPORTS
        ================================================== */}

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            DATA MANAGEMENT
        ================================================== */}

        <Route
          path="/data"
          element={
            <ProtectedRoute>
              <DataManagement />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            SETTINGS / ACCOUNT
        ================================================== */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            HELP
        ================================================== */}

        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpSupport />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            UNKNOWN ROUTE
        ================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}