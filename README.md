# MediStock — Pharmacy Inventory & Expiry Alert System

## Problem Statement

Small and mid-sized pharmacies manage dozens to hundreds of medicines across varying dosage forms, suppliers, batch numbers, reorder thresholds, and expiry dates. Relying on manual ledgers or static spreadsheets frequently leads to three costly operational failures:

1. **Expired stock remaining on active shelves**, risking patient safety and financial write-offs.
2. **Unexpected stock-outs of essential medicines** when reorder thresholds are missed.
3. **Limited visibility into inventory valuation, category concentration, and supplier dependency.**

**MediStock** solves these problems through a structured, terminal-based Python application that maintains persistent CSV inventory records, dynamically evaluates expiry and reorder risks against the current date, performs statistical analysis with Pandas and NumPy, and produces actionable charts and reports.

---

## Objectives

- Build a clean, modular Python 3 command-line pharmacy inventory system with `main.py` as the primary entry point.
- Persist all inventory records reliably in CSV format (`data/medicines.csv`) with optional JSON export.
- Implement full CRUD operations (View, Search, Add, Update Stock, Restock, Remove) backed by strict input validation and exception handling.
- Provide a live prioritized **"What Needs Attention"** dashboard separating `CRITICAL`, `WARNING`, and `INFO` alerts dynamically computed from real inventory data.
- Demonstrate core Python programming concepts: control flow, modular functions, lists, tuples, sets, dictionaries, nested dictionaries, file handling, and exception handling.
- Analyze pharmacy stock data with **Pandas** and **NumPy**, visualize key metrics with **Matplotlib**, and export structured inventory reports.

---

## Features

- **Full Inventory Management (CRUD)**
  - View all medicines in a clean, formatted table with live stock valuation and status indicators.
  - Search medicines by medicine name, category, manufacturer, medicine ID, or across all fields.
  - Add new medicines with automatic unique ID suggestion and strict validation.
  - Update stock (`current stock -> new stock`) and restock (`current stock + received quantity`).
  - Safely remove medicines after reviewing details and confirming deletion.
- **What Needs Attention (Priority Alert System)**
  - **CRITICAL**: Expired medicines and out-of-stock medicines (`quantity == 0`).
  - **WARNING**: Medicines expiring within 30 days (highlighting urgent items `<= 7 days`) and low-stock medicines (`quantity <= minimum_stock`).
  - **INFO**: Active medicines approaching their reorder level (`minimum_stock < quantity <= 1.5 * minimum_stock`).
- **Dynamic Expiry & Low-Stock Tracking**
  - Uses `datetime.date.today()` dynamically to classify items as `Expired`, `Expiring Within 7 Days`, `Expiring Within 30 Days`, or `Safe`.
- **Data Analysis (Pandas & NumPy)**
  - Computes inventory totals, unit price statistics (mean, median, standard deviation, min/max), stock quantity distributions, item valuation percentiles, category rollups, supplier portfolio shares, and highest-value medicines.
- **Automated Visualizations (Matplotlib)**
  - Generates four labeled, high-resolution PNG charts in `charts/`.
- **Report Generation**
  - Exports structured CSV summary reports (`reports/inventory_report.csv`), formatted text executive reports (`reports/inventory_report.txt`), and JSON snapshots (`reports/inventory_export.json`).

---

## Technologies Used

- **Python 3** (standard library: `csv`, `json`, `datetime`, `pathlib`)
- **Pandas** — DataFrame aggregations (`groupby`, `mean`, `sum`, `count`, `sort_values`, `value_counts`)
- **NumPy** — Array statistics (`np.mean`, `np.median`, `np.std`, `np.min`, `np.max`, `np.percentile`, `np.sum`) and vectorized classification (`np.select`)
- **Matplotlib** — Automated chart generation saved directly to `charts/`

---

## Project Structure

```text
medistock/
│
├── main.py                  # Interactive CLI entry point & menu workflow
├── models.py                # Immutable tuples, medicine dict factory, set helpers
├── utils.py                 # Input validation, dynamic date helpers, table formatting
├── data_manager.py          # CSV persistence, JSON export, report generation, file error recovery
├── inventory.py             # CRUD operations, search, valuation, alert & attention engine
├── analysis.py              # Pandas & NumPy analytics (also runnable standalone)
├── visualization.py         # Matplotlib chart generators (also runnable standalone)
├── requirements.txt         # Minimal required Python dependencies
├── README.md                # Project documentation
│
├── data/
│   └── medicines.csv        # 40 realistic pharmacy medicine records
│
├── reports/
│   ├── inventory_report.csv # Generated CSV summary report
│   ├── inventory_report.txt # Generated executive text report
│   └── inventory_export.json# Generated JSON inventory snapshot
│
└── charts/
    ├── medicines_by_category.png
    ├── stock_by_category.png
    ├── inventory_value_by_category.png
    └── expiry_status.png
```

