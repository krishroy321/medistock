import os
import secrets
import sys
from datetime import date
from pathlib import Path

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    send_file,
    session,
    url_for,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from analysis import analyze_inventory
from data_manager import (
    DEFAULT_JSON_PATH,
    DEFAULT_REPORT_CSV_PATH,
    DEFAULT_REPORT_TXT_PATH,
    generate_inventory_report,
    load_medicines,
    save_medicines,
)
from inventory import (
    build_attention_report,
    calculate_inventory_value,
    check_expiring_soon,
    check_low_stock,
    find_medicine_by_id,
    restock_medicine,
    remove_medicine,
    update_stock,
)
from models import (
    MEDICINE_CATEGORIES,
    MEDICINE_FORMS,
    create_medicine_record,
)
from utils import (
    classify_expiry_status,
    format_currency,
    format_display_date,
    validate_medicine_input,
)
from visualization import generate_all_charts

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("MEDISTOCK_SECRET_KEY", "medistock-local-development")


@app.context_processor
def inject_globals():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(24)
    medicines = load_medicines()
    attention = build_attention_report(medicines)
    return {
        "csrf_token": session["csrf_token"],
        "notification_count": sum(len(attention[level]) for level in ("CRITICAL", "WARNING")),
    }


@app.before_request
def csrf_protection():
    if request.method == "POST":
        submitted = request.form.get("_csrf_token", "")
        if not submitted or not secrets.compare_digest(submitted, session.get("csrf_token", "")):
            flash("Your session expired. Please try again.", "error")
            return redirect(request.referrer or url_for("dashboard"))


@app.template_filter("display_date")
def display_date(value):
    return format_display_date(value)


@app.template_filter("money")
def money(value):
    return format_currency(value)


def get_status(medicine):
    return classify_expiry_status(medicine["expiry_date"]), {
        "quantity": medicine["quantity"],
        "minimum_stock": medicine["minimum_stock"],
    }


def validate_record(record, allow_zero_quantity=False, existing_ids=None):
    is_valid, errors = validate_medicine_input(
        record,
        existing_ids=existing_ids,
        check_duplicate_id=bool(existing_ids),
        allow_zero_quantity=allow_zero_quantity,
    )
    if record["category"] not in MEDICINE_CATEGORIES:
        errors.append("Invalid category.")
    return is_valid and not errors, errors


