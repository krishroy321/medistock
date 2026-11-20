"""Core inventory management operations, alert logic, and summary builders.

Implements CRUD operations, search, valuation, dynamic expiry & low-stock
detection, and the prioritized "What Needs Attention" alert engine using
Python lists, dictionaries, tuples, sets, and nested dictionaries.
"""

from datetime import date

from models import (
    ALERT_LEVELS,
    DEFAULT_EXPIRY_WARNING_DAYS,
    REORDER_APPROACH_MULTIPLIER,
    SEARCH_FIELDS,
    URGENT_EXPIRY_DAYS,
    get_existing_ids,
    get_unique_categories,
    get_unique_manufacturers,
    get_unique_suppliers,
)
from utils import (
    classify_expiry_status,
    format_currency,
    format_display_date,
    format_table,
    get_days_until_expiry,
    print_divider,
    print_header,
    print_section,
    validate_medicine_input,
)


def build_medicine_index(medicines):
    """Build a dictionary mapping uppercase medicine_id to its medicine record."""
    return {medicine["medicine_id"].upper(): medicine for medicine in medicines}


def get_medicine_by_id(medicines, medicine_id):
    """Look up a medicine by ID using a dictionary index; raises KeyError if missing."""
    index = build_medicine_index(medicines)
    key = str(medicine_id).strip().upper()
    return index[key]


def find_medicine_by_id(medicines, medicine_id):
    """Safely look up a medicine by ID, returning None if not found."""
    try:
        return get_medicine_by_id(medicines, medicine_id)
    except KeyError:
        return None


def generate_next_medicine_id(medicines):
    """Suggest the next sequential unique medicine ID (e.g., MED041)."""
    existing_ids = get_existing_ids(medicines)
    max_num = 0
    for med_id in existing_ids:
        if med_id.startswith("MED"):
            suffix = med_id[3:]
            if suffix.isdigit():
                num = int(suffix)
                if num > max_num:
                    max_num = num
    next_num = max_num + 1
    while f"MED{next_num:03d}" in existing_ids:
        next_num += 1
    return f"MED{next_num:03d}"


def calculate_medicine_value(medicine):
    """Calculate total monetary value (quantity * unit_price) for one medicine."""
    return round(int(medicine["quantity"]) * float(medicine["unit_price"]), 2)


def calculate_inventory_value(medicines):
    """Calculate individual medicine values and grand total inventory value."""
    item_values = []
    total_value = 0.0

    for medicine in medicines:
        value = calculate_medicine_value(medicine)
        total_value += value
        item_values.append(
            {
                "medicine_id": medicine["medicine_id"],
                "medicine_name": medicine["medicine_name"],
                "quantity": medicine["quantity"],
                "unit_price": medicine["unit_price"],
                "total_value": value,
            }
        )

    return {
        "items": item_values,
        "total_value": round(total_value, 2),
    }


def display_medicines(medicines, title="PHARMACY MEDICINE INVENTORY"):
    """Display a formatted table of medicines with stock, value, and expiry status."""
    print_header(title)
    if not medicines:
        print("  No medicines found.")
        return

    headers = (
        "ID",
        "Medicine Name",
        "Category",
        "Form",
        "Qty",
        "Min",
        "Price",
        "Value",
        "Expiry",
        "Status",
    )
    rows = []
    for med in medicines:
        status = classify_expiry_status(med["expiry_date"])
        if status == "Expiring Within 7 Days":
            short_status = "Exp <=7d"
        elif status == "Expiring Within 30 Days":
            short_status = "Exp <=30d"
        else:
            short_status = status

        if med["quantity"] == 0:
            short_status += " | OUT"
        elif med["quantity"] <= med["minimum_stock"]:
            short_status += " | LOW"

        rows.append(
            [
                med["medicine_id"],
                med["medicine_name"],
                med["category"],
                med["form"],
                med["quantity"],
                med["minimum_stock"],
                format_currency(med["unit_price"]),
                format_currency(calculate_medicine_value(med)),
                format_display_date(med["expiry_date"]),
                short_status,
            ]
        )

    table = format_table(
        headers=headers,
        rows=rows,
        right_align_cols=(4, 5, 6, 7),
        max_col_widths={1: 28, 2: 20},
    )
    print(table)

    valuation = calculate_inventory_value(medicines)
    categories = get_unique_categories(medicines)
    suppliers = get_unique_suppliers(medicines)
    total_units = sum(med["quantity"] for med in medicines)

    print_divider()
    print(
        f"Showing {len(medicines)} medicine(s) | Total Units: {total_units:,} | "
        f"Total Value: {format_currency(valuation['total_value'])} | "
        f"Categories: {len(categories)} | Suppliers: {len(suppliers)}"
    )


