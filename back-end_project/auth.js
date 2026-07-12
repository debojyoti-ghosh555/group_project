const jwt = require("jsonwebtoken");

// This middleware runs BEFORE any protected route handler.
// It checks the Authorization header for a valid JWT token.
// If valid, it attaches the user info to req.user and calls next().
// If invalid, it returns 401 immediately.

function verifyToken(req, res, next) {
  // Token comes in the header as: Authorization: Bearer eyJhbGci...
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1]; // get the part after "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name } — available in every protected route
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token. Please log in." });
  }
}

module.exports = { verifyToken };
