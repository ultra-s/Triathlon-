require("dotenv").config();
const axios = require("axios");
const { pool } = require("./db");

const MODELS = [
  "inclusionai/ring-2.6-1t:free",
  "openrouter/owl-alpha",
  "poolside/laguna-m.1:free",
  "baidu/cobuddy:free"
];

/**
 * Optimized AI Service with PostgreSQL history
 */
async function getChatHistory(chatId) {
  const res = await pool.query(
    "SELECT role, content FROM chat_history WHERE chat_id = $1 ORDER BY created_at ASC LIMIT 10",
    [chatId]
  );
  return res.rows;
}

async function saveChatMessage(chatId, role, content) {
  pool.query(
    "INSERT INTO chat_history (chat_id, role, content) VALUES ($1, $2, $3)",
    [chatId, role, content]
  ).catch(err => console.error("[AI] History save failed:", err.message));
}

async function clearMemory(chatId) {
  await pool.query("DELETE FROM chat_history WHERE chat_id = $1", [chatId]);
  return true;
}

async function askOpenRouter(chatId, message) {
  try {
    // 1. Save user message (fire and forget for speed)
    saveChatMessage(chatId, "user", message);

    // 2. Get context
    const history = await getChatHistory(chatId);
    history.push({ role: "user", content: message });

    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`[AI] Trying ${model}...`);

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          { model, messages: history },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://render.com",
              "X-Title": "WhatsApp AI Bot",
              "Content-Type": "application/json"
            },
            timeout: 15000 // Faster timeout
          }
        );

        const reply = response.data.choices?.[0]?.message?.content;

        if (reply && reply.trim()) {
          saveChatMessage(chatId, "assistant", reply);
          console.log(`[AI] Success: ${model}`);
          return reply;
        }
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        console.log(`[AI] ${model} failed (${status || error.message})`);
        if (status === 401) return "⚠️ API Key error.";
        continue;
      }
    }

    return `❌ Failed to generate response. (${lastError?.message || "Unknown error"})`;
  } catch (err) {
    console.error("[AI] Service Error:", err.message);
    return "⚠️ System error. Please try again.";
  }
}

module.exports = { askOpenRouter, clearMemory };
