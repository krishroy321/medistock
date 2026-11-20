"""MediStock - Pharmacy Inventory & Expiry Alert System (Entry Point).

Run directly with:
    python main.py
"""

from analysis import analyze_inventory, display_analysis
from data_manager import generate_inventory_report, load_medicines, save_medicines
from inventory import (
    add_medicine,
    build_attention_report,
    display_attention_dashboard,
    display_expiry_alerts,
    display_low_stock_alerts,
    display_medicine_details,
    display_medicines,
    find_medicine_by_id,
    generate_inventory_summary,
    generate_next_medicine_id,
    remove_medicine,
    restock_medicine,
    search_medicine,
    update_stock,
)
from models import (
    MEDICINE_CATEGORIES,
    MEDICINE_FORMS,
    create_medicine_record,
    get_existing_ids,
)
from utils import (
    format_currency,
    print_divider,
    print_header,
    print_section,
    prompt_choice_from_tuple,
    prompt_confirmation,
    prompt_date,
    prompt_medicine_id,
    prompt_non_empty,
    prompt_positive_float,
    prompt_positive_int,
)
from visualization import generate_all_charts


def display_main_menu(medicines):
    """Render the main terminal menu along with a live inventory health banner."""
    summary = generate_inventory_summary(medicines)
    attention = build_attention_report(medicines)

    print_header("MEDISTOCK", subtitle="PHARMACY INVENTORY & EXPIRY ALERT SYSTEM")
    print(
        f"  Status: {summary['stock']['total_medicines']} medicines | "
        f"Units: {summary['stock']['total_units']:,} | "
        f"Value: {format_currency(summary['financial']['total_inventory_value'])}"
    )
    print(
        f"  Alerts: CRITICAL: {len(attention['CRITICAL'])} | "
        f"WARNING: {len(attention['WARNING'])} | "
        f"INFO: {len(attention['INFO'])}"
    )
    print_divider()
    print("   1. View all medicines")
    print("   2. Search medicine")
    print("   3. Add medicine")
    print("   4. Update stock")
    print("   5. Restock medicine")
    print("   6. Remove medicine")
    print("   7. What needs attention (Priority alerts)")
    print("   8. Low stock alerts")
    print("   9. Expiry alerts")
    print("  10. Inventory analysis (Pandas & NumPy)")
    print("  11. Generate charts (Matplotlib)")
    print("  12. Generate inventory report (CSV / TXT / JSON)")
    print("   0. Exit")
    print("=" * 80)


def handle_view_medicines(medicines):
    """Display the full medicine inventory table and summary."""
    display_medicines(medicines, title="ALL MEDICINES IN INVENTORY")


def handle_search_medicine(medicines):
    """Search medicines by name, category, manufacturer, ID, or across all fields."""
    print_header("SEARCH MEDICINE")
    print("  Search by:")
    print("    1. Medicine Name")
    print("    2. Category")
    print("    3. Manufacturer")
    print("    4. Medicine ID")
    print("    5. All Fields")
    print("    0. Back to main menu")

    mode_map = {
        "1": "name",
        "2": "category",
        "3": "manufacturer",
        "4": "id",
        "5": "all",
    }

    while True:
        choice = input("\n  Select search option (0-5): ").strip()
        if choice == "0":
            return
        if choice not in mode_map:
            print("  [Error] Invalid option. Please enter a number between 0 and 5.")
            continue

        query = prompt_non_empty(f"  Enter search term ({mode_map[choice]})")
        if query is None:
            print("  [Info] Search cancelled.")
            return

        results = search_medicine(medicines, query, search_by=mode_map[choice])
        if not results:
            print(f"\n  [Info] No medicines matched '{query}' under '{mode_map[choice]}'.")
        elif len(results) == 1:
            display_medicine_details(results[0])
        else:
            display_medicines(
                results,
                title=f"SEARCH RESULTS FOR '{query.upper()}' ({mode_map[choice].upper()})",
            )
        break


