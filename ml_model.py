"""Machine-learning helpers for the AI BI Dashboard.

The model trains on monthly sales from Supabase data supplied by the API.
It uses LinearRegression with time and seasonal features so the model can
extrapolate into future months instead of simply repeating recent values.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score


def _monthly_sales(df: pd.DataFrame) -> pd.Series:
    """Convert dashboard rows into a monthly sales series."""
    if df is None or df.empty:
        return pd.Series(dtype=float)

    data = df.copy()

    if "_date" in data.columns:
        dates = pd.to_datetime(data["_date"], errors="coerce")
    else:
        date_col = next(
            (c for c in ["Order Date", "OrderDate", "Date", "Transaction Date"] if c in data.columns),
            None,
        )
        if date_col is None:
            return pd.Series(dtype=float)
        dates = pd.to_datetime(data[date_col], errors="coerce")

    if "_sales" in data.columns:
        sales = pd.to_numeric(data["_sales"], errors="coerce").fillna(0)
    elif "Sales" in data.columns:
        sales = pd.to_numeric(data["Sales"], errors="coerce").fillna(0)
    else:
        return pd.Series(dtype=float)

    data = pd.DataFrame({"date": dates, "sales": sales}).dropna(subset=["date"])
    if data.empty:
        return pd.Series(dtype=float)

    return data.set_index("date")["sales"].resample("MS").sum().astype(float)


def _features(dates: pd.DatetimeIndex) -> np.ndarray:
    """Create extrapolatable time + seasonal features."""
    month = dates.month.to_numpy(dtype=float)
    t = np.arange(len(dates), dtype=float)

    return np.column_stack(
        [
            t,
            np.sin(2 * np.pi * month / 12.0),
            np.cos(2 * np.pi * month / 12.0),
        ]
    )


def train_sales_forecast(df: pd.DataFrame, periods: int = 12) -> dict:
    """Train a LinearRegression model and forecast future monthly sales."""
    monthly = _monthly_sales(df).dropna()

    if monthly.empty:
        return {
            "model": "LinearRegression",
            "training_months": 0,
            "mae": 0.0,
            "r2": 0.0,
            "confidence": 0,
            "expected_growth": 0.0,
            "next_month": 0.0,
            "forecast": [],
        }

    # Keep zero/negative sales from producing misleading negative forecasts.
    y = monthly.clip(lower=0).to_numpy(dtype=float)
    train_dates = pd.DatetimeIndex(monthly.index)
    X = _features(train_dates)

    model = LinearRegression()
    model.fit(X, y)

    fitted = np.maximum(model.predict(X), 0)
    mae = float(mean_absolute_error(y, fitted))
    r2 = float(r2_score(y, fitted)) if len(y) >= 2 else 0.0

    last_date = train_dates[-1]
    future_dates = pd.date_range(
        last_date + pd.offsets.MonthBegin(1),
        periods=periods,
        freq="MS",
    )

    # Continue the time index after the training observations.
    future_t = np.arange(len(y), len(y) + periods, dtype=float)
    future_month = future_dates.month.to_numpy(dtype=float)
    X_future = np.column_stack(
        [
            future_t,
            np.sin(2 * np.pi * future_month / 12.0),
            np.cos(2 * np.pi * future_month / 12.0),
        ]
    )

    predictions = np.maximum(model.predict(X_future), 0)

    last_actual = float(y[-1])
    next_month = float(predictions[0]) if len(predictions) else 0.0
    expected_growth = (
        ((next_month - last_actual) / last_actual) * 100
        if last_actual > 0
        else 0.0
    )

    # Confidence is intentionally conservative for a small monthly history.
    if len(y) >= 24:
        confidence = 92
    elif len(y) >= 18:
        confidence = 86
    elif len(y) >= 12:
        confidence = 80
    elif len(y) >= 6:
        confidence = 72
    else:
        confidence = 60

    forecast = []
    for date, value in zip(future_dates, predictions):
        value = float(value)
        forecast.append(
            {
                "label": date.strftime("%b %Y"),
                "month": date.strftime("%b %Y"),
                "date": date.strftime("%Y-%m-%d"),
                "sales": round(value, 2),
                "value": round(value, 2),
                "forecast": round(value, 2),
                "predicted_sales": round(value, 2),
                "type": "ml_forecast",
            }
        )

    return {
        "model": "LinearRegression",
        "training_months": int(len(y)),
        "mae": round(mae, 2),
        "r2": round(r2, 4),
        "confidence": confidence,
        "expected_growth": round(float(expected_growth), 2),
        "next_month": round(next_month, 2),
        "forecast": forecast,
    }
