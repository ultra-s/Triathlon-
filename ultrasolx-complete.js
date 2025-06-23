require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")
const fs = require("fs")

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

// Memory system
const memoryPath = "./memory.json"
if (!fs.existsSync(memoryPath)) {
  fs.writeFileSync(memoryPath, JSON.stringify([], null, 2))
}

// All working AI providers with correct endpoints
const AI_PROVIDERS = [
  {
    name: "Groq (Mixtral)",
    test: async (message) => {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      )
      return response.data.choices[0].message.content
    },
  },
  {
    name: "Groq (Backup)",
    test: async (message) => {
      if (!process.env.GROQ_API_KEY2) throw new Error("No backup key")
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY2}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      )
      return response.data.choices[0].message.content
    },
  },
  {
    name: "Together AI",
    test: async (message) => {
      const response = await axios.post(
        "https://api.together.xyz/v1/chat/completions",
        {
          model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      )
      return response.data.choices[0].message.content
    },
  },
  {
    name: "OpenRouter",
    test: async (message) => {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ultrasolx.com",
            "X-Title": "ULTRASOLX Bot",
          },
          timeout: 30000,
        },
      )
      return response.data.choices[0].message.content
    },
  },
  {
    name: "Gemini",
    test: async (message) => {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: message }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        },
        {
          timeout: 30000,
        },
      )
      return response.data.candidates[0].content.parts[0].text
    },
  },
]

// AI Chat function
async function getAIResponse(message, userId = "default") {
  console.log(`💬 Processing: "${message.substring(0, 50)}..."`)

  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`🔄 Trying ${provider.name}...`)
      const response = await provider.test(message)

      if (response && response.trim()) {
        console.log(`✅ ${provider.name} succeeded`)
        return `${response}\n\n_✨ ${provider.name}_`
      }
    } catch (error) {
      const status = error.response?.status
      const errorMsg = error.response?.data?.error?.message || error.message
      console.log(`❌ ${provider.name} failed: ${status} - ${errorMsg}`)
    }
  }

  return "❌ All AI providers are currently unavailable. Please try again."
}

// Image generation function
async function generateImage(prompt) {
  console.log(`🎨 Generating image: "${prompt.substring(0, 50)}..."`)

  if (!process.env.STABILITY_API_KEY) {
    console.log("❌ No Stability AI key available")
    return null
  }

  try {
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
      {
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 60000,
      },
    )

    if (response.data.artifacts && response.data.artifacts[0]) {
      console.log("✅ Image generated successfully")
      return Buffer.from(response.data.artifacts[0].base64, "base64")
    }
  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    console.log(`❌ Image generation failed: ${status} - ${message}`)
  }

  return null
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  const name = msg.from.first_name || "there"

  bot.sendMessage(
    chatId,
    `🤖 Hey ${name}! Welcome to ULTRASOLX!

🚀 **Features:**
💬 Multi-AI chat (Groq, Gemini, Together, OpenRouter)
🎨 Image generation (Stability AI)
🧠 Conversation memory
⚡ Automatic fallback system

**Commands:**
/help - Show help
/image <prompt> - Generate image
/nsfw <prompt> - Adult content
/test - Test all APIs
/clear - Clear memory

Just send any message to chat! 🎉`,
  )
})

bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, "🧪 Testing all APIs...")

  let results = "📊 **API Test Results:**\n\n"

  for (const provider of AI_PROVIDERS) {
    try {
      await provider.test("Hello")
      results += `✅ ${provider.name}: Working\n`
    } catch (error) {
      results += `❌ ${provider.name}: Failed\n`
    }
  }

  // Test image generation
  try {
    const imageBuffer = await generateImage("test image")
    results += imageBuffer ? "✅ Stability AI: Working\n" : "❌ Stability AI: Failed\n"
  } catch (error) {
    results += "❌ Stability AI: Failed\n"
  }

  bot.sendMessage(chatId, results)
})

bot.onText(/\/image (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const prompt = match[1]

  bot.sendChatAction(chatId, "upload_photo")

  const imageBuffer = await generateImage(prompt)
  if (imageBuffer) {
    bot.sendPhoto(chatId, imageBuffer, { caption: `🎨 "${prompt}"` })
  } else {
    bot.sendMessage(chatId, "❌ Image generation failed. Try again.")
  }
})

bot.onText(/\/nsfw (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const prompt = `artistic ${match[1]}, renaissance style, photography`

  bot.sendChatAction(chatId, "upload_photo")

  const imageBuffer = await generateImage(prompt)
  if (imageBuffer) {
    bot.sendPhoto(chatId, imageBuffer, { caption: `🔞 "${match[1]}"` })
  } else {
    bot.sendMessage(chatId, "❌ NSFW generation failed. Try more artistic descriptions.")
  }
})

// Main message handler
bot.on("message", async (msg) => {
  const text = msg.text?.trim()
  const chatId = msg.chat.id
  const userId = msg.from.id

  if (!text || text.startsWith("/")) return

  bot.sendChatAction(chatId, "typing")

  try {
    // Handle image requests
    if (text.toLowerCase().startsWith("draw ") || text.toLowerCase().includes("generate image")) {
      const prompt = text.replace(/^draw |generate image /i, "").trim()
      bot.sendChatAction(chatId, "upload_photo")

      const imageBuffer = await generateImage(prompt)
      if (imageBuffer) {
        return bot.sendPhoto(chatId, imageBuffer, { caption: `🎨 "${prompt}"` })
      } else {
        return bot.sendMessage(chatId, "❌ Image generation failed.")
      }
    }

    // Regular AI chat
    const response = await getAIResponse(text, userId)
    bot.sendMessage(chatId, response)
  } catch (error) {
    console.error("❌ Bot error:", error.message)
    bot.sendMessage(chatId, "⚠️ Something went wrong. Please try again.")
  }
})

// Error handling
bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error.message)
})

console.log("🚀 ULTRASOLX Bot starting...")
console.log("📡 All API endpoints loaded and ready!")