def handle_add_medicine(medicines):
    """Collect validated inputs from the user and add a new medicine to CSV."""
    print_header("ADD NEW MEDICINE", subtitle="Type 'cancel' at any prompt to abort")

    suggested_id = generate_next_medicine_id(medicines)
    existing_ids = get_existing_ids(medicines)

    med_id = prompt_medicine_id(
        "  Medicine ID", existing_ids=existing_ids, default=suggested_id
    )
    if med_id is None:
        print("  [Info] Add medicine cancelled.")
        return

    med_name = prompt_non_empty("  Medicine Name (e.g., Ibuprofen 200mg)")
    if med_name is None:
        print("  [Info] Add medicine cancelled.")
        return

    category = prompt_choice_from_tuple(
        "Category", MEDICINE_CATEGORIES, allow_custom=True
    )
    if category is None:
        print("  [Info] Add medicine cancelled.")
        return

    form = prompt_choice_from_tuple("Dosage Form", MEDICINE_FORMS, allow_custom=False)
    if form is None:
        print("  [Info] Add medicine cancelled.")
        return

    manufacturer = prompt_non_empty("  Manufacturer")
    if manufacturer is None:
        print("  [Info] Add medicine cancelled.")
        return

    batch_number = prompt_non_empty("  Batch Number (e.g., BCH-2611A)")
    if batch_number is None:
        print("  [Info] Add medicine cancelled.")
        return

    quantity = prompt_positive_int("  Initial Stock Quantity", allow_zero=False)
    if quantity is None:
        print("  [Info] Add medicine cancelled.")
        return

    minimum_stock = prompt_positive_int("  Minimum Stock Level", allow_zero=False)
    if minimum_stock is None:
        print("  [Info] Add medicine cancelled.")
        return

    unit_price = prompt_positive_float("  Unit Price")
    if unit_price is None:
        print("  [Info] Add medicine cancelled.")
        return

    manufacturing_date = prompt_date("  Manufacturing Date")
    if manufacturing_date is None:
        print("  [Info] Add medicine cancelled.")
        return

    expiry_date = prompt_date("  Expiry Date", after_date_str=manufacturing_date)
    if expiry_date is None:
        print("  [Info] Add medicine cancelled.")
        return

    supplier = prompt_non_empty("  Supplier")
    if supplier is None:
        print("  [Info] Add medicine cancelled.")
        return

    record = create_medicine_record(
        medicine_id=med_id,
        medicine_name=med_name,
        category=category,
        form=form,
        manufacturer=manufacturer,
        batch_number=batch_number,
        quantity=quantity,
        minimum_stock=minimum_stock,
        unit_price=unit_price,
        manufacturing_date=manufacturing_date,
        expiry_date=expiry_date,
        supplier=supplier,
    )

    success, errors = add_medicine(medicines, record)
    if not success:
        print("\n  [Error] Could not add medicine due to validation issues:")
        for err in errors:
            print(f"    - {err}")
        return

    if save_medicines(medicines):
        print(
            f"\n  [Success] Added '{record['medicine_name']}' ({record['medicine_id']}) "
            f"and saved changes to CSV."
        )
        display_medicine_details(record)


def handle_update_stock(medicines):
    """Update the absolute stock quantity of an existing medicine."""
    print_header("UPDATE STOCK QUANTITY", subtitle="Current Stock -> New Stock")
    med_id = prompt_non_empty("  Enter Medicine ID to update (e.g., MED001)")
    if med_id is None:
        print("  [Info] Stock update cancelled.")
        return

    medicine = find_medicine_by_id(medicines, med_id)
    if medicine is None:
        print(f"  [Error] Medicine not found: '{med_id.upper()}'.")
        return

    print(
        f"  Selected: {medicine['medicine_name']} ({medicine['medicine_id']}) | "
        f"Current Stock: {medicine['quantity']} units (Min: {medicine['minimum_stock']})"
    )
    new_qty = prompt_positive_int("  Enter new stock quantity (0 or greater)", allow_zero=True)
    if new_qty is None:
        print("  [Info] Stock update cancelled.")
        return

    success, message, _ = update_stock(medicines, med_id, new_qty)
    if success:
        save_medicines(medicines)
        print(f"\n  [Success] {message}")
        print("  [Info] Updated inventory saved to CSV.")
    else:
        print(f"\n  [Error] {message}")


def handle_restock_medicine(medicines):
    """Increase stock quantity by adding newly received units."""
    print_header("RESTOCK MEDICINE", subtitle="Current Stock + Received Quantity")
    med_id = prompt_non_empty("  Enter Medicine ID to restock (e.g., MED017)")
    if med_id is None:
        print("  [Info] Restock cancelled.")
        return

    medicine = find_medicine_by_id(medicines, med_id)
    if medicine is None:
        print(f"  [Error] Medicine not found: '{med_id.upper()}'.")
        return

    print(
        f"  Selected: {medicine['medicine_name']} ({medicine['medicine_id']}) | "
        f"Current Stock: {medicine['quantity']} units | Supplier: {medicine['supplier']}"
    )
    added_qty = prompt_positive_int("  Enter received quantity to add", allow_zero=False)
    if added_qty is None:
        print("  [Info] Restock cancelled.")
        return

    success, message, _ = restock_medicine(medicines, med_id, added_qty)
    if success:
        save_medicines(medicines)
        print(f"\n  [Success] {message}")
        print("  [Info] Updated inventory saved to CSV.")
    else:
        print(f"\n  [Error] {message}")


