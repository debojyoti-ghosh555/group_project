require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { initDB } = require("./config/db");

const authRoutes  = require("./routes/auth");
const tripRoutes  = require("./routes/trips");
const aiRoutes    = require("./routes/ai");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/ai",    aiRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "running", message: "VoyagerAI backend is live ✅" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── START ─────────────────────────────────────────────────────
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST http://localhost:${PORT}/api/ai/generate\n`);
  });
}
start();
