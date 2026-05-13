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
      console.log(`[Store] Checking session in DB for clientId: ${this.clientId}`);
      const res = await pool.query(
        "SELECT 1 FROM whatsapp_sessions WHERE client_id = $1",
        [this.clientId]
      );
      const exists = res.rowCount > 0;
      console.log(`[Store] Session exists in DB: ${exists}`);
      return exists;
    } catch (err) {
      console.error(`[Store] sessionExists error:`, err.message);
      return false;
    }
  }

  async save({ session }) {
    try {
      console.log(`[Store] Saving session to DB: ${this.clientId} (zip name: ${session})`);
      const sessionPath = path.join(this.dataPath, `${session}.zip`);

      await fs.ensureDir(this.dataPath);

      // Wait a bit for filesystem to sync if needed
      if (!(await fs.pathExists(sessionPath))) {
        console.log(`[Store] Waiting for session file...`);
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!(await fs.pathExists(sessionPath))) {
        console.error(`[Store] CRITICAL: Session file NOT FOUND at ${sessionPath}`);
        return;
      }

      const sessionData = await fs.readFile(sessionPath);
      console.log(`[Store] Read ${sessionData.length} bytes from zip.`);

      await pool.query(
        `INSERT INTO whatsapp_sessions (client_id, session_data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (client_id) DO UPDATE SET session_data = $2, updated_at = CURRENT_TIMESTAMP`,
        [this.clientId, sessionData]
      );
      console.log(`[Store] SUCCESS: Session blob saved to PostgreSQL.`);
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
