const { pool } = require("./db");
const fs = require("fs-extra");
const path = require("path");

/**
 * Balanced Postgres Store for RemoteAuth
 * Handles binary session data with explicit directory management.
 */
class PostgresStore {
  constructor({ clientId } = {}) {
    this.clientId = clientId || "default";
    this.dataPath = path.resolve("./.wwebjs_auth/");
  }

  async sessionExists({ session }) {
    try {
      console.log(`[Store] Checking session: ${this.clientId}`);
      const res = await pool.query(
        "SELECT 1 FROM whatsapp_sessions WHERE client_id = $1",
        [this.clientId]
      );
      return res.rowCount > 0;
    } catch (err) {
      console.error(`[Store] sessionExists error:`, err.message);
      return false;
    }
  }

  async save({ session }) {
    try {
      console.log(`[Store] Saving session: ${this.clientId}...`);
      const sessionPath = path.join(this.dataPath, `${session}.zip`);

      await fs.ensureDir(this.dataPath);

      if (!(await fs.pathExists(sessionPath))) {
        console.warn(`[Store] Session file missing during save: ${sessionPath}`);
        return;
      }

      const sessionData = await fs.readFile(sessionPath);

      await pool.query(
        `INSERT INTO whatsapp_sessions (client_id, session_data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (client_id) DO UPDATE SET session_data = $2, updated_at = CURRENT_TIMESTAMP`,
        [this.clientId, sessionData]
      );
      console.log(`[Store] Session saved to DB.`);
    } catch (err) {
      console.error(`[Store] save error:`, err.message);
    }
  }

  async extract({ session, path: targetPath }) {
    try {
      console.log(`[Store] Extracting session: ${this.clientId}...`);
      const res = await pool.query(
        "SELECT session_data FROM whatsapp_sessions WHERE client_id = $1",
        [this.clientId]
      );

      if (res.rowCount > 0) {
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, res.rows[0].session_data);
        console.log(`[Store] Session data written to: ${targetPath}`);
        return true;
      }
      console.log(`[Store] No session found for: ${this.clientId}`);
      return false;
    } catch (err) {
      console.error(`[Store] extract error:`, err.message);
      return false;
    }
  }

  async delete({ session }) {
    try {
      await pool.query("DELETE FROM whatsapp_sessions WHERE client_id = $1", [this.clientId]);
      console.log(`[Store] Session deleted for: ${this.clientId}`);
    } catch (err) {
      console.error(`[Store] delete error:`, err.message);
    }
  }
}

module.exports = PostgresStore;
