const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────
// Creates a new user account
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are all required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // 2. Check if email is already registered
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // 3. Hash the password — NEVER store plain text passwords
    //    10 = salt rounds (higher = more secure but slower; 10 is the standard)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save the new user to the database
    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );
    const user = result.rows[0];

    // 5. Create a JWT token so they're immediately logged in
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Return the user (without password) and the token
    res.status(201).json({
      message: "Account created successfully!",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });

  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});


// ── POST /api/auth/login ─────────────────────────────────────
// Logs in an existing user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // 1. Find user by email
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    const user = result.rows[0];

    // 2. Use a vague error message — never say "email not found" (security)
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 3. Compare the entered password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 4. Issue JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Logged in successfully!",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});


// ── GET /api/auth/me ─────────────────────────────────────────
// Returns the currently logged-in user's profile (protected route)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