def display_medicine_details(medicine):
    """Display full details for a single medicine record."""
    days_left = get_days_until_expiry(medicine["expiry_date"])
    expiry_status = classify_expiry_status(medicine["expiry_date"])
    total_value = calculate_medicine_value(medicine)

    print_section(f"MEDICINE DETAILS: {medicine['medicine_id']} - {medicine['medicine_name']}")
    print(f"  Medicine ID        : {medicine['medicine_id']}")
    print(f"  Medicine Name      : {medicine['medicine_name']}")
    print(f"  Category           : {medicine['category']}")
    print(f"  Dosage Form        : {medicine['form']}")
    print(f"  Manufacturer       : {medicine['manufacturer']}")
    print(f"  Batch Number       : {medicine['batch_number']}")
    print(f"  Quantity in Stock  : {medicine['quantity']} units")
    print(f"  Minimum Stock      : {medicine['minimum_stock']} units")
    print(f"  Unit Price         : {format_currency(medicine['unit_price'])}")
    print(f"  Stock Value        : {format_currency(total_value)}")
    print(f"  Manufacturing Date : {format_display_date(medicine['manufacturing_date'])}")
    print(
        f"  Expiry Date        : {format_display_date(medicine['expiry_date'])} "
        f"({expiry_status}, {days_left} day(s))"
    )
    print(f"  Supplier           : {medicine['supplier']}")


def search_medicine(medicines, query, search_by="all"):
    """Search medicines by name, category, manufacturer, ID, or across all fields."""
    cleaned_query = str(query).strip().lower()
    if not cleaned_query:
        return []

    field_mode = str(search_by).strip().lower()
    if field_mode not in SEARCH_FIELDS:
        raise ValueError(
            f"Invalid search field '{search_by}'. Choose from: {', '.join(SEARCH_FIELDS)}."
        )

    matches = []
    for med in medicines:
        if field_mode == "id":
            matched = cleaned_query in med["medicine_id"].lower()
        elif field_mode == "name":
            matched = cleaned_query in med["medicine_name"].lower()
        elif field_mode == "category":
            matched = cleaned_query in med["category"].lower()
        elif field_mode == "manufacturer":
            matched = cleaned_query in med["manufacturer"].lower()
        else:
            searchable = (
                med["medicine_id"],
                med["medicine_name"],
                med["category"],
                med["manufacturer"],
                med["supplier"],
                med["batch_number"],
            )
            matched = any(cleaned_query in value.lower() for value in searchable)

        if matched:
            matches.append(med)

    return matches


def add_medicine(medicines, new_medicine):
    """Validate and add a new medicine record to the inventory list.

    Returns:
        tuple[bool, list[str]]: (success, error_messages)
    """
    existing_ids = get_existing_ids(medicines)
    is_valid, errors = validate_medicine_input(
        new_medicine,
        existing_ids=existing_ids,
        check_duplicate_id=True,
        allow_zero_quantity=False,
    )
    if not is_valid:
        return False, errors

    medicines.append(new_medicine)
    return True, []


def update_stock(medicines, medicine_id, new_quantity):
    """Update a medicine's stock quantity to a new absolute value.

    Demonstrates ValueError and KeyError handling.

    Returns:
        tuple[bool, str, dict | None]: (success, status_message, updated_record)
    """
    try:
        parsed_qty = int(new_quantity)
    except (TypeError, ValueError):
        return False, "Invalid quantity. Please enter a valid whole number.", None

    if parsed_qty < 0:
        return False, "Quantity cannot be negative.", None

    try:
        medicine = get_medicine_by_id(medicines, medicine_id)
    except KeyError:
        return False, f"Medicine not found: '{str(medicine_id).strip().upper()}'.", None

    old_quantity = medicine["quantity"]
    medicine["quantity"] = parsed_qty
    message = (
        f"Updated stock for {medicine['medicine_name']} ({medicine['medicine_id']}): "
        f"{old_quantity} -> {parsed_qty} units."
    )
    return True, message, medicine