def handle_remove_medicine(medicines):
    """Safely delete a medicine after showing its details and requesting confirmation."""
    print_header("REMOVE MEDICINE")
    med_id = prompt_non_empty("  Enter Medicine ID to remove (e.g., MED005)")
    if med_id is None:
        print("  [Info] Removal cancelled.")
        return

    medicine = find_medicine_by_id(medicines, med_id)
    if medicine is None:
        print(f"  [Error] Medicine not found: '{med_id.upper()}'.")
        return

    display_medicine_details(medicine)
    confirmed = prompt_confirmation(
        f"\n  Confirm permanent removal of '{medicine['medicine_name']}' ({medicine['medicine_id']})?"
    )
    if not confirmed:
        print("  [Info] Removal aborted. Inventory unchanged.")
        return

    success, message, _ = remove_medicine(medicines, med_id)
    if success:
        save_medicines(medicines)
        print(f"\n  [Success] {message}")
        print("  [Info] Updated inventory saved to CSV.")
    else:
        print(f"\n  [Error] {message}")


def handle_attention_dashboard(medicines):
    """Display the prioritized 'What Needs Attention' dashboard."""
    display_attention_dashboard(medicines)


def handle_low_stock_alerts(medicines):
    """Display out-of-stock, low-stock, and approaching-reorder alerts."""
    display_low_stock_alerts(medicines)


def handle_expiry_alerts(medicines):
    """Display expired, expiring within 7 days, and expiring within 30 days alerts."""
    display_expiry_alerts(medicines)


def handle_inventory_analysis(medicines):
    """Run and display the Pandas and NumPy inventory analysis."""
    analysis_results = analyze_inventory(medicines)
    display_analysis(analysis_results)


def handle_generate_charts(medicines):
    """Generate Matplotlib charts and save them into charts/."""
    print_header("GENERATE INVENTORY CHARTS")
    chart_paths = generate_all_charts(medicines)
    if not chart_paths:
        return

    print(f"  [Success] Generated {len(chart_paths)} chart(s) in charts/:\n")
    for idx, path in enumerate(chart_paths, start=1):
        print(f"    {idx}. {path}")


def handle_generate_report(medicines):
    """Generate CSV, TXT, and JSON inventory reports inside reports/."""
    print_header("GENERATE INVENTORY REPORT")
    analysis_results = analyze_inventory(medicines)
    attention_data = build_attention_report(medicines)
    report_paths = generate_inventory_report(medicines, analysis_results, attention_data)

    print_section("GENERATED REPORT FILES")
    print(f"  CSV Summary Report  : {report_paths['csv']}")
    print(f"  Text Executive Rep. : {report_paths['txt']}")
    if report_paths["json"]:
        print(f"  JSON Data Export    : {report_paths['json']}")
    print("\n  [Success] Inventory reports generated successfully.")


def main():
    """Run the interactive MediStock terminal application loop."""
    medicines = load_medicines()

    while True:
        try:
            display_main_menu(medicines)
            choice = input("Select an option (0-12): ").strip()

            if choice == "1":
                handle_view_medicines(medicines)
            elif choice == "2":
                handle_search_medicine(medicines)
            elif choice == "3":
                handle_add_medicine(medicines)
            elif choice == "4":
                handle_update_stock(medicines)
            elif choice == "5":
                handle_restock_medicine(medicines)
            elif choice == "6":
                handle_remove_medicine(medicines)
            elif choice == "7":
                handle_attention_dashboard(medicines)
            elif choice == "8":
                handle_low_stock_alerts(medicines)
            elif choice == "9":
                handle_expiry_alerts(medicines)
            elif choice == "10":
                handle_inventory_analysis(medicines)
            elif choice == "11":
                handle_generate_charts(medicines)
            elif choice == "12":
                handle_generate_report(medicines)
            elif choice == "0":
                print("\nThank you for using MediStock Pharmacy Inventory System. Goodbye!")
                break
            else:
                print(
                    f"\n[Error] Invalid menu option '{choice}'. "
                    "Please enter a number between 0 and 12."
                )
                continue

        except KeyboardInterrupt:
            print("\n\n[Info] Session interrupted by user. Exiting MediStock safely.")
            break
        except EOFError:
            print("\n[Info] End of input reached. Exiting MediStock safely.")
            break


if __name__ == "__main__":
    main()
