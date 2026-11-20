"""Inventory data analysis powered by Pandas and NumPy.

Demonstrates real DataFrame analytics (`groupby`, `mean`, `sum`, `count`,
`sort_values`, `value_counts`) and NumPy numerical arrays/vectorized
operations (`np.array`, `np.mean`, `np.median`, `np.std`, `np.percentile`,
`np.select`) on live pharmacy inventory data.
"""

from datetime import date

import numpy as np
import pandas as pd

from data_manager import load_medicines
from models import (
    CSV_FIELDS,
    DEFAULT_EXPIRY_WARNING_DAYS,
    REORDER_APPROACH_MULTIPLIER,
    URGENT_EXPIRY_DAYS,
)
from utils import (
    format_currency,
    format_display_date,
    format_table,
    print_header,
    print_section,
)


def build_inventory_dataframe(medicines, reference_date=None):
    """Convert medicine dictionaries into an enriched Pandas DataFrame."""
    today = pd.Timestamp(reference_date if reference_date is not None else date.today())

    if not medicines:
        empty_df = pd.DataFrame(columns=list(CSV_FIELDS))
        empty_df["total_value"] = pd.Series(dtype=float)
        empty_df["days_to_expiry"] = pd.Series(dtype=int)
        empty_df["expiry_status"] = pd.Series(dtype=str)
        empty_df["expiry_group"] = pd.Series(dtype=str)
        empty_df["stock_status"] = pd.Series(dtype=str)
        return empty_df

    df = pd.DataFrame(medicines)
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).astype(int)
    df["minimum_stock"] = (
        pd.to_numeric(df["minimum_stock"], errors="coerce").fillna(0).astype(int)
    )
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0.0).astype(float)

    # Compute stock valuation per medicine
    df["total_value"] = (df["quantity"] * df["unit_price"]).round(2)

    # Dynamic expiry calculation using Pandas timestamps
    expiry_dt = pd.to_datetime(df["expiry_date"], errors="coerce")
    df["days_to_expiry"] = (expiry_dt - today).dt.days

    # Vectorized expiry status classification using NumPy np.select
    expiry_conditions = [
        df["days_to_expiry"] < 0,
        df["days_to_expiry"] <= URGENT_EXPIRY_DAYS,
        df["days_to_expiry"] <= DEFAULT_EXPIRY_WARNING_DAYS,
    ]
    expiry_choices = [
        "Expired",
        "Expiring Within 7 Days",
        "Expiring Within 30 Days",
    ]
    df["expiry_status"] = np.select(expiry_conditions, expiry_choices, default="Safe")

    # Grouped 3-bucket expiry label for executive charts
    grouped_conditions = [
        df["days_to_expiry"] < 0,
        df["days_to_expiry"] <= DEFAULT_EXPIRY_WARNING_DAYS,
    ]
    df["expiry_group"] = np.select(
        grouped_conditions, ["Expired", "Expiring Soon"], default="Safe"
    )

    # Vectorized stock health classification using NumPy np.select
    reorder_threshold = np.floor(df["minimum_stock"] * REORDER_APPROACH_MULTIPLIER)
    stock_conditions = [
        df["quantity"] == 0,
        df["quantity"] <= df["minimum_stock"],
        df["quantity"] <= reorder_threshold,
    ]
    stock_choices = [
        "Out of Stock",
        "Low Stock",
        "Approaching Reorder",
    ]
    df["stock_status"] = np.select(stock_conditions, stock_choices, default="Healthy")

    return df