def restock_medicine(medicines, medicine_id, added_quantity):
    """Add newly received units to an existing medicine's stock.

    Returns:
        tuple[bool, str, dict | None]: (success, status_message, updated_record)
    """
    try:
        parsed_add = int(added_quantity)
    except (TypeError, ValueError):
        return False, "Invalid restock quantity. Please enter a valid whole number.", None

    if parsed_add <= 0:
        return False, "Restock quantity must be a positive integer.", None

    try:
        medicine = get_medicine_by_id(medicines, medicine_id)
    except KeyError:
        return False, f"Medicine not found: '{str(medicine_id).strip().upper()}'.", None

    old_quantity = medicine["quantity"]
    medicine["quantity"] = old_quantity + parsed_add
    message = (
        f"Restocked {medicine['medicine_name']} ({medicine['medicine_id']}): "
        f"{old_quantity} + {parsed_add} -> {medicine['quantity']} units."
    )
    return True, message, medicine


def remove_medicine(medicines, medicine_id):
    """Remove a medicine from the inventory list by its medicine ID.

    Returns:
        tuple[bool, str, dict | None]: (success, status_message, removed_record)
    """
    try:
        medicine = get_medicine_by_id(medicines, medicine_id)
    except KeyError:
        return False, f"Medicine not found: '{str(medicine_id).strip().upper()}'.", None

    medicines.remove(medicine)
    message = (
        f"Removed {medicine['medicine_name']} ({medicine['medicine_id']}) "
        f"from active inventory."
    )
    return True, message, medicine


def check_out_of_stock(medicines):
    """Return medicines whose quantity is exactly 0."""
    return [med for med in medicines if med["quantity"] == 0]


def check_low_stock(medicines, include_out_of_stock=True):
    """Return medicines with quantity <= minimum_stock, sorted by stock deficit."""
    low_items = []
    for med in medicines:
        qty = med["quantity"]
        if qty <= med["minimum_stock"]:
            if not include_out_of_stock and qty == 0:
                continue
            low_items.append(med)
    low_items.sort(key=lambda item: (item["quantity"], item["quantity"] - item["minimum_stock"]))
    return low_items


def check_approaching_reorder(medicines, multiplier=REORDER_APPROACH_MULTIPLIER):
    """Return medicines above minimum stock but within the reorder warning buffer."""
    approaching = []
    for med in medicines:
        qty = med["quantity"]
        min_stock = med["minimum_stock"]
        threshold = int(min_stock * multiplier)
        if min_stock < qty <= threshold:
            approaching.append(med)
    approaching.sort(key=lambda item: item["quantity"] - item["minimum_stock"])
    return approaching


def check_expired_medicines(medicines, reference_date=None):
    """Return medicines whose expiry date is before today, ordered oldest first."""
    expired = []
    for med in medicines:
        if get_days_until_expiry(med["expiry_date"], reference_date=reference_date) < 0:
            expired.append(med)
    expired.sort(key=lambda item: item["expiry_date"])
    return expired


def check_expiring_soon(
    medicines,
    days=DEFAULT_EXPIRY_WARNING_DAYS,
    reference_date=None,
):
    """Return non-expired medicines expiring within the specified number of days."""
    expiring = []
    for med in medicines:
        days_left = get_days_until_expiry(med["expiry_date"], reference_date=reference_date)
        if 0 <= days_left <= days:
            expiring.append(med)
    expiring.sort(key=lambda item: item["expiry_date"])
    return expiring


def generate_inventory_summary(medicines, reference_date=None):
    """Build a nested dictionary summarizing stock, expiry, financials, and catalog sets."""
    total_medicines = len(medicines)
    total_units = sum(med["quantity"] for med in medicines)
    out_of_stock = check_out_of_stock(medicines)
    low_stock = check_low_stock(medicines, include_out_of_stock=True)
    approaching_reorder = check_approaching_reorder(medicines)

    expired = check_expired_medicines(medicines, reference_date=reference_date)
    expiring_7 = check_expiring_soon(
        medicines, days=URGENT_EXPIRY_DAYS, reference_date=reference_date
    )
    expiring_30 = check_expiring_soon(
        medicines, days=DEFAULT_EXPIRY_WARNING_DAYS, reference_date=reference_date
    )
    safe_count = total_medicines - len(expired) - len(expiring_30)

    valuation = calculate_inventory_value(medicines)
    avg_price = (
        round(sum(med["unit_price"] for med in medicines) / total_medicines, 2)
        if total_medicines
        else 0.0
    )

    categories = get_unique_categories(medicines)
    suppliers = get_unique_suppliers(medicines)
    manufacturers = get_unique_manufacturers(medicines)

    healthy_stock_count = (
        total_medicines - len(low_stock) - len(approaching_reorder)
    )

    inventory_summary = {
        "stock": {
            "total_medicines": total_medicines,
            "total_units": total_units,
            "out_of_stock": len(out_of_stock),
            "low_stock": len(low_stock),
            "approaching_reorder": len(approaching_reorder),
            "healthy_stock": max(healthy_stock_count, 0),
        },
        "expiry": {
            "expired": len(expired),
            "expiring_within_7_days": len(expiring_7),
            "expiring_within_30_days": len(expiring_30),
            "safe": max(safe_count, 0),
        },
        "financial": {
            "total_inventory_value": valuation["total_value"],
            "average_unit_price": avg_price,
        },
        "catalog": {
            "unique_categories": len(categories),
            "unique_suppliers": len(suppliers),
            "unique_manufacturers": len(manufacturers),
            "categories": sorted(categories),
            "suppliers": sorted(suppliers),
        },
    }
    return inventory_summary