def build_record_from_form(form, medicine_id):
    def integer(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    def decimal(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    return create_medicine_record(
        medicine_id,
        form.get("medicine_name", ""),
        form.get("category", ""),
        form.get("form", ""),
        form.get("manufacturer", ""),
        form.get("batch_number", ""),
        integer(form.get("quantity", "")),
        integer(form.get("minimum_stock", "")),
        decimal(form.get("unit_price", "")),
        form.get("manufacturing_date", ""),
        form.get("expiry_date", ""),
        form.get("supplier", ""),
    )


@app.route("/")
@app.route("/dashboard")
def dashboard():
    medicines = load_medicines()
    analysis = analyze_inventory(medicines)
    overview = analysis["overview"]
    attention = build_attention_report(medicines)
    low_stock = check_low_stock(medicines, include_out_of_stock=False)
    expiring = check_expiring_soon(medicines, days=30)

    chart_data = {
        "category_distribution": {
            "labels": list(analysis["category_distribution"].index),
            "values": [int(value) for value in analysis["category_distribution"].values],
        },
        "stock_by_category": {
            "labels": list(analysis["stock_by_category"].index),
            "values": [int(value) for value in analysis["stock_by_category"].values],
        },
        "value_by_category": {
            "labels": list(analysis["value_by_category"].index),
            "values": [round(float(value), 2) for value in analysis["value_by_category"].values],
        },
        "expiry_distribution": {
            "labels": list(analysis["expiry_distribution"].index),
            "values": [int(value) for value in analysis["expiry_distribution"].values],
        },
    }
    urgent = attention["CRITICAL"][:6]
    return render_template(
        "dashboard.html",
        overview=overview,
        urgent=urgent,
        low_stock=low_stock,
        expiring=expiring,
        chart_data=chart_data,
    )


@app.route("/medicines")
def medicines():
    all_medicines = load_medicines()
    query = request.args.get("q", "").strip()
    search_field = request.args.get("field", "all")
    category = request.args.get("category", "")
    supplier = request.args.get("supplier", "")
    stock_status = request.args.get("stock_status", "")
    expiry_status = request.args.get("expiry_status", "")
    sort_by = request.args.get("sort", "medicine_name")

    if query:
        from inventory import search_medicine
        filtered = search_medicine(all_medicines, query, search_field)
    else:
        filtered = list(all_medicines)

    if category:
        filtered = [item for item in filtered if item["category"] == category]
    if supplier:
        filtered = [item for item in filtered if item["supplier"] == supplier]
    if stock_status:
        if stock_status == "out":
            filtered = [item for item in filtered if item["quantity"] == 0]
        elif stock_status == "low":
            filtered = [item for item in filtered if 0 < item["quantity"] <= item["minimum_stock"]]
        elif stock_status == "healthy":
            filtered = [item for item in filtered if item["quantity"] > item["minimum_stock"]]
    if expiry_status:
        filtered = [
            item for item in filtered
            if classify_expiry_status(item["expiry_date"]) == expiry_status
        ]

    sortable_fields = {
        "medicine_name": lambda item: item["medicine_name"].lower(),
        "quantity": lambda item: item["quantity"],
        "expiry_date": lambda item: item["expiry_date"],
        "unit_price": lambda item: item["unit_price"],
    }
    filtered.sort(key=sortable_fields.get(sort_by, sortable_fields["medicine_name"]))
    if request.args.get("order") == "desc":
        filtered.reverse()
    filtered = [
        {**item, "expiry_status": classify_expiry_status(item["expiry_date"])}
        for item in filtered
    ]

    categories = sorted({item["category"] for item in all_medicines})
    suppliers = sorted({item["supplier"] for item in all_medicines})
    return render_template(
        "medicines.html",
        medicines=filtered,
        categories=categories,
        suppliers=suppliers,
        filters=request.args,
    )


@app.route("/medicines/add", methods=["GET", "POST"])
def add_medicine():
    if request.method == "POST":
        medicine_id = request.form.get("medicine_id", "").strip()
        medicines = load_medicines()
        record = build_record_from_form(request.form, medicine_id)
        existing_ids = {item["medicine_id"] for item in medicines}
        is_valid, errors = validate_record(record, existing_ids=existing_ids)
        if is_valid:
            from inventory import add_medicine as add_medicine_record
            success, backend_errors = add_medicine_record(medicines, record)
            if success and save_medicines(medicines):
                flash(f"{record['medicine_name']} was added successfully.", "success")
                return redirect(url_for("medicine_details", medicine_id=record["medicine_id"]))
            errors = backend_errors or ["Unable to save the medicine."]
        for error in errors:
            flash(error, "error")
        return render_template(
            "add-medicine.html",
            medicine=record,
            categories=MEDICINE_CATEGORIES,
            forms=MEDICINE_FORMS,
        )

    return render_template(
        "add-medicine.html",
        medicine={},
        categories=MEDICINE_CATEGORIES,
        forms=MEDICINE_FORMS,
    )


@app.route("/medicines/<medicine_id>")
def medicine_details(medicine_id):
    medicines = load_medicines()
    medicine = find_medicine_by_id(medicines, medicine_id)
    if not medicine:
        flash("Medicine not found.", "error")
        return redirect(url_for("medicines"))
    expiry_status = classify_expiry_status(medicine["expiry_date"])
    inventory_value = calculate_inventory_value([medicine])
    stock_status = (
        "Out of Stock" if medicine["quantity"] == 0
        else "Low Stock" if medicine["quantity"] <= medicine["minimum_stock"]
        else "Healthy"
    )
    return render_template(
        "medicine-details.html",
        medicine=medicine,
        expiry_status=expiry_status,
        stock_status=stock_status,
        inventory_value=inventory_value,
    )


@app.route("/medicines/<medicine_id>/edit", methods=["GET", "POST"])
def edit_medicine(medicine_id):
    medicines = load_medicines()
    medicine = find_medicine_by_id(medicines, medicine_id)
    if not medicine:
        flash("Medicine not found.", "error")
        return redirect(url_for("medicines"))

    if request.method == "POST":
        record = build_record_from_form(request.form, medicine["medicine_id"])
        is_valid, errors = validate_record(record, allow_zero_quantity=True)
        if is_valid:
            medicine.update(record)
            if save_medicines(medicines):
                flash("Medicine details were updated successfully.", "success")
                return redirect(url_for("medicine_details", medicine_id=medicine_id))
            errors = ["Unable to save the medicine."]
        for error in errors:
            flash(error, "error")
        medicine = record

    return render_template(
        "edit-medicine.html",
        medicine=medicine,
        categories=MEDICINE_CATEGORIES,
        forms=MEDICINE_FORMS,
    )


@app.route("/medicines/<medicine_id>/update-stock", methods=["POST"])
def update_medicine_stock(medicine_id):
    medicines = load_medicines()
    success, message, _ = update_stock(medicines, medicine_id, request.form.get("quantity"))
    if success:
        success = save_medicines(medicines)
        if not success:
            message = "Unable to save the stock change."
    flash(message, "success" if success else "error")
    return redirect(url_for("medicine_details", medicine_id=medicine_id.upper()))


@app.route("/medicines/<medicine_id>/restock", methods=["POST"])
def restock_medicine_route(medicine_id):
    medicines = load_medicines()
    success, message, _ = restock_medicine(medicines, medicine_id, request.form.get("quantity"))
    if success:
        success = save_medicines(medicines)
        if not success:
            message = "Unable to save the restock."
    flash(message, "success" if success else "error")
    return redirect(url_for("medicine_details", medicine_id=medicine_id.upper()))


@app.route("/medicines/<medicine_id>/remove", methods=["POST"])
def remove_medicine_route(medicine_id):
    medicines = load_medicines()
    success, message, _ = remove_medicine(medicines, medicine_id)
    if success:
        success = save_medicines(medicines)
        if not success:
            message = "Unable to save the removal."
    flash(message, "success" if success else "error")
    return redirect(url_for("medicines"))


@app.route("/alerts")
def alerts():
    medicines = load_medicines()
    attention = build_attention_report(medicines)
    return render_template("alerts.html", attention=attention)


@app.route("/analytics")
def analytics():
    medicines = load_medicines()
    analysis = analyze_inventory(medicines)
    highest = analysis["highest_value_medicines"].to_dict("records")
    category_rows = [
        {
            "category": category,
            "medicine_count": int(row["medicine_count"]),
            "total_units": int(row["total_units"]),
            "avg_stock": float(row["avg_stock"]),
            "avg_price": float(row["avg_price"]),
            "total_value": float(row["total_value"]),
        }
        for category, row in analysis["category_summary"].iterrows()
    ]
    total_supplier_value = sum(
        float(row["total_value"]) for _, row in analysis["supplier_summary"].iterrows()
    )
    supplier_rows = [
        {
            "supplier": supplier,
            "medicine_count": int(row["medicine_count"]),
            "total_units": int(row["total_units"]),
            "total_value": float(row["total_value"]),
            "share": (float(row["total_value"]) / total_supplier_value * 100)
            if total_supplier_value else 0.0,
        }
        for supplier, row in analysis["supplier_summary"].iterrows()
    ]
    return render_template(
        "analysis.html",
        overview=analysis["overview"],
        category_rows=category_rows,
        supplier_rows=supplier_rows,
        highest=highest,
        chart_data={
            "categories": list(analysis["category_distribution"].index),
            "category_values": [int(value) for value in analysis["category_distribution"].values],
            "stock_categories": list(analysis["stock_by_category"].index),
            "stock_values": [int(value) for value in analysis["stock_by_category"].values],
            "value_categories": list(analysis["value_by_category"].index),
            "value_values": [round(float(value), 2) for value in analysis["value_by_category"].values],
            "expiry_labels": list(analysis["expiry_distribution"].index),
            "expiry_values": [int(value) for value in analysis["expiry_distribution"].values],
        },
    )


@app.route("/reports", methods=["GET", "POST"])
def reports():
    if request.method == "POST":
        medicines = load_medicines()
        analysis = analyze_inventory(medicines)
        attention = build_attention_report(medicines)
        try:
            generate_inventory_report(medicines, analysis, attention)
            generate_all_charts(medicines)
            flash("CSV, TXT, JSON, and Matplotlib charts were generated.", "success")
        except Exception as exc:
            app.logger.exception("Report generation failed")
            flash("Something went wrong while generating reports.", "error")
    files = []
    for label, report_type, path in (
        ("Inventory CSV Report", "csv", DEFAULT_REPORT_CSV_PATH),
        ("Inventory TXT Report", "txt", DEFAULT_REPORT_TXT_PATH),
        ("Inventory JSON Export", "json", DEFAULT_JSON_PATH),
    ):
        files.append({"label": label, "type": report_type, "path": path, "exists": path.exists(), "size": path.stat().st_size if path.exists() else 0})
    return render_template("reports.html", files=files)


@app.route("/reports/download/<report_type>")
def download_report(report_type):
    paths = {
        "csv": DEFAULT_REPORT_CSV_PATH,
        "txt": DEFAULT_REPORT_TXT_PATH,
        "json": DEFAULT_JSON_PATH,
    }
    path = paths.get(report_type)
    if path is None or not path.exists():
        flash("The requested report has not been generated yet.", "error")
        return redirect(url_for("reports"))
    return send_file(path, as_attachment=True)


@app.route("/charts/download/<chart_name>")
def download_chart(chart_name):
    allowed = {
        "medicines": "medicines_by_category.png",
        "stock": "stock_by_category.png",
        "value": "inventory_value_by_category.png",
        "expiry": "expiry_status.png",
    }
    filename = allowed.get(chart_name)
    if not filename:
        flash("Invalid chart requested.", "error")
        return redirect(url_for("dashboard"))
    path = PROJECT_ROOT / "charts" / filename
    if not path.exists():
        medicines = load_medicines()
        generate_all_charts(medicines)
    if not path.exists():
        flash("The chart could not be generated.", "error")
        return redirect(url_for("dashboard"))
    return send_file(path, mimetype="image/png", as_attachment=True)


@app.errorhandler(404)
def not_found(error):
    return render_template("error.html", title="Page not found", message="The requested page could not be found."), 404


@app.errorhandler(500)
def server_error(error):
    app.logger.exception("Unexpected server error")
    return render_template("error.html", title="Something went wrong", message="Unable to complete the request. Please try again."), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