---

## How to Install

1. Ensure Python 3.10+ is installed on your system.
2. (Recommended) Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
```

3. Install the required packages:

```bash
pip install -r requirements.txt
```

---

## How to Run

Launch the interactive pharmacy inventory application:

```bash
python main.py
```

You can also run the analytics and chart modules independently:

```bash
python analysis.py
python visualization.py
```

---

## Sample Menu

```text
================================================================================
                                   MEDISTOCK
                    PHARMACY INVENTORY & EXPIRY ALERT SYSTEM
================================================================================
  Status: 40 medicines | Units: 2,915 | Value: $10,618.50
  Alerts: CRITICAL: 6 | WARNING: 14 | INFO: 6
--------------------------------------------------------------------------------
   1. View all medicines
   2. Search medicine
   3. Add medicine
   4. Update stock
   5. Restock medicine
   6. Remove medicine
   7. What needs attention (Priority alerts)
   8. Low stock alerts
   9. Expiry alerts
  10. Inventory analysis (Pandas & NumPy)
  11. Generate charts (Matplotlib)
  12. Generate inventory report (CSV / TXT / JSON)
   0. Exit
================================================================================
Select an option (0-12):
```

---

## Data Structures Used

All core Python data structures are actively used across the application:

- **List (`list`)**: Stores the main collection of medicine records (`medicines = []`), search results, alert queues, and validation error collections.
- **Tuple (`tuple`)**: Stores immutable domain constants in `models.py`, including `CSV_FIELDS`, `MEDICINE_FORMS`, `MEDICINE_CATEGORIES`, `EXPIRY_STATUSES`, `ALERT_LEVELS`, and `SEARCH_FIELDS`.
- **Set (`set`)**: Extracts unique categories (`{m["category"] for m in medicines}`), unique suppliers, unique manufacturers, existing uppercase medicine IDs for duplicate prevention, and expired ID sets in `models.py` and `inventory.py`.
- **Dictionary (`dict`)**: Represents each individual medicine record (`medicine_id`, `medicine_name`, `category`, `form`, `manufacturer`, `batch_number`, `quantity`, `minimum_stock`, `unit_price`, `manufacturing_date`, `expiry_date`, `supplier`) and powers O(1) ID lookup via `build_medicine_index()`.
- **Nested Dictionary**: Powers `generate_inventory_summary()` (nested `stock`, `expiry`, `financial`, and `catalog` sections) and `build_attention_report()` (nested `CRITICAL`, `WARNING`, and `INFO` lists of structured alert dictionaries).

---

## File Handling

All file operations use Python context managers (`with open(...)`) in `data_manager.py`:

- **CSV Persistence (`data/medicines.csv`)**: Loaded via `csv.DictReader` at startup and written back via `csv.DictWriter` whenever medicines are added, updated, restocked, or removed so changes persist between runs.
- **CSV & Text Reports (`reports/inventory_report.csv`, `reports/inventory_report.txt`)**: Summarizes stock counts, valuation, expiry risk, top categories, and priority alerts with generation timestamps.
- **JSON Export (`reports/inventory_export.json`)**: Exports the live inventory and metadata cleanly using `json.dump(..., indent=2)`.

---

## Exception Handling

MediStock handles runtime and input errors safely without crashing:

- **`ValueError`**: Caught when parsing non-numeric quantities (e.g., entering `abc`), non-numeric prices, invalid calendar dates, or corrupted rows inside a CSV file.
- **`FileNotFoundError`**: Caught in `load_medicines()` if `data/medicines.csv` is missing; the program explains the issue and safely initializes a fallback CSV with starter medicines so execution continues smoothly.
- **`KeyError`**: Caught when looking up a non-existent medicine ID through `get_medicine_by_id()` (displaying `Medicine not found`) or when a CSV file is missing required schema columns.
- **`OSError`, `KeyboardInterrupt`, `EOFError`**: Handled cleanly for safe filesystem errors and graceful terminal exit.

---

## Data Analysis

`analysis.py` builds an enriched Pandas DataFrame from live inventory records and combines Pandas and NumPy operations:

- **Pandas**: `groupby("category").agg(...)`, `groupby("supplier").agg(...)`, `value_counts()`, `sort_values()`, `count()`, `sum()`, `mean()`, and `pd.to_datetime()`.
- **NumPy**: `np.array()`, `np.sum()`, `np.mean()`, `np.median()`, `np.std()`, `np.min()`, `np.max()`, `np.percentile(..., [25, 50, 75])`, and vectorized `np.select()` for expiry and stock classification.

---

## Visualizations

Running option `11` from the menu (or `python visualization.py`) saves four charts into `charts/`:

1. `charts/medicines_by_category.png` — Horizontal bar chart comparing distinct medicine counts across categories with an average reference line.
2. `charts/stock_by_category.png` — Horizontal bar chart showing total stock units held per category against the category mean.
3. `charts/inventory_value_by_category.png` — Horizontal bar chart illustrating monetary valuation (`quantity × unit_price`) by category with total and average benchmarks.
4. `charts/expiry_status.png` — Color-coded bar chart comparing `Expired`, `Expiring Soon (<= 30 Days)`, and `Safe (> 30 Days)` counts and shares.

---

## Sample Output

### What Needs Attention (Excerpt)

```text
================================================================================
                              WHAT NEEDS ATTENTION
               Live Pharmacy Action Dashboard (As of 20-11-2026)
