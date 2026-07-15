const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected");
    release();
  }
});

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

const query = (text, params) => pool.query(text, params);
module.exports = { query, initDB };
