"""Data model definitions, immutable constants, and record helpers for MediStock.

Demonstrates Python Tuples (for fixed domain vocabularies and schema fields),
Dictionaries (for medicine records), Lists (for medicine collections), and
Sets (for extracting unique categories, suppliers, manufacturers, and IDs).
"""

# Immutable tuple defining the exact CSV schema column order
CSV_FIELDS = (
    "medicine_id",
    "medicine_name",
    "category",
    "form",
    "manufacturer",
    "batch_number",
    "quantity",
    "minimum_stock",
    "unit_price",
    "manufacturing_date",
    "expiry_date",
    "supplier",
)

# Immutable tuple of supported pharmaceutical dosage forms
MEDICINE_FORMS = (
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Cream",
    "Drops",
    "Powder",
    "Inhaler",
    "Solution",
    "Supplies",
)

# Immutable tuple of standard pharmacy categories
MEDICINE_CATEGORIES = (
    "Analgesic",
    "Antibiotic",
    "Antihistamine",
    "Antacid",
    "Antidiabetic",
    "Vitamin & Supplement",
    "Cardiovascular",
    "Respiratory",
    "Dermatological",
    "Ophthalmic",
    "Antiseptic & First Aid",
    "Hydration & Electrolyte",
    "Medical Supplies",
)

# Immutable tuple of expiry classification labels
EXPIRY_STATUSES = (
    "Expired",
    "Expiring Within 7 Days",
    "Expiring Within 30 Days",
    "Safe",
)

# Immutable tuple of attention alert severity levels
ALERT_LEVELS = ("CRITICAL", "WARNING", "INFO")

# Immutable tuple of supported search fields
SEARCH_FIELDS = ("all", "name", "category", "manufacturer", "id")

# Date and threshold constants
DATE_FORMAT = "%Y-%m-%d"
DISPLAY_DATE_FORMAT = "%d-%m-%Y"
URGENT_EXPIRY_DAYS = 7
DEFAULT_EXPIRY_WARNING_DAYS = 30
REORDER_APPROACH_MULTIPLIER = 1.5
CURRENCY_SYMBOL = "₹"


def create_medicine_record(
    medicine_id,
    medicine_name,
    category,
    form,
    manufacturer,
    batch_number,
    quantity,
    minimum_stock,
    unit_price,
    manufacturing_date,
    expiry_date,
    supplier,
):
    """Create and return a standardized medicine dictionary."""
    return {
        "medicine_id": str(medicine_id).strip().upper(),
        "medicine_name": str(medicine_name).strip(),
        "category": str(category).strip(),
        "form": str(form).strip(),
        "manufacturer": str(manufacturer).strip(),
        "batch_number": str(batch_number).strip().upper(),
        "quantity": int(quantity),
        "minimum_stock": int(minimum_stock),
        "unit_price": round(float(unit_price), 2),
        "manufacturing_date": str(manufacturing_date).strip(),
        "expiry_date": str(expiry_date).strip(),
        "supplier": str(supplier).strip(),
    }


def get_unique_categories(medicines):
    """Return a set of all unique medicine categories in the inventory."""
    return {medicine["category"] for medicine in medicines if medicine.get("category")}


def get_unique_suppliers(medicines):
    """Return a set of all unique suppliers in the inventory."""
    return {medicine["supplier"] for medicine in medicines if medicine.get("supplier")}


def get_unique_manufacturers(medicines):
    """Return a set of all unique manufacturers in the inventory."""
    return {
        medicine["manufacturer"]
        for medicine in medicines
        if medicine.get("manufacturer")
    }


def get_unique_forms(medicines):
    """Return a set of all unique dosage forms currently in stock."""
    return {medicine["form"] for medicine in medicines if medicine.get("form")}


def get_existing_ids(medicines):
    """Return a set of existing uppercase medicine IDs for duplicate checking."""
    return {medicine["medicine_id"].upper() for medicine in medicines}


def get_default_sample_medicines():
    """Return a small fallback list of realistic medicines used only if CSV is missing."""
    return [
        create_medicine_record(
            medicine_id="MED001",
            medicine_name="Paracetamol 500mg",
            category="Analgesic",
            form="Tablet",
            manufacturer="GlaxoSmithKline",
            batch_number="BCH-2501A",
            quantity=120,
            minimum_stock=40,
            unit_price=1.50,
            manufacturing_date="2025-05-15",
            expiry_date="2027-05-15",
            supplier="MedLine Distributors",
        ),
        create_medicine_record(
            medicine_id="MED002",
            medicine_name="Amoxicillin 500mg",
            category="Antibiotic",
            form="Capsule",
            manufacturer="Cipla Ltd",
            batch_number="BCH-2412B",
            quantity=20,
            minimum_stock=30,
            unit_price=4.80,
            manufacturing_date="2024-12-08",
            expiry_date="2026-12-08",
            supplier="Apollo Wholesale Pharma",
        ),
        create_medicine_record(
            medicine_id="MED003",
            medicine_name="Cetirizine 10mg",
            category="Antihistamine",
            form="Tablet",
            manufacturer="Dr. Reddy's",
            batch_number="BCH-2506D",
            quantity=95,
            minimum_stock=30,
            unit_price=2.20,
            manufacturing_date="2025-06-20",
            expiry_date="2027-06-20",
            supplier="HealthBridge Supply Co.",
        ),
        create_medicine_record(
            medicine_id="MED004",
            medicine_name="Ibuprofen 400mg",
            category="Analgesic",
            form="Tablet",
            manufacturer="Abbott Healthcare",
            batch_number="BCH-2411E",
            quantity=35,
            minimum_stock=25,
            unit_price=2.75,
            manufacturing_date="2024-11-15",
            expiry_date="2026-11-15",
            supplier="MedLine Distributors",
        ),
        create_medicine_record(
            medicine_id="MED005",
            medicine_name="Metformin 500mg",
            category="Antidiabetic",
            form="Tablet",
            manufacturer="Sanofi",
            batch_number="BCH-2509G",
            quantity=0,
            minimum_stock=40,
            unit_price=3.40,
            manufacturing_date="2025-09-01",
            expiry_date="2027-09-01",
            supplier="CarePlus Medical Logistics",
        ),
    ]
