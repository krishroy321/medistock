"""Utility helpers for formatting, date handling, and input validation.

Provides reusable functions for:
- Dynamic date parsing and expiry status classification
- Strict validation of medicine fields (with ValueError handling)
- Safe interactive terminal prompts with cancel support
- Clean tabular terminal rendering
"""

from datetime import date, datetime

from models import (
    CURRENCY_SYMBOL,
    DATE_FORMAT,
    DEFAULT_EXPIRY_WARNING_DAYS,
    DISPLAY_DATE_FORMAT,
    MEDICINE_FORMS,
    URGENT_EXPIRY_DAYS,
)

CANCEL_KEYWORDS = ("cancel", "q", "quit")


def print_divider(char="-", width=80):
    """Print a horizontal separator line."""
    print(char * width)


def print_header(title, subtitle="", width=80):
    """Print a prominent centered section header."""
    print()
    print("=" * width)
    print(title.center(width))
    if subtitle:
        print(subtitle.center(width))
    print("=" * width)


def print_section(title, width=80):
    """Print a clean sub-section heading."""
    print()
    print(title)
    print("-" * width)


def format_currency(amount):
    """Format a numeric amount as currency string."""
    return f"{CURRENCY_SYMBOL}{float(amount):,.2f}"


def parse_date(date_str):
    """Parse a date string in YYYY-MM-DD or DD-MM-YYYY format into a date object.

    Raises ValueError if the date string is empty or invalid.
    """
    if not isinstance(date_str, str) or not date_str.strip():
        raise ValueError("Date cannot be empty. Use YYYY-MM-DD (e.g., 2027-06-30).")

    cleaned = date_str.strip()
    for fmt in (DATE_FORMAT, DISPLAY_DATE_FORMAT):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue

    raise ValueError(
        f"Invalid date '{cleaned}'. Expected YYYY-MM-DD (e.g., 2027-06-30) "
        f"or DD-MM-YYYY (e.g., 30-06-2027)."
    )


def normalize_date_str(date_str):
    """Validate and normalize a date string into ISO YYYY-MM-DD format."""
    parsed = parse_date(date_str)
    return parsed.strftime(DATE_FORMAT)


def format_display_date(date_str):
    """Convert an ISO date string (YYYY-MM-DD) into DD-MM-YYYY for display."""
    try:
        return parse_date(date_str).strftime(DISPLAY_DATE_FORMAT)
    except ValueError:
        return str(date_str)


def get_days_until_expiry(expiry_date_str, reference_date=None):
    """Calculate the number of days remaining until expiry using today's date dynamically."""
    today = reference_date if reference_date is not None else date.today()
    expiry = parse_date(expiry_date_str)
    return (expiry - today).days


def classify_expiry_status(expiry_date_str, reference_date=None):
    """Classify expiry status into Expired, Expiring Within 7 Days, Expiring Within 30 Days, or Safe."""
    days_left = get_days_until_expiry(expiry_date_str, reference_date=reference_date)
    if days_left < 0:
        return "Expired"
    if days_left <= URGENT_EXPIRY_DAYS:
        return "Expiring Within 7 Days"
    if days_left <= DEFAULT_EXPIRY_WARNING_DAYS:
        return "Expiring Within 30 Days"
    return "Safe"


