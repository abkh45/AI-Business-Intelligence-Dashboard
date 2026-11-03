import pandas as pd
from pathlib import Path

data_folder = Path("data")

column_mapping = {
    "Row ID": "row_id",
    "Order ID": "order_id",
    "Customer ID": "customer_id",
    "Order Date": "order_date",
    "Ship Date": "ship_date",
    "Country": "country",
    "Region": "region",
    "State": "state",
    "City": "city",
    "Category": "category",
    "Product Name": "product_name",
    "Sales": "sales",
    "Quantity": "quantity",
    "Discount": "discount",
    "Profit": "profit",
    "Orders": "orders",
    "Profit Margin": "profit_margin",
    "Month": "month",
    "Year": "year"
}

for year in [2022, 2023, 2024, 2025]:

    input_file = data_folder / f"superstore_{year}.csv"
    output_file = data_folder / f"superstore_{year}_supabase.csv"

    df = pd.read_csv(input_file)

    df = df.rename(columns=column_mapping)

    df.to_csv(output_file, index=False)

    print(f"Created: {output_file}")
    print(f"Rows: {len(df)}")
    print()