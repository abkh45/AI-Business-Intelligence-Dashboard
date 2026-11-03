from pathlib import Path
import pandas as pd
import numpy as np


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


CUSTOMERS_PER_YEAR = {
    "2022": 1000,
    "2023": 1100,
    "2024": 1250,
    "2025": 1400,
}


for year, customer_count in CUSTOMERS_PER_YEAR.items():

    file_path = DATA_DIR / f"superstore_{year}.csv"

    print()
    print("=" * 60)
    print("Processing:", file_path)
    print("=" * 60)

    if not file_path.exists():

        print("[ERROR] File not found")
        continue

    df = pd.read_csv(file_path)

    # Remove old Customer ID
    if "Customer ID" in df.columns:

        df = df.drop(
            columns=["Customer ID"]
        )

    row_count = len(df)

    if row_count < customer_count:

        print(
            f"[ERROR] {year} has only "
            f"{row_count} rows but needs "
            f"{customer_count} customers."
        )

        continue

    # -----------------------------------------------------
    # Create customer IDs
    # -----------------------------------------------------

    customer_ids = [
        f"CUST-{year}-{i:04d}"
        for i in range(
            1,
            customer_count + 1
        )
    ]

    # -----------------------------------------------------
    # Fixed random generator
    # -----------------------------------------------------

    rng = np.random.default_rng(
        int(year)
    )

    # -----------------------------------------------------
    # IMPORTANT:
    # First give every customer one order.
    # -----------------------------------------------------

    assigned_customers = customer_ids.copy()

    # -----------------------------------------------------
    # Remaining rows
    # -----------------------------------------------------

    remaining_rows = (
        row_count
        - customer_count
    )

    if remaining_rows > 0:

        extra_customers = rng.choice(
            customer_ids,
            size=remaining_rows,
            replace=True,
        )

        assigned_customers.extend(
            extra_customers.tolist()
        )

    # -----------------------------------------------------
    # Shuffle customer assignments
    # -----------------------------------------------------

    rng.shuffle(
        assigned_customers
    )

    # -----------------------------------------------------
    # Add Customer ID
    # -----------------------------------------------------

    insert_position = min(
        2,
        len(df.columns)
    )

    df.insert(
        insert_position,
        "Customer ID",
        assigned_customers,
    )

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    df.to_csv(
        file_path,
        index=False,
    )

    # -----------------------------------------------------
    # Verify
    # -----------------------------------------------------

    actual_customers = (
        df["Customer ID"]
        .nunique()
    )

    print(
        "[SUCCESS] Rows:",
        len(df)
    )

    print(
        "[SUCCESS] Customers:",
        actual_customers
    )

    print(
        "[SUCCESS] Expected:",
        customer_count
    )


print()
print("=" * 60)
print("DONE")
print("=" * 60)