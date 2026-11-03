import { useState, useMemo, useEffect, useRef } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  Mail,
  Phone,
  MessageCircle,
  CircleHelp,
  Send,
  Bot,
  User,
  Trash2,
  ArrowRight,
  Database,
  BarChart3,
  BrainCircuit,
  FileText,
  Users,
  Package,
  Globe,
  Lightbulb,
  Search,
  Bell,
  Settings,
  AlertTriangle,
  Upload,
  LayoutDashboard,
  X,
} from "lucide-react";

/* ============================================================
   DASHBOARD SUPPORT KNOWLEDGE BASE
   ============================================================ */

const supportKnowledge = [
  /* ==========================================================
     DATASET / YEAR
     ========================================================== */

  {
    id: "dataset-change",
    category: "Dataset & Year",
    keywords: [
      "change dataset",
      "change year",
      "switch dataset",
      "switch year",
      "select dataset",
      "select year",
      "different dataset",
      "different year",
      "how to change dataset",
      "how to change year",
      "dataset selection",
      "year selection",
    ],
    answer:
      "You can change the dataset by using the year selector in the top-right corner. Select 2022, 2023, 2024, or 2025. The dashboard pages should then use the corresponding dataset.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  {
    id: "wrong-dataset",
    category: "Dataset & Year",
    keywords: [
      "wrong dataset",
      "wrong year",
      "selected 2022",
      "selected 2023",
      "selected 2024",
      "selected 2025",
      "showing 2022",
      "showing 2023",
      "showing 2024",
      "showing 2025",
      "wrong data",
      "old data",
      "different data",
      "dataset not changing",
      "year not changing",
    ],
    answer:
      "If you select one year but the page still displays another dataset, that page is probably using a fixed or hard-coded dataset. The selected year should be passed to that page's API request so it loads the matching CSV.",
    action: {
      label: "Open Data Management",
      path: "/data-management",
    },
  },

  {
    id: "only-one-dataset",
    category: "Dataset & Year",
    keywords: [
      "only one dataset",
      "one dataset",
      "only showing one",
      "same dataset",
      "all datasets same",
      "every dataset same",
      "all years same",
      "same data every year",
    ],
    answer:
      "Your application supports four datasets: superstore_2022.csv, superstore_2023.csv, superstore_2024.csv, and superstore_2025.csv. Each page should use the dataset corresponding to the selected year.",
    action: {
      label: "Open Data Management",
      path: "/data-management",
    },
  },

  {
    id: "dataset-missing",
    category: "Dataset & Year",
    keywords: [
      "2022 not showing",
      "2023 not showing",
      "2024 not showing",
      "2025 not showing",
      "year missing",
      "dataset missing",
      "dataset unavailable",
      "cannot find dataset",
    ],
    answer:
      "First check that the corresponding CSV file exists in the backend dataset directory. Then verify that the backend recognizes that dataset and that the frontend sends the correct year or dataset name in the API request.",
    action: {
      label: "Open Data Management",
      path: "/data-management",
    },
  },

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  {
    id: "dashboard",
    category: "Dashboard",
    keywords: [
      "dashboard",
      "main dashboard",
      "dashboard page",
      "what is dashboard",
      "dashboard information",
    ],
    answer:
      "The Dashboard provides an overall business view including Total Sales, Total Profit, Total Orders, Total Customers, Average Order Value, Sales Trend, Profit by Category, Sales by Region, and Top Products.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  {
    id: "dashboard-slow",
    category: "Dashboard",
    keywords: [
      "dashboard slow",
      "dashboard loading slow",
      "dashboard takes long",
      "dashboard takes time",
      "slow dashboard",
      "slow loading",
      "loading slow",
      "takes too long",
    ],
    answer:
      "When you change datasets, the dashboard may make several API requests and process the data again. To make it faster, the application should load the selected dataset once, cache the response, and reuse the data instead of making duplicate requests.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  {
    id: "dashboard-loading",
    category: "Dashboard",
    keywords: [
      "loading forever",
      "dashboard stuck",
      "stuck loading",
      "loading",
      "page loading",
      "not loading",
      "data not loading",
    ],
    answer:
      "If the dashboard stays on Loading, first verify that the FastAPI backend is running. Then check the browser Network tab to see whether the dashboard API request succeeds or returns an error.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  /* ==========================================================
     SALES
     ========================================================== */

  {
    id: "sales",
    category: "Sales Analytics",
    keywords: [
      "sales analytics",
      "sales analysis",
      "sales data",
      "sales",
      "sales performance",
      "sales trend",
      "sales trends",
    ],
    answer:
      "Sales Analytics analyzes sales performance from the currently selected dataset. You can use it to understand sales trends, growth, categories, regions, and other sales metrics.",
    action: {
      label: "Open Sales Analytics",
      path: "/sales-analytics",
    },
  },

  {
    id: "total-sales",
    category: "Sales Analytics",
    keywords: [
      "total sales",
      "what is total sales",
      "sales amount",
      "sales value",
    ],
    answer:
      "Total Sales is the total sales amount calculated from the currently selected dataset and year.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  {
    id: "profit",
    category: "Sales Analytics",
    keywords: [
      "total profit",
      "profit",
      "profit amount",
      "what is profit",
    ],
    answer:
      "Total Profit is the total profit calculated from the currently selected dataset.",
    action: {
      label: "Open Sales Analytics",
      path: "/sales-analytics",
    },
  },

  {
    id: "sales-growth",
    category: "Sales Analytics",
    keywords: [
      "sales growth",
      "growth",
      "negative growth",
      "positive growth",
      "sales decreasing",
      "sales increasing",
    ],
    answer:
      "Sales growth shows how sales changed compared with the comparison period used by the dashboard. Negative growth means sales decreased, while positive growth means sales increased.",
    action: {
      label: "Open Sales Analytics",
      path: "/sales-analytics",
    },
  },

  {
    id: "average-order",
    category: "Sales Analytics",
    keywords: [
      "average order",
      "average order value",
      "aov",
      "what is average order value",
    ],
    answer:
      "Average Order Value represents the average sales amount per order in the selected dataset.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  /* ==========================================================
     CUSTOMER
     ========================================================== */

  {
    id: "customers",
    category: "Customer Analytics",
    keywords: [
      "customer analytics",
      "customer analysis",
      "customer",
      "customers",
      "customer data",
      "customer performance",
    ],
    answer:
      "Customer Analytics analyzes customer activity and purchasing behavior from the currently selected dataset.",
    action: {
      label: "Open Customer Analytics",
      path: "/customer-analytics",
    },
  },

  {
    id: "customer-count",
    category: "Customer Analytics",
    keywords: [
      "customer count",
      "number of customers",
      "how many customers",
      "total customers",
    ],
    answer:
      "Total Customers represents the customer count calculated from the currently selected dataset.",
    action: {
      label: "Open Customer Analytics",
      path: "/customer-analytics",
    },
  },

  {
    id: "churn",
    category: "Customer Analytics",
    keywords: [
      "churn",
      "customer churn",
      "churn prediction",
      "customers at risk",
      "customer risk",
    ],
    answer:
      "Customer Churn represents customers identified as being at risk of becoming inactive based on the prediction analysis.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "churn-high",
    category: "Customer Analytics",
    keywords: [
      "churn high",
      "why churn high",
      "churn 100",
      "high churn",
      "customer churn high",
    ],
    answer:
      "A high churn value means the prediction system has identified a high number or percentage of customers as being at risk. The result depends on the selected dataset.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  /* ==========================================================
     PRODUCT
     ========================================================== */

  {
    id: "products",
    category: "Product Analytics",
    keywords: [
      "product analytics",
      "product analysis",
      "products",
      "product data",
      "product performance",
    ],
    answer:
      "Product Analytics analyzes product sales, profit, orders, and performance using the selected dataset.",
    action: {
      label: "Open Product Analytics",
      path: "/product-analytics",
    },
  },

  {
    id: "top-products",
    category: "Product Analytics",
    keywords: [
      "top products",
      "best products",
      "best selling product",
      "highest selling product",
      "top 10 products",
      "which product sells most",
      "product sells most",
    ],
    answer:
      "Top Products ranks products according to their performance in the selected dataset. You can use Product Analytics to identify the highest-selling and highest-profit products.",
    action: {
      label: "Open Product Analytics",
      path: "/product-analytics",
    },
  },

  /* ==========================================================
     REGION
     ========================================================== */

  {
    id: "regions",
    category: "Region Analytics",
    keywords: [
      "region analytics",
      "region analysis",
      "regions",
      "regional sales",
      "region data",
      "geographic",
      "map",
    ],
    answer:
      "Region Analytics analyzes sales and performance across geographic regions using the selected dataset.",
    action: {
      label: "Open Region Analytics",
      path: "/region-analytics",
    },
  },

  {
    id: "highest-region",
    category: "Region Analytics",
    keywords: [
      "highest region",
      "best region",
      "top region",
      "region highest sales",
      "which region",
      "highest regional sales",
    ],
    answer:
      "Region Analytics can identify the region with the highest sales in the currently selected dataset.",
    action: {
      label: "Open Region Analytics",
      path: "/region-analytics",
    },
  },

  /* ==========================================================
     AI PREDICTIONS
     ========================================================== */

  {
    id: "ai-predictions",
    category: "AI Predictions",
    keywords: [
      "ai prediction",
      "ai predictions",
      "prediction",
      "predictions",
      "predict",
      "machine learning",
      "ml prediction",
    ],
    answer:
      "AI Predictions estimates future sales, product demand, and customer churn using historical information from the currently selected dataset.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "prediction-dataset",
    category: "AI Predictions",
    keywords: [
      "prediction dataset",
      "prediction year",
      "change prediction dataset",
      "change prediction year",
      "prediction selected year",
    ],
    answer:
      "AI Predictions should use the dataset selected in the top-right year selector. For example, selecting 2023 should request the 2023 dataset and generate predictions from that data.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "same-prediction",
    category: "AI Predictions",
    keywords: [
      "same prediction",
      "prediction same",
      "same predictions",
      "same forecast",
      "same every dataset",
      "same every year",
      "prediction not changing",
      "forecast not changing",
      "prediction doesn't change",
    ],
    answer:
      "Each dataset should generate its own prediction. If every year produces the same prediction, the prediction request is probably using the same dataset every time. The frontend should send the selected dataset to the prediction API.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "wrong-prediction-year",
    category: "AI Predictions",
    keywords: [
      "prediction says 2024",
      "prediction showing 2024",
      "forecast says 2024",
      "forecast showing 2024",
      "selected 2022 prediction",
      "selected 2023 prediction",
      "wrong prediction year",
      "wrong forecast year",
    ],
    answer:
      "If you select 2022 or 2023 but the forecast says 2024, check that the forecast component uses the dataset and year returned by the prediction API rather than a hard-coded value such as superstore_2024.csv.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "sales-prediction",
    category: "AI Predictions",
    keywords: [
      "sales prediction",
      "predicted sales",
      "prediction sales",
      "expected sales",
    ],
    answer:
      "Sales Prediction is the estimated future sales value generated from historical sales data in the selected dataset.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "demand-prediction",
    category: "AI Predictions",
    keywords: [
      "demand prediction",
      "predicted demand",
      "product demand",
      "demand",
    ],
    answer:
      "Demand Prediction estimates future product demand based on the historical data in the selected dataset.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "confidence",
    category: "AI Predictions",
    keywords: [
      "confidence",
      "prediction confidence",
      "ai confidence",
      "model confidence",
      "confidence percentage",
    ],
    answer:
      "Prediction Confidence indicates the confidence value returned by the prediction system for the selected dataset.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "forecast",
    category: "AI Predictions",
    keywords: [
      "sales forecast",
      "forecast",
      "future sales",
      "forecast chart",
      "forecast graph",
    ],
    answer:
      "Sales Forecast displays estimated future sales after the historical sales period. The forecast should be generated from the currently selected dataset.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  /* ==========================================================
     BUSINESS INSIGHTS
     ========================================================== */

  {
    id: "insights",
    category: "Business Insights",
    keywords: [
      "business insights",
      "business insight",
      "insights",
      "ai insights",
      "insight page",
    ],
    answer:
      "Business Insights summarizes important findings from the selected dataset, including category performance, profit, regional performance, expected revenue, and prediction confidence.",
    action: {
      label: "Open Business Insights",
      path: "/insights",
    },
  },

  {
    id: "insights-year",
    category: "Business Insights",
    keywords: [
      "insight wrong year",
      "insights wrong year",
      "insight showing 2024",
      "insights showing 2024",
      "insight not changing",
      "insights not changing",
      "business insights same",
    ],
    answer:
      "Business Insights should recalculate when the selected year changes. If it continues showing another year, the Insights page is probably using a fixed dataset instead of the selected year.",
    action: {
      label: "Open Business Insights",
      path: "/insights",
    },
  },

  {
    id: "expected-revenue",
    category: "Business Insights",
    keywords: [
      "expected revenue",
      "revenue",
      "expected sales revenue",
      "revenue blank",
      "revenue missing",
      "expected revenue blank",
    ],
    answer:
      "Expected Revenue represents the expected future revenue based on the prediction results for the selected dataset. If it is blank, check whether the prediction API returned the required forecast value.",
    action: {
      label: "Open Business Insights",
      path: "/insights",
    },
  },

  {
    id: "insight-confidence",
    category: "Business Insights",
    keywords: [
      "insight confidence",
      "ai confidence blank",
      "confidence blank",
      "confidence missing",
    ],
    answer:
      "AI Confidence should come from the prediction result for the selected dataset. If it is blank, verify that the prediction API response contains a confidence field and that the Insights page reads that field.",
    action: {
      label: "Open Business Insights",
      path: "/insights",
    },
  },

  /* ==========================================================
     REPORTS
     ========================================================== */

  {
    id: "reports",
    category: "Reports",
    keywords: [
      "reports",
      "report",
      "business reports",
      "report page",
      "download report",
    ],
    answer:
      "Reports provides business reports generated from the selected dataset. Available report types can include Sales, Customer, Product, and AI Prediction reports.",
    action: {
      label: "Open Reports",
      path: "/reports",
    },
  },

  {
    id: "reports-wrong-year",
    category: "Reports",
    keywords: [
      "report wrong year",
      "reports wrong year",
      "report showing 2025",
      "reports showing 2025",
      "report not changing",
      "reports not changing",
      "report same",
    ],
    answer:
      "Reports should use the currently selected dataset. If Reports always shows 2025, check that the Reports page sends the selected year to its API request instead of using a fixed superstore_2025.csv value.",
    action: {
      label: "Open Reports",
      path: "/reports",
    },
  },

  {
    id: "download-report",
    category: "Reports",
    keywords: [
      "download report",
      "how download",
      "export report",
      "export reports",
      "download",
    ],
    answer:
      "Open Reports and select the required report's Download action. The report should be generated using the currently selected dataset.",
    action: {
      label: "Open Reports",
      path: "/reports",
    },
  },

  /* ==========================================================
     DATA MANAGEMENT
     ========================================================== */

  {
    id: "data-management",
    category: "Data Management",
    keywords: [
      "data management",
      "manage data",
      "dataset management",
      "manage dataset",
    ],
    answer:
      "Data Management is where you manage and upload datasets used by the dashboard.",
    action: {
      label: "Open Data Management",
      path: "/data-management",
    },
  },

  {
    id: "upload",
    category: "Data Management",
    keywords: [
      "upload csv",
      "upload dataset",
      "upload data",
      "import dataset",
      "import csv",
      "upload file",
      "how upload",
      "upload",
    ],
    answer:
      "Open Data Management and use the upload option to select your CSV or supported Excel file. After uploading, verify that the backend successfully processed the file.",
    action: {
      label: "Open Data Management",
      path: "/data-management",
    },
  },

  {
    id: "upload-error",
    category: "Data Management",
    keywords: [
      "upload failed",
      "upload error",
      "csv error",
      "dataset upload failed",
      "cannot upload",
      "file upload problem",
    ],
    answer:
      "Check that the file format is supported and that the required columns exist. If the upload still fails, check the backend terminal for the API error.",
    action: {
      label: "Open Data Management",
      path: "/data-management",
    },
  },

  /* ==========================================================
     SEARCH
     ========================================================== */

  {
    id: "search",
    category: "Search",
    keywords: [
      "search",
      "search bar",
           "search not working",
      "search doesn't work",
      "search does not work",
      "search anything",
      "cannot search",
    ],
    answer:
      "The search box needs to be connected to a search/filter action. If typing only changes the text inside the input without filtering or navigating, the search logic has not been connected yet.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */

  {
    id: "notifications",
    category: "Notifications",
    keywords: [
      "notification",
      "notifications",
      "notification icon",
      "notification not working",
      "notifications not working",
      "bell",
      "bell not working",
    ],
    answer:
      "The notification button should open a notification dropdown. If clicking the bell does nothing, verify that its click handler updates the notification state and renders the notification panel.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  /* ==========================================================
     PROFILE
     ========================================================== */

  {
    id: "profile",
    category: "Profile",
    keywords: [
      "profile",
      "admin",
      "admin button",
      "profile button",
      "user button",
      "user icon",
      "profile not working",
      "admin not working",
    ],
    answer:
      "The profile/admin icon should open the user's profile or account menu. If clicking it does nothing, the button needs to be connected to a profile action or route.",
    action: {
      label: "Open Settings",
      path: "/settings",
    },
  },

  /* ==========================================================
     SETTINGS
     ========================================================== */

  {
    id: "settings",
    category: "Settings",
    keywords: [
      "settings",
      "setting",
      "settings not working",
      "settings not saving",
      "save settings",
      "preferences",
    ],
    answer:
      "Settings contains dashboard and account preferences. If changes disappear after refreshing the page, the settings probably need to be persisted using the backend or browser storage.",
    action: {
      label: "Open Settings",
      path: "/settings",
    },
  },

  /* ==========================================================
     ERRORS
     ========================================================== */

  {
    id: "404",
    category: "Errors",
    keywords: [
      "404",
      "not found",
      "api not found",
      "route not found",
    ],
    answer:
      "A 404 means the requested API or page route does not exist. Check that the frontend URL exactly matches a registered backend endpoint or React route.",
  },

  {
    id: "500",
    category: "Errors",
    keywords: [
      "500",
      "internal server error",
      "server error",
      "api error",
    ],
    answer:
      "A 500 error means the backend encountered an exception while processing the request. Check the FastAPI/Uvicorn terminal for the actual Python error and line number.",
  },

  {
    id: "network-error",
    category: "Errors",
    keywords: [
      "network error",
      "connection refused",
      "cannot connect",
      "api not responding",
      "backend not responding",
      "server not running",
    ],
    answer:
      "Check that your FastAPI backend is running and that the frontend is using the correct API URL and port. Your health endpoint should return an API running message when the backend is available.",
  },

  {
    id: "blank-page",
    category: "Errors",
    keywords: [
      "blank page",
      "white page",
      "empty page",
      "page blank",
      "nothing showing",
    ],
    answer:
      "A blank React page usually means a JavaScript error occurred. Open the browser Developer Tools and check Console for the first red error. Also verify that the route and component imports are correct.",
  },

  {
    id: "chart-error",
    category: "Errors",
    keywords: [
      "chart broken",
      "chart empty",
      "graph empty",
      "graph broken",
      "chart not showing",
      "graph not showing",
    ],
    answer:
      "Check that the API returned an array with the fields expected by the chart. A missing field, incorrect property name, or empty array can cause the chart to appear blank.",
  },

  {
    id: "undefined",
    category: "Errors",
    keywords: [
      "undefined",
      "nan",
      "not a number",
      "invalid number",
      "value undefined",
    ],
    answer:
      "Undefined or NaN values usually mean the frontend is reading a missing field or performing a calculation with invalid data. Compare the API response fields with the fields used by the React component.",
  },

  /* ==========================================================
     NAVIGATION
     ========================================================== */

  {
    id: "where-dashboard",
    category: "Navigation",
    keywords: [
      "where dashboard",
      "open dashboard",
      "go dashboard",
    ],
    answer: "You can open the Dashboard from the left sidebar.",
    action: {
      label: "Open Dashboard",
      path: "/",
    },
  },

  {
    id: "where-predictions",
    category: "Navigation",
    keywords: [
      "where predictions",
      "open predictions",
      "go predictions",
    ],
    answer: "AI Predictions is available from the left sidebar.",
    action: {
      label: "Open AI Predictions",
      path: "/ai-predictions",
    },
  },

  {
    id: "where-insights",
    category: "Navigation",
    keywords: [
      "where insights",
      "open insights",
      "go insights",
    ],
    answer: "Business Insights is available from the left sidebar.",
    action: {
      label: "Open Business Insights",
      path: "/insights",
    },
  },

  {
    id: "where-reports",
    category: "Navigation",
    keywords: [
      "where reports",
      "open reports",
      "go reports",
    ],
    answer: "Reports is available from the left sidebar.",
    action: {
      label: "Open Reports",
      path: "/reports",
    },
  },
];

/* ============================================================
   QUICK QUESTIONS
   ============================================================ */

const quickQuestions = [
  {
    label: "Dataset not changing",
    icon: Database,
    question: "Why is my dataset not changing when I select another year?",
  },
  {
    label: "Prediction problem",
    icon: BrainCircuit,
    question: "Why is the same prediction showing for every dataset?",
  },
  {
    label: "Wrong year",
    icon: AlertTriangle,
    question: "I selected 2023 but the page is showing 2024 data.",
  },
  {
    label: "Dashboard slow",
    icon: LayoutDashboard,
    question: "Why is my dashboard loading slowly when I change dataset?",
  },
  {
    label: "Expected revenue",
    icon: Lightbulb,
    question: "Why is Expected Revenue blank?",
  },
  {
    label: "Reports",
    icon: FileText,
    question: "Why is my Reports page showing the wrong dataset?",
  },
  {
    label: "Upload dataset",
    icon: Upload,
    question: "How do I upload a dataset?",
  },
  {
    label: "Search problem",
    icon: Search,
    question: "Why is the search bar not working?",
  },
];

/* ============================================================
   SUPPORT CATEGORIES
   ============================================================ */

const supportCategories = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    color: "#8B5CF6",
  },
  {
    name: "Dataset & Year",
    icon: Database,
    color: "#3B82F6",
  },
  {
    name: "Sales Analytics",
    icon: BarChart3,
    color: "#22C55E",
  },
  {
    name: "Customer Analytics",
    icon: Users,
    color: "#F59E0B",
  },
  {
    name: "Product Analytics",
    icon: Package,
    color: "#EC4899",
  },
  {
    name: "Region Analytics",
    icon: Globe,
    color: "#06B6D4",
  },
  {
    name: "AI Predictions",
    icon: BrainCircuit,
    color: "#8B5CF6",
  },
  {
    name: "Business Insights",
    icon: Lightbulb,
    color: "#F59E0B",
  },
  {
    name: "Reports",
    icon: FileText,
    color: "#3B82F6",
  },
  {
    name: "Data Management",
    icon: Upload,
    color: "#22C55E",
  },
];

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
  Find the best support answer.

  We score keyword matches rather than only checking:
  text.includes(keyword)

  This makes the chatbot much more tolerant of different
  user wording.
*/
function findSupportAnswer(question) {
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const item of supportKnowledge) {
    let score = 0;

    for (const keyword of item.keywords) {
      const normalizedKeyword = normalizeText(keyword);

      if (!normalizedKeyword) continue;

      if (normalizedQuestion.includes(normalizedKeyword)) {
        score += normalizedKeyword.split(" ").length * 5;
      } else {
        const words = normalizedKeyword.split(" ");

        for (const word of words) {
          if (word.length > 3 && normalizedQuestion.includes(word)) {
            score += 1;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestScore > 0) {
    return bestMatch;
  }

  return null;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function HelpSupport() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text:
        "Hi! 👋 I'm your AI BI Dashboard Support Assistant. I can help you with datasets, year selection, analytics, AI predictions, business insights, reports, uploads, dashboard errors, and other dashboard problems.",
      time: new Date(),
    },
    {
      id: 2,
      sender: "bot",
      text:
        "What problem are you having?",
      time: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ==========================================================
     AUTO SCROLL
     ========================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  function sendMessage(text = input) {
    const trimmed = text.trim();

    if (!trimmed || isTyping) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
      time: new Date(),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    /*
      Small delay makes the support assistant feel natural.
    */
    setTimeout(() => {
      const answer = findSupportAnswer(trimmed);

      let botMessage;

      if (answer) {
        botMessage = {
          id: Date.now() + 1,
          sender: "bot",
          text: answer.answer,
          category: answer.category,
          action: answer.action,
          time: new Date(),
        };
      } else {
        botMessage = {
          id: Date.now() + 1,
          sender: "bot",
          text:
            "I can help with the AI BI Dashboard, but I couldn't identify the exact problem yet. Try asking about the dataset/year selector, Dashboard, Sales Analytics, Customer Analytics, Product Analytics, Region Analytics, AI Predictions, Business Insights, Reports, Data Management, Search, Notifications, or Settings.",
          time: new Date(),
        };
      }

      setMessages((previous) => [
        ...previous,
        botMessage,
      ]);

      setIsTyping(false);
    }, 650);
  }

  /* ==========================================================
     ENTER KEY
     ========================================================== */

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  /* ==========================================================
     CLEAR CHAT
     ========================================================== */

  function clearChat() {
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text:
          "Chat cleared. 👋 How can I help you with the AI BI Dashboard?",
        time: new Date(),
      },
    ]);

    setSelectedCategory(null);
  }

  /* ==========================================================
     QUICK QUESTION
     ========================================================== */

  function askQuickQuestion(question) {
    sendMessage(question);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  /* ==========================================================
     CATEGORY
     ========================================================== */

  function askCategory(category) {
    const question = `I need help with ${category}.`;

    setSelectedCategory(category);

    const answer = supportKnowledge.find(
      (item) => item.category === category
    );

    if (answer) {
      const userMessage = {
        id: Date.now(),
        sender: "user",
        text: question,
        time: new Date(),
      };

      setMessages((previous) => [
        ...previous,
        userMessage,
      ]);

      setIsTyping(true);

      setTimeout(() => {
        setMessages((previous) => [
          ...previous,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: answer.answer,
            category: answer.category,
            action: answer.action,
            time: new Date(),
          },
        ]);

        setIsTyping(false);
      }, 500);
    }
  }

  /* ==========================================================
     TIME
     ========================================================== */

  function formatTime(date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <h1
          style={{
            color: "white",
            marginBottom: "8px",
          }}
        >
          Help & Support
        </h1>

        <p
          style={{
            color: "#8FA3C7",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          Get help with your AI BI Dashboard, datasets, analytics,
          predictions, reports, and dashboard problems.
        </p>

        {/* ====================================================
            FAQ
        ==================================================== */}

        <div className="dashboard-grid">
          <div className="chart-card">
            <div className="card-header">
              <h3>
                <CircleHelp
                  size={18}
                  style={{
                    verticalAlign: "middle",
                    marginRight: "8px",
                  }}
                />
                Frequently Asked Questions
              </h3>
            </div>

            <div className="settings-form">
              <div className="faq-item">
                <h4>
                  How do I change the dataset?
                </h4>

                <p>
                  Use the year selector in the top-right
                  corner and choose 2022, 2023, 2024, or
                  2025.
                </p>
              </div>

              <div className="faq-item">
                <h4>
                  Why is my prediction not changing?
                </h4>

                <p>
                  AI Predictions should use the selected
                  year's dataset. If every year shows the
                  same result, the prediction request may
                  be using a fixed dataset.
                </p>
              </div>

              <div className="faq-item">
                <h4>
                  Why is my dashboard slow?
                </h4>

                <p>
                  Changing datasets may trigger multiple
                  API requests. Loading and caching the
                  selected dataset once can make the
                  dashboard faster.
                </p>
              </div>

              <div className="faq-item">
                <h4>
                  How do I import a dataset?
                </h4>

                <p>
                  Go to Data Management and upload your
                  supported CSV or Excel file.
                </p>
              </div>

              <div className="faq-item">
                <h4>
                  Why is Reports showing the wrong year?
                </h4>

                <p>
                  Reports should use the currently selected
                  dataset. If it always shows one year,
                  the Reports page may be using a hard-coded
                  dataset.
                </p>
              </div>

              <div className="faq-item">
                <h4>
                  Can I get help with AI predictions?
                </h4>

                <p>
                  Yes. Use the Live Chat below and describe
                  your prediction, forecast, demand, or
                  churn problem.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              CONTACT SUPPORT
          ================================================== */}

          <div className="chart-card">
            <div className="card-header">
              <h3>Contact Support</h3>
            </div>

            <div className="settings-form">
              <a
                href="mailto:support@aibi.com?subject=AI%20BI%20Dashboard%20Support"
                className="support-btn"
                style={{
                  textDecoration: "none",
                }}
              >
                <Mail size={20} />
                <span>
                  support@aibi.com
                </span>
              </a>

              <a
                href="tel:+917248240385"
                className="support-btn"
                style={{
                  textDecoration: "none",
                }}
              >
                <Phone size={20} />
                <span>
                  +91 7248240385
                </span>
              </a>

              <button
                className="support-btn"
                onClick={() => {
                  inputRef.current?.focus();
                }}
              >
                <MessageCircle size={20} />

                <span>
                  AI Live Chat
                </span>

                <span
                  style={{
                    marginLeft: "auto",
                    color: "#22C55E",
                    fontSize: "11px",
                  }}
                >
                  ● Online
                </span>
              </button>

              <button
                className="support-btn"
                onClick={() =>
                  window.open(
                    "/help",
                    "_self"
                  )
                }
              >
                <CircleHelp size={20} />

                <span>
                  Documentation
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            AI LIVE CHAT
        ==================================================== */}

        <div
          className="chart-card"
          style={{
            marginTop: "24px",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {/* CHAT HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px",
              borderBottom: "1px solid #233758",
              background: "#101d32",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #7C3AED, #4F46E5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 8px 20px rgba(79,70,229,.25)",
                }}
              >
                <Bot
                  size={23}
                  color="white"
                />
              </div>

              <div>
                <h3
                  style={{
                    color: "white",
                    margin: 0,
                    fontSize: "16px",
                  }}
                >
                  AI Dashboard Support
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "4px",
                    color: "#8FA3C7",
                    fontSize: "11px",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      background: "#22C55E",
                      borderRadius: "50%",
                      display: "inline-block",
                    }}
                  />

                  Online • Dashboard Support
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={clearChat}
              title="Clear chat"
              style={{
                border: "1px solid #263C5E",
                background: "#0D192B",
                color: "#8FA3C7",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* ==================================================
              CHAT BODY
          ================================================== */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "230px minmax(0, 1fr)",
              minHeight: "570px",
            }}
          >
            {/* ================================================
                CATEGORY SIDEBAR
            ================================================= */}

            <div
              style={{
                borderRight: "1px solid #233758",
                background: "#0C182B",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "#7187AA",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: ".7px",
                  marginBottom: "12px",
                }}
              >
                Support Topics
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {supportCategories.map(
                  (category) => {
                    const Icon = category.icon;

                    const active =
                      selectedCategory ===
                      category.name;

                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() =>
                          askCategory(
                            category.name
                          )
                        }
                        style={{
                          width: "100%",
                          border: active
                            ? "1px solid #465CF5"
                            : "1px solid transparent",
                          background: active
                            ? "rgba(79,70,229,.16)"
                            : "transparent",
                          color: active
                            ? "white"
                            : "#8FA3C7",
                          borderRadius: "8px",
                          padding: "9px 8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "11px",
                        }}
                      >
                        <Icon
                          size={14}
                          color={
                            active
                              ? "#8B5CF6"
                              : category.color
                          }
                        />

                        <span>
                          {category.name}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* ================================================
                CHAT AREA
            ================================================= */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                background: "#0A1628",
              }}
            >
              {/* ==============================================
                  MESSAGES
              =============================================== */}

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  maxHeight: "500px",
                }}
              >
                {messages.map(
                  (message) => {
                    const isBot =
                      message.sender ===
                      "bot";

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: "flex",
                          justifyContent:
                            isBot
                              ? "flex-start"
                              : "flex-end",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "flex-start",
                            gap: "9px",
                            maxWidth:
                              "82%",
                            flexDirection:
                              isBot
                                ? "row"
                                : "row-reverse",
                          }}
                        >
                          {/* AVATAR */}

                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              minWidth: "32px",
                              borderRadius:
                                "9px",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                isBot
                                  ? "linear-gradient(135deg,#7C3AED,#4F46E5)"
                                  : "#1C3150",
                            }}
                          >
                            {isBot ? (
                              <Bot
                                size={16}
                                color="white"
                              />
                            ) : (
                              <User
                                size={16}
                                color="white"
                              />
                            )}
                          </div>

                          {/* MESSAGE */}

                          <div>
                            <div
                              style={{
                                padding:
                                  "11px 14px",
                                borderRadius:
                                  isBot
                                    ? "4px 13px 13px 13px"
                                    : "13px 4px 13px 13px",
                                background:
                                  isBot
                                    ? "#122139"
                                    : "#4F46E5",
                                border:
                                  isBot
                                    ? "1px solid #263C5E"
                                    : "1px solid #6366F1",
                                color: "#E7EEF9",
                                fontSize:
                                  "13px",
                                lineHeight:
                                  "1.6",
                                whiteSpace:
                                  "pre-wrap",
                              }}
                            >
                              {message.text}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "9px",
                                color:
                                  "#637A9E",
                                marginTop:
                                  "4px",
                                textAlign:
                                  isBot
                                    ? "left"
                                    : "right",
                              }}
                            >
                              {formatTime(
                                message.time
                              )}
                            </div>

                            {/* ACTION BUTTON */}

                            {message.action && (
                              <button
                                type="button"
                                onClick={() =>
                                  window.location.href =
                                    message.action
                                      .path
                                }
                                style={{
                                  marginTop:
                                    "8px",
                                  border:
                                    "1px solid #4058F5",
                                  background:
                                    "rgba(79,70,229,.12)",
                                  color:
                                    "#9BA7FF",
                                  borderRadius:
                                    "7px",
                                  padding:
                                    "7px 10px",
                                  fontSize:
                                    "11px",
                                  cursor:
                                    "pointer",
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  gap: "6px",
                                }}
                              >
                                {
                                  message
                                    .action
                                    .label
                                }

                                <ArrowRight
                                  size={13}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}

                {/* ============================================
                    TYPING
                ============================================= */}

                {isTyping && (
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "9px",
                      marginBottom:
                        "15px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius:
                          "9px",
                        background:
                          "linear-gradient(135deg,#7C3AED,#4F46E5)",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      <Bot
                        size={16}
                        color="white"
                      />
                    </div>

                    <div
                      style={{
                        background:
                          "#122139",
                        border:
                          "1px solid #263C5E",
                        padding:
                          "10px 14px",
                        borderRadius:
                          "4px 13px 13px 13px",
                        display:
                          "flex",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          background:
                            "#7187AA",
                          borderRadius:
                            "50%",
                        }}
                      />

                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          background:
                            "#7187AA",
                          borderRadius:
                            "50%",
                        }}
                      />

                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          background:
                            "#7187AA",
                          borderRadius:
                            "50%",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ==============================================
                  QUICK QUESTIONS
              =============================================== */}

              <div
                style={{
                  borderTop:
                    "1px solid #1F3453",
                  padding:
                    "12px 16px",
                  background:
                    "#0D1A2D",
                }}
              >
                <div
                  style={{
                    color:
                      "#7187AA",
                    fontSize:
                      "10px",
                    marginBottom:
                      "8px",
                  }}
                >
                  QUICK QUESTIONS
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: "6px",
                    overflowX:
                      "auto",
                    paddingBottom:
                      "2px",
                  }}
                >
                  {quickQuestions.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <button
                          key={
                            item.label
                          }
                          type="button"
                          onClick={() =>
                            askQuickQuestion(
                              item.question
                            )
                          }
                          style={{
                            flex:
                              "0 0 auto",
                            border:
                              "1px solid #263C5E",
                            background:
                              "#101F35",
                            color:
                              "#9AAED0",
                            borderRadius:
                              "7px",
                            padding:
                              "7px 9px",
                            fontSize:
                              "10px",
                            cursor:
                              "pointer",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "5px",
                          }}
                        >
                          <Icon
                            size={
                              12
                            }
                          />

                          {
                            item.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* ==============================================
                  INPUT
              =============================================== */}

              <div
                style={{
                  borderTop:
                    "1px solid #1F3453",
                  padding:
                    "12px 16px 16px",
                  background:
                    "#0B1729",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "flex-end",
                    gap: "8px",
                    background:
                      "#101F35",
                    border:
                      "1px solid #294261",
                    borderRadius:
                      "10px",
                    padding:
                      "7px",
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) =>
                      setInput(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                    placeholder="Describe your dashboard problem..."
                    rows={1}
                    disabled={
                      isTyping
                    }
                    style={{
                      flex: 1,
                      resize:
                        "none",
                      background:
                        "transparent",
                      border:
                        "none",
                      outline:
                        "none",
                      color:
                        "white",
                      fontSize:
                        "13px",
                      lineHeight:
                        "1.5",
                      padding:
                        "7px 8px",
                      minHeight:
                        "30px",
                      maxHeight:
                        "90px",
                      fontFamily:
                        "inherit",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage()
                    }
                    disabled={
                      !input.trim() ||
                      isTyping
                    }
                    style={{
                      width: "38px",
                      height:
                        "38px",
                      minWidth:
                        "38px",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      background:
                        input.trim() &&
                        !isTyping
                          ? "#5B5BF7"
                          : "#26344B",
                      color:
                        "white",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      cursor:
                        input.trim() &&
                        !isTyping
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <Send
                      size={16}
                    />
                  </button>
                </div>

                <div
                  style={{
                    textAlign:
                      "center",
                    color:
                      "#526A8D",
                    fontSize:
                      "9px",
                    marginTop:
                      "7px",
                  }}
                >
                  AI Dashboard Support •
                  Press Enter to send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}