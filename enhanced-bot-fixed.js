require("dotenv").config()
const { Telegraf } = require("telegraf")
const axios = require("axios")

const bot = new Telegraf(process.env.BOT_TOKEN)
const chatMemory = {}
const userStats = {}

// Fixed AI providers with correct endpoints and formats
const AI_PROVIDERS = [
  {
    name: "Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    keys: [process.env.GEMINI_API_KEY].filter(Boolean),
    format: (messages) => ({
      contents: [
        {
          parts: [{ text: messages.at(-1).content }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
    extract: (res) => res.data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    headers: (key) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    }),
  },
  {
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keys: [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY2].filter(Boolean),
    model: "mixtral-8x7b-32768",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  {
    name: "Together",
    url: "https://api.together.xyz/v1/chat/completions",
    keys: [process.env.TOGETHER_API_KEY, process.env.TOGETHER_API_KEY2].filter(Boolean),
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  {
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keys: [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY2].filter(Boolean),
    model: "mistralai/mistral-7b-instruct:free",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ultrasolx.com",
      "X-Title": "ULTRASOLX Bot",
    }),
  },
  {
    name: "Pawan",
    url: "https://api.pawan.krd/cosmosrp/v1/chat/completions",
    keys: [process.env.PAWAN_API_KEY, process.env.PAWAN_API_KEY2].filter(Boolean),
    model: "pai-001-rp",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
]

// Fixed askAI function with better error handling
async function askAI(chatId, message, userId) {
  try {
    if (!userStats[userId]) {
      userStats[userId] = { requests: 0, lastRequest: Date.now() }
    }

    const now = Date.now()
    if (now - userStats[userId].lastRequest < 1000) {
      return "⏳ Please wait a moment before sending another message."
    }

    userStats[userId].requests++
    userStats[userId].lastRequest = now

    // Initialize or update chat memory
    if (!chatMemory[chatId]) {
      chatMemory[chatId] = []
    }

    chatMemory[chatId].push({ role: "user", content: message })
    chatMemory[chatId] = chatMemory[chatId].slice(-15) // Keep last 15 messages

    for (const provider of AI_PROVIDERS) {
      if (!provider.keys || provider.keys.length === 0) {
        console.log(`⚠️ No keys available for ${provider.name}`)
        continue
      }

      // Try each key for the provider
      for (const key of provider.keys) {
        try {
          console.log(`🔄 Trying ${provider.name}...`)

          const body = provider.format
            ? provider.format(chatMemory[chatId])
            : {
                model: provider.model,
                messages: chatMemory[chatId],
                temperature: 0.7,
                max_tokens: 1500,
                stream: false,
              }

          const headers = provider.headers(key)

          const res = await axios.post(provider.url, body, {
            headers,
            timeout: 30000, // 30 second timeout
          })

          const reply = provider.extract ? provider.extract(res) : res.data.choices?.[0]?.message?.content

          if (reply && reply.trim()) {
            chatMemory[chatId].push({ role: "assistant", content: reply })
            console.log(`✅ ${provider.name} succeeded`)
            return `${reply}\n\n_✨ Powered by ${provider.name}_`
          }
        } catch (err) {
          const status = err.response?.status
          const errorMsg = err.response?.data?.error?.message || err.message
          console.log(`❌ ${provider.name} failed: ${status} - ${errorMsg}`)

          // If rate limited, try next key
          if (status === 429) continue
          // If unauthorized, skip this provider entirely
          if (status === 401 || status === 403) break
        }
      }
    }

    return "❌ All AI providers are currently unavailable. Please try again in a few moments."
  } catch (error) {
    console.error("❌ Error in askAI:", error.message)
    return "⚠️ An unexpected error occurred. Please try again."
  }
}

// Fixed image generation function
async function generateImage(prompt) {
  const keys = [process.env.STABILITY_API_KEY].filter(Boolean)

  if (keys.length === 0) {
    console.log("❌ No Stability AI keys available")
    return null
  }

  for (const key of keys) {
    try {
      console.log("🎨 Generating image...")

      const res = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 20,
          seed: Math.floor(Math.random() * 1000000),
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 60000, // 60 second timeout for image generation
        },
      )

      if (res.data && res.data.artifacts && res.data.artifacts[0]) {
        const b64 = res.data.artifacts[0].base64
        console.log("✅ Image generated successfully")
        return Buffer.from(b64, "base64")
      } else {
        console.log("❌ No image data in response")
        return null
      }
    } catch (err) {
      const status = err.response?.status
      const errorMsg = err.response?.data?.message || err.message
      console.log(`❌ Image generation failed: ${status} - ${errorMsg}`)
    }
  }
  return null
}

// Bot command handlers with error handling
bot.start((ctx) => {
  try {
    const name = ctx.from?.first_name || "there"
    ctx.reply(`🤖 Hey ${name}! Welcome to ULTRASOLX!

🚀 **What I can do:**
💬 Chat with multiple AI models
🎨 Generate images from text
🧠 Remember our conversation
⚡ Super fast responses with fallback

**Commands:**
/help - Show detailed help
/clear - Clear chat memory  
/stats - Your usage statistics
/image <prompt> - Generate an image

Just send me any message to start chatting! 🎉`)
  } catch (error) {
    console.error("❌ Error in start command:", error.message)
    ctx.reply("⚠️ Welcome to ULTRASOLX! Something went wrong, but you can still chat with me.")
  }
})

bot.help((ctx) => {
  try {
    ctx.reply(`🤖 **ULTRASOLX Help Guide**

**💬 Chat Commands:**
• Just type anything to chat with AI
• I'll try multiple AI providers for the best response

**🎨 Image Generation:**
• \`/image a beautiful sunset over mountains\`
• \`nsfw: your adult prompt\` (if enabled)
• \`prompt: your creative idea\`

**🛠️ Utility Commands:**
• \`/clear\` - Clear conversation memory
• \`/stats\` - See your usage statistics  

**✨ Features:**
• Multi-AI fallback system
• Conversation memory
• Rate limiting protection
• High-quality image generation

Happy chatting! 🚀`)
  } catch (error) {
    console.error("❌ Error in help command:", error.message)
    ctx.reply("⚠️ Help information is temporarily unavailable.")
  }
})

bot.command("clear", (ctx) => {
  try {
    const chatId = ctx.chat.id
    delete chatMemory[chatId]
    ctx.reply("🧹 Chat memory cleared! Starting fresh conversation.")
  } catch (error) {
    console.error("❌ Error in clear command:", error.message)
    ctx.reply("⚠️ Failed to clear memory, but you can continue chatting.")
  }
})

bot.command("stats", (ctx) => {
  try {
    const userId = ctx.from.id
    const stats = userStats[userId] || { requests: 0 }
    const lastRequest = stats.lastRequest ? new Date(stats.lastRequest).toLocaleString() : "Never"

    ctx.reply(`📊 **Your ULTRASOLX Stats:**

🔢 Total Requests: ${stats.requests}
⏰ Last Request: ${lastRequest}
💾 Memory Slots: ${chatMemory[ctx.chat.id]?.length || 0}/15

Keep chatting to see these numbers grow! 📈`)
  } catch (error) {
    console.error("❌ Error in stats command:", error.message)
    ctx.reply("⚠️ Stats are temporarily unavailable.")
  }
})

bot.command("image", async (ctx) => {
  try {
    const prompt = ctx.message.text.replace("/image", "").trim()
    if (!prompt) {
      return ctx.reply(`🎨 **Image Generation**

Usage: \`/image your prompt here\`

Examples:
• \`/image a majestic dragon in a fantasy landscape\`
• \`/image modern minimalist logo design\`
• \`/image cyberpunk city at night with neon lights\`

Try to be descriptive for better results! ✨`)
    }

    await ctx.sendChatAction("upload_photo")
    const imageBuffer = await generateImage(prompt)

    if (imageBuffer) {
      return ctx.replyWithPhoto(
        { source: imageBuffer },
        {
          caption: `🎨 **Generated Image**\n📝 Prompt: "${prompt}"\n⚡ Powered by Stability AI`,
        },
      )
    }

    ctx.reply("❌ Image generation failed. Please try again with a different prompt or wait a moment.")
  } catch (error) {
    console.error("❌ Error in image command:", error.message)
    ctx.reply("⚠️ Image generation is temporarily unavailable.")
  }
})

// Main message handler with comprehensive error handling
bot.on("message", async (ctx) => {
  const text = ctx.message?.text
  const chatId = ctx.chat?.id
  const userId = ctx.from?.id

  if (!text || !chatId || !userId) {
    return
  }

  try {
    await ctx.sendChatAction("typing")

    // Handle image generation triggers
    if (
      text.toLowerCase().startsWith("nsfw") ||
      text.toLowerCase().startsWith("prompt:") ||
      text.toLowerCase().startsWith("generate image:")
    ) {
      const prompt = text.replace(/^(nsfw|prompt:|generate image:)\s*/i, "").trim()

      if (!prompt) {
        return ctx.reply("Please provide a prompt after the command.")
      }

      await ctx.sendChatAction("upload_photo")
      const imageBuffer = await generateImage(prompt)

      if (imageBuffer) {
        return ctx.replyWithPhoto(
          { source: imageBuffer },
          {
            caption: `🎨 Generated: "${prompt}"`,
          },
        )
      }
      return ctx.reply("❌ Image generation failed. Try again with a different prompt.")
    }

    // Regular AI chat
    const reply = await askAI(chatId, text, userId)

    // Handle long messages by splitting them
    if (reply.length > 4096) {
      const chunks = reply.match(/.{1,4000}/g) || [reply]
      for (let i = 0; i < chunks.length; i++) {
        await ctx.reply(chunks[i])
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } else {
      await ctx.reply(reply)
    }
  } catch (e) {
    console.error("❌ Unexpected error in message handler:", e.message)
    try {
      await ctx.reply("⚠️ Something went wrong. Please try again in a moment.")
    } catch (replyError) {
      console.error("❌ Failed to send error message:", replyError.message)
    }
  }
})

// Global error handling
bot.catch((err, ctx) => {
  console.error("❌ Bot error:", err)
  try {
    ctx.reply("⚠️ An error occurred. Please try again.")
  } catch (replyError) {
    console.error("❌ Failed to send error reply:", replyError.message)
  }
})

// Graceful shutdown handlers
process.once("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...")
  bot.stop("SIGINT")
})

process.once("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully...")
  bot.stop("SIGTERM")
})

// Start the bot with error handling
bot
  .launch()
  .then(() => {
    console.log("🚀 ULTRASOLX Enhanced Bot is running!")
    console.log(`📊 Loaded ${AI_PROVIDERS.filter((p) => p.keys?.length > 0).length} AI providers`)

    // Log available providers
    AI_PROVIDERS.forEach((provider) => {
      const keyCount = provider.keys?.length || 0
      console.log(`  • ${provider.name}: ${keyCount} key(s)`)
    })
  })
  .catch((err) => {
    console.error("❌ Failed to start bot:", err.message)
    process.exit(1)
  })

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
})
