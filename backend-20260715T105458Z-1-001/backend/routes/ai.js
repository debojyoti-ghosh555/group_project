const express   = require("express");
const Groq      = require("groq-sdk");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: "Too many requests. Please wait 15 minutes." },
});

// POST /api/ai/generate
router.post("/generate", verifyToken, aiLimiter, async (req, res) => {
  try {
    const { destination, days, budget, interests, travel_style, travellers, notes } = req.body;

    if (!destination || !days)
      return res.status(400).json({ error: "Destination and days are required." });
    if (days < 1 || days > 30)
      return res.status(400).json({ error: "Days must be between 1 and 30." });

    const interestsList = Array.isArray(interests) && interests.length
      ? interests.join(", ") : "general sightseeing";
    const budgetText = budget
      ? `Total budget: INR ${parseInt(budget).toLocaleString("en-IN")}`
      : "Budget: flexible";
    const notesText = notes ? `Special requirements: ${notes}` : "";

    const prompt = `You are an expert travel planner for Indian destinations.
Create a detailed ${days}-day itinerary for:
- Destination: ${destination}
- Duration: ${days} days
- Travellers: ${travellers || 1}
- Travel style: ${travel_style || "budget"}
- ${budgetText}
- Interests: ${interestsList}
${notesText}

Rules:
1. Use real, specific place names only.
2. Keep costs realistic in INR.
3. Stay within the stated budget.
4. Every day must have morning, afternoon, evening.

Respond ONLY with this exact JSON structure, no markdown, no extra text:
{
  "tripTitle": "3-Day Darjeeling Itinerary",
  "totalEstimatedCost": 12000,
  "budgetBreakdown": {
    "activities": 3000,
    "food": 3000,
    "transport": 2000,
    "stay": 4000
  },
  "days": [
    {
      "day": 1,
      "theme": "Arrival & Tea Gardens",
      "morning": {
        "icon": "🚂",
        "name": "Arrive via Toy Train",
        "detail": "Darjeeling Himalayan Railway from NJP",
        "cost": 800
      },
      "afternoon": {
        "icon": "🌿",
        "name": "Happy Valley Tea Estate",
        "detail": "Tour the tea gardens, 2 hrs",
        "cost": 150
      },
      "evening": {
        "icon": "🍽️",
        "name": "Dinner at Glenary's",
        "detail": "Continental and Indian, Mall Road",
        "cost": 600
      },
      "transport": "Share jeep from NJP to Darjeeling — INR 200"
    }
  ],
  "packingTips": ["Warm jacket", "Comfortable walking shoes", "Rain cover"],
  "bestTimeToVisit": "March to May, September to November"
}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    console.log(`🤖 Generating: ${destination} (${days} days)`);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a travel planning expert. Always respond with valid JSON only. No markdown, no explanation, just the JSON object."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawText = completion.choices[0]?.message?.content || "";

    // Clean and parse JSON
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Extract JSON if there's any extra text around it
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", rawText.substring(0, 300));
      return res.status(500).json({ error: "AI returned unexpected format. Please try again." });
    }

    let itinerary;
    try {
      itinerary = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON parse failed:", rawText.substring(0, 300));
      return res.status(500).json({ error: "AI returned unexpected format. Please try again." });
    }

    res.json({ success: true, itinerary });

  } catch (err) {
    console.error("AI error:", err.message);
    if (err.message?.includes("API_KEY") || err.message?.includes("api_key")) {
      return res.status(500).json({ error: "Groq API key not configured. Add GROQ_API_KEY to .env" });
    }
    res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
  }
});

module.exports = router;