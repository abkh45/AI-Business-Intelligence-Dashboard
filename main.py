from pathlib import Path

import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="AI BI Dashboard API"
)



# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# DATA DIRECTORY
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"


# =========================================================
# DATASET VALIDATION
# =========================================================

ALLOWED_DATASETS = {
    "superstore_2022.csv",
    "superstore_2023.csv",
    "superstore_2024.csv",
    "superstore_2025.csv",
}


# =========================================================
# LOAD CSV
# =========================================================

def load_dataset(
    dataset: str,
):

    if dataset not in ALLOWED_DATASETS:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid dataset: {dataset}"
            ),
        )


    csv_path =
        DATA_DIR / dataset


    if not csv_path.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                f"CSV file not found: "
                f"{csv_path}"
            ),
        )


    try:

        df = pd.read_csv(
            csv_path
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Could not read CSV: "
                f"{error}"
            ),
        )


    if df.empty:

        raise HTTPException(
            status_code=404,
            detail=(
                f"CSV is empty: {dataset}"
            ),
        )


    return df


# =========================================================
# NORMALIZE COLUMNS
# =========================================================

def normalize_columns(
    df: pd.DataFrame,
):

    df = df.copy()


    # -----------------------------------------------
    # Strip whitespace from column names
    # -----------------------------------------------

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]


    # -----------------------------------------------
    # Date
    # -----------------------------------------------

    if "Order Date" in df.columns:

        df["Order Date"] = pd.to_datetime(
            df["Order Date"],
            errors="coerce",
        )

    elif "OrderDate" in df.columns:

        df["Order Date"] = pd.to_datetime(
            df["OrderDate"],
            errors="coerce",
        )


    # -----------------------------------------------
    # Sales
    # -----------------------------------------------

    if "Sales" in df.columns:

        df["Sales"] = pd.to_numeric(
            df["Sales"],
            errors="coerce",
        ).fillna(0)


    # -----------------------------------------------
    # Profit
    # -----------------------------------------------

    if "Profit" in df.columns:

        df["Profit"] = pd.to_numeric(
            df["Profit"],
            errors="coerce",
        ).fillna(0)


    return df


# =========================================================
# DASHBOARD
# =========================================================

@app.get("/api/dashboard")
def dashboard(
    dataset: str = "superstore_2024.csv",
):

    print(
        "Dashboard dataset:",
        dataset,
    )


    df = load_dataset(
        dataset
    )


    df = normalize_columns(
        df
    )


    # =====================================================
    # TOTAL SALES
    # =====================================================

    total_sales = float(
        df["Sales"].sum()
    )


    # =====================================================
    # TOTAL PROFIT
    # =====================================================

    total_profit = float(
        df["Profit"].sum()
    )


    # =====================================================
    # TOTAL ORDERS
    # =====================================================

    if "Order ID" in df.columns:

        total_orders = int(
            df["Order ID"]
            .nunique()
        )

    else:

        total_orders = int(
            len(df)
        )


    # =====================================================
    # TOTAL CUSTOMERS
    # =====================================================

    if "Customer ID" in df.columns:

        total_customers = int(
            df["Customer ID"]
            .nunique()
        )

    else:

        total_customers = 0


    # =====================================================
    # AVERAGE ORDER VALUE
    # =====================================================

    if total_orders > 0:

        avg_order_value = (
            total_sales /
            total_orders
        )

    else:

        avg_order_value = 0


    # =====================================================
    # DATES
    # =====================================================

    earliest_date = None

    latest_date = None


    if "Order Date" in df.columns:

        valid_dates = (
            df["Order Date"]
            .dropna()
        )


        if len(valid_dates) > 0:

            earliest_date = (
                valid_dates
                .min()
                .strftime("%Y-%m-%d")
            )

            latest_date = (
                valid_dates
                .max()
                .strftime("%Y-%m-%d")
            )


    # =====================================================
    # RETURN
    # =====================================================

    return {

        "dataset": dataset,

        "total_sales":
            total_sales,

        "total_profit":
            total_profit,

        "total_orders":
            total_orders,

        "total_customers":
            total_customers,

        "avg_order_value":
            avg_order_value,

        "average_order_value":
            avg_order_value,

        "sales_growth":
            0,

        "profit_growth":
            0,

        "orders_growth":
            0,

        "customers_growth":
            0,

        "average_order_growth":
            0,

        "earliest_date":
            earliest_date,

        "latest_date":
            latest_date,

    }


# =========================================================
# SALES TREND
# =========================================================

@app.get("/api/sales-trend")
def sales_trend(
    dataset: str = "superstore_2024.csv",
):

    print(
        "Sales Trend dataset:",
        dataset,
    )


    df = load_dataset(
        dataset
    )


    df = normalize_columns(
        df
    )


    if "Order Date" not in df.columns:

        raise HTTPException(
            status_code=400,
            detail=(
                "CSV does not contain "
                "'Order Date' column"
            ),
        )


    if "Sales" not in df.columns:

        raise HTTPException(
            status_code=400,
            detail=(
                "CSV does not contain "
                "'Sales' column"
            ),
        )


    # =====================================================
    # REMOVE INVALID DATES
    # =====================================================

    df = df.dropna(
        subset=["Order Date"]
    )


    # =====================================================
    # GROUP BY DAY
    # =====================================================

    daily_sales = (

        df
        .groupby(
            df["Order Date"].dt.date
        )["Sales"]
        .sum()
        .reset_index()

    )


    daily_sales.columns = [
        "date",
        "sales",
    ]


    # =====================================================
    # BUILD CHART DATA
    # =====================================================

    result = []


    for _, row in daily_sales.iterrows():

        date_value = row["date"]


        result.append({

            "label":
                pd.Timestamp(
                    date_value
                ).strftime(
                    "%b %d"
                ),

            "sales":
                float(
                    row["sales"]
                ),

            "date":
                str(
                    date_value
                ),

        })


    return {

        "dataset":
            dataset,

        "data":
            result,

    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
    }