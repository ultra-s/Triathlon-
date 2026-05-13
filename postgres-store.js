const { pool } = require("./db");
const fs = require("fs-extra");
const path = require("path");

class PostgresStore {
  constructor({ clientId } = {}) {
    this.clientId = clientId || "default";
  }

  async sessionExists({ session }) {
    console.log(`🔍 Checking if session exists for client: ${this.clientId}`);
    const res = await pool.query(
      "SELECT 1 FROM whatsapp_sessions WHERE client_id = $1",
      [this.clientId]
    );
    const exists = res.rowCount > 0;
    console.log(`🔍 Session exists: ${exists}`);
    return exists;
  }

  async save({ session }) {
    try {
      console.log(`💾 Attempting to save session for client: ${this.clientId}...`);
      const sessionPath = path.resolve("./.wwebjs_auth/", `${session}.zip`);
      const sessionData = await fs.readFile(sessionPath);

      await pool.query(
        `INSERT INTO whatsapp_sessions (client_id, session_data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (client_id) DO UPDATE SET session_data = $2, updated_at = CURRENT_TIMESTAMP`,
        [this.clientId, sessionData]
      );
      console.log(`✅ SUCCESS: Session binary saved to PostgreSQL for client: ${this.clientId}`);
    } catch (err) {
      console.error(`❌ FAILED to save session for client: ${this.clientId}:`, err);
    }
  }

  async extract({ session, path: targetPath }) {
    try {
      console.log(`📂 Attempting to extract session for client: ${this.clientId}...`);
      const res = await pool.query(
        "SELECT session_data FROM whatsapp_sessions WHERE client_id = $1",
        [this.clientId]
      );
      if (res.rowCount > 0) {
        await fs.writeFile(targetPath, res.rows[0].session_data);
        console.log(`📂 SUCCESS: Session binary extracted from PostgreSQL to: ${targetPath}`);
        return true;
      }
      console.log(`⚠️ No session found in DB for client: ${this.clientId}`);
      return false;
    } catch (err) {
      console.error(`❌ FAILED to extract session for client: ${this.clientId}:`, err);
      return false;
    }
  }

  async delete({ session }) {
    await pool.query("DELETE FROM whatsapp_sessions WHERE client_id = $1", [
      this.clientId,
    ]);
    console.log(`❌ Session deleted from PostgreSQL for client: ${this.clientId}`);
  }
}

module.exports = PostgresStore;
