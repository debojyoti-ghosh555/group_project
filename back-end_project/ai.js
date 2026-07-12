const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// ── Rate limiter — max 10 AI generations per user per 15 minutes ──
// Protects your free Gemini API quota from being drained
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip, // limit per user, not IP
  message: { error: "Too many requests. Please wait 15 minutes before generating again." },
});

// ── POST /api/ai/generate ────────────────────────────────────
// The core AI feature — takes trip details, calls Gemini, returns itinerary
router.post("/generate", verifyToken, aiLimiter, async (req, res) => {
  try {
    const { destination, days, budget, interests, travel_style, travellers, notes } = req.body;

    // Validate required fields
    if (!destination || !days) {
      return res.status(400).json({ error: "Destination and number of days are required." });
    }
    if (days < 1 || days > 30) {
      return res.status(400).json({ error: "Days must be between 1 and 30." });
    }

    // ── Build the prompt ──────────────────────────────────────
    // This is the most important part — a clear, structured prompt
    // gives you consistent, parseable JSON output from Gemini
    const interestsList = Array.isArray(interests) && interests.length
      ? interests.join(", ")
      : "general sightseeing";

    const budgetText = budget
      ? `Total budget: INR ${parseInt(budget).toLocaleString("en-IN")}`
      : "Budget: flexible";

    const notesText = notes ? `Special requirements: ${notes}` : "";

    const prompt = `
You are an expert travel planner specialising in Indian destinations.
Create a detailed ${days}-day trip itinerary based on the following:

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${days} days
- Travellers: ${travellers || 1} person(s)
- Travel style: ${travel_style || "budget"}
- ${budgetText}
- Interests: ${interestsList}
${notesText}

RULES:
1. Keep costs realistic for ${travel_style || "budget"} travel in India (in INR).
2. Include specific, real place names — no generic descriptions.
3. Keep total cost within the stated budget.
4. Include a practical transport tip for each day.
5. Suggest a specific restaurant for each evening with cuisine type and average cost.

Respond ONLY with a valid JSON object. No markdown, no explanation, just JSON:
{
  "tripTitle": "X-Day [Destination] Itinerary",
  "totalEstimatedCost": 14600,
  "budgetBreakdown": {
    "activities": 4500,
    "food": 3200,
    "transport": 2100,
    "stay": 4800
  },
  "days": [
    {
      "day": 1,
      "theme": "Arrival & First Impressions",
      "morning": {
        "icon": "✈️",
        "name": "Arrive and check in",
        "detail": "Name of hotel/hostel with area name",
        "cost": 0
      },
      "afternoon": {
        "icon": "🏖️",
        "name": "Visit specific place name",
        "detail": "What to do there, how long",
        "cost": 200
      },
      "evening": {
        "icon": "🍽️",
        "name": "Dinner at Restaurant Name",
        "detail": "Cuisine type, location",
        "cost": 400
      },
      "transport": "Practical transport tip for this day"
    }
  ],
  "packingTips": ["tip1", "tip2", "tip3"],
  "bestTimeToVisit": "October to February"
}
`;

    // ── Call Gemini API ───────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // free tier model

    console.log(`🤖 Generating itinerary for: ${destination} (${days} days)`);
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // ── Parse the JSON response ───────────────────────────────
    // Remove markdown code fences if Gemini adds them (it sometimes does)
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let itinerary;
    try {
      itinerary = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw response:", rawText.substring(0, 500));
      return res.status(500).json({
        error: "AI returned an unexpected format. Please try again.",
      });
    }

    // ── Return the itinerary ──────────────────────────────────
    res.json({
      success: true,
      itinerary,
    });

  } catch (err) {
    console.error("AI generation error:", err.message);

    // Give a helpful error if API key is missing
    if (err.message?.includes("API_KEY")) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
  }
});


module.exports = router;
