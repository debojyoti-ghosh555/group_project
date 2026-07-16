const express = require("express");
const db      = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/trips
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, destination, days, start_date, budget, travel_style, travellers, created_at FROM trips WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ trips: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trips/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM trips WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Trip not found." });
    const trip = result.rows[0];
    if (trip.itinerary) { try { trip.itinerary = JSON.parse(trip.itinerary); } catch (e) {} }
    res.json({ trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trips
router.post("/", verifyToken, async (req, res) => {
  try {
    const { destination, days, start_date, budget, interests, travel_style, travellers, notes, itinerary } = req.body;
    if (!destination || !days) return res.status(400).json({ error: "Destination and days are required." });

    const result = await db.query(
      `INSERT INTO trips (user_id, destination, days, start_date, budget, interests, travel_style, travellers, notes, itinerary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, destination, days, created_at`,
      [req.user.id, destination, days, start_date || null, budget || null,
       interests ? JSON.stringify(interests) : null, travel_style || "budget",
       travellers || 1, notes || null, itinerary ? JSON.stringify(itinerary) : null]
    );
    res.status(201).json({ message: "Trip saved!", trip: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trips/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await db.query("DELETE FROM trips WHERE id=$1 AND user_id=$2 RETURNING id", [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Trip not found." });
    res.json({ message: "Trip deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
