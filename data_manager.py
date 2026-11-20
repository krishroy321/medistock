"""File handling and persistent storage for MediStock.

Handles:
- Loading medicines from CSV with safe FileNotFoundError, KeyError, and ValueError handling
- Saving inventory updates persistently back to CSV using `with open(...)`
- Exporting inventory snapshots to JSON
- Generating structured CSV and readable text inventory reports in reports/
"""

import csv
import json
from datetime import datetime
from pathlib import Path

from models import CSV_FIELDS, create_medicine_record, get_default_sample_medicines
from utils import (
    classify_expiry_status,
    format_currency,
    format_display_date,
    normalize_date_str,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = BASE_DIR / "reports"
CHARTS_DIR = BASE_DIR / "charts"

DEFAULT_CSV_PATH = DATA_DIR / "medicines.csv"
DEFAULT_JSON_PATH = REPORTS_DIR / "inventory_export.json"
DEFAULT_REPORT_CSV_PATH = REPORTS_DIR / "inventory_report.csv"
DEFAULT_REPORT_TXT_PATH = REPORTS_DIR / "inventory_report.txt"


def ensure_directories():
    """Ensure required project subdirectories exist."""
    for directory in (DATA_DIR, REPORTS_DIR, CHARTS_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def load_medicines(filepath=DEFAULT_CSV_PATH, create_if_missing=True):
    """Load medicine records from CSV into a list of dictionaries.

    Handles FileNotFoundError, KeyError, and ValueError safely so missing
    or partially corrupted files never crash the application.
    """
    ensure_directories()
    csv_path = Path(filepath)
    medicines = []

    try:
        with open(csv_path, mode="r", newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            if reader.fieldnames is None:
                print(
                    f"[Warning] Data file '{csv_path}' is empty. Starting with empty inventory."
                )
                return []

            missing_cols = [col for col in CSV_FIELDS if col not in reader.fieldnames]
            if missing_cols:
                raise KeyError(
                    f"Missing required CSV column(s): {', '.join(missing_cols)}"
                )

            for row_num, row in enumerate(reader, start=2):
                try:
                    record = create_medicine_record(
                        medicine_id=row["medicine_id"],
                        medicine_name=row["medicine_name"],
                        category=row["category"],
                        form=row["form"],
                        manufacturer=row["manufacturer"],
                        batch_number=row["batch_number"],
                        quantity=int(row["quantity"]),
                        minimum_stock=int(row["minimum_stock"]),
                        unit_price=float(row["unit_price"]),
                        manufacturing_date=normalize_date_str(
                            row["manufacturing_date"]
                        ),
                        expiry_date=normalize_date_str(row["expiry_date"]),
                        supplier=row["supplier"],
                    )
                    medicines.append(record)
                except KeyError as err:
                    print(
                        f"[Warning] Skipping row {row_num} in '{csv_path.name}': "
                        f"missing expected field {err}."
                    )
                except ValueError as err:
                    print(
                        f"[Warning] Skipping row {row_num} in '{csv_path.name}': "
                        f"invalid value ({err})."
                    )

    except FileNotFoundError:
        print(f"\n[Warning] Inventory data file not found: '{csv_path}'")
        if create_if_missing:
            print(
                "[Info] Creating a fallback CSV file with starter pharmacy medicines "
                "so you can continue safely."
            )
            fallback_medicines = get_default_sample_medicines()
            save_medicines(fallback_medicines, filepath=csv_path)
            return fallback_medicines
        print("[Info] Continuing with an empty inventory list.")
        return []

    except KeyError as err:
        print(f"\n[Error] Data file format error in '{csv_path}': {err}")
        print("[Info] Please verify the CSV headers. Starting with an empty inventory.")
        return []

    except OSError as err:
        print(f"\n[Error] Unable to read data file '{csv_path}': {err}")
        return []

    return medicines


def save_medicines(medicines, filepath=DEFAULT_CSV_PATH):
    """Persist the list of medicine dictionaries to CSV using `with open(...)`."""
    csv_path = Path(filepath)
    try:
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with open(csv_path, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
            writer.writeheader()
            for medicine in medicines:
                row = {field: medicine[field] for field in CSV_FIELDS}
                writer.writerow(row)
        return True
    except KeyError as err:
        print(f"[Error] Failed to save CSV: medicine record missing field {err}.")
        return False
    except OSError as err:
        print(f"[Error] Could not write to '{csv_path}': {err}")
        return False


def export_to_json(medicines, filepath=DEFAULT_JSON_PATH):
    """Export the current medicine inventory to a structured JSON file."""
    json_path = Path(filepath)
    payload = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_medicines": len(medicines),
        "medicines": medicines,
    }
    try:
        json_path.parent.mkdir(parents=True, exist_ok=True)
        with open(json_path, mode="w", encoding="utf-8") as file:
            json.dump(payload, file, indent=2)
        return str(json_path)
    except OSError as err:
        print(f"[Error] Could not export JSON to '{json_path}': {err}")
        return ""


def generate_inventory_report(
    medicines,
    analysis_results,
    attention_data,
    csv_path=DEFAULT_REPORT_CSV_PATH,
    txt_path=DEFAULT_REPORT_TXT_PATH,
    json_path=DEFAULT_JSON_PATH,
):
    """Generate CSV summary report, readable TXT report, and JSON export in reports/.

    Returns:
        dict: Paths of generated files under keys 'csv', 'txt', and 'json'.
    """
    ensure_directories()
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    overview = analysis_results["overview"]
    category_counts = analysis_results["category_distribution"]
    value_by_category = analysis_results["value_by_category"]

    top_categories_by_count = [
        f"{cat} ({int(cnt)})" for cat, cnt in category_counts.head(5).items()
    ]
    top_categories_by_value = [
        f"{cat} ({format_currency(val)})"
        for cat, val in value_by_category.head(5).items()
    ]

    critical_count = len(attention_data.get("CRITICAL", []))
    warning_count = len(attention_data.get("WARNING", []))
    info_count = len(attention_data.get("INFO", []))

    summary_rows = [
        ("Generated Date/Time", generated_at),
        ("Total Medicines", overview["total_medicines"]),
        ("Total Stock Units", overview["total_stock_units"]),
        ("Total Inventory Value", f"{overview['total_inventory_value']:.2f}"),
        ("Average Medicine Price", f"{overview['average_unit_price']:.2f}"),
        ("Average Stock Quantity", f"{overview['average_stock_quantity']:.2f}"),
        ("Out of Stock Count", overview["out_of_stock_count"]),
        ("Low Stock Count (<= Min Stock)", overview["low_stock_count"]),
        ("Approaching Reorder Count", overview["approaching_reorder_count"]),
        ("Expired Medicine Count", overview["expired_count"]),
        ("Expiring Within 7 Days Count", overview["expiring_7_days_count"]),
        ("Expiring Within 30 Days Count", overview["expiring_30_days_count"]),
        ("Safe Expiry Count", overview["safe_count"]),
        ("Critical Alerts", critical_count),
        ("Warning Alerts", warning_count),
        ("Info Alerts", info_count),
        ("Top Categories (By Count)", "; ".join(top_categories_by_count)),
        ("Top Categories (By Value)", "; ".join(top_categories_by_value)),
    ]

    csv_target = Path(csv_path)
    txt_target = Path(txt_path)

    # 1. Write structured CSV report
    with open(csv_target, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Metric", "Value"])
        for metric, value in summary_rows:
            writer.writerow([metric, value])

    # 2. Write human-readable executive text report
    lines = [
        "=" * 78,
        "MEDISTOCK PHARMACY INVENTORY REPORT".center(78),
        f"Generated: {generated_at}".center(78),
        "=" * 78,
        "",
        "1. INVENTORY OVERVIEW",
        "-" * 78,
        f"  Total Medicines           : {overview['total_medicines']}",
        f"  Total Stock Units         : {overview['total_stock_units']:,}",
        f"  Total Inventory Value     : {format_currency(overview['total_inventory_value'])}",
        f"  Average Unit Price        : {format_currency(overview['average_unit_price'])}",
        f"  Average Stock Quantity    : {overview['average_stock_quantity']:.2f} units",
        f"  Out-of-Stock Medicines    : {overview['out_of_stock_count']}",
        f"  Low-Stock Medicines       : {overview['low_stock_count']}",
        f"  Approaching Reorder Level : {overview['approaching_reorder_count']}",
        f"  Expired Medicines         : {overview['expired_count']}",
        f"  Expiring Within 7 Days    : {overview['expiring_7_days_count']}",
        f"  Expiring Within 30 Days   : {overview['expiring_30_days_count']}",
        f"  Safe Stock (Expiry > 30d) : {overview['safe_count']}",
        "",
        "2. TOP CATEGORIES BY MEDICINE COUNT",
        "-" * 78,
    ]

    for rank, (category, count) in enumerate(category_counts.head(5).items(), start=1):
        cat_value = value_by_category.get(category, 0.0)
        lines.append(
            f"  {rank}. {category:<28} {int(count):>3} medicines | Value: {format_currency(cat_value)}"
        )

    lines.extend(
        [
            "",
            "3. PRIORITY ALERTS SUMMARY",
            "-" * 78,
            f"  CRITICAL alerts : {critical_count}",
            f"  WARNING alerts  : {warning_count}",
            f"  INFO alerts     : {info_count}",
            "",
        ]
    )

    for level in ("CRITICAL", "WARNING", "INFO"):
        items = attention_data.get(level, [])
        if not items:
            continue
        lines.append(f"  [{level}]")
        for alert in items:
            lines.append(
                f"    - {alert['medicine_id']} | {alert['medicine_name']} | "
                f"{alert['problem']} | Qty: {alert['quantity']} | "
                f"Expiry: {alert['display_expiry_date']} | Action: {alert['action']}"
            )
        lines.append("")

    lines.extend(
        [
            "4. COMPLETE MEDICINE VALUATION SNAPSHOT",
            "-" * 78,
            f"  {'ID':<8} {'Medicine Name':<32} {'Qty':>5} {'Unit Price':>11} {'Total Value':>12} {'Expiry':<11} {'Status'}",
            "  " + "-" * 96,
        ]
    )

    for med in medicines:
        total_val = med["quantity"] * med["unit_price"]
        status = classify_expiry_status(med["expiry_date"])
        lines.append(
            f"  {med['medicine_id']:<8} {med['medicine_name'][:32]:<32} "
            f"{med['quantity']:>5} {format_currency(med['unit_price']):>11} "
            f"{format_currency(total_val):>12} {format_display_date(med['expiry_date']):<11} {status}"
        )

    lines.append("=" * 78)

    with open(txt_target, mode="w", encoding="utf-8") as file:
        file.write("\n".join(lines) + "\n")

    # 3. Export JSON snapshot
    exported_json = export_to_json(medicines, filepath=json_path)

    return {
        "csv": str(csv_target),
        "txt": str(txt_target),
        "json": exported_json,
    }