def build_attention_report(medicines, reference_date=None):
    """Dynamically construct prioritized CRITICAL, WARNING, and INFO pharmacy alerts."""
    today = reference_date if reference_date is not None else date.today()
    attention = {level: [] for level in ALERT_LEVELS}

    # CRITICAL 1: Expired medicines
    for med in check_expired_medicines(medicines, reference_date=today):
        days_past = abs(get_days_until_expiry(med["expiry_date"], reference_date=today))
        display_exp = format_display_date(med["expiry_date"])
        attention["CRITICAL"].append(
            {
                "level": "CRITICAL",
                "issue_type": "Expired Medicine",
                "medicine_id": med["medicine_id"],
                "medicine_name": med["medicine_name"],
                "problem": f"Expired on {display_exp} ({days_past} day(s) ago)",
                "quantity": med["quantity"],
                "minimum_stock": med["minimum_stock"],
                "expiry_date": med["expiry_date"],
                "display_expiry_date": display_exp,
                "action": "Remove from active stock immediately and quarantine for disposal",
            }
        )

    # CRITICAL 2: Out-of-stock medicines
    for med in check_out_of_stock(medicines):
        display_exp = format_display_date(med["expiry_date"])
        reorder_qty = max(med["minimum_stock"] * 2, 20)
        attention["CRITICAL"].append(
            {
                "level": "CRITICAL",
                "issue_type": "Out of Stock",
                "medicine_id": med["medicine_id"],
                "medicine_name": med["medicine_name"],
                "problem": f"Out of stock (0 units available; minimum required: {med['minimum_stock']})",
                "quantity": med["quantity"],
                "minimum_stock": med["minimum_stock"],
                "expiry_date": med["expiry_date"],
                "display_expiry_date": display_exp,
                "action": f"Place urgent reorder of {reorder_qty} units from {med['supplier']}",
            }
        )

    # WARNING 1: Expiring within 30 days (highlighting <= 7 days as urgent)
    for med in check_expiring_soon(
        medicines, days=DEFAULT_EXPIRY_WARNING_DAYS, reference_date=today
    ):
        days_left = get_days_until_expiry(med["expiry_date"], reference_date=today)
        display_exp = format_display_date(med["expiry_date"])
        if days_left <= URGENT_EXPIRY_DAYS:
            problem = f"Expires in {days_left} day(s) on {display_exp} (URGENT <= 7 days)"
            action = "Prioritize dispensing (FEFO) or prepare return/replacement batch"
        else:
            problem = f"Expires in {days_left} day(s) on {display_exp} (within 30 days)"
            action = "Move to front shelf (FEFO) and plan replacement stock"

        attention["WARNING"].append(
            {
                "level": "WARNING",
                "issue_type": "Expiring Soon",
                "medicine_id": med["medicine_id"],
                "medicine_name": med["medicine_name"],
                "problem": problem,
                "quantity": med["quantity"],
                "minimum_stock": med["minimum_stock"],
                "expiry_date": med["expiry_date"],
                "display_expiry_date": display_exp,
                "action": action,
            }
        )

    # WARNING 2: Low-stock medicines (quantity > 0 and quantity <= minimum_stock)
    for med in check_low_stock(medicines, include_out_of_stock=False):
        display_exp = format_display_date(med["expiry_date"])
        suggested_order = max((med["minimum_stock"] * 2) - med["quantity"], med["minimum_stock"])
        attention["WARNING"].append(
            {
                "level": "WARNING",
                "issue_type": "Low Stock",
                "medicine_id": med["medicine_id"],
                "medicine_name": med["medicine_name"],
                "problem": f"Low stock ({med['quantity']} units <= minimum {med['minimum_stock']})",
                "quantity": med["quantity"],
                "minimum_stock": med["minimum_stock"],
                "expiry_date": med["expiry_date"],
                "display_expiry_date": display_exp,
                "action": f"Restock approximately {suggested_order} units from {med['supplier']}",
            }
        )

    # INFO: Approaching reorder level (active non-expired stock only)
    expired_ids = {
        med["medicine_id"]
        for med in check_expired_medicines(medicines, reference_date=today)
    }
    for med in check_approaching_reorder(medicines):
        if med["medicine_id"] in expired_ids:
            continue
        display_exp = format_display_date(med["expiry_date"])
        buffer_left = med["quantity"] - med["minimum_stock"]
        attention["INFO"].append(
            {
                "level": "INFO",
                "issue_type": "Approaching Reorder Level",
                "medicine_id": med["medicine_id"],
                "medicine_name": med["medicine_name"],
                "problem": (
                    f"Approaching minimum stock ({med['quantity']} units; "
                    f"only {buffer_left} above minimum {med['minimum_stock']})"
                ),
                "quantity": med["quantity"],
                "minimum_stock": med["minimum_stock"],
                "expiry_date": med["expiry_date"],
                "display_expiry_date": display_exp,
                "action": f"Schedule routine purchase order with {med['supplier']}",
            }
        )

    return attention


