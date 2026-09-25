// app.js
const API_BASE = "";

function statusClass(status) {
  if (status === "normal") return "normal";
  if (status.some(f => f.includes("critical"))) return "crit";
  return "warn";
}

function statusLabel(status) {
  if (status === "normal") return "All Normal";
  if (status.some(f => f.includes("critical"))) return "Critical";
  return "Warning";
}

async function fetchLatest() {
  const res = await fetch(API_BASE + "/api/readings");
  return res.json();
}

async function fetchHistory() {
  const res = await fetch(API_BASE + "/api/history");
  return res.json();
}

// ---- Home page quick stats ----
async function loadQuickStats() {
  try {
    const r = await fetchLatest();
    const cls = statusClass(r.status);
    document.getElementById("qs-pm25").textContent = r.pm25 + " µg/m³";
    document.getElementById("qs-noise").textContent = r.noise + " dB";
    document.getElementById("qs-ph").textContent = r.ph;
    const statusEl = document.getElementById("qs-status");
    statusEl.textContent = statusLabel(r.status);
    statusEl.className = "value " + cls;
  } catch (err) {
    console.error("Failed to load quick stats", err);
  }
}

// ---- Dashboard page ----
let historyChart = null;

function fieldClass(value, safe, warning) {
  if (warning !== undefined && value > warning) return "crit";
  if (value > safe) return "warn";
  return "normal";
}

async function loadDashboard() {
  try {
    const r = await fetchLatest();

    const banner = document.getElementById("statusBanner");
    const cls = statusClass(r.status);
    banner.className = "status-banner " + cls;
    banner.textContent = r.status === "normal"
      ? "All readings within safe range"
      : "Flags: " + r.status.join(", ");

    setCard("pm25", r.pm25, " µg/m³", fieldClass(r.pm25, 60, 90));
    setCard("co", r.co, " ppm", fieldClass(r.co, 2, 4));
    setCard("temp", r.temp, " °C", "normal");
    setCard("humidity", r.humidity, " %", "normal");
    setCard("ph", r.ph, "", (r.ph < 6.5 || r.ph > 8.5) ? "warn" : "normal");
    setCard("turbidity", r.turbidity, " NTU", fieldClass(r.turbidity, 5, 10));
    setCard("tds", r.tds, " ppm", fieldClass(r.tds, 500, 1000));
    setCard("dissolvedOxygen", r.dissolvedOxygen, " mg/L", r.dissolvedOxygen < 5 ? "warn" : "normal");
    setCard("noise", r.noise, " dB", fieldClass(r.noise, 65, 80));

    const hist = await fetchHistory();
    updateChart(hist);
  } catch (err) {
    console.error("Failed to load dashboard", err);
  }
}

function setCard(id, value, unit, cls) {
  const el = document.getElementById("card-" + id);
  if (!el) return;
  el.textContent = value + unit;
  el.className = "value " + cls;
}

function updateChart(history) {
  const labels = history.map(h => new Date(h.timestamp).toLocaleTimeString());
  const pm25Data = history.map(h => h.pm25);
  const noiseData = history.map(h => h.noise);

  if (!historyChart) {
    const ctx = document.getElementById("historyChart").getContext("2d");
    historyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "PM2.5 (µg/m³)", data: pm25Data, borderColor: "#3ddc84", tension: 0.3 },
          { label: "Noise (dB)", data: noiseData, borderColor: "#e8b339", tension: 0.3 },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: "#7c9284" } },
          y: { ticks: { color: "#7c9284" } },
        },
        plugins: {
          legend: { labels: { color: "#e8f0ea" } },
        },
      },
    });
  } else {
    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = pm25Data;
    historyChart.data.datasets[1].data = noiseData;
    historyChart.update();
  }
}

if (document.getElementById("dashboardRoot")) {
  loadDashboard();
  setInterval(loadDashboard, 4000);
}