def analyze_inventory(medicines, reference_date=None):
    """Run comprehensive Pandas & NumPy analysis on the medicine inventory."""
    df = build_inventory_dataframe(medicines, reference_date=reference_date)

    if df.empty:
        empty_series = pd.Series(dtype=float)
        return {
            "dataframe": df,
            "overview": {
                "total_medicines": 0,
                "total_stock_units": 0,
                "total_inventory_value": 0.0,
                "average_unit_price": 0.0,
                "median_unit_price": 0.0,
                "price_std_dev": 0.0,
                "min_unit_price": 0.0,
                "max_unit_price": 0.0,
                "average_stock_quantity": 0.0,
                "median_stock_quantity": 0.0,
                "stock_std_dev": 0.0,
                "min_stock_quantity": 0,
                "max_stock_quantity": 0,
                "value_p25": 0.0,
                "value_p50": 0.0,
                "value_p75": 0.0,
                "expired_count": 0,
                "expiring_7_days_count": 0,
                "expiring_30_days_count": 0,
                "safe_count": 0,
                "out_of_stock_count": 0,
                "low_stock_count": 0,
                "approaching_reorder_count": 0,
                "expired_stock_value": 0.0,
            },
            "category_summary": pd.DataFrame(),
            "category_distribution": empty_series,
            "stock_by_category": empty_series,
            "value_by_category": empty_series,
            "supplier_distribution": empty_series,
            "supplier_summary": pd.DataFrame(),
            "expiry_distribution": empty_series,
            "expiry_group_distribution": empty_series,
            "highest_value_medicines": pd.DataFrame(),
            "lowest_stock_medicines": pd.DataFrame(),
        }

    # NumPy numerical arrays for statistical computations
    prices_arr = np.array(df["unit_price"], dtype=float)
    quantities_arr = np.array(df["quantity"], dtype=float)
    values_arr = np.array(df["total_value"], dtype=float)

    value_percentiles = np.percentile(values_arr, [25, 50, 75])

    expired_mask = df["days_to_expiry"] < 0
    expiring_7_mask = (df["days_to_expiry"] >= 0) & (
        df["days_to_expiry"] <= URGENT_EXPIRY_DAYS
    )
    expiring_30_mask = (df["days_to_expiry"] >= 0) & (
        df["days_to_expiry"] <= DEFAULT_EXPIRY_WARNING_DAYS
    )
    safe_mask = df["days_to_expiry"] > DEFAULT_EXPIRY_WARNING_DAYS

    overview = {
        "total_medicines": int(df["medicine_id"].count()),
        "total_stock_units": int(np.sum(quantities_arr)),
        "total_inventory_value": round(float(np.sum(values_arr)), 2),
        "average_unit_price": round(float(np.mean(prices_arr)), 2),
        "median_unit_price": round(float(np.median(prices_arr)), 2),
        "price_std_dev": round(float(np.std(prices_arr)), 2),
        "min_unit_price": round(float(np.min(prices_arr)), 2),
        "max_unit_price": round(float(np.max(prices_arr)), 2),
        "average_stock_quantity": round(float(np.mean(quantities_arr)), 2),
        "median_stock_quantity": round(float(np.median(quantities_arr)), 2),
        "stock_std_dev": round(float(np.std(quantities_arr)), 2),
        "min_stock_quantity": int(np.min(quantities_arr)),
        "max_stock_quantity": int(np.max(quantities_arr)),
        "value_p25": round(float(value_percentiles[0]), 2),
        "value_p50": round(float(value_percentiles[1]), 2),
        "value_p75": round(float(value_percentiles[2]), 2),
        "expired_count": int(expired_mask.sum()),
        "expiring_7_days_count": int(expiring_7_mask.sum()),
        "expiring_30_days_count": int(expiring_30_mask.sum()),
        "safe_count": int(safe_mask.sum()),
        "out_of_stock_count": int((df["quantity"] == 0).sum()),
        "low_stock_count": int((df["quantity"] <= df["minimum_stock"]).sum()),
        "approaching_reorder_count": int(
            (df["stock_status"] == "Approaching Reorder").sum()
        ),
        "expired_stock_value": round(float(df.loc[expired_mask, "total_value"].sum()), 2),
    }

    # Pandas groupby aggregations by category
    category_summary = (
        df.groupby("category")
        .agg(
            medicine_count=("medicine_id", "count"),
            total_units=("quantity", "sum"),
            avg_stock=("quantity", "mean"),
            avg_price=("unit_price", "mean"),
            total_value=("total_value", "sum"),
        )
        .sort_values(by="total_value", ascending=False)
    )

    category_distribution = df["category"].value_counts()
    stock_by_category = (
        df.groupby("category")["quantity"].sum().sort_values(ascending=False)
    )
    value_by_category = (
        df.groupby("category")["total_value"].sum().sort_values(ascending=False)
    )

    # Supplier analysis using value_counts and groupby
    supplier_distribution = df["supplier"].value_counts()
    supplier_summary = (
        df.groupby("supplier")
        .agg(
            medicine_count=("medicine_id", "count"),
            total_units=("quantity", "sum"),
            total_value=("total_value", "sum"),
        )
        .sort_values(by="total_value", ascending=False)
    )

    # Expiry status distributions
    expiry_distribution = df["expiry_status"].value_counts()
    expiry_group_distribution = df["expiry_group"].value_counts()

    # Top highest-value medicines and lowest-stock medicines via sort_values
    highest_value_medicines = df.sort_values(
        by="total_value", ascending=False
    ).head(5)[
        ["medicine_id", "medicine_name", "category", "quantity", "unit_price", "total_value"]
    ]

    lowest_stock_medicines = df.sort_values(
        by=["quantity", "minimum_stock"], ascending=[True, False]
    ).head(5)[
        ["medicine_id", "medicine_name", "quantity", "minimum_stock", "stock_status", "supplier"]
    ]

    return {
        "dataframe": df,
        "overview": overview,
        "category_summary": category_summary,
        "category_distribution": category_distribution,
        "stock_by_category": stock_by_category,
        "value_by_category": value_by_category,
        "supplier_distribution": supplier_distribution,
        "supplier_summary": supplier_summary,
        "expiry_distribution": expiry_distribution,
        "expiry_group_distribution": expiry_group_distribution,
        "highest_value_medicines": highest_value_medicines,
        "lowest_stock_medicines": lowest_stock_medicines,
    }


