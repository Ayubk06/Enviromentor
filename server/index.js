// index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const sensors = require("./sensors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Latest single reading
app.get("/api/readings", (req, res) => {
  res.json(sensors.getLatest());
});

// Full history (for charts)
app.get("/api/history", (req, res) => {
  res.json(sensors.getHistory());
});

// Future hook: real ESP32/wifi sensor pushes data here.
// Only does anything meaningful once DATA_MODE=wifi.
app.post("/api/ingest", (req, res) => {
  sensors.ingestReading(req.body);
  res.json({ ok: true, mode: sensors.MODE });
});

sensors.startEngine();

app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
  console.log("Data mode: " + sensors.MODE);
});
