require("dotenv").config();
const axios = require("axios");
const { pool } = require("./db");

const MODELS = [
  "inclusionai/ring-2.6-1t:free",
  "openrouter/owl-alpha",
  "poolside/laguna-m.1:free",
  "baidu/cobuddy:free"
];

async function getChatHistory(chatId) {
  const res = await pool.query(
    "SELECT role, content FROM chat_history WHERE chat_id = $1 ORDER BY created_at ASC LIMIT 15",
    [chatId]
  );
  return res.rows;
}

async function saveChatMessage(chatId, role, content) {
  await pool.query(
    "INSERT INTO chat_history (chat_id, role, content) VALUES ($1, $2, $3)",
    [chatId, role, content]
  );
}

async function clearMemory(chatId) {
  await pool.query("DELETE FROM chat_history WHERE chat_id = $1", [chatId]);
  return true;
}

async function askOpenRouter(chatId, message) {
  try {
    // 1. Save user message
    await saveChatMessage(chatId, "user", message);

    // 2. Retrieve history (optimized query)
    const history = await getChatHistory(chatId);

    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`🔄 Trying model: ${model}`);

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: model,
            messages: history,
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://render.com",
              "X-Title": "WhatsApp AI Bot",
              "Content-Type": "application/json"
            },
            timeout: 20000 // Reduced timeout for faster switching
          }
        );

        const reply = response.data.choices?.[0]?.message?.content;

        if (reply && reply.trim()) {
          // 3. Save assistant reply
          await saveChatMessage(chatId, "assistant", reply);
          console.log(`✅ Success with model: ${model}`);
          return reply;
        } else {
          console.log(`⚠️ Model ${model} returned empty response`);
        }
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.log(`❌ Model ${model} failed: ${status} - ${errorMsg}`);

        if (status === 401) {
          return "⚠️ OpenRouter API key is invalid or missing.";
        }
        continue;
      }
    }

    return `❌ All models failed. Last error: ${lastError?.message || "Unknown error"}`;
  } catch (dbError) {
    console.error("❌ Database or Logic Error:", dbError);
    return "⚠️ Encountered a system error. Please try again.";
  }
}

module.exports = {
  askOpenRouter,
  clearMemory
};
