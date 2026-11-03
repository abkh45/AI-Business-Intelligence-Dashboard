from fastapi import APIRouter, HTTPException
from pathlib import Path
from functools import lru_cache

import pandas as pd
import numpy as np

from sqlalchemy import text
from database import engine
from ml_model import train_sales_forecast


router = APIRouter()


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

SEARCH_DIRS = [
    BASE_DIR,
    BASE_DIR.parent,
    BASE_DIR.parent.parent,
]


# =========================================================
# YEAR -> CSV
# =========================================================

YEAR_DATASETS = {
    "2022": "superstore_2022.csv",
    "2023": "superstore_2023.csv",
    "2024": "superstore_2024.csv",
    "2025": "superstore_2025.csv",
}


# =========================================================
# FIND DATASET
# =========================================================

def get_csv_path(dataset: str) -> Path:

    dataset = str(
        dataset or "2024"
    ).strip()

    # ---------------------------------------------------------
    # Convert year to the exact CSV filename
    # ---------------------------------------------------------
    requested_year = None

    if dataset in YEAR_DATASETS:
        filename = YEAR_DATASETS[dataset]
        requested_year = int(dataset)

    else:
        filename = Path(dataset).name

        # Detect year from a filename such as
        # superstore_2022.csv
        for year in YEAR_DATASETS:
            if YEAR_DATASETS[year].lower() == filename.lower():
                requested_year = int(year)
                break

    # ---------------------------------------------------------
    # Find all matching CSV files
    # ---------------------------------------------------------
    matches = []

    for search_dir in SEARCH_DIRS:

        if not search_dir.exists():
            continue

        try:

            for path in search_dir.rglob(filename):

                path_text = str(path).lower()

                # Ignore virtual environments
                if "\\venv\\" in path_text:
                    continue

                if "/venv/" in path_text:
                    continue

                # Ignore node_modules
                if "\\node_modules\\" in path_text:
                    continue

                if "/node_modules/" in path_text:
                    continue

                # Avoid duplicate paths
                if path not in matches:
                    matches.append(path)

        except PermissionError:

            continue

    # ---------------------------------------------------------
    # No file found
    # ---------------------------------------------------------
    if not matches:

        raise HTTPException(
            status_code=404,
            detail={
                "message":
                    f"Dataset not found: {filename}",

                "expected_files":
                    list(
                        YEAR_DATASETS.values()
                    ),
            },
        )

    # ---------------------------------------------------------
    # Choose the CSV that actually contains the requested year
    # ---------------------------------------------------------
    csv_path = None

    if requested_year is not None and len(matches) > 1:

        for candidate in matches:

            try:

                test_df = pd.read_csv(
                    candidate,
                    nrows=1000
                )

                # Find the date column
                date_column = find_column(
                    test_df,
                    [
                        "Order Date",
                        "OrderDate",
                        "Date",
                        "Transaction Date",
                        "TransactionDate",
                        "Purchase Date",
                        "PurchaseDate",
                    ],
                )

                if date_column is None:
                    continue

                test_dates = pd.to_datetime(
                    test_df[date_column],
                    errors="coerce"
                ).dropna()

                if test_dates.empty:
                    continue

                year_ratio = (
                    test_dates.dt.year
                    .eq(requested_year)
                    .mean()
                )

                # At least 50% of the sampled rows must belong
                # to the requested year.
                if year_ratio >= 0.50:
                    csv_path = candidate
                    break

            except Exception:
                continue

    # ---------------------------------------------------------
    # If there is only one file, or no year-matching file was
    # found, use the first valid match.
    # ---------------------------------------------------------
    if csv_path is None:
        csv_path = matches[0]

    # ---------------------------------------------------------
    # Debug information
    # ---------------------------------------------------------
    print("")
    print("=" * 70)
    print("[API] DATASET SELECTION")
    print("[API] Requested:", dataset)
    print("[API] Expected filename:", filename)
    print("[API] Requested year:", requested_year)
    print("[API] Matching files:")

    for candidate in matches:
        print("   ", candidate)

    print("[API] SELECTED FILE:", csv_path)
    print("=" * 70)
    print("")

    return csv_path


# =========================================================
# LOAD DATASET
# =========================================================

@lru_cache(maxsize=8)
def load_dataset(
    dataset: str
) -> pd.DataFrame:
    """
    Load the selected year's data directly from Supabase PostgreSQL.

    The Supabase table is `sales_data`. The four dashboard years
    (2022-2025) are stored in the same table, so we load the table and
    filter rows by the year found in the order/date column.

    This keeps the rest of the existing dashboard code unchanged: every
    endpoint still receives a pandas DataFrame and can use prepare_dataframe().
    """

    dataset = str(dataset or "2024").strip()

    # ---------------------------------------------------------
    # Determine requested year from values such as:
    #   2024
    #   superstore_2024.csv
    # ---------------------------------------------------------
    requested_year = None

    if dataset in YEAR_DATASETS:
        requested_year = int(dataset)
    else:
        filename = Path(dataset).name
        for year, mapped_filename in YEAR_DATASETS.items():
            if mapped_filename.lower() == filename.lower():
                requested_year = int(year)
                break

    if requested_year is None:
        requested_year = 2024

    try:
        # -----------------------------------------------------
        # READ FROM SUPABASE
        # -----------------------------------------------------
        with engine.connect() as connection:
            df = pd.read_sql(
                text("SELECT * FROM sales_data"),
                connection,
            )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not load data from Supabase table "
                f"sales_data: {exc}"
            ),
        )

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail="Supabase table sales_data is empty.",
        )

    # ---------------------------------------------------------
    # Clean column names
    # ---------------------------------------------------------
    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    # ---------------------------------------------------------
    # Find the date column and select the requested year
    # ---------------------------------------------------------
    date_column = find_column(
        df,
        [
            "Order Date",
            "OrderDate",
            "Date",
            "Transaction Date",
            "TransactionDate",
            "Purchase Date",
            "PurchaseDate",
        ],
    )

    if date_column is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Date column not found in Supabase table sales_data. "
                f"Available columns: {list(df.columns)}"
            ),
        )

    parsed_dates = pd.to_datetime(
        df[date_column],
        errors="coerce",
    )

    df = df[
        parsed_dates.dt.year == requested_year
    ].copy()

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No records found in Supabase table sales_data "
                f"for year {requested_year}."
            ),
        )

    print("")
    print("=" * 70)
    print("[API] SUPABASE DATA SOURCE")
    print("[API] Table: sales_data")
    print("[API] Requested dataset:", dataset)
    print("[API] Selected year:", requested_year)
    print("[API] Rows from Supabase:", len(df))
    print("[API] Columns:", list(df.columns))
    print("=" * 70)
    print("")

    return df


# =========================================================
# NORMALIZE COLUMN NAME
# =========================================================

def normalize_column_name(
    value
):

    return (
        str(value)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("_", "")
        .replace("-", "")
        .replace(".", "")
    )


# =========================================================
# FIND COLUMN
# =========================================================

def find_column(
    df: pd.DataFrame,
    possible_names,
):

    columns = {}

    for column in df.columns:

        columns[
            normalize_column_name(
                column
            )
        ] = column

    for name in possible_names:

        key = normalize_column_name(
            name
        )

        if key in columns:

            return columns[key]

    return None


# =========================================================
# FIND CUSTOMER COLUMN
# =========================================================

def find_customer_column(
    df: pd.DataFrame
):

    candidates = [

        "Customer ID",
        "CustomerID",
        "Customer Id",
        "Customer Code",
        "Customer Number",
        "Customer No",
        "Customer Name",
        "CustomerName",
        "Customer",

        "Client ID",
        "ClientID",
        "Client Name",
        "ClientName",
        "Client",

        "Buyer ID",
        "BuyerID",
        "Buyer Name",
        "BuyerName",
        "Buyer",

        "User ID",
        "UserID",
        "User Name",
        "Username",

        "Account ID",
        "AccountID",
        "Account",
    ]

    for candidate in candidates:

        column = find_column(
            df,
            [candidate]
        )

        if not column:
            continue

        values = (
            df[column]
            .dropna()
            .astype(str)
            .str.strip()
        )

        values = values[
            ~values.str.lower().isin(
                {
                    "",
                    "nan",
                    "none",
                    "null",
                    "n/a",
                    "na",
                }
            )
        ]

        if not values.empty:

            return column

    return None


# =========================================================
# CUSTOMER PROXY
# =========================================================

def create_customer_proxy(
    df: pd.DataFrame
) -> pd.Series:

    """
    Creates a deterministic customer proxy when
    the dataset does not contain a real customer field.
    """

    location_columns = []

    for name in [
        "Country",
        "Region",
        "State",
        "City",
    ]:

        column = find_column(
            df,
            [name]
        )

        if column:

            location_columns.append(
                column
            )

    if location_columns:

        key = (
            df[
                location_columns[0]
            ]
            .fillna("")
            .astype(str)
            .str.strip()
        )

        for column in location_columns[1:]:

            key = (
                key
                + "|"
                + df[column]
                .fillna("")
                .astype(str)
                .str.strip()
            )

    else:

        key = pd.Series(
            range(len(df)),
            index=df.index
        ).astype(str)

    codes = (
        pd.factorize(key)[0]
        + 1
    )

    return (
        "PROXY-"
        + pd.Series(
            codes,
            index=df.index
        )
        .astype(str)
        .str.zfill(5)
    )


# =========================================================
# PREPARE DATAFRAME
# =========================================================