def display_attention_dashboard(medicines, reference_date=None):
    """Display the prioritized 'WHAT NEEDS ATTENTION' pharmacy dashboard."""
    today = reference_date if reference_date is not None else date.today()
    attention = build_attention_report(medicines, reference_date=today)

    print_header(
        "WHAT NEEDS ATTENTION",
        subtitle=f"Live Pharmacy Action Dashboard (As of {today.strftime('%d-%m-%Y')})",
    )

    section_meta = (
        ("CRITICAL", "Expired medicines & Out-of-stock medicines"),
        ("WARNING", "Medicines expiring within 30 days & Low-stock medicines"),
        ("INFO", "Medicines approaching reorder level"),
    )

    total_alerts = 0
    for level, description in section_meta:
        alerts = attention[level]
        total_alerts += len(alerts)
        print_section(f"{level} ({len(alerts)}) - {description}")

        if not alerts:
            print(f"  No {level.lower()} issues detected.")
            continue

        for alert in alerts:
            print(f"  [{level}] {alert['medicine_name']} ({alert['medicine_id']})")
            print(f"    Problem     : {alert['problem']}")
            print(
                f"    Quantity    : {alert['quantity']} units "
                f"(Minimum: {alert['minimum_stock']})"
            )
            print(f"    Expiry Date : {alert['display_expiry_date']}")
            print(f"    Action      : {alert['action']}")
            print()

    print_divider()
    print(
        f"Total Attention Items: {total_alerts} | "
        f"CRITICAL: {len(attention['CRITICAL'])} | "
        f"WARNING: {len(attention['WARNING'])} | "
        f"INFO: {len(attention['INFO'])}"
    )


def display_low_stock_alerts(medicines):
    """Display detailed out-of-stock, low-stock, and approaching-reorder tables."""
    out_of_stock = check_out_of_stock(medicines)
    low_stock = check_low_stock(medicines, include_out_of_stock=False)
    approaching = check_approaching_reorder(medicines)

    print_header("LOW STOCK & REORDER ALERTS")

    print_section(f"[CRITICAL] OUT OF STOCK ({len(out_of_stock)})")
    if out_of_stock:
        rows = [
            [
                m["medicine_id"],
                m["medicine_name"],
                m["category"],
                m["quantity"],
                m["minimum_stock"],
                m["supplier"],
            ]
            for m in out_of_stock
        ]
        print(
            format_table(
                ("ID", "Medicine Name", "Category", "Qty", "Min Stock", "Supplier"),
                rows,
                right_align_cols=(3, 4),
            )
        )
    else:
        print("  No out-of-stock medicines.")

    print_section(f"[WARNING] LOW STOCK (Qty <= Minimum Stock) ({len(low_stock)})")
    if low_stock:
        rows = [
            [
                m["medicine_id"],
                m["medicine_name"],
                m["category"],
                m["quantity"],
                m["minimum_stock"],
                m["minimum_stock"] - m["quantity"],
                m["supplier"],
            ]
            for m in low_stock
        ]
        print(
            format_table(
                ("ID", "Medicine Name", "Category", "Qty", "Min", "Deficit", "Supplier"),
                rows,
                right_align_cols=(3, 4, 5),
            )
        )
    else:
        print("  No low-stock medicines.")

    print_section(f"[INFO] APPROACHING REORDER LEVEL ({len(approaching)})")
    if approaching:
        rows = [
            [
                m["medicine_id"],
                m["medicine_name"],
                m["quantity"],
                m["minimum_stock"],
                m["quantity"] - m["minimum_stock"],
                m["supplier"],
            ]
            for m in approaching
        ]
        print(
            format_table(
                ("ID", "Medicine Name", "Qty", "Min", "Buffer", "Supplier"),
                rows,
                right_align_cols=(2, 3, 4),
            )
        )
    else:
        print("  No medicines currently approaching reorder threshold.")


