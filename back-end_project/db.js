const { Pool } = require("pg");

// Connection pool — reuses connections instead of opening a new one every request
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Required for Neon.tech (free cloud PostgreSQL)
  ssl: { rejectUnauthorized: false },
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

// Create tables if they don't exist yet
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(150) UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        destination  VARCHAR(200) NOT NULL,
        days         INTEGER NOT NULL,
        start_date   DATE,
        budget       INTEGER,
        interests    TEXT,
        travel_style VARCHAR(50) DEFAULT 'budget',
        travellers   INTEGER DEFAULT 1,
        notes        TEXT,
        itinerary    TEXT,
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Tables ready");
  } catch (err) {
    console.error("❌ Table creation failed:", err.message);
  } finally {
    client.release();
  }
}

// Simple query helper — use this in routes
const query = (text, params) => pool.query(text, params);

module.exports = { query, initDB };