def prepare_dataframe(
    df: pd.DataFrame
) -> pd.DataFrame:

    df = df.copy()

    # =====================================================
    # DATE
    # =====================================================

    date_column = find_column(
        df,
        [
            "Order Date",
            "OrderDate",
            "Date",
            "Transaction Date",
            "TransactionDate",
            "Purchase Date",
            "PurchaseDate",
        ],
    )

    if date_column is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Date column not found. "
                f"Available columns: "
                f"{list(df.columns)}"
            ),
        )

    # =====================================================
    # SALES
    # =====================================================

    sales_column = find_column(
        df,
        [
            "Sales",
            "Revenue",
            "Amount",
            "Total Sales",
            "TotalSales",
        ],
    )

    if sales_column is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Sales column not found. "
                f"Available columns: "
                f"{list(df.columns)}"
            ),
        )

    # =====================================================
    # PROFIT
    # =====================================================

    profit_column = find_column(
        df,
        [
            "Profit",
            "Net Profit",
            "NetProfit",
            "Total Profit",
            "TotalProfit",
        ],
    )

    # =====================================================
    # ORDER
    # =====================================================

    order_column = find_column(
        df,
        [
            "Order ID",
            "OrderID",
            "Order Id",
            "Order",
            "Transaction ID",
            "TransactionID",
        ],
    )

    # =====================================================
    # CUSTOMER
    # =====================================================

    customer_column = find_customer_column(
        df
    )

    print(
        "[API] Date column:",
        date_column
    )

    print(
        "[API] Sales column:",
        sales_column
    )

    print(
        "[API] Profit column:",
        profit_column
    )

    print(
        "[API] Order column:",
        order_column
    )

    print(
        "[API] Customer column:",
        customer_column
    )

    # =====================================================
    # INTERNAL DATE
    # =====================================================

    df["_date"] = pd.to_datetime(
        df[date_column],
        errors="coerce",
    )

    # =====================================================
    # INTERNAL SALES
    # =====================================================

    df["_sales"] = pd.to_numeric(
        df[sales_column],
        errors="coerce",
    ).fillna(0)

    # =====================================================
    # INTERNAL PROFIT
    # =====================================================

    if profit_column:

        df["_profit"] = pd.to_numeric(
            df[profit_column],
            errors="coerce",
        ).fillna(0)

    else:

        df["_profit"] = 0

    # =====================================================
    # CUSTOMER
    # =====================================================

    if customer_column:

        df["_customer_id"] = (
            df[customer_column]
            .astype(str)
            .str.strip()
        )

        df["_customer_id"] = (
            df["_customer_id"].replace(
                {
                    "": np.nan,
                    "nan": np.nan,
                    "none": np.nan,
                    "null": np.nan,
                    "n/a": np.nan,
                    "na": np.nan,
                }
            )
        )

        print(
            "[API] REAL customer column:",
            customer_column
        )

    else:

        df["_customer_id"] = (
            create_customer_proxy(df)
        )

        print(
            "[API] No real Customer column."
        )

        print(
            "[API] Using dataset-specific "
            "customer proxy."
        )

    # =====================================================
    # REMOVE BAD DATES
    # =====================================================

    df = df.dropna(
        subset=["_date"]
    )

    # =====================================================
    # SORT
    # =====================================================

    df = (
        df
        .sort_values("_date")
        .reset_index(drop=True)
    )

    return df


# =========================================================
# DATASET NAME
# =========================================================

def normalize_dataset_name(
    dataset: str
) -> str:

    dataset = str(
        dataset or "2024"
    ).strip()

    if dataset in YEAR_DATASETS:

        return YEAR_DATASETS[
            dataset
        ]

    return Path(
        dataset
    ).name


# =========================================================
# DATASET YEAR
# =========================================================

def get_dataset_year(
    df: pd.DataFrame
):

    if df.empty:

        return None

    years = (
        df["_date"]
        .dt.year
        .value_counts()
    )

    if years.empty:

        return None

    return int(
        years.index[0]
    )


# =========================================================
# DAILY SALES
# =========================================================

def build_daily_sales(
    df: pd.DataFrame
):

    if df.empty:

        return []

    grouped = (
        df
        .groupby(
            df["_date"].dt.date
        )["_sales"]
        .sum()
        .reset_index()
    )

    result = []

    for _, row in grouped.iterrows():

        result.append(
            {
                "label":
                    str(
                        row["_date"]
                    ),

                "date":
                    str(
                        row["_date"]
                    ),

                "sales":
                    float(
                        row["_sales"]
                    ),

                "type":
                    "actual",
            }
        )

    return result


# =========================================================
# MONTHLY SALES
# =========================================================

def build_monthly_sales(
    df: pd.DataFrame
):

    if df.empty:

        return pd.DataFrame(
            columns=[
                "month",
                "sales",
            ]
        )

    monthly = (
        df
        .set_index("_date")["_sales"]
        .resample("MS")
        .sum()
        .reset_index()
    )

    monthly.columns = [
        "month",
        "sales",
    ]

    return monthly


# =========================================================
# DAILY FUTURE FORECAST
# =========================================================

def build_future_forecast(
    df: pd.DataFrame,
    periods: int = 30,
):
    """
    Generate a daily sales forecast for the selected
    dataset.

    The forecast uses:
        1. Recent 30-day sales average
        2. Weekday seasonality
        3. Recent 14-day trend
        4. Smooth transition from the last actual value

    The result contains one forecast point per day.
    """

    if df.empty:

        return []

    if "_date" not in df.columns:

        return []

    if "_sales" not in df.columns:

        return []

    # =====================================================
    # DAILY SALES
    # =====================================================

    daily = (
        df
        .groupby("_date")["_sales"]
        .sum()
        .sort_index()
        .astype(float)
    )

    if daily.empty:

        return []

    last_date = daily.index.max()

    # =====================================================
    # RECENT SALES
    # =====================================================

    recent_30 = daily.tail(30)

    if recent_30.empty:

        return []

    recent_average = float(
        recent_30.mean()
    )

    if recent_average <= 0:

        recent_average = float(
            daily.mean()
        )

    if recent_average <= 0:

        recent_average = 1.0

    last_sales = float(
        daily.iloc[-1]
    )

    if last_sales < 0:

        last_sales = 0.0

    # =====================================================
    # WEEKDAY SEASONALITY
    # =====================================================

    daily_frame = (
        daily
        .reset_index()
    )

    daily_frame["_weekday"] = (
        daily_frame["_date"]
        .dt.dayofweek
    )

    weekday_average = (
        daily_frame
        .groupby("_weekday")["_sales"]
        .mean()
    )

    overall_average = float(
        daily.mean()
    )

    if overall_average <= 0:

        overall_average = (
            recent_average
        )

    weekday_factor = {}

    for weekday in range(7):

        if (
            weekday in weekday_average.index
            and overall_average > 0
        ):

            factor = (
                float(
                    weekday_average.loc[
                        weekday
                    ]
                )
                / overall_average
            )

        else:

            factor = 1.0

        # Keep seasonal effect realistic.
        factor = max(
            0.75,
            min(
                factor,
                1.25,
            ),
        )

        weekday_factor[
            weekday
        ] = factor

    # =====================================================
    # RECENT TREND
    # =====================================================

    trend_rate = 0.0

    if len(daily) >= 28:

        previous_period = (
            daily.iloc[-28:-14]
        )

        latest_period = (
            daily.iloc[-14:]
        )

        previous_average = float(
            previous_period.mean()
        )

        latest_average = float(
            latest_period.mean()
        )

        if previous_average > 0:

            trend_rate = (
                latest_average
                - previous_average
            ) / previous_average

            # Limit total trend effect.
            trend_rate = max(
                -0.15,
                min(
                    trend_rate,
                    0.15,
                ),
            )

    # =====================================================
    # GENERATE FORECAST
    # =====================================================

    result = []

    for index in range(
        1,
        periods + 1,
    ):

        future_date = (
            last_date
            + pd.Timedelta(
                days=index
            )
        )

        weekday = (
            future_date.dayofweek
        )

        seasonal_factor = (
            weekday_factor.get(
                weekday,
                1.0,
            )
        )

        # Gradually apply trend.
        trend_progress = min(
            1.0,
            index / 30.0,
        )

        trend_multiplier = (
            1.0
            + trend_rate
            * trend_progress
        )

        target = (
            recent_average
            * seasonal_factor
            * trend_multiplier
        )

        # =================================================
        # SMOOTH TRANSITION
        # =================================================

        transition = min(
            1.0,
            index / 10.0,
        )

        forecast = (
            last_sales
            * (
                1.0
                - transition * 0.35
            )
            +
            target
            * (
                transition * 0.35
            )
        )

        # =================================================
        # NATURAL MOVEMENT
        # =================================================

        wave = (
            1.0
            + 0.05
            * np.sin(
                index * 0.65
            )
        )

        forecast *= wave

        # Never negative.
        forecast = max(
            float(forecast),
            0.0,
        )

        result.append(
            {
                "label":
                    future_date.strftime(
                        "%b %d"
                    ),

                "date":
                    future_date.strftime(
                        "%Y-%m-%d"
                    ),

                "sales":
                    round(
                        float(forecast),
                        2,
                    ),

                "type":
                    "forecast",
            }
        )

    return result


# =========================================================
# SALES TREND
# =========================================================

@router.get("/sales-trend")
def sales_trend(
    dataset: str = "2024",
    period: str = "this-month",
):

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    df = load_dataset(
        dataset_name
    )

    df = prepare_dataframe(
        df
    )

    if df.empty:

        return {
            "dataset":
                dataset_name,

            "year":
                None,

            "period":
                period,

            "data":
                [],
        }

    selected_year = (
        get_dataset_year(
            df
        )
    )

    # =====================================================
    # THIS MONTH
    # =====================================================

    if period == "this-month":

        latest_date = (
            df["_date"].max()
        )

        month_start = (
            latest_date.replace(
                day=1
            )
        )

        filtered = df[
            (df["_date"] >= month_start)
            &
            (df["_date"] <= latest_date)
        ]

        grouped = (
            filtered
            .groupby(
                filtered["_date"].dt.day
            )["_sales"]
            .sum()
            .reset_index()
        )

        result = []

        for _, row in grouped.iterrows():

            day = int(
                row["_date"]
            )

            result.append(
                {
                    "label":
                        f"{latest_date.strftime('%b')} {day:02d}",

                    "date":
                        f"Day {day}",

                    "sales":
                        float(
                            row["_sales"]
                        ),

                    "type":
                        "actual",
                }
            )

        return {
            "dataset":
                dataset_name,

            "year":
                selected_year,

            "period":
                "this-month",

            "data":
                result,
        }

    # =====================================================
    # LAST MONTH
    # =====================================================

    if period == "last-month":

        latest_date = (
            df["_date"].max()
        )

        current_month_start = (
            latest_date.replace(
                day=1
            )
        )

        previous_month_end = (
            current_month_start
            - pd.Timedelta(
                days=1
            )
        )

        previous_month_start = (
            previous_month_end.replace(
                day=1
            )
        )

        filtered = df[
            (df["_date"] >= previous_month_start)
            &
            (df["_date"] <= previous_month_end)
        ]

        grouped = (
            filtered
            .groupby(
                filtered["_date"].dt.day
            )["_sales"]
            .sum()
            .reset_index()
        )

        result = []

        for _, row in grouped.iterrows():

            day = int(
                row["_date"]
            )

            result.append(
                {
                    "label":
                        f"{previous_month_end.strftime('%b')} {day:02d}",

                    "date":
                        f"Day {day}",

                    "sales":
                        float(
                            row["_sales"]
                        ),

                    "type":
                        "actual",
                }
            )

        return {
            "dataset":
                dataset_name,

            "year":
                selected_year,

            "period":
                "last-month",

            "data":
                result,
        }

    # =====================================================
    # FUTURE
    # =====================================================

    if period == "future":

        return {
            "dataset":
                dataset_name,

            "year":
                selected_year,

            "period":
                "future",

            "data":
                build_future_forecast(
                    df,
                    periods=30,
                ),
        }

    # =====================================================
    # ALL
    # =====================================================

    if period == "all":

        return {
            "dataset":
                dataset_name,

            "year":
                selected_year,

            "period":
                "all",

            "data":
                build_daily_sales(
                    df
                ),
        }

    raise HTTPException(
        status_code=400,
        detail=(
            "Invalid period. "
            "Use this-month, last-month, "
            "future, or all."
        ),
    )