def display_analysis(analysis_results):
    """Print the Pandas and NumPy inventory analysis clearly to the terminal."""
    overview = analysis_results["overview"]
    print_header(
        "INVENTORY DATA ANALYSIS",
        subtitle="Powered by Pandas DataFrames & NumPy Statistical Functions",
    )

    if overview["total_medicines"] == 0:
        print("  No inventory data available to analyze.")
        return

    # 1. Core KPIs & NumPy Statistics
    print_section("1. KEY METRICS & NUMPY STATISTICAL SUMMARY")
    print(f"  Total Medicines           : {overview['total_medicines']}")
    print(f"  Total Stock Units         : {overview['total_stock_units']:,}")
    print(f"  Total Inventory Value     : {format_currency(overview['total_inventory_value'])}")
    print(
        f"  Unit Price (Mean / Med)   : {format_currency(overview['average_unit_price'])} / "
        f"{format_currency(overview['median_unit_price'])} "
        f"(Std Dev: {format_currency(overview['price_std_dev'])})"
    )
    print(
        f"  Unit Price Range          : {format_currency(overview['min_unit_price'])} to "
        f"{format_currency(overview['max_unit_price'])}"
    )
    print(
        f"  Stock Qty (Mean / Med)    : {overview['average_stock_quantity']:.2f} / "
        f"{overview['median_stock_quantity']:.1f} units "
        f"(Min: {overview['min_stock_quantity']}, Max: {overview['max_stock_quantity']}, "
        f"Std Dev: {overview['stock_std_dev']:.2f})"
    )
    print(
        f"  Item Value Percentiles    : 25th={format_currency(overview['value_p25'])} | "
        f"50th={format_currency(overview['value_p50'])} | "
        f"75th={format_currency(overview['value_p75'])}"
    )
    print()
    print(
        f"  Stock Health Counts       : Out of Stock={overview['out_of_stock_count']} | "
        f"Low Stock (<=Min)={overview['low_stock_count']} | "
        f"Approaching Reorder={overview['approaching_reorder_count']}"
    )
    print(
        f"  Expiry Health Counts      : Expired={overview['expired_count']} "
        f"(Value at Risk: {format_currency(overview['expired_stock_value'])}) | "
        f"<=7d={overview['expiring_7_days_count']} | "
        f"<=30d={overview['expiring_30_days_count']} | "
        f"Safe={overview['safe_count']}"
    )

    # 2. Category Breakdown
    print_section("2. CATEGORY DISTRIBUTION, STOCK & VALUATION (Pandas groupby)")
    cat_df = analysis_results["category_summary"]
    cat_rows = []
    for category, row in cat_df.iterrows():
        cat_rows.append(
            [
                category,
                int(row["medicine_count"]),
                f"{int(row['total_units']):,}",
                f"{row['avg_stock']:.1f}",
                format_currency(row["avg_price"]),
                format_currency(row["total_value"]),
            ]
        )
    print(
        format_table(
            ("Category", "Medicines", "Total Units", "Avg Stock", "Avg Price", "Total Value"),
            cat_rows,
            right_align_cols=(1, 2, 3, 4, 5),
        )
    )

    # 3. Supplier Distribution
    print_section("3. SUPPLIER DISTRIBUTION & PORTFOLIO SHARE")
    sup_df = analysis_results["supplier_summary"]
    sup_rows = []
    for supplier, row in sup_df.iterrows():
        share = (
            (row["total_value"] / overview["total_inventory_value"]) * 100
            if overview["total_inventory_value"] > 0
            else 0.0
        )
        sup_rows.append(
            [
                supplier,
                int(row["medicine_count"]),
                f"{int(row['total_units']):,}",
                format_currency(row["total_value"]),
                f"{share:.1f}%",
            ]
        )
    print(
        format_table(
            ("Supplier", "Medicines", "Total Units", "Inventory Value", "Value Share"),
            sup_rows,
            right_align_cols=(1, 2, 3, 4),
        )
    )

    # 4. Top 5 Highest-Value Medicines
    print_section("4. TOP 5 HIGHEST-VALUE MEDICINES (Pandas sort_values)")
    top_df = analysis_results["highest_value_medicines"]
    top_rows = []
    for _, row in top_df.iterrows():
        top_rows.append(
            [
                row["medicine_id"],
                row["medicine_name"],
                row["category"],
                int(row["quantity"]),
                format_currency(row["unit_price"]),
                format_currency(row["total_value"]),
            ]
        )
    print(
        format_table(
            ("ID", "Medicine Name", "Category", "Qty", "Unit Price", "Total Value"),
            top_rows,
            right_align_cols=(3, 4, 5),
        )
    )

    # 5. Soonest Expiring Medicines
    df = analysis_results["dataframe"]
    print_section("5. NEXT 5 MEDICINES BY EXPIRY DATE")
    soonest = df.sort_values(by="days_to_expiry").head(5)
    exp_rows = []
    for _, row in soonest.iterrows():
        exp_rows.append(
            [
                row["medicine_id"],
                row["medicine_name"],
                format_display_date(row["expiry_date"]),
                f"{int(row['days_to_expiry'])}d",
                row["expiry_status"],
            ]
        )
    print(
        format_table(
            ("ID", "Medicine Name", "Expiry Date", "Days Left", "Expiry Status"),
            exp_rows,
            right_align_cols=(3,),
        )
    )


if __name__ == "__main__":
    inventory_records = load_medicines()
    results = analyze_inventory(inventory_records)
    display_analysis(results)