================================================================================

CRITICAL (6) - Expired medicines & Out-of-stock medicines
--------------------------------------------------------------------------------
  [CRITICAL] Ibuprofen 400mg (MED005)
    Problem     : Expired on 15-11-2026 (5 day(s) ago)
    Quantity    : 42 units (Minimum: 30)
    Expiry Date : 15-11-2026
    Action      : Remove from active stock immediately and quarantine for disposal

  [CRITICAL] Ciprofloxacin 500mg (MED017)
    Problem     : Out of stock (0 units available; minimum required: 30)
    Quantity    : 0 units (Minimum: 30)
    Expiry Date : 30-09-2027
    Action      : Place urgent reorder of 60 units from PrimeCare Pharma Distributors
```

### Pandas & NumPy Inventory Analysis (Excerpt)

```text
1. KEY METRICS & NUMPY STATISTICAL SUMMARY
--------------------------------------------------------------------------------
  Total Medicines           : 40
  Total Stock Units         : 2,915
  Total Inventory Value     : $10,618.50
  Unit Price (Mean / Med)   : $5.38 / $4.45 (Std Dev: $4.67)
  Unit Price Range          : $0.85 to $28.50
  Stock Qty (Mean / Med)    : 72.88 / 52.0 units (Min: 0, Max: 240, Std Dev: 60.83)
  Item Value Percentiles    : 25th=$115.42 | 50th=$203.20 | 75th=$337.50

  Stock Health Counts       : Out of Stock=2 | Low Stock (<=Min)=8 | Approaching Reorder=10
  Expiry Health Counts      : Expired=4 (Value at Risk: $377.10) | <=7d=3 | <=30d=8 | Safe=28
```

---

## Team Contribution

| Member | Assigned Module(s) | Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | `main.py`, `utils.py` | CLI menu loop, user prompts, input validation, terminal formatting |
| **Member 2** | `models.py`, `inventory.py` | Data structures, CRUD operations, search, low-stock & expiry alerts, attention dashboard |
| **Member 3** | `data_manager.py`, `data/medicines.csv` | Realistic 40-record dataset, CSV persistence, JSON export, report generation, file exception handling |
| **Member 4** | `analysis.py`, `visualization.py`, `README.md` | Pandas & NumPy analytics, Matplotlib charts, testing & documentation |

*(Update member names above before academic submission.)*

---

## Web Application

MediStock also includes a Flask web interface that uses the existing Python modules and the same `data/medicines.csv` data source.

### Run the website

```bash
pip install -r requirements.txt
python3 web/app.py
```

Open `http://127.0.0.1:5000`. For a production-style WSGI deployment, use a Flask-compatible server and set `MEDISTOCK_SECRET_KEY` to a secure environment value.

### Web routes

- `/` and `/dashboard` - dynamic dashboard and Chart.js visualizations
- `/medicines` - searchable, filterable inventory table
- `/medicines/add` - add a medicine
- `/medicines/<medicine_id>` - medicine details and stock actions
- `/medicines/<medicine_id>/edit` - edit medicine details
- `/alerts` - CRITICAL, WARNING, and INFO attention report
- `/analytics` - Pandas/NumPy category, supplier, inventory, and expiry analysis
- `/reports` - generate and download CSV, TXT, JSON, and Matplotlib PNG outputs

The web routes call `inventory.py`, `analysis.py`, `data_manager.py`, and `visualization.py`; they do not maintain a separate inventory implementation.

---

## Future Improvements

- Add batch-level transaction history logging (`sales`, `restocks`, `disposals`) to a separate CSV audit log.
- Support FEFO (First-Expired, First-Out) dispensing workflows across multiple batches of the same medicine.
- Add automated supplier purchase order draft generation for all out-of-stock and low-stock medicines.
- Implement unit tests with `pytest` or Python's built-in `unittest` module for continuous verification.