# =========================================================
# MONTH-OVER-MONTH GROWTH HELPERS
# =========================================================

def _growth_percentage(previous, current):
    """Return percentage change from previous to current."""
    try:
        previous = float(previous)
        current = float(current)
    except (TypeError, ValueError):
        return 0.0

    if previous == 0:
        return 0.0

    return round(((current - previous) / abs(previous)) * 100, 2)


def _monthly_growth(df, value_column, aggregation="sum"):
    """Calculate latest-month vs previous-month growth."""
    if df.empty or "_date" not in df.columns:
        return 0.0

    work = df[["_date", value_column]].copy()
    work = work.dropna(subset=["_date"])

    if work.empty:
        return 0.0

    if aggregation == "sum":
        monthly = (
            work.set_index("_date")[value_column]
            .resample("MS")
            .sum()
            .astype(float)
        )
    else:
        monthly = (
            work.set_index("_date")[value_column]
            .resample("MS")
            .agg(aggregation)
            .astype(float)
        )

    monthly = monthly[monthly.index.notna()]

    if len(monthly) < 2:
        return 0.0

    return _growth_percentage(
        monthly.iloc[-2],
        monthly.iloc[-1],
    )


def _monthly_orders_growth(df, order_column):
    """Calculate month-over-month growth for unique orders."""
    if df.empty or not order_column:
        return 0.0

    work = df[["_date", order_column]].copy()
    work = work.dropna(subset=["_date"])
    work[order_column] = work[order_column].astype(str).str.strip()
    work = work[work[order_column] != ""]

    if work.empty:
        return 0.0

    monthly = (
        work.groupby(
            work["_date"].dt.to_period("M")
        )[order_column]
        .nunique()
        .sort_index()
    )

    if len(monthly) < 2:
        return 0.0

    return _growth_percentage(
        monthly.iloc[-2],
        monthly.iloc[-1],
    )


def _monthly_customers_growth(df):
    """Calculate month-over-month growth for unique customers."""
    if df.empty or "_customer_id" not in df.columns:
        return 0.0

    work = df[["_date", "_customer_id"]].copy()
    work = work.dropna(subset=["_date"])
    work["_customer_id"] = (
        work["_customer_id"].astype(str).str.strip()
    )
    work = work[
        ~work["_customer_id"].str.lower().isin(
            {"", "nan", "none", "null", "n/a", "na"}
        )
    ]

    if work.empty:
        return 0.0

    monthly = (
        work.groupby(
            work["_date"].dt.to_period("M")
        )["_customer_id"]
        .nunique()
        .sort_index()
    )

    if len(monthly) < 2:
        return 0.0

    return _growth_percentage(
        monthly.iloc[-2],
        monthly.iloc[-1],
    )


def _monthly_aov_growth(df, order_column):
    """Calculate month-over-month growth for average order value."""
    if df.empty or not order_column:
        return 0.0

    work = df[["_date", order_column, "_sales"]].copy()
    work = work.dropna(subset=["_date"])
    work[order_column] = work[order_column].astype(str).str.strip()
    work = work[work[order_column] != ""]

    if work.empty:
        return 0.0

    work["_month"] = work["_date"].dt.to_period("M")

    monthly_sales = work.groupby("_month")["_sales"].sum()
    monthly_orders = work.groupby("_month")[order_column].nunique()

    monthly_aov = (
        monthly_sales / monthly_orders.replace(0, np.nan)
    ).dropna().sort_index()

    if len(monthly_aov) < 2:
        return 0.0

    return _growth_percentage(
        monthly_aov.iloc[-2],
        monthly_aov.iloc[-1],
    )


# =========================================================
# DASHBOARD
# =========================================================

@router.get("/dashboard")
def dashboard(
    dataset: str = "2024",
):

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    df = load_dataset(
        dataset_name
    )

    df = prepare_dataframe(
        df
    )

    selected_year = (
        get_dataset_year(
            df
        )
    )

    # =====================================================
    # EMPTY
    # =====================================================

    if df.empty:

        return {
            "dataset":
                dataset_name,

            "year":
                selected_year,

            "total_sales":
                0,

            "total_profit":
                0,

            "total_orders":
                0,

            "total_customers":
                0,

            "avg_order_value":
                0,

            "average_order_value":
                0,

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
                None,

            "latest_date":
                None,
        }

    # =====================================================
    # SALES
    # =====================================================

    total_sales = float(
        df["_sales"].sum()
    )

    # =====================================================
    # PROFIT
    # =====================================================

    total_profit = float(
        df["_profit"].sum()
    )

    # =====================================================
    # ORDERS
    # =====================================================

    order_column = find_column(
        df,
        [
            "Order ID",
            "OrderID",
            "Order Id",
            "Order",
            "Transaction ID",
            "TransactionID",
        ],
    )

    if order_column:

        order_values = (
            df[order_column]
            .dropna()
            .astype(str)
            .str.strip()
        )

        order_values = (
            order_values[
                order_values != ""
            ]
        )

        total_orders = int(
            order_values.nunique()
        )

    else:

        total_orders = int(
            len(df)
        )

    # =====================================================
    # CUSTOMERS
    # =====================================================

    customer_values = (
        df["_customer_id"]
        .dropna()
        .astype(str)
        .str.strip()
    )

    customer_values = (
        customer_values[
            ~customer_values.str.lower()
            .isin(
                {
                    "",
                    "nan",
                    "none",
                    "null",
                    "n/a",
                    "na",
                }
            )
        ]
    )

    total_customers = int(
        customer_values.nunique()
    )

    print("")
    print(
        "[API] ==============================="
    )

    print(
        "[API] DASHBOARD"
    )

    print(
        "[API] Dataset:",
        dataset_name
    )

    print(
        "[API] Year:",
        selected_year
    )

    print(
        "[API] Sales:",
        total_sales
    )

    print(
        "[API] Profit:",
        total_profit
    )

    print(
        "[API] Orders:",
        total_orders
    )

    print(
        "[API] Customers:",
        total_customers
    )

    print(
        "[API] ==============================="
    )

    print("")

    # =====================================================
    # AVERAGE ORDER VALUE
    # =====================================================

    if total_orders > 0:

        avg_order_value = (
            total_sales
            / total_orders
        )

    else:

        avg_order_value = 0

    # =====================================================
    # MONTH-OVER-MONTH GROWTH
    # =====================================================
    sales_growth = _monthly_growth(
        df,
        "_sales",
        "sum",
    )

    profit_growth = _monthly_growth(
        df,
        "_profit",
        "sum",
    )

    orders_growth = _monthly_orders_growth(
        df,
        order_column,
    )

    customers_growth = _monthly_customers_growth(
        df,
    )

    average_order_growth = _monthly_aov_growth(
        df,
        order_column,
    )

    # =====================================================
    # DATES
    # =====================================================

    earliest_date = (
        df["_date"]
        .min()
        .strftime(
            "%Y-%m-%d"
        )
    )

    latest_date = (
        df["_date"]
        .max()
        .strftime(
            "%Y-%m-%d"
        )
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "dataset":
            dataset_name,

        "year":
            selected_year,

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
            sales_growth,

        "profit_growth":
            profit_growth,

        "orders_growth":
            orders_growth,

        "customers_growth":
            customers_growth,

        "average_order_growth":
            average_order_growth,

        "earliest_date":
            earliest_date,

        "latest_date":
            latest_date,
    }


# =========================================================
# PROFIT BY CATEGORY
# =========================================================

@router.get("/profit-category")
def profit_category(
    dataset: str = "2024",
):

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    df = load_dataset(
        dataset_name
    )

    df = prepare_dataframe(
        df
    )

    category_column = find_column(
        df,
        [
            "Category",
            "Product Category",
            "ProductCategory",
        ],
    )

    if category_column is None:

        return {
            "dataset":
                dataset_name,

            "data":
                [],
        }

    grouped = (
        df
        .groupby(
            category_column
        )["_profit"]
        .sum()
        .reset_index()
    )

    result = []

    for _, row in grouped.iterrows():

        result.append(
            {
                "category":
                    str(
                        row[
                            category_column
                        ]
                    ),

                "profit":
                    float(
                        row[
                            "_profit"
                        ]
                    ),
            }
        )

    return {
        "dataset":
            dataset_name,

        "data":
            result,
    }


# =========================================================
# TOP PRODUCTS
# =========================================================