def validate_medicine_input(
    record,
    existing_ids=None,
    check_duplicate_id=True,
    allow_zero_quantity=False,
):
    """Validate all fields of a medicine dictionary.

    Args:
        record (dict): Candidate medicine dictionary.
        existing_ids (set | None): Set of uppercase IDs already in inventory.
        check_duplicate_id (bool): Whether to reject an ID already present in existing_ids.
        allow_zero_quantity (bool): Whether quantity == 0 is allowed (False when adding new stock).

    Returns:
        tuple[bool, list[str]]: (is_valid, list_of_error_messages)
    """
    errors = []
    existing_ids_upper = {str(item).upper() for item in (existing_ids or set())}

    # 1. Required non-empty text fields
    required_text_fields = (
        ("medicine_id", "Medicine ID"),
        ("medicine_name", "Medicine name"),
        ("category", "Category"),
        ("form", "Dosage form"),
        ("manufacturer", "Manufacturer"),
        ("batch_number", "Batch number"),
        ("supplier", "Supplier"),
    )

    for key, label in required_text_fields:
        value = str(record.get(key, "")).strip()
        if not value:
            errors.append(f"{label} cannot be empty.")

    # 2. Medicine ID format and uniqueness
    med_id = str(record.get("medicine_id", "")).strip().upper()
    if med_id:
        allowed_chars = all(ch.isalnum() or ch in ("-", "_") for ch in med_id)
        if not allowed_chars:
            errors.append(
                "Medicine ID must contain only letters, numbers, hyphens, or underscores."
            )
        if check_duplicate_id and med_id in existing_ids_upper:
            errors.append(f"Medicine ID '{med_id}' already exists. IDs must be unique.")

    # 3. Dosage form check against MEDICINE_FORMS tuple
    form_val = str(record.get("form", "")).strip()
    valid_forms_map = {form.lower(): form for form in MEDICINE_FORMS}
    if form_val and form_val.lower() not in valid_forms_map:
        errors.append(
            f"Invalid dosage form '{form_val}'. Valid forms: {', '.join(MEDICINE_FORMS)}."
        )

    # 4. Quantity check
    try:
        qty = int(record.get("quantity"))
        if allow_zero_quantity:
            if qty < 0:
                errors.append("Quantity cannot be negative.")
        else:
            if qty <= 0:
                errors.append("Quantity must be a positive integer.")
    except (TypeError, ValueError):
        errors.append("Quantity must be a valid integer.")

    # 5. Minimum stock check
    try:
        min_stock = int(record.get("minimum_stock"))
        if min_stock <= 0:
            errors.append("Minimum stock must be a positive integer.")
    except (TypeError, ValueError):
        errors.append("Minimum stock must be a valid integer.")

    # 6. Unit price check
    try:
        price = float(record.get("unit_price"))
        if price <= 0:
            errors.append("Unit price must be a positive number.")
    except (TypeError, ValueError):
        errors.append("Unit price must be a valid number.")

    # 7. Manufacturing and expiry dates
    mfg_date = None
    exp_date = None
    try:
        mfg_date = parse_date(str(record.get("manufacturing_date", "")))
    except ValueError as err:
        errors.append(f"Manufacturing date error: {err}")

    try:
        exp_date = parse_date(str(record.get("expiry_date", "")))
    except ValueError as err:
        errors.append(f"Expiry date error: {err}")

    if mfg_date is not None and exp_date is not None and exp_date <= mfg_date:
        errors.append("Expiry date must be later than the manufacturing date.")

    return (len(errors) == 0, errors)


def truncate_text(text, max_width):
    """Truncate text neatly with ellipsis if it exceeds max_width."""
    text_str = str(text)
    if len(text_str) <= max_width:
        return text_str
    if max_width <= 3:
        return text_str[:max_width]
    return text_str[: max_width - 3] + "..."


def format_table(headers, rows, right_align_cols=None, max_col_widths=None):
    """Format rows and headers into a clean aligned text table."""
    right_cols = set(right_align_cols or ())
    max_widths = max_col_widths or {}

    col_count = len(headers)
    processed_rows = []
    col_widths = [len(str(header)) for header in headers]

    for row in rows:
        formatted_row = []
        for idx in range(col_count):
            cell_text = str(row[idx])
            if idx in max_widths:
                cell_text = truncate_text(cell_text, max_widths[idx])
            formatted_row.append(cell_text)
            if len(cell_text) > col_widths[idx]:
                col_widths[idx] = len(cell_text)
        processed_rows.append(formatted_row)

    def _build_line(cells):
        parts = []
        for idx, cell in enumerate(cells):
            width = col_widths[idx]
            if idx in right_cols:
                parts.append(cell.rjust(width))
            else:
                parts.append(cell.ljust(width))
        return " | ".join(parts)

    header_line = _build_line([str(h) for h in headers])
    separator_line = "-+-".join("-" * width for width in col_widths)
    lines = [header_line, separator_line]
    for row in processed_rows:
        lines.append(_build_line(row))
    return "\n".join(lines)


def _is_cancel(raw_value):
    """Check if the user entered a cancel keyword."""
    return raw_value.strip().lower() in CANCEL_KEYWORDS


def prompt_non_empty(prompt_text, default=None, allow_cancel=True):
    """Prompt until a non-empty string is entered, or return None if cancelled."""
    while True:
        suffix = f" [default: {default}]" if default else ""
        raw = input(f"{prompt_text}{suffix}: ").strip()

        if allow_cancel and _is_cancel(raw):
            return None
        if not raw and default is not None:
            return default
        if not raw:
            print("  [Error] This field cannot be empty. Please try again (or type 'cancel').")
            continue
        return raw