def display_expiry_alerts(medicines, reference_date=None):
    """Display expired, expiring within 7 days, and expiring within 30 days tables."""
    today = reference_date if reference_date is not None else date.today()
    expired = check_expired_medicines(medicines, reference_date=today)
    expiring_7 = check_expiring_soon(
        medicines, days=URGENT_EXPIRY_DAYS, reference_date=today
    )
    expiring_30_all = check_expiring_soon(
        medicines, days=DEFAULT_EXPIRY_WARNING_DAYS, reference_date=today
    )
    expiring_8_to_30 = [
        med
        for med in expiring_30_all
        if get_days_until_expiry(med["expiry_date"], reference_date=today)
        > URGENT_EXPIRY_DAYS
    ]
    safe_count = len(medicines) - len(expired) - len(expiring_30_all)

    print_header("EXPIRY ALERTS", subtitle=f"Evaluated dynamically on {today.strftime('%d-%m-%Y')}")

    print_section(f"[CRITICAL] EXPIRED MEDICINES ({len(expired)})")
    if expired:
        rows = []
        for med in expired:
            days_ago = abs(get_days_until_expiry(med["expiry_date"], reference_date=today))
            rows.append(
                [
                    med["medicine_id"],
                    med["medicine_name"],
                    med["batch_number"],
                    med["quantity"],
                    format_display_date(med["expiry_date"]),
                    f"{days_ago}d ago",
                    format_currency(calculate_medicine_value(med)),
                ]
            )
        print(
            format_table(
                ("ID", "Medicine Name", "Batch", "Qty", "Expired On", "Overdue", "Value at Risk"),
                rows,
                right_align_cols=(3, 6),
            )
        )
    else:
        print("  No expired medicines found.")

    print_section(f"[URGENT WARNING] EXPIRING WITHIN 7 DAYS ({len(expiring_7)})")
    if expiring_7:
        rows = []
        for med in expiring_7:
            days_left = get_days_until_expiry(med["expiry_date"], reference_date=today)
            rows.append(
                [
                    med["medicine_id"],
                    med["medicine_name"],
                    med["batch_number"],
                    med["quantity"],
                    format_display_date(med["expiry_date"]),
                    f"{days_left}d left",
                    format_currency(calculate_medicine_value(med)),
                ]
            )
        print(
            format_table(
                ("ID", "Medicine Name", "Batch", "Qty", "Expiry Date", "Remaining", "Value"),
                rows,
                right_align_cols=(3, 6),
            )
        )
    else:
        print("  No medicines expiring within 7 days.")

    print_section(f"[WARNING] EXPIRING IN 8 TO 30 DAYS ({len(expiring_8_to_30)})")
    if expiring_8_to_30:
        rows = []
        for med in expiring_8_to_30:
            days_left = get_days_until_expiry(med["expiry_date"], reference_date=today)
            rows.append(
                [
                    med["medicine_id"],
                    med["medicine_name"],
                    med["batch_number"],
                    med["quantity"],
                    format_display_date(med["expiry_date"]),
                    f"{days_left}d left",
                    format_currency(calculate_medicine_value(med)),
                ]
            )
        print(
            format_table(
                ("ID", "Medicine Name", "Batch", "Qty", "Expiry Date", "Remaining", "Value"),
                rows,
                right_align_cols=(3, 6),
            )
        )
    else:
        print("  No medicines expiring in 8 to 30 days.")

    print_divider()
    print(
        f"Expiry Summary -> Expired: {len(expired)} | <= 7 Days: {len(expiring_7)} | "
        f"8-30 Days: {len(expiring_8_to_30)} | Safe (> 30 Days): {max(safe_count, 0)}"
    )