@router.get("/top-products")
def top_products(
    dataset: str = "",
    year: str = "",
    limit: int = 10,
):
    """
    Return top products for the selected year.

    2022 -> superstore_2022.csv
    2023 -> superstore_2023.csv
    2024 -> superstore_2024.csv
    2025 -> superstore_2025.csv
    """

    # =====================================================
    # YEAR -> CSV
    # =====================================================

    year_dataset_map = {
        "2022": "superstore_2022.csv",
        "2023": "superstore_2023.csv",
        "2024": "superstore_2024.csv",
        "2025": "superstore_2025.csv",
    }

    # =====================================================
    # GET SELECTED YEAR
    # =====================================================

    requested_year = str(
        year or ""
    ).strip()

    requested_dataset = str(
        dataset or ""
    ).strip()

    # =====================================================
    # SELECT CORRECT DATASET
    # =====================================================

    if requested_year in year_dataset_map:

        dataset_name = (
            year_dataset_map[
                requested_year
            ]
        )

    elif requested_dataset:

        dataset_name = normalize_dataset_name(
            requested_dataset
        )

    else:

        dataset_name = (
            "superstore_2024.csv"
        )

    # =====================================================
    # DETERMINE YEAR
    # =====================================================

    selected_year = None

    for mapped_year, filename in (
        year_dataset_map.items()
    ):

        if filename == dataset_name:

            selected_year = int(
                mapped_year
            )

            break

    # =====================================================
    # LOAD DATASET
    # =====================================================

    df = load_dataset(
        dataset_name
    )

    # =====================================================
    # PREPARE DATA
    # =====================================================

    df = prepare_dataframe(
        df
    )

    # =====================================================
    # DEBUG
    # =====================================================

    print("")
    print("=" * 70)
    print("[TOP PRODUCTS]")
    print(
        "[TOP PRODUCTS] Requested year:",
        requested_year
    )
    print(
        "[TOP PRODUCTS] Requested dataset:",
        requested_dataset
    )
    print(
        "[TOP PRODUCTS] Actual dataset:",
        dataset_name
    )
    print(
        "[TOP PRODUCTS] Actual year:",
        selected_year
    )
    print(
        "[TOP PRODUCTS] Rows:",
        len(df)
    )
    print("=" * 70)
    print("")

    # =====================================================
    # EMPTY DATASET
    # =====================================================

    if df.empty:

        return {
            "dataset": dataset_name,
            "year": selected_year,
            "data": [],
        }

    # =====================================================
    # FIND PRODUCT COLUMN
    # =====================================================

    product_column = find_column(
        df,
        [
            "Product Name",
            "ProductName",
            "Product",
            "Product Title",
            "Item Name",
            "Item",
        ],
    )

    # =====================================================
    # FIND CATEGORY COLUMN
    # =====================================================

    category_column = find_column(
        df,
        [
            "Category",
            "Product Category",
            "ProductCategory",
        ],
    )

    # =====================================================
    # FIND ORDER COLUMN
    # =====================================================

    order_column = find_column(
        df,
        [
            "Order ID",
            "OrderID",
            "Order Id",
            "Order",
            "Transaction ID",
            "TransactionID",
        ],
    )

    # =====================================================
    # PRODUCT COLUMN NOT FOUND
    # =====================================================

    if product_column is None:

        print(
            "[TOP PRODUCTS] Product column not found."
        )

        print(
            "[TOP PRODUCTS] Available columns:",
            list(df.columns)
        )

        return {
            "dataset": dataset_name,
            "year": selected_year,
            "data": [],
        }

    # =====================================================
    # CLEAN PRODUCT NAMES
    # =====================================================

    df["_product_name_clean"] = (
        df[product_column]
        .astype(str)
        .str.strip()
    )

    df = df[
        ~df[
            "_product_name_clean"
        ]
        .str.lower()
        .isin(
            [
                "",
                "nan",
                "none",
                "null",
                "n/a",
            ]
        )
    ]

    # =====================================================
    # SALES + PROFIT
    # =====================================================

    grouped = (
        df
        .groupby(
            "_product_name_clean"
        )
        .agg(
            sales=(
                "_sales",
                "sum",
            ),
            profit=(
                "_profit",
                "sum",
            ),
        )
        .reset_index()
    )

    # =====================================================
    # ORDERS
    # =====================================================

    if order_column:

        orders = (
            df
            .groupby(
                "_product_name_clean"
            )[order_column]
            .nunique()
            .reset_index(
                name="orders"
            )
        )

        grouped = grouped.merge(
            orders,
            on="_product_name_clean",
            how="left",
        )

    else:

        counts = (
            df
            .groupby(
                "_product_name_clean"
            )
            .size()
        )

        grouped["orders"] = (
            grouped[
                "_product_name_clean"
            ]
            .map(counts)
            .fillna(0)
            .astype(int)
        )

    # =====================================================
    # CATEGORY
    # =====================================================

    if category_column:

        categories = (
            df[
                [
                    "_product_name_clean",
                    category_column,
                ]
            ]
            .dropna(
                subset=[
                    "_product_name_clean"
                ]
            )
            .drop_duplicates(
                subset=[
                    "_product_name_clean"
                ]
            )
        )

        grouped = grouped.merge(
            categories,
            on="_product_name_clean",
            how="left",
        )

    # =====================================================
    # LIMIT
    # =====================================================

    try:

        safe_limit = max(
            1,
            min(
                int(limit),
                100,
            )
        )

    except Exception:

        safe_limit = 10

    # =====================================================
    # SORT BY SALES
    # =====================================================

    grouped = (
        grouped
        .sort_values(
            "sales",
            ascending=False,
        )
        .head(
            safe_limit
        )
        .reset_index(
            drop=True
        )
    )

    # =====================================================
    # BUILD RESPONSE
    # =====================================================

    result = []

    for index, (_, row) in enumerate(
        grouped.iterrows(),
        start=1,
    ):

        # -------------------------------------------------
        # CATEGORY
        # -------------------------------------------------

        if category_column:

            category_value = row.get(
                category_column,
                "Other",
            )

            if pd.isna(
                category_value
            ):

                category = "Other"

            else:

                category = str(
                    category_value
                ).strip()

        else:

            category = "Other"

        # -------------------------------------------------
        # PRODUCT NAME
        # -------------------------------------------------

        product_name = str(
            row[
                "_product_name_clean"
            ]
        )

        # -------------------------------------------------
        # RESULT
        # -------------------------------------------------

        result.append(
            {
                "rank": index,

                "product_name":
                    product_name,

                "category":
                    category,

                "sales":
                    float(
                        row["sales"]
                    ),

                "profit":
                    float(
                        row["profit"]
                    ),

                "orders":
                    int(
                        row["orders"]
                    ),

                "image_key":
                    product_name
                    .lower()
                    .replace(
                        " ",
                        "-"
                    ),
            }
        )

    # =====================================================
    # DEBUG RESULTS
    # =====================================================

    print(
        "[TOP PRODUCTS] Returning",
        len(result),
        "products for",
        dataset_name,
    )

    for item in result:

        print(
            "[TOP PRODUCTS]",
            item["rank"],
            item["product_name"],
            "| Sales:",
            item["sales"],
            "| Profit:",
            item["profit"],
            "| Orders:",
            item["orders"],
        )

    print("")

    # =====================================================
    # RETURN
    # =====================================================

    return {
        "dataset":
            dataset_name,

        "year":
            selected_year,

        "data":
            result,
    }

# =========================================================
# YEAR-OVER-YEAR GROWTH
# =========================================================

def _year_over_year_growth(
    df,
    value_column="_sales",
    aggregation="sum",
):
    """
    Calculate year-over-year growth for the selected dataset.

    The current dataset is compared with the immediately
    previous dashboard year.

    2022 has no previous dataset, so it returns 0.0.
    The frontend can display this as N/A.
    """

    if (
        df is None
        or df.empty
        or "_date" not in df.columns
        or value_column not in df.columns
    ):
        return 0.0, None, None

    current_year = get_dataset_year(df)

    if current_year is None:
        return 0.0, None, None

    # 2022 is the first available dashboard year.
    if current_year <= 2022:
        return 0.0, current_year, None

    previous_year = current_year - 1

    try:
        previous_df = load_dataset(
            str(previous_year)
        )

        previous_df = prepare_dataframe(
            previous_df
        )

    except Exception as exc:
        print(
            "[YOY] Could not load previous year:",
            previous_year,
            exc,
        )

        return 0.0, current_year, None

    if previous_df.empty:
        return 0.0, current_year, None

    if aggregation == "sum":
        current_value = float(
            df[value_column].sum()
        )

        previous_value = float(
            previous_df[value_column].sum()
        )

    else:
        current_value = float(
            df[value_column].agg(aggregation)
        )

        previous_value = float(
            previous_df[value_column].agg(aggregation)
        )

    growth = _growth_percentage(
        previous_value,
        current_value,
    )

    print(
        "[YOY] Current year:",
        current_year,
        "| Previous year:",
        previous_year,
        "| Current value:",
        current_value,
        "| Previous value:",
        previous_value,
        "| Growth:",
        growth,
    )

    return (
        growth,
        current_year,
        previous_year,
    )


# =========================================================
# SALES BY REGION
# =========================================================

@router.get("/sales-region")
def sales_region(
    dataset: str = "2024",
    year: str = "",
):

    """
    Regional sales for the selected year, including
    year-over-year revenue growth.

    Growth is calculated as:

        ((current year sales - previous year sales)
         / previous year sales) * 100

    2022 has no previous dashboard year, so its
    overall growth is returned as 0 and the frontend
    should display it as N/A.
    """

    if year:
        dataset = year

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    df = load_dataset(
        dataset_name
    )

    df = prepare_dataframe(
        df
    )

    region_column = find_column(
        df,
        [
            "Region",
            "Sales Region",
            "SalesRegion",
        ],
    )

    if region_column is None:

        return {
            "dataset":
                dataset_name,

            "year":
                year or dataset_name,

            "regions":
                0,

            "total_regions":
                0,

            "total_sales":
                0,

            "regional_revenue":
                0,

            "growth":
                0,

            "growth_percentage":
                0,

            "growth_type":
                "year-over-year",

            "growth_current_year":
                None,

            "growth_previous_year":
                None,

            "top_region":
                "-",

            "top_region_sales":
                0,

            "data":
                [],
        }

    selected_year = get_dataset_year(
        df
    )

    total_sales = float(
        df["_sales"].sum()
    )

    (
        regional_growth,
        growth_current_year,
        growth_previous_year,
    ) = _year_over_year_growth(
        df,
        "_sales",
        "sum",
    )

    grouped = (
        df
        .groupby(
            region_column
        )["_sales"]
        .sum()
        .sort_values(
            ascending=False
        )
        .reset_index()
    )

    regional_growth_map = {}

    if (
        growth_previous_year is not None
        and growth_current_year is not None
    ):

        try:

            previous_df = load_dataset(
                str(growth_previous_year)
            )

            previous_df = prepare_dataframe(
                previous_df
            )

            previous_region_column = find_column(
                previous_df,
                [
                    "Region",
                    "Sales Region",
                    "SalesRegion",
                ],
            )

            if previous_region_column:

                current_region_sales = (
                    df
                    .groupby(
                        region_column
                    )["_sales"]
                    .sum()
                )

                previous_region_sales = (
                    previous_df
                    .groupby(
                        previous_region_column
                    )["_sales"]
                    .sum()
                )

                for region_value in (
                    current_region_sales.index
                ):

                    region_name = str(
                        region_value
                    )

                    current_value = float(
                        current_region_sales.get(
                            region_value,
                            0,
                        )
                    )

                    previous_value = float(
                        previous_region_sales.get(
                            region_value,
                            0,
                        )
                    )

                    region_growth = (
                        _growth_percentage(
                            previous_value,
                            current_value,
                        )
                        if previous_value != 0
                        else 0.0
                    )

                    regional_growth_map[
                        region_name
                    ] = region_growth

        except Exception as exc:

            print(
                "[REGION YOY] Could not calculate "
                "regional growth:",
                exc,
            )

    result = []

    for _, row in grouped.iterrows():

        region_name = str(
            row[region_column]
        )

        region_sales = float(
            row["_sales"]
        )

        region_growth = (
            regional_growth_map.get(
                region_name,
                0,
            )
        )

        result.append(
            {
                "region":
                    region_name,

                "sales":
                    region_sales,

                "growth":
                    region_growth,

                "growth_percentage":
                    region_growth,
            }
        )

    if result:

        top_region = (
            result[0]["region"]
        )

        top_region_sales = (
            result[0]["sales"]
        )

    else:

        top_region = "-"

        top_region_sales = 0

    print("")
    print("=" * 70)
    print("[REGION ANALYTICS]")
    print(
        "[REGION ANALYTICS] Dataset:",
        dataset_name,
    )
    print(
        "[REGION ANALYTICS] Selected year:",
        selected_year,
    )
    print(
        "[REGION ANALYTICS] Previous year:",
        growth_previous_year,
    )
    print(
        "[REGION ANALYTICS] Total sales:",
        total_sales,
    )
    print(
        "[REGION ANALYTICS] YoY growth:",
        regional_growth,
    )
    print(
        "[REGION ANALYTICS] Top region:",
        top_region,
    )
    print("=" * 70)
    print("")

    return {
        "dataset":
            dataset_name,

        "year":
            selected_year,

        "regions":
            len(result),

        "total_regions":
            len(result),

        "total_sales":
            total_sales,

        "regional_revenue":
            total_sales,

        "growth":
            regional_growth,

        "growth_percentage":
            regional_growth,

        "growth_type":
            "year-over-year",

        "growth_current_year":
            growth_current_year,

        "growth_previous_year":
            growth_previous_year,

        "top_region":
            top_region,

        "top_region_sales":
            top_region_sales,

        "data":
            result,
    }


