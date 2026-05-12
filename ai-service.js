require("dotenv").config();
const axios = require("axios");

const MODELS = [
  "inclusionai/ring-2.6-1t:free",
  "openrouter/owl-alpha",
  "poolside/laguna-m.1:free",
  "baidu/cobuddy:free"
];

const chatMemory = {};

async function askOpenRouter(chatId, message) {
  // Initialize or update chat memory
  if (!chatMemory[chatId]) {
    chatMemory[chatId] = [];
  }

  chatMemory[chatId].push({ role: "user", content: message });
  // Keep last 10 messages for context
  if (chatMemory[chatId].length > 10) {
    chatMemory[chatId] = chatMemory[chatId].slice(-10);
  }

  let lastError = null;

  for (const model of MODELS) {
    try {
      console.log(`🔄 Trying model: ${model}`);

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: model,
          messages: chatMemory[chatId],
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://render.com", // Optional, for OpenRouter analytics
            "X-Title": "WhatsApp AI Bot",
            "Content-Type": "application/json"
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      const reply = response.data.choices?.[0]?.message?.content;

      if (reply && reply.trim()) {
        chatMemory[chatId].push({ role: "assistant", content: reply });
        console.log(`✅ Success with model: ${model}`);
        return reply;
      }
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.log(`❌ Model ${model} failed: ${status} - ${errorMsg}`);

      // If it's a 401 (Unauthorized), there's no point in trying other models with the same key
      if (status === 401) {
        return "⚠️ OpenRouter API key is invalid or missing.";
      }

      // Continue to next model for other errors (like 429 rate limit or 5xx)
      continue;
    }
  }

  return `❌ All models failed to respond. Last error: ${lastError?.message || "Unknown error"}`;
}

function clearMemory(chatId) {
  if (chatMemory[chatId]) {
    delete chatMemory[chatId];
    return true;
  }
  return false;
}

module.exports = {
  askOpenRouter,
  clearMemory
};
