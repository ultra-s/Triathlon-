const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDb() {
  const client = await pool.connect();
  try {
    // Session table for whatsapp-web.js
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        client_id TEXT PRIMARY KEY,
        session_data BYTEA,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database initialized successfully.");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDb,
};