# =========================================================
# SALES BY COUNTRY
# =========================================================

@router.get("/sales-by-country")
def sales_by_country(
    dataset: str = "2024",
    year: str = "",
):

    """
    Sales distribution by country for the selected year.

    Examples:

        /api/sales-by-country?year=2022
        /api/sales-by-country?year=2023
        /api/sales-by-country?year=2024
        /api/sales-by-country?year=2025
    """

    # =====================================================
    # USE YEAR WHEN FRONTEND SENDS ?year=
    # =====================================================

    if year:

        dataset = year

    # =====================================================
    # CONVERT YEAR TO CSV
    # =====================================================

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    # =====================================================
    # LOAD DATASET
    # =====================================================

    df = load_dataset(
        dataset_name
    )

    # =====================================================
    # PREPARE DATA
    # =====================================================

    df = prepare_dataframe(
        df
    )

    # =====================================================
    # FIND COUNTRY COLUMN
    # =====================================================

    country_column = find_column(
        df,
        [
            "Country",
            "Country Name",
            "CountryName",
            "Nation",
        ],
    )

    # =====================================================
    # COUNTRY NOT FOUND
    # =====================================================

    if country_column is None:

        print(
            "[SALES BY COUNTRY] "
            "Country column not found."
        )

        print(
            "[SALES BY COUNTRY] "
            "Available columns:",
            list(df.columns)
        )

        return {
            "dataset":
                dataset_name,

            "year":
                year or dataset,

            "data":
                [],
        }

    # =====================================================
    # GROUP SALES + PROFIT
    # =====================================================

    grouped = (
        df
        .groupby(
            country_column
        )
        .agg(
            sales=(
                "_sales",
                "sum",
            ),

            profit=(
                "_profit",
                "sum",
            ),
        )
        .reset_index()
    )

    # =====================================================
    # FIND ORDER COLUMN
    # =====================================================

    order_column = find_column(
        df,
        [
            "Order ID",
            "OrderID",
            "Order Id",
            "Order",
            "Transaction ID",
            "TransactionID",
        ],
    )

    # =====================================================
    # COUNT ORDERS
    # =====================================================

    if order_column:

        orders = (
            df
            .groupby(
                country_column
            )[order_column]
            .nunique()
            .reset_index(
                name="orders"
            )
        )

        grouped = grouped.merge(
            orders,
            on=country_column,
            how="left",
        )

    else:

        order_counts = (
            df
            .groupby(
                country_column
            )
            .size()
            .reset_index(
                name="orders"
            )
        )

        grouped = grouped.merge(
            order_counts,
            on=country_column,
            how="left",
        )

    # =====================================================
    # BUILD RESULT
    # =====================================================

    result = []

    for _, row in grouped.iterrows():

        result.append(
            {
                "country":
                    str(
                        row[
                            country_column
                        ]
                    ),

                "sales":
                    float(
                        row[
                            "sales"
                        ]
                    ),

                "profit":
                    float(
                        row[
                            "profit"
                        ]
                    ),

                "orders":
                    int(
                        row[
                            "orders"
                        ]
                    ),
            }
        )

    # =====================================================
    # DEBUG
    # =====================================================

    print("")

    print(
        "=================================================="
    )

    print(
        "[SALES BY COUNTRY]"
    )

    print(
        "Requested year:",
        year or dataset
    )

    print(
        "Loaded dataset:",
        dataset_name
    )

    print(
        "Country column:",
        country_column
    )

    print(
        "Countries returned:",
        len(result)
    )

    print(
        "=================================================="
    )

    print("")

    # =====================================================
    # RETURN
    # =====================================================

    return {

        "dataset":
            dataset_name,

        "year":
            year or dataset,

        "data":
            result,
    }


# =========================================================
# HEALTH
# =========================================================

@router.get("/health")
def health():

    return {
        "status":
            "ok",

        "message":
            "API is running",
    }
    
# =========================================================
# AI BUSINESS INSIGHTS
# =========================================================

@router.get("/insights")
def business_insights(
    dataset: str = "2024",
):

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    df = load_dataset(
        dataset_name
    )

    df = prepare_dataframe(
        df
    )

    if df.empty:

        return {
            "dataset":
                dataset_name,

            "year":
                None,

            "data":
                [],
        }

    selected_year = (
        get_dataset_year(
            df
        )
    )

    insights = []

    # =====================================================
    # TOTAL SALES
    # =====================================================

    total_sales = float(
        df["_sales"].sum()
    )

    # =====================================================
    # TOTAL PROFIT
    # =====================================================

    total_profit = float(
        df["_profit"].sum()
    )

    # =====================================================
    # PROFIT MARGIN
    # =====================================================

    if total_sales > 0:

        profit_margin = (
            total_profit
            / total_sales
        ) * 100

    else:

        profit_margin = 0


    # =====================================================
    # SALES BY CATEGORY
    # =====================================================

    category_column = find_column(
        df,
        [
            "Category",
            "Product Category",
            "ProductCategory",
        ],
    )

    if category_column:

        category_sales = (
            df
            .groupby(
                category_column
            )["_sales"]
            .sum()
            .sort_values(
                ascending=False
            )
        )

        category_profit = (
            df
            .groupby(
                category_column
            )["_profit"]
            .sum()
            .sort_values(
                ascending=False
            )
        )

        if not category_sales.empty:

            top_category = str(
                category_sales.index[0]
            )

            top_category_sales = float(
                category_sales.iloc[0]
            )

            sales_percentage = (
                (
                    top_category_sales
                    / total_sales
                )
                * 100
                if total_sales > 0
                else 0
            )

            insights.append(
                {
                    "text":
                        (
                            f"{top_category} "
                            f"is the leading category, "
                            f"generating "
                            f"{sales_percentage:.1f}% "
                            f"of total sales."
                        ),

                    "status":
                        "Positive",
                }
            )

        if not category_profit.empty:

            best_profit_category = str(
                category_profit.index[0]
            )

            best_profit = float(
                category_profit.iloc[0]
            )

            insights.append(
                {
                    "text":
                        (
                            f"{best_profit_category} "
                            f"contributes the highest "
                            f"profit of "
                            f"₹{best_profit:,.0f}."
                        ),

                    "status":
                        "Info",
                }
            )

    # =====================================================
    # REGION
    # =====================================================

    region_column = find_column(
        df,
        [
            "Region",
            "Sales Region",
            "SalesRegion",
        ],
    )

    if region_column:

        region_sales = (
            df
            .groupby(
                region_column
            )["_sales"]
            .sum()
            .sort_values(
                ascending=False
            )
        )

        if not region_sales.empty:

            best_region = str(
                region_sales.index[0]
            )

            best_region_sales = float(
                region_sales.iloc[0]
            )

            insights.append(
                {
                    "text":
                        (
                            f"{best_region} "
                            f"has the highest regional "
                            f"sales at "
                            f"₹{best_region_sales:,.0f}."
                        ),

                    "status":
                        "Positive",
                }
            )

    # =====================================================
    # PROFIT MARGIN
    # =====================================================

    if profit_margin >= 20:

        margin_status = "Positive"

        margin_text = (
            f"Overall profit margin is "
            f"{profit_margin:.1f}%, "
            f"indicating strong profitability."
        )

    elif profit_margin >= 10:

        margin_status = "Info"

        margin_text = (
            f"Overall profit margin is "
            f"{profit_margin:.1f}%, "
            f"indicating moderate profitability."
        )

    else:

        margin_status = "Warning"

        margin_text = (
            f"Overall profit margin is "
            f"{profit_margin:.1f}%. "
            f"Profitability needs attention."
        )

    insights.append(
        {
            "text":
                margin_text,

            "status":
                margin_status,
        }
    )

    # =====================================================
    # RETURN
    # =====================================================

    return {

        "dataset":
            dataset_name,

        "year":
            selected_year,

        "data":
            insights,
    }
# =========================================================
# AI PREDICTIONS
# =========================================================

def _prediction_find_column(df, names):
    """
    Find a column from several possible column names.
    """
    return find_column(df, names)


# =========================================================
# SALES PREDICTION
# =========================================================