def prompt_medicine_id(prompt_text, existing_ids, default=None, allow_cancel=True):
    """Prompt for a valid, unique medicine ID, or return None if cancelled."""
    existing_upper = {item.upper() for item in existing_ids}
    while True:
        value = prompt_non_empty(prompt_text, default=default, allow_cancel=allow_cancel)
        if value is None:
            return None

        candidate = value.upper()
        if not all(ch.isalnum() or ch in ("-", "_") for ch in candidate):
            print("  [Error] Medicine ID may only contain letters, digits, '-' or '_'.")
            continue
        if candidate in existing_upper:
            print(f"  [Error] Medicine ID '{candidate}' already exists. Please enter a unique ID.")
            continue
        return candidate


def prompt_positive_int(prompt_text, allow_zero=False, allow_cancel=True):
    """Prompt until a valid positive (or non-negative) integer is entered."""
    while True:
        raw = input(f"{prompt_text}: ").strip()
        if allow_cancel and _is_cancel(raw):
            return None
        try:
            value = int(raw)
        except ValueError:
            print("  [Error] Invalid quantity. Please enter a valid whole number.")
            continue

        if allow_zero:
            if value < 0:
                print("  [Error] Value cannot be negative. Please enter 0 or a positive integer.")
                continue
        else:
            if value <= 0:
                print("  [Error] Quantity must be a positive integer.")
                continue
        return value


def prompt_positive_float(prompt_text, allow_cancel=True):
    """Prompt until a valid positive float is entered."""
    while True:
        raw = input(f"{prompt_text}: ").strip()
        if allow_cancel and _is_cancel(raw):
            return None
        try:
            value = float(raw)
        except ValueError:
            print("  [Error] Invalid price. Please enter a valid numeric value.")
            continue

        if value <= 0:
            print("  [Error] Price must be a positive number.")
            continue
        return round(value, 2)


def prompt_date(prompt_text, after_date_str=None, allow_cancel=True):
    """Prompt until a valid date is entered, returning ISO YYYY-MM-DD string."""
    min_date = parse_date(after_date_str) if after_date_str else None
    while True:
        raw = input(f"{prompt_text} (YYYY-MM-DD): ").strip()
        if allow_cancel and _is_cancel(raw):
            return None
        try:
            parsed = parse_date(raw)
        except ValueError as err:
            print(f"  [Error] {err}")
            continue

        if min_date is not None and parsed <= min_date:
            print(
                f"  [Error] Date must be later than {min_date.strftime(DATE_FORMAT)}."
            )
            continue
        return parsed.strftime(DATE_FORMAT)


def prompt_choice_from_tuple(
    prompt_text,
    options_tuple,
    allow_custom=False,
    allow_cancel=True,
):
    """Display numbered options from a tuple and return the selected item."""
    print(f"\n  Available options for {prompt_text}:")
    for idx, option in enumerate(options_tuple, start=1):
        print(f"    {idx:2d}. {option}")
    if allow_custom:
        print("     0. Enter custom value")

    lookup_by_name = {opt.lower(): opt for opt in options_tuple}

    while True:
        raw = input(f"  Select {prompt_text} (number or name): ").strip()
        if allow_cancel and _is_cancel(raw):
            return None
        if not raw:
            print("  [Error] Selection cannot be empty.")
            continue

        # Allow entering option name directly
        if raw.lower() in lookup_by_name:
            return lookup_by_name[raw.lower()]

        try:
            choice = int(raw)
        except ValueError:
            if allow_custom:
                return raw
            print("  [Error] Please enter a valid option number or exact option name.")
            continue

        if allow_custom and choice == 0:
            custom_val = prompt_non_empty(f"  Enter custom {prompt_text}", allow_cancel=allow_cancel)
            return custom_val

        if 1 <= choice <= len(options_tuple):
            return options_tuple[choice - 1]

        print(f"  [Error] Please choose a number between 1 and {len(options_tuple)}.")


def prompt_confirmation(prompt_text):
    """Ask a yes/no confirmation question and return True for yes, False for no."""
    while True:
        raw = input(f"{prompt_text} (y/n): ").strip().lower()
        if raw in ("y", "yes"):
            return True
        if raw in ("n", "no"):
            return False
        print("  [Error] Please enter 'y' for yes or 'n' for no.")
