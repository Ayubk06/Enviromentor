// sensors.js
const MODE = process.env.DATA_MODE || "simulate";

const BASELINE = {
  pm25: 45,
  co: 1.2,
  temp: 29,
  humidity: 62,
  ph: 7.1,
  turbidity: 4,
  tds: 320,
  dissolvedOxygen: 6.5,
  noise: 58,
};

const THRESHOLDS = {
  pm25: { safe: 60, warning: 90 },
  co: { safe: 2, warning: 4 },
  ph: { safeMin: 6.5, safeMax: 8.5 },
  turbidity: { safe: 5, warning: 10 },
  tds: { safe: 500, warning: 1000 },
  dissolvedOxygen: { safeMin: 5 },
  noise: { safe: 65, warning: 80 },
};

function jitter(value, spread) {
  return +(value + (Math.random() * 2 - 1) * spread).toFixed(2);
}

function computeStatus(r) {
  const flags = [];
  if (r.pm25 > THRESHOLDS.pm25.warning) flags.push("pm25-critical");
  else if (r.pm25 > THRESHOLDS.pm25.safe) flags.push("pm25-warning");

  if (r.co > THRESHOLDS.co.warning) flags.push("co-critical");
  else if (r.co > THRESHOLDS.co.safe) flags.push("co-warning");

  if (r.ph < THRESHOLDS.ph.safeMin || r.ph > THRESHOLDS.ph.safeMax) flags.push("ph-warning");

  if (r.turbidity > THRESHOLDS.turbidity.warning) flags.push("turbidity-critical");
  else if (r.turbidity > THRESHOLDS.turbidity.safe) flags.push("turbidity-warning");

  if (r.dissolvedOxygen < THRESHOLDS.dissolvedOxygen.safeMin) flags.push("oxygen-warning");

  if (r.noise > THRESHOLDS.noise.warning) flags.push("noise-critical");
  else if (r.noise > THRESHOLDS.noise.safe) flags.push("noise-warning");

  return flags.length === 0 ? "normal" : flags;
}

function generateReading() {
  const reading = {
    timestamp: Date.now(),
    pm25: Math.max(0, jitter(BASELINE.pm25, 20)),
    co: Math.max(0, jitter(BASELINE.co, 0.8)),
    temp: jitter(BASELINE.temp, 3),
    humidity: Math.min(100, Math.max(0, jitter(BASELINE.humidity, 8))),
    ph: jitter(BASELINE.ph, 0.6),
    turbidity: Math.max(0, jitter(BASELINE.turbidity, 3)),
    tds: Math.max(0, jitter(BASELINE.tds, 100)),
    dissolvedOxygen: Math.max(0, jitter(BASELINE.dissolvedOxygen, 1.2)),
    noise: Math.max(20, jitter(BASELINE.noise, 12)),
  };
  reading.status = computeStatus(reading);
  return reading;
}

let latestReading = generateReading();
const history = [latestReading];
const MAX_HISTORY = 200;

function tick() {
  if (MODE === "simulate") {
    latestReading = generateReading();
    history.push(latestReading);
    if (history.length > MAX_HISTORY) history.shift();
  }
}

function ingestReading(data) {
  const reading = { timestamp: Date.now(), ...data };
  reading.status = computeStatus(reading);
  latestReading = reading;
  history.push(reading);
  if (history.length > MAX_HISTORY) history.shift();
}

function startEngine(intervalMs = 4000) {
  if (MODE === "simulate") {
    setInterval(tick, intervalMs);
  }
  console.log("[sensors] running in \"" + MODE + "\" mode");
}

function getLatest() {
  return latestReading;
}

function getHistory() {
  return history;
}

module.exports = { startEngine, getLatest, getHistory, ingestReading, MODE };
