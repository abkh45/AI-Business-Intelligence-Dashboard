from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"


FILES = [
    "superstore_2022.csv",
    "superstore_2023.csv",
    "superstore_2024.csv",
    "superstore_2025.csv",
]


for filename in FILES:

    file_path = DATA_DIR / filename

    if not file_path.exists():

        print(
            f"[SKIP] File not found: {file_path}"
        )

        continue

    print("")
    print("=" * 60)
    print("Processing:", filename)
    print("=" * 60)

    df = pd.read_csv(file_path)

    # -----------------------------------------------------
    # Already has Customer ID?
    # -----------------------------------------------------

    if "Customer ID" in df.columns:

        print(
            "[OK] Customer ID already exists."
        )

        continue

    # -----------------------------------------------------
    # Create customer IDs
    # -----------------------------------------------------
    #
    # We create customers based on repeated combinations
    # of location information.
    #
    # This is synthetic because the original CSV doesn't
    # contain real customer information.
    # -----------------------------------------------------

    parts = []

    for column in [
        "Country",
        "Region",
        "State",
        "City",
    ]:

        if column in df.columns:

            parts.append(
                df[column]
                .fillna("")
                .astype(str)
                .str.strip()
            )

    if parts:

        customer_key = parts[0]

        for part in parts[1:]:

            customer_key = (
                customer_key
                + "|"
                + part
            )

    else:

        customer_key = pd.Series(
            range(len(df)),
            index=df.index
        ).astype(str)

    # -----------------------------------------------------
    # Create customer numbers
    # -----------------------------------------------------

    customer_numbers = (
        pd.factorize(
            customer_key
        )[0]
        + 1
    )

    df.insert(
        2,
        "Customer ID",
        [
            f"CUST-{year_number:04d}"
            for year_number in customer_numbers
        ]
    )

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    df.to_csv(
        file_path,
        index=False
    )

    print(
        "[OK] Customer ID added."
    )

    print(
        "[OK] Customers:",
        df["Customer ID"].nunique()
    )

print("")
print("=" * 60)
print("DONE")
print("=" * 60)