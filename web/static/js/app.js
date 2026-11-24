const chartPalette = ["#2f6fed", "#14a8a1", "#7c67d8", "#f59e0b", "#ef6a67", "#5d7fbd", "#42b883"];

function chartColors(count) {
  return Array.from({ length: count }, (_, index) => chartPalette[index % chartPalette.length]);
}

function createBarChart(canvasId, labels, values, prefix = "") {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ data: values, backgroundColor: chartColors(labels.length), borderRadius: 6, maxBarThickness: 38 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => prefix + context.parsed.y.toLocaleString() } } },
      scales: { x: { grid: { display: false }, ticks: { maxRotation: 35, minRotation: 0 } }, y: { beginAtZero: true, grid: { color: "#edf1f7" } } }
    }
  });
}

function createDoughnutChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  new Chart(canvas, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, backgroundColor: chartColors(labels.length), borderWidth: 3, borderColor: "#ffffff" }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16 } } } }
  });
}

document.getElementById("menuButton")?.addEventListener("click", () => {
  document.getElementById("sidebar")?.classList.toggle("open");
});

const removeDialog = document.getElementById("removeDialog");
document.querySelector("[data-remove-open]")?.addEventListener("click", () => removeDialog?.showModal());
document.getElementById("confirmRemove")?.addEventListener("click", () => {
  document.getElementById("removeForm")?.submit();
});