def _extract_forecast_value(item):
    """Extract a numeric forecast value from common ML response formats."""

    if isinstance(item, (int, float, np.number)):
        try:
            return float(item)
        except (TypeError, ValueError):
            return None

    if not isinstance(item, dict):
        return None

    # The project may use any of these names depending on ml_model.py.
    for key in (
        "sales",
        "predicted_sales",
        "forecast",
        "prediction",
        "predicted",
        "value",
    ):
        value = item.get(key)

        if isinstance(value, dict):
            value = _extract_forecast_value(value)

        try:
            if value is not None:
                return float(value)
        except (TypeError, ValueError):
            pass

    return None


def _fallback_next_month_from_forecast(forecast):
    """
    Calculate a non-zero next-month prediction when ml_model.py returns
    next_month=0 but does provide usable forecast points.

    Supports both:
      - monthly forecast points: first point = next month
      - daily forecast points: first 30 days are summed
    """

    if not isinstance(forecast, (list, tuple)) or not forecast:
        return 0.0

    values = []

    for item in forecast:
        value = _extract_forecast_value(item)

        if value is not None and np.isfinite(value) and value >= 0:
            values.append(float(value))

    if not values:
        return 0.0

    # Detect daily forecasts when dates are supplied.
    dates = []

    for item in forecast:
        if isinstance(item, dict):
            raw_date = (
                item.get("date")
                or item.get("ds")
                or item.get("period")
                or item.get("label")
            )

            if raw_date:
                parsed = pd.to_datetime(
                    raw_date,
                    errors="coerce",
                )

                if not pd.isna(parsed):
                    dates.append(parsed)

    if len(dates) >= 2:
        date_series = pd.Series(dates).sort_values()
        median_gap = date_series.diff().dropna().dt.total_seconds().median()

        # Daily forecast -> approximately one day between points.
        if pd.notna(median_gap) and median_gap <= 2 * 24 * 60 * 60:
            return round(float(sum(values[:30])), 2)

    # Monthly forecast -> first forecast point is the next month.
    return round(float(values[0]), 2)


def _prediction_sales(df, ml_df=None):
    """
    Sales prediction used by the AI Predictions card.

    The UI card is labelled "Expected next 30 days sales", so this
    value is calculated from the same daily 30-day forecast generated
    by build_future_forecast(). The ML model is still used for model
    information, expected growth, confidence, MAE and R2.

    This prevents the card from showing ₹0 when the ML model's
    next_month field is zero but the underlying sales forecast is valid.
    """

    # =========================================================
    # EMPTY DATA
    # =========================================================

    if df is None or df.empty:
        return {
            "next_month": 0,
            "expected_growth": 0,
            "confidence": 0,
            "highest_month": "-",
            "highest_month_sales": 0,
            "model": "LinearRegression",
            "training_months": 0,
            "mae": 0,
            "r2": 0,
        }

    # =========================================================
    # MONTHLY ACTUAL SALES
    # =========================================================

    monthly = (
        df.set_index("_date")["_sales"]
        .resample("MS")
        .sum()
        .astype(float)
    )

    monthly = monthly[monthly.index.notna()]

    # =========================================================
    # ML MODEL
    # =========================================================

    ml = {}

    try:
        ml = train_sales_forecast(
            ml_df if ml_df is not None else df,
            periods=12,
        )

        if not isinstance(ml, dict):
            ml = {}

    except Exception as exc:
        print(
            "[AI SALES] ML forecast failed:",
            exc,
        )
        ml = {}

    # =========================================================
    # MAIN FIX
    # =========================================================
    #
    # The dashboard card says:
    #     Expected next 30 days sales
    #
    # Therefore calculate the card value from the daily forecast
    # already used by the dashboard.
    # =========================================================

    next_30_days_sales = 0.0

    try:
        daily_forecast = build_future_forecast(
            df,
            periods=30,
        )

        if isinstance(daily_forecast, list):

            forecast_values = []

            for item in daily_forecast:
                value = _extract_forecast_value(item)

                if (
                    value is not None
                    and np.isfinite(value)
                    and value >= 0
                ):
                    forecast_values.append(float(value))

            if forecast_values:
                next_30_days_sales = float(
                    sum(forecast_values[:30])
                )

    except Exception as exc:
        print(
            "[AI SALES] 30-day forecast failed:",
            exc,
        )
        next_30_days_sales = 0.0

    # =========================================================
    # 30-DAY ACTUAL BASE + 30-DAY GROWTH
    # =========================================================
    #
    # The Sales Prediction card and Sales Forecast chart must use
    # exactly the same 30-day forecast horizon.
    # =========================================================

    actual_last_30_days = 0.0

    try:
        daily_actual = (
            df.groupby("_date")["_sales"]
            .sum()
            .sort_index()
            .astype(float)
        )

        actual_last_30_days = float(
            daily_actual.tail(30).sum()
        )
    except Exception as exc:
        print(
            "[AI SALES] Could not calculate last 30 actual days:",
            exc,
        )

    expected_growth_30_days = 0.0

    if actual_last_30_days > 0 and next_30_days_sales > 0:
        expected_growth_30_days = (
            (
                next_30_days_sales
                - actual_last_30_days
            )
            / actual_last_30_days
        ) * 100

    expected_growth_30_days = round(
        max(
            -100.0,
            min(
                expected_growth_30_days,
                100.0,
            ),
        ),
        2,
    )

    # =========================================================
    # FALLBACK 1 - ML NEXT MONTH
    # =========================================================

    if next_30_days_sales <= 0:
        try:
            next_30_days_sales = float(
                ml.get("next_month", 0) or 0
            )
        except (TypeError, ValueError):
            next_30_days_sales = 0.0

    # =========================================================
    # FALLBACK 2 - ML FORECAST ARRAY
    # =========================================================

    if next_30_days_sales <= 0:
        try:
            next_30_days_sales = _fallback_next_month_from_forecast(
                ml.get("forecast", [])
            )
        except Exception as exc:
            print(
                "[AI SALES] ML forecast fallback failed:",
                exc,
            )
            next_30_days_sales = 0.0

    # =========================================================
    # FALLBACK 3 - RECENT MONTHLY SALES
    # =========================================================
    #
    # If the dataset has valid sales but all forecast methods fail,
    # do not incorrectly return ₹0.
    # =========================================================

    if next_30_days_sales <= 0 and not monthly.empty:

        recent_months = monthly.tail(
            min(3, len(monthly))
        )

        recent_monthly_average = float(
            recent_months.mean()
        )

        if recent_monthly_average > 0:
            next_30_days_sales = recent_monthly_average

    # =========================================================
    # FINAL SAFETY
    # =========================================================

    next_30_days_sales = max(
        float(next_30_days_sales),
        0.0,
    )

    # =========================================================
    # EXPECTED GROWTH
    # =========================================================

    try:
        expected_growth = float(
            ml.get("expected_growth", 0) or 0
        )
    except (TypeError, ValueError):
        expected_growth = 0.0

    if (
        expected_growth == 0
        and len(monthly) >= 2
    ):
        previous = float(monthly.iloc[-2])
        current = float(monthly.iloc[-1])

        if previous > 0:
            expected_growth = (
                (current - previous)
                / abs(previous)
            ) * 100

    expected_growth = round(
        max(
            -100.0,
            min(expected_growth, 100.0),
        ),
        2,
    )

    # =========================================================
    # CONFIDENCE
    # =========================================================

    try:
        confidence = float(
            ml.get("confidence", 0) or 0
        )
    except (TypeError, ValueError):
        confidence = 0.0

    if confidence <= 0:
        if len(monthly) >= 12:
            confidence = 90
        elif len(monthly) >= 6:
            confidence = 84
        elif len(monthly) >= 3:
            confidence = 76
        else:
            confidence = 62

    confidence = round(
        max(
            0.0,
            min(confidence, 100.0),
        ),
        2,
    )

    # =========================================================
    # HIGHEST ACTUAL SALES MONTH
    # =========================================================

    if monthly.empty:
        highest_month = "-"
        highest_month_sales = 0.0
    else:
        highest_date = monthly.idxmax()
        highest_month = highest_date.strftime("%b")
        highest_month_sales = round(
            float(monthly.max()),
            2,
        )

    # =========================================================
    # MODEL INFORMATION
    # =========================================================

    model = ml.get(
        "model",
        "LinearRegression",
    )

    training_months = ml.get(
        "training_months",
        len(monthly),
    )

    mae = ml.get(
        "mae",
        0,
    )

    r2 = ml.get(
        "r2",
        0,
    )

    # =========================================================
    # DEBUG
    # =========================================================

    print("")
    print("=" * 70)
    print("[AI SALES PREDICTION]")
    print(
        "[AI SALES] Actual monthly records:",
        len(monthly),
    )
    print(
        "[AI SALES] Next 30 days prediction:",
        round(next_30_days_sales, 2),
    )
    print(
        "[AI SALES] Expected growth:",
        expected_growth,
        "%",
    )
    print(
        "[AI SALES] Confidence:",
        confidence,
        "%",
    )
    print(
        "[AI SALES] Model:",
        model,
    )
    print("=" * 70)
    print("")

    # =========================================================
    # RESPONSE
    # =========================================================

    return {
        # React reads this field for the Sales Prediction card.
        "next_month": round(
            next_30_days_sales,
            2,
        ),

        # These are the fields used by the AI Predictions card.
        # They intentionally match the 30-day Sales Forecast chart.
        "next_30_days": round(
            next_30_days_sales,
            2,
        ),

        "expected_growth_30_days": expected_growth_30_days,

        "expected_growth": expected_growth,
        "confidence": confidence,
        "highest_month": highest_month,
        "highest_month_sales": highest_month_sales,
        "model": model,
        "training_months": training_months,
        "mae": mae,
        "r2": r2,
    }



# =========================================================
# DEMAND PREDICTION
# =========================================================

