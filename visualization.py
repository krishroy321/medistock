"""Matplotlib visualizations for MediStock pharmacy inventory analysis.

Generates four meaningful PNG charts automatically saved into `charts/`:
1. medicines_by_category.png       - Bar chart of medicine count per category
2. stock_by_category.png           - Bar chart of total stock units per category
3. inventory_value_by_category.png - Bar chart of total inventory value per category
4. expiry_status.png               - Color-coded bar chart of expiry status buckets
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from analysis import analyze_inventory
from data_manager import CHARTS_DIR, load_medicines
from models import CURRENCY_SYMBOL


def _configure_style():
    """Apply clean, readable typography and figure defaults."""
    plt.rcParams.update(
        {
            "font.size": 10,
            "axes.titlesize": 13,
            "axes.titleweight": "bold",
            "axes.labelsize": 11,
            "axes.edgecolor": "#CCCCCC",
            "axes.linewidth": 0.8,
            "xtick.labelsize": 9.5,
            "ytick.labelsize": 9.5,
            "figure.facecolor": "white",
            "axes.facecolor": "#FAFAFA",
        }
    )


def plot_medicines_by_category(analysis_results, output_dir=CHARTS_DIR):
    """Generate Bar Chart 1: Number of Medicines by Category."""
    _configure_style()
    output_path = Path(output_dir) / "medicines_by_category.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    counts = analysis_results["category_distribution"].sort_values(ascending=True)
    categories = counts.index.tolist()
    values = counts.values.astype(int)
    avg_count = float(np.mean(values)) if len(values) > 0 else 0.0

    fig, ax = plt.subplots(figsize=(10, 6.2))
    bars = ax.barh(categories, values, color="#2B6CB0", edgecolor="#1A365D", height=0.68)

    ax.axvline(
        avg_count,
        color="#DD6B20",
        linestyle="--",
        linewidth=1.5,
        zorder=2,
        label=f"Average ({avg_count:.1f} medicines/category)",
    )

    max_val = max(values) if len(values) > 0 else 1
    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + max_val * 0.02,
            bar.get_y() + bar.get_height() / 2,
            f"{val}",
            va="center",
            ha="left",
            fontsize=9.5,
            fontweight="bold",
            color="#1A202C",
            zorder=4,
            bbox={"facecolor": "#FAFAFA", "edgecolor": "none", "pad": 1.2, "alpha": 0.9},
        )

    ax.set_title("Medicines by Category", pad=14)
    ax.set_xlabel("Number of Distinct Medicines")
    ax.set_ylabel("Category")
    ax.set_xlim(0, max_val * 1.18)
    ax.grid(axis="x", linestyle=":", alpha=0.6)
    ax.set_axisbelow(True)
    ax.legend(loc="lower right", frameon=True, facecolor="white")

    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return str(output_path)


def plot_stock_by_category(analysis_results, output_dir=CHARTS_DIR):
    """Generate Bar Chart 2: Total Stock Quantity (Units) by Category."""
    _configure_style()
    output_path = Path(output_dir) / "stock_by_category.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    stock_series = analysis_results["stock_by_category"].sort_values(ascending=True)
    categories = stock_series.index.tolist()
    units = stock_series.values.astype(int)
    avg_units = float(np.mean(units)) if len(units) > 0 else 0.0

    fig, ax = plt.subplots(figsize=(10, 6.2))
    bars = ax.barh(categories, units, color="#2F855A", edgecolor="#1C4532", height=0.68)

    ax.axvline(
        avg_units,
        color="#C53030",
        linestyle="--",
        linewidth=1.5,
        zorder=2,
        label=f"Category Mean ({avg_units:,.1f} units)",
    )

    max_val = max(units) if len(units) > 0 else 1
    for bar, val in zip(bars, units):
        ax.text(
            bar.get_width() + max_val * 0.015,
            bar.get_y() + bar.get_height() / 2,
            f"{val:,}",
            va="center",
            ha="left",
            fontsize=9.5,
            fontweight="bold",
            color="#1A202C",
            zorder=4,
            bbox={"facecolor": "#FAFAFA", "edgecolor": "none", "pad": 1.2, "alpha": 0.9},
        )

    ax.set_title("Total Stock Quantity by Category", pad=14)
    ax.set_xlabel("Stock Quantity (Units)")
    ax.set_ylabel("Category")
    ax.set_xlim(0, max_val * 1.18)
    ax.grid(axis="x", linestyle=":", alpha=0.6)
    ax.set_axisbelow(True)
    ax.legend(loc="lower right", frameon=True, facecolor="white")

    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return str(output_path)


def plot_inventory_value_by_category(analysis_results, output_dir=CHARTS_DIR):
    """Generate Bar Chart 3: Total Inventory Value by Category."""
    _configure_style()
    output_path = Path(output_dir) / "inventory_value_by_category.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    value_series = analysis_results["value_by_category"].sort_values(ascending=True)
    categories = value_series.index.tolist()
    values = value_series.values.astype(float)
    total_portfolio = float(np.sum(values)) if len(values) > 0 else 0.0
    avg_value = float(np.mean(values)) if len(values) > 0 else 0.0

    fig, ax = plt.subplots(figsize=(10.5, 6.2))
    bars = ax.barh(
        categories,
        values,
        color="#6B46C1",
        edgecolor="#44337A",
        height=0.68,
        label=f"Total Inventory Value ({CURRENCY_SYMBOL}{total_portfolio:,.2f})",
    )

    ax.axvline(
        avg_value,
        color="#D69E2E",
        linestyle="--",
        linewidth=1.5,
        zorder=2,
        label=f"Category Average ({CURRENCY_SYMBOL}{avg_value:,.2f})",
    )

    max_val = max(values) if len(values) > 0 else 1.0
    for bar, val in zip(bars, values):
        ax.text(
            bar.get_width() + max_val * 0.015,
            bar.get_y() + bar.get_height() / 2,
            f"{CURRENCY_SYMBOL}{val:,.2f}",
            va="center",
            ha="left",
            fontsize=9.2,
            fontweight="bold",
            color="#1A202C",
            zorder=4,
            bbox={"facecolor": "#FAFAFA", "edgecolor": "none", "pad": 1.2, "alpha": 0.9},
        )

    ax.set_title("Inventory Value by Category", pad=14)
    ax.set_xlabel(f"Total Inventory Value ({CURRENCY_SYMBOL})")
    ax.set_ylabel("Category")
    ax.set_xlim(0, max_val * 1.24)
    ax.grid(axis="x", linestyle=":", alpha=0.6)
    ax.set_axisbelow(True)
    ax.legend(loc="lower right", frameon=True, facecolor="white")

    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return str(output_path)


def plot_expiry_status(analysis_results, output_dir=CHARTS_DIR):
    """Generate Bar Chart 4: Medicine Expiry Status Overview."""
    _configure_style()
    output_path = Path(output_dir) / "expiry_status.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    overview = analysis_results["overview"]
    labels = ["Expired", "Expiring Soon\n(<= 30 Days)", "Safe\n(> 30 Days)"]
    counts = [
        overview["expired_count"],
        overview["expiring_30_days_count"],
        overview["safe_count"],
    ]
    colors = ["#C53030", "#DD6B20", "#2F855A"]
    legend_labels = [
        f"Expired ({counts[0]})",
        f"Expiring Soon <= 30d ({counts[1]}; {overview['expiring_7_days_count']} within 7d)",
        f"Safe > 30d ({counts[2]})",
    ]

    total = sum(counts)
    fig, ax = plt.subplots(figsize=(8.8, 5.6))

    x_positions = np.arange(len(labels))
    bars = ax.bar(
        x_positions,
        counts,
        color=colors,
        edgecolor="#1A202C",
        linewidth=0.9,
        width=0.55,
    )

    # Assign legend entries per bar
    for bar, leg_label in zip(bars, legend_labels):
        bar.set_label(leg_label)

    max_count = max(counts) if counts and max(counts) > 0 else 1
    for bar, count in zip(bars, counts):
        pct = (count / total * 100) if total > 0 else 0.0
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max_count * 0.03,
            f"{count} ({pct:.1f}%)",
            ha="center",
            va="bottom",
            fontsize=10.5,
            fontweight="bold",
            color="#1A202C",
        )

    ax.set_xticks(x_positions)
    ax.set_xticklabels(labels, fontsize=10.5)
    ax.set_ylim(0, max_count * 1.24)
    ax.set_title("Medicine Expiry Status Distribution", pad=14)
    ax.set_xlabel("Expiry Status Category")
    ax.set_ylabel("Number of Medicines")
    ax.grid(axis="y", linestyle=":", alpha=0.6)
    ax.set_axisbelow(True)
    ax.legend(title="Status Breakdown", loc="upper left", frameon=True, facecolor="white")

    fig.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return str(output_path)


def generate_all_charts(medicines, output_dir=CHARTS_DIR):
    """Run analysis and generate all four inventory charts into charts/."""
    analysis_results = analyze_inventory(medicines)
    if analysis_results["overview"]["total_medicines"] == 0:
        print("[Warning] Cannot generate charts because the inventory is empty.")
        return []

    generated_files = [
        plot_medicines_by_category(analysis_results, output_dir=output_dir),
        plot_stock_by_category(analysis_results, output_dir=output_dir),
        plot_inventory_value_by_category(analysis_results, output_dir=output_dir),
        plot_expiry_status(analysis_results, output_dir=output_dir),
    ]
    return generated_files


if __name__ == "__main__":
    inventory_records = load_medicines()
    files = generate_all_charts(inventory_records)
    print("Generated charts:")
    for chart_file in files:
        print(f"  - {chart_file}")
