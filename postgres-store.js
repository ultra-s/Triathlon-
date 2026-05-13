const { pool } = require("./db");
const fs = require("fs-extra");
const path = require("path");

class PostgresStore {
  constructor({ clientId } = {}) {
    this.clientId = clientId || "default";
  }

  async sessionExists({ session }) {
    const res = await pool.query(
      "SELECT 1 FROM whatsapp_sessions WHERE client_id = $1",
      [this.clientId]
    );
    return res.rowCount > 0;
  }

  async save({ session }) {
    // RemoteAuth expects the store to find the zip file at:
    // dataPath/sessionName.zip
    const sessionPath = path.resolve("./.wwebjs_auth/", `${session}.zip`);
    const sessionData = await fs.readFile(sessionPath);

    await pool.query(
      `INSERT INTO whatsapp_sessions (client_id, session_data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (client_id) DO UPDATE SET session_data = $2, updated_at = CURRENT_TIMESTAMP`,
      [this.clientId, sessionData]
    );
    console.log(`✅ Session binary saved to PostgreSQL for client: ${this.clientId}`);
  }

  async extract({ session, path: targetPath }) {
    const res = await pool.query(
      "SELECT session_data FROM whatsapp_sessions WHERE client_id = $1",
      [this.clientId]
    );
    if (res.rowCount > 0) {
      await fs.writeFile(targetPath, res.rows[0].session_data);
      console.log(`📂 Session binary extracted from PostgreSQL to: ${targetPath}`);
      return true;
    }
    return false;
  }

  async delete({ session }) {
    await pool.query("DELETE FROM whatsapp_sessions WHERE client_id = $1", [
      this.clientId,
    ]);
    console.log(`❌ Session deleted from PostgreSQL for client: ${this.clientId}`);
  }
}

module.exports = PostgresStore;
