// Load environment variables from .env file FIRST — before anything else
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const { initDB } = require("./config/db");

// Import route files
const authRoutes  = require("./routes/auth");
const tripRoutes  = require("./routes/trips");
const aiRoutes    = require("./routes/ai");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────────────────────────
// CORS — allows your frontend (localhost:5500) to call this backend
app.use(cors({
  origin: [
    "http://localhost:5500",       // Live Server (VS Code)
    "http://127.0.0.1:5500",      // Live Server alternate
    "http://localhost:3000",       // React dev server (for later)
    process.env.FRONTEND_URL,     // Production frontend URL (set on Render)
  ].filter(Boolean),
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/ai",    aiRoutes);

// Health check — visit this URL to confirm server is running
app.get("/", (req, res) => {
  res.json({
    status:  "running",
    message: "AI Trip Planner API is live ✅",
    version: "1.0.0",
  });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────
// Catches any error passed via next(err) from route handlers
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Something went wrong on the server.",
  });
});

// ── 404 HANDLER ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── START SERVER ──────────────────────────────────────────────
async function start() {
  await initDB();  // Create tables if they don't exist
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 API endpoints:`);
    console.log(`   POST /api/auth/register`);
    console.log(`   POST /api/auth/login`);
    console.log(`   GET  /api/auth/me`);
    console.log(`   GET  /api/trips`);
    console.log(`   POST /api/trips`);
    console.log(`   GET  /api/trips/:id`);
    console.log(`   DELETE /api/trips/:id`);
    console.log(`   POST /api/ai/generate\n`);
  });
}

start();