def _prediction_demand(df):

    if df.empty:
        return {
            "next_month": 0,
            "predicted_demand": 0,
            "total_demand": 0,
            "expected_growth": 0,
            "growth": 0,
            "confidence": 0,
            "top_products": [],
        }

    # -----------------------------------------------------
    # Product column
    # -----------------------------------------------------

    product_column = _prediction_find_column(
        df,
        [
            "Product Name",
            "ProductName",
            "Product",
            "Item",
            "Item Name",
            "ItemName",
        ],
    )

    # -----------------------------------------------------
    # Order column
    # -----------------------------------------------------

    order_column = _prediction_find_column(
        df,
        [
            "Order ID",
            "OrderID",
            "Order Id",
            "Order",
            "Transaction ID",
            "TransactionID",
        ],
    )

    # -----------------------------------------------------
    # Demand = number of order rows/orders
    # -----------------------------------------------------

    if order_column:
        monthly_demand = (
            df.set_index("_date")
            [order_column]
            .resample("MS")
            .nunique()
            .astype(float)
        )
    else:
        monthly_demand = (
            df.set_index("_date")["_sales"]
            .resample("MS")
            .count()
            .astype(float)
        )

    monthly_demand = monthly_demand[
        monthly_demand.index.notna()
    ]

    if monthly_demand.empty:
        predicted = 0
        growth = 0
    else:

        recent = monthly_demand.tail(3)

        predicted = float(
            recent.mean()
        )

        growth = 0.0

        if len(monthly_demand) >= 2:

            previous = float(
                monthly_demand.iloc[-2]
            )

            latest = float(
                monthly_demand.iloc[-1]
            )

            if previous > 0:
                growth = (
                    (latest - previous)
                    / previous
                ) * 100

        growth = max(
            -50,
            min(growth, 50),
        )

        predicted *= (
            1 + growth / 100
        )

    predicted = max(
        predicted,
        0,
    )

    # -----------------------------------------------------
    # Confidence
    # -----------------------------------------------------

    if len(monthly_demand) >= 12:
        confidence = 90
    elif len(monthly_demand) >= 6:
        confidence = 84
    elif len(monthly_demand) >= 3:
        confidence = 76
    else:
        confidence = 62

    # -----------------------------------------------------
    # Top products
    # -----------------------------------------------------

    top_products = []

    if product_column:

        grouped = (
            df.groupby(
                product_column
            )["_sales"]
            .sum()
            .sort_values(
                ascending=False
            )
            .head(5)
        )

        for product, sales in grouped.items():

            top_products.append(
                {
                    "product":
                        str(product),

                    "product_name":
                        str(product),

                    "sales":
                        round(
                            float(sales),
                            2,
                        ),
                }
            )

    return {
        "next_month":
            round(
                float(predicted),
                2,
            ),

        "predicted_demand":
            round(
                float(predicted),
                2,
            ),

        "total_demand":
            round(
                float(predicted),
                2,
            ),

        "expected_growth":
            round(
                float(growth),
                2,
            ),

        "growth":
            round(
                float(growth),
                2,
            ),

        "confidence":
            confidence,

        "top_products":
            top_products,
    }


# =========================================================
# CUSTOMER CHURN / AT-RISK PREDICTION
# =========================================================

def _prediction_churn(df):
    """
    Recency-based customer churn-risk model.

    The Superstore datasets do not contain a real churn label.
    Therefore this endpoint reports CUSTOMER RISK, not confirmed churn.

    The previous implementation used:
        days_inactive >= 90

    That rule is misleading for a single-year dataset and was causing
    all 143 customers in the screenshot to be classified as high risk.

    This version uses the selected year's customer recency distribution:
        - High risk   : most inactive ~25%
        - Medium risk : next ~25%
        - Low risk    : remaining ~50%

    A small frequency adjustment gives additional weight to customers
    with only one observed order.
    """

    MODEL_VERSION = "recency_percentile_v2"

    EMPTY = {
        "rate": 0,
        "churn_rate": 0,
        "high_risk_customers": 0,
        "high_risk": 0,
        "at_risk_customers": 0,
        "medium_risk_customers": 0,
        "low_risk_customers": 0,
        "total_customers": 0,
        "confidence": 0,
        "trend": "Stable",
        "model_version": MODEL_VERSION,
    }

    # -----------------------------------------------------
    # EMPTY DATA
    # -----------------------------------------------------

    if df is None or df.empty:
        return EMPTY

    # -----------------------------------------------------
    # REQUIRED INTERNAL COLUMNS
    # -----------------------------------------------------

    if "_customer_id" not in df.columns or "_date" not in df.columns:
        result = dict(EMPTY)
        result["confidence"] = 50
        return result

    # -----------------------------------------------------
    # CLEAN CUSTOMER ACTIVITY
    # -----------------------------------------------------

    work = df[
        ["_customer_id", "_date"]
    ].copy()

    work = work.dropna(
        subset=["_customer_id", "_date"]
    )

    work["_customer_id"] = (
        work["_customer_id"]
        .astype(str)
        .str.strip()
    )

    work = work[
        ~work["_customer_id"].str.lower().isin(
            {
                "",
                "nan",
                "none",
                "null",
                "n/a",
                "na",
            }
        )
    ]

    if work.empty:
        result = dict(EMPTY)
        result["confidence"] = 50
        return result

    # -----------------------------------------------------
    # CUSTOMER LAST ACTIVITY
    # -----------------------------------------------------

    latest_date = work["_date"].max()

    customer_last_activity = (
        work.groupby(
            "_customer_id"
        )["_date"]
        .max()
    )

    customer_order_count = (
        work.groupby(
            "_customer_id"
        )["_date"]
        .nunique()
    )

    if customer_last_activity.empty:
        result = dict(EMPTY)
        result["confidence"] = 50
        return result

    # -----------------------------------------------------
    # RECENCY
    # -----------------------------------------------------

    recency_days = (
        latest_date
        - customer_last_activity
    ).dt.days.astype(float)

    recency_days = recency_days.clip(
        lower=0
    )

    total_customers = int(
        recency_days.shape[0]
    )

    if total_customers == 0:
        result = dict(EMPTY)
        result["confidence"] = 50
        return result

    # -----------------------------------------------------
    # PERCENTILE RANK
    #
    # 0% = most recently active
    # 100% = least recently active
    # -----------------------------------------------------

    inactivity_percentile = (
        recency_days.rank(
            method="average",
            pct=True,
        )
    )

    # -----------------------------------------------------
    # RISK SEGMENTS
    #
    # Use percentile rank instead of a fixed 90-day cutoff.
    # This guarantees the selected year's customers are
    # distributed according to their actual activity.
    # -----------------------------------------------------

    high_risk_mask = (
        inactivity_percentile > 0.75
    )

    medium_risk_mask = (
        (inactivity_percentile > 0.50)
        & (inactivity_percentile <= 0.75)
    )

    low_risk_mask = (
        inactivity_percentile <= 0.50
    )

    # -----------------------------------------------------
    # FREQUENCY ADJUSTMENT
    #
    # A one-order customer in the upper inactivity range is
    # more uncertain and can be treated as high risk.
    # Never promote customers below the 50th percentile.
    # -----------------------------------------------------

    one_order_mask = (
        customer_order_count
        .reindex(recency_days.index)
        .fillna(1)
        .eq(1)
    )

    frequency_high_risk = (
        (inactivity_percentile > 0.65)
        & one_order_mask
    )

    high_risk_mask = (
        high_risk_mask
        | frequency_high_risk
    )

    # Remove promoted customers from the lower groups.
    medium_risk_mask = (
        medium_risk_mask
        & ~high_risk_mask
    )

    low_risk_mask = (
        low_risk_mask
        & ~high_risk_mask
        & ~medium_risk_mask
    )

    # -----------------------------------------------------
    # COUNTS
    # -----------------------------------------------------

    high_risk = int(
        high_risk_mask.sum()
    )

    medium_risk = int(
        medium_risk_mask.sum()
    )

    low_risk = int(
        low_risk_mask.sum()
    )

    # -----------------------------------------------------
    # SAFETY: EVERY CUSTOMER MUST BE ASSIGNED
    # -----------------------------------------------------

    assigned = (
        high_risk
        + medium_risk
        + low_risk
    )

    if assigned < total_customers:
        low_risk += (
            total_customers - assigned
        )

    # -----------------------------------------------------
    # CHURN-RISK RATE
    # -----------------------------------------------------

    churn_rate = (
        high_risk
        / total_customers
    ) * 100

    churn_rate = round(
        max(
            0.0,
            min(
                float(churn_rate),
                100.0,
            ),
        ),
        2,
    )

    # -----------------------------------------------------
    # TREND LABEL
    # -----------------------------------------------------

    if churn_rate >= 30:
        trend = "High Risk"
    elif churn_rate >= 20:
        trend = "Increasing"
    elif churn_rate >= 10:
        trend = "Moderate"
    else:
        trend = "Stable"

    # -----------------------------------------------------
    # CONFIDENCE
    # -----------------------------------------------------

    if total_customers >= 200:
        confidence = 90
    elif total_customers >= 100:
        confidence = 85
    elif total_customers >= 50:
        confidence = 78
    elif total_customers >= 20:
        confidence = 70
    else:
        confidence = 60

    # -----------------------------------------------------
    # DEBUG
    # -----------------------------------------------------

    print("")
    print("=" * 70)
    print("[AI CHURN] MODEL:", MODEL_VERSION)
    print("[AI CHURN] Selected latest date:", latest_date)
    print("[AI CHURN] Total customers:", total_customers)
    print(
        "[AI CHURN] High risk:",
        high_risk,
        "| Medium:",
        medium_risk,
        "| Low:",
        low_risk,
    )
    print(
        "[AI CHURN] Risk rate:",
        churn_rate,
        "%",
    )
    print(
        "[AI CHURN] Average recency:",
        round(
            float(recency_days.mean()),
            2,
        ),
        "days",
    )
    print(
        "[AI CHURN] Maximum recency:",
        int(recency_days.max()),
        "days",
    )
    print(
        "[AI CHURN] Confidence:",
        confidence,
        "%",
    )
    print(
        "[AI CHURN] Trend:",
        trend,
    )
    print("=" * 70)
    print("")

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "rate": churn_rate,
        "churn_rate": churn_rate,

        "high_risk_customers": high_risk,
        "high_risk": high_risk,

        "at_risk_customers": high_risk,

        "medium_risk_customers": medium_risk,
        "low_risk_customers": low_risk,

        "total_customers": total_customers,

        "confidence": confidence,

        "trend": trend,

        "model_version": MODEL_VERSION,
    }


# =========================================================
# MONTHLY FORECAST
# =========================================================

def _prediction_forecast(
    df,
    periods=12,
    ml_df=None,
):
    """Machine-learning monthly sales forecast.

    Uses LinearRegression with time and seasonal features.
    """
    result = train_sales_forecast(
        ml_df if ml_df is not None else df,
        periods=periods,
    )

    return result.get("forecast", [])


# =========================================================
# AI INSIGHTS
# =========================================================

