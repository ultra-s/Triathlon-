// ULTRASOLX - Complete API Endpoints Reference
// All verified and working endpoints for your bot

const API_ENDPOINTS = {
  // 1. TELEGRAM BOT API
  telegram: {
    base: "https://api.telegram.org/bot{TOKEN}",
    methods: {
      getMe: "/getMe",
      sendMessage: "/sendMessage",
      sendPhoto: "/sendPhoto",
      sendChatAction: "/sendChatAction",
    },
    example: "https://api.telegram.org/bot8062381062:AAEnTsxL5WGFfJrvFs9gWvnFl9Mu9r0zOkE/getMe",
  },

  // 2. GROQ API (Fast inference)
  groq: {
    base: "https://api.groq.com/openai/v1",
    endpoints: {
      chat: "/chat/completions",
      models: "/models",
    },
    models: ["mixtral-8x7b-32768", "llama2-70b-4096", "gemma-7b-it", "llama3-8b-8192", "llama3-70b-8192"],
    headers: {
      Authorization: "Bearer {API_KEY}",
      "Content-Type": "application/json",
    },
  },

  // 3. GOOGLE GEMINI API
  gemini: {
    base: "https://generativelanguage.googleapis.com/v1beta",
    endpoints: {
      generateContent: "/models/gemini-pro:generateContent",
      generateContentStream: "/models/gemini-pro:streamGenerateContent",
      models: "/models",
    },
    auth: "?key={API_KEY}",
    models: ["gemini-pro", "gemini-pro-vision"],
  },

  // 4. TOGETHER AI API
  together: {
    base: "https://api.together.xyz/v1",
    endpoints: {
      chat: "/chat/completions",
      completions: "/completions",
      models: "/models",
    },
    models: [
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "meta-llama/Llama-2-70b-chat-hf",
      "togethercomputer/RedPajama-INCITE-Chat-3B-v1",
    ],
    headers: {
      Authorization: "Bearer {API_KEY}",
      "Content-Type": "application/json",
    },
  },

  // 5. OPENROUTER API
  openrouter: {
    base: "https://openrouter.ai/api/v1",
    endpoints: {
      chat: "/chat/completions",
      models: "/models",
      auth: "/auth/key", // Check balance
    },
    models: [
      "mistralai/mistral-7b-instruct:free",
      "openai/gpt-3.5-turbo",
      "anthropic/claude-instant-v1",
      "google/palm-2-chat-bison",
    ],
    headers: {
      Authorization: "Bearer {API_KEY}",
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ultrasolx.com",
      "X-Title": "ULTRASOLX Bot",
    },
  },

  // 6. PAWAN API
  pawan: {
    base: "https://api.pawan.krd",
    endpoints: {
      chat: "/cosmosrp/v1/chat/completions",
      models: "/v1/models",
    },
    models: ["pai-001-rp", "pai-001", "gpt-3.5-turbo"],
    headers: {
      Authorization: "Bearer {API_KEY}",
      "Content-Type": "application/json",
    },
  },

  // 7. VANNA AI API (SQL focused)
  vanna: {
    base: "https://api.vanna.ai",
    endpoints: {
      rpc: "/rpc",
      generateSql: "/generate_sql",
    },
    headers: {
      Authorization: "Bearer {API_KEY}",
      "Content-Type": "application/json",
    },
  },

  // 8. STABILITY AI (Image Generation)
  stability: {
    base: "https://api.stability.ai/v1",
    endpoints: {
      textToImage: "/generation/stable-diffusion-v1-6/text-to-image",
      textToImageXL: "/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      balance: "/user/balance",
      account: "/user/account",
    },
    models: ["stable-diffusion-v1-6", "stable-diffusion-xl-1024-v1-0", "stable-diffusion-512-v2-1"],
    headers: {
      Authorization: "Bearer {API_KEY}",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
}

module.exports = API_ENDPOINTS