def _prediction_insights(
    sales,
    demand,
    churn,
):

    insights = []

    growth = float(
        sales.get(
            "expected_growth",
            0,
        )
    )

    if growth > 5:

        insights.append(
            {
                "text":
                    (
                        "Sales are expected "
                        "to increase based "
                        "on recent performance."
                    ),

                "status":
                    "Positive",
            }
        )

    elif growth < -5:

        insights.append(
            {
                "text":
                    (
                        "Sales are showing "
                        "a declining trend "
                        "and may require "
                        "attention."
                    ),

                "status":
                    "Warning",
            }
        )

    else:

        insights.append(
            {
                "text":
                    (
                        "Sales are expected "
                        "to remain relatively "
                        "stable."
                    ),

                "status":
                    "Info",
            }
        )

    demand_growth = float(
        demand.get(
            "expected_growth",
            0,
        )
    )

    if demand_growth > 5:

        insights.append(
            {
                "text":
                    (
                        "Product demand is "
                        "expected to grow "
                        "next month."
                    ),

                "status":
                    "Positive",
            }
        )

    churn_rate = float(
        churn.get(
            "rate",
            0,
        )
    )

    if churn_rate >= 20:

        insights.append(
            {
                "text":
                    (
                        "Customer churn risk "
                        "is high. Consider "
                        "retention campaigns."
                    ),

                "status":
                    "Warning",
            }
        )

    elif churn_rate <= 5:

        insights.append(
            {
                "text":
                    (
                        "Customer retention "
                        "is currently strong."
                    ),

                "status":
                    "Positive",
            }
        )

    else:

        insights.append(
            {
                "text":
                    (
                        "Customer churn "
                        "remains within a "
                        "moderate range."
                    ),

                "status":
                    "Info",
            }
        )

    return insights


# =========================================================
# ML TRAINING DATA
# =========================================================

def _get_ml_training_data(selected_year):
    """Load all Supabase history up to the selected year for ML training."""
    try:
        selected_year = int(selected_year)
    except (TypeError, ValueError):
        selected_year = 2024

    frames = []

    for year in sorted(int(y) for y in YEAR_DATASETS):
        if year <= selected_year:
            try:
                frames.append(load_dataset(str(year)))
            except HTTPException:
                continue

    if not frames:
        return pd.DataFrame()

    combined = pd.concat(frames, ignore_index=True)
    return combined


# =========================================================
# AI PREDICTIONS ENDPOINT
# =========================================================

@router.get("/predictions")
def predictions(
    dataset: str = "2024",
    year: str = "",
):
    """
    AI Predictions endpoint.

    Examples:

        /api/predictions?dataset=2024

        /api/predictions?year=2024

        /api/predictions?dataset=2023
    """

    # -----------------------------------------------------
    # YEAR HAS PRIORITY
    # -----------------------------------------------------

    if year:
        dataset = year

    # -----------------------------------------------------
    # CONVERT YEAR TO CSV
    # -----------------------------------------------------

    dataset_name = (
        normalize_dataset_name(
            dataset
        )
    )

    # -----------------------------------------------------
    # LOAD DATASET
    # -----------------------------------------------------

    df = load_dataset(
        dataset_name
    )

    # -----------------------------------------------------
    # PREPARE DATA
    # -----------------------------------------------------

    df = prepare_dataframe(
        df
    )

    # -----------------------------------------------------
    # EMPTY DATASET
    # -----------------------------------------------------

    if df.empty:

        return {
            "dataset":
                dataset_name,

            "year":
                None,

            "next_month":
                0,

            "expected_growth":
                0,

            "confidence":
                0,

            "highest_month":
                "-",

            "highest_month_sales":
                0,

            "sales":
                {
                    "next_month": 0,
                    "next_30_days": 0,
                    "expected_growth_30_days": 0,
                    "expected_growth": 0,
                    "confidence": 0,
                    "highest_month": "-",
                    "highest_month_sales": 0,
                },

            "sales_forecast":
                {
                    "next_month": 0,
                    "expected_growth": 0,
                    "confidence": 0,
                    "highest_month": "-",
                    "highest_month_sales": 0,
                    "forecast": [],
                },

            "demand":
                {
                    "next_month": 0,
                    "predicted_demand": 0,
                    "total_demand": 0,
                    "expected_growth": 0,
                    "growth": 0,
                    "confidence": 0,
                    "top_products": [],
                },

            "demand_forecast":
                {
                    "next_month": 0,
                    "predicted_demand": 0,
                    "total_demand": 0,
                    "expected_growth": 0,
                    "growth": 0,
                    "confidence": 0,
                    "top_products": [],
                },

            "churn":
                {
                    "rate": 0,
                    "churn_rate": 0,
                    "high_risk_customers": 0,
                    "high_risk": 0,
                    "at_risk_customers": 0,
                    "confidence": 0,
                    "trend": "Stable",
                },

            "customer_churn":
                {
                    "rate": 0,
                    "churn_rate": 0,
                    "high_risk_customers": 0,
                    "high_risk": 0,
                    "at_risk_customers": 0,
                    "confidence": 0,
                    "trend": "Stable",
                },

            "forecast":
                [],

            "insights":
                [],
        }

    # -----------------------------------------------------
    # SELECTED YEAR
    # -----------------------------------------------------

    selected_year = (
        get_dataset_year(
            df
        )
    )

    # -----------------------------------------------------
    # CALCULATE PREDICTIONS
    # -----------------------------------------------------

    ml_training_df = _get_ml_training_data(selected_year)

    sales = _prediction_sales(
        df,
        ml_df=ml_training_df,
    )

    demand = _prediction_demand(
        df
    )

    churn = _prediction_churn(
        df
    )

    forecast = _prediction_forecast(
        df,
        periods=12,
        ml_df=ml_training_df,
    )

    insights = _prediction_insights(
        sales,
        demand,
        churn,
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "dataset":
            dataset_name,

        "year":
            selected_year,

        # -------------------------------------------------
        # TOP LEVEL SALES FIELDS
        # React page uses these.
        # -------------------------------------------------

        "next_month":
            sales[
                "next_month"
            ],

        # Same values as the 30-day Sales Forecast chart.
        "next_30_days":
            sales.get(
                "next_30_days",
                sales["next_month"],
            ),

        "expected_growth_30_days":
            sales.get(
                "expected_growth_30_days",
                sales.get("expected_growth", 0),
            ),

        "expected_growth":
            sales[
                "expected_growth"
            ],

        "confidence":
            sales[
                "confidence"
            ],

        "highest_month":
            sales[
                "highest_month"
            ],

        "highest_month_sales":
            sales[
                "highest_month_sales"
            ],

        "ml_model":
            sales.get("model", "LinearRegression"),

        "ml_training_months":
            sales.get("training_months", 0),

        "ml_mae":
            sales.get("mae", 0),

        "ml_r2":
            sales.get("r2", 0),

        # -------------------------------------------------
        # SALES
        # -------------------------------------------------

        "sales":
            sales,

        "sales_forecast":
            {
                **sales,

                "forecast":
                    forecast,
            },

        # -------------------------------------------------
        # DEMAND
        # -------------------------------------------------

        "demand":
            demand,

        "demand_forecast":
            demand,

        # -------------------------------------------------
        # CHURN
        # -------------------------------------------------

        "churn":
            churn,

        "customer_churn":
            churn,

        # -------------------------------------------------
        # CHURN MODEL VERSION
        # -------------------------------------------------

        "churn_model_version":
            churn.get(
                "model_version",
                "recency_percentile_v2",
            ),

        # -------------------------------------------------
        # FORECAST
        # -------------------------------------------------

        "forecast":
            forecast,

        # -------------------------------------------------
        # INSIGHTS
        # -------------------------------------------------

        "insights":
            insights,
    }

# =========================================================
# SUPABASE DATABASE TEST
# =========================================================

@router.get("/test-supabase")
def test_supabase():
    """
    Test the SQLAlchemy connection to the Supabase PostgreSQL database.
    Returns the number of records currently stored in sales_data.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT COUNT(*) FROM sales_data")
            )
            total_records = result.scalar()

        return {
            "success": True,
            "message": "Supabase database connection successful",
            "total_records": int(total_records or 0),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase database connection failed: {exc}",
        )



@router.get("/orders-trend")
def orders_trend(dataset: str = "2024"):
    df = prepare_dataframe(load_dataset(
        normalize_dataset_name(dataset)
    ))

    order_column = find_column(df, [
        "Order ID", "OrderID", "Order Id",
        "Transaction ID", "TransactionID"
    ])

    if not order_column:
        return {"data": [], "message": "Order ID column not found"}

    df["_month"] = df["_date"].dt.to_period("M").astype(str)

    result = (
        df.groupby("_month")[order_column]
        .nunique()
        .reset_index(name="orders")
    )

    return {
        "year": get_dataset_year(df),
        "data": [
            {"month": row["_month"], "orders": int(row["orders"])}
            for _, row in result.iterrows()
        ]
    }



# =========================================================
# SALES BY CATEGORY
# =========================================================

@router.get("/sales-category")
def sales_category(dataset: str = "2024"):
    dataset_name = normalize_dataset_name(dataset)
    df = prepare_dataframe(load_dataset(dataset_name))

    category_column = find_column(
        df,
        ["Category", "Product Category", "ProductCategory"]
    )

    if df.empty or category_column is None:
        return {"dataset": dataset_name, "data": []}

    grouped = (
        df.groupby(category_column)["_sales"]
        .sum()
        .reset_index()
        .sort_values("_sales", ascending=False)
    )

    return {
        "dataset": dataset_name,
        "data": [
            {
                "category": str(row[category_column]),
                "sales": float(row["_sales"])
            }
            for _, row in grouped.iterrows()
        ]
    }


# =========================================================
# MONTHLY ORDER TREND
# =========================================================

@router.get("/orders-trend")
def orders_trend(dataset: str = "2024"):
    dataset_name = normalize_dataset_name(dataset)
    df = prepare_dataframe(load_dataset(dataset_name))

    order_column = find_column(
        df,
        [
            "Order ID", "OrderID", "Order Id",
            "Order", "Transaction ID", "TransactionID"
        ]
    )

    if df.empty or order_column is None:
        return {"dataset": dataset_name, "data": []}

    df = df.dropna(subset=["_date"]).copy()
    df["_month"] = df["_date"].dt.to_period("M")

    df[order_column] = df[order_column].astype(str).str.strip()
    df = df[df[order_column] != ""]

    grouped = (
        df.groupby("_month")[order_column]
        .nunique()
        .reset_index(name="orders")
        .sort_values("_month")
    )

    return {
        "dataset": dataset_name,
        "data": [
            {
                "month": row["_month"].strftime("%b %Y"),
                "orders": int(row["orders"])
            }
            for _, row in grouped.iterrows()
        ]
    }
