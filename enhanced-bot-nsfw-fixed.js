require("dotenv").config()
const { Telegraf } = require("telegraf")
const axios = require("axios")

const bot = new Telegraf(process.env.BOT_TOKEN)
const chatMemory = {}
const userStats = {}

// Enhanced AI providers with better error handling
const AI_PROVIDERS = [
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
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    }),
    extract: (res) => res.data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    headers: (key) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    }),
  },
]

// Enhanced askAI with better debugging
async function askAI(chatId, message, userId) {
  try {
    console.log(`🔄 Processing message from user ${userId}: "${message.substring(0, 50)}..."`)

    if (!userStats[userId]) {
      userStats[userId] = { requests: 0, lastRequest: Date.now() }
    }

    const now = Date.now()
    if (now - userStats[userId].lastRequest < 1000) {
      console.log(`⏳ Rate limiting user ${userId}`)
      return "⏳ Please wait a moment before sending another message."
    }

    userStats[userId].requests++
    userStats[userId].lastRequest = now

    // Initialize chat memory
    if (!chatMemory[chatId]) {
      chatMemory[chatId] = []
    }

    chatMemory[chatId].push({ role: "user", content: message })
    chatMemory[chatId] = chatMemory[chatId].slice(-15)

    console.log(`💾 Chat memory for ${chatId}: ${chatMemory[chatId].length} messages`)

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
            timeout: 30000,
          })

          const reply = provider.extract ? provider.extract(res) : res.data.choices?.[0]?.message?.content

          if (reply && reply.trim()) {
            chatMemory[chatId].push({ role: "assistant", content: reply })
            console.log(`✅ ${provider.name} succeeded with ${reply.length} characters`)
            return `${reply}\n\n_✨ Powered by ${provider.name}_`
          } else {
            console.log(`⚠️ ${provider.name} returned empty response`)
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

    console.log("❌ All AI providers failed")
    return "❌ All AI providers are currently unavailable. Please try again in a few moments."
  } catch (error) {
    console.error("❌ Error in askAI:", error.message)
    return "⚠️ An unexpected error occurred. Please try again."
  }
}

// Enhanced NSFW image generation with multiple approaches
async function generateNSFWImage(prompt) {
  console.log(`🎨 Generating NSFW image for prompt: "${prompt.substring(0, 50)}..."`)

  // Method 1: Try with modified prompt to bypass filters
  const nsfwPrompts = [
    prompt, // Original prompt
    `artistic ${prompt}`, // Add "artistic" prefix
    `renaissance style ${prompt}`, // Art style prefix
    `oil painting of ${prompt}`, // Art medium prefix
    prompt
      .replace(/nsfw/gi, "")
      .trim(), // Remove NSFW keyword
  ]

  for (const modifiedPrompt of nsfwPrompts) {
    const result = await tryStabilityAI(modifiedPrompt)
    if (result) {
      console.log("✅ NSFW image generated successfully")
      return result
    }
  }

  // Method 2: Try alternative image generation service
  console.log("🔄 Trying alternative image generation...")
  return await tryAlternativeImageGen(prompt)
}

// Stability AI with enhanced settings for NSFW
async function tryStabilityAI(prompt) {
  const keys = [process.env.STABILITY_API_KEY].filter(Boolean)

  if (keys.length === 0) {
    console.log("❌ No Stability AI keys available")
    return null
  }

  for (const key of keys) {
    try {
      const response = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: "blurry, low quality, censored", weight: -1 }, // Negative prompt
          ],
          cfg_scale: 12, // Higher for more prompt adherence
          height: 512,
          width: 512,
          samples: 1,
          steps: 30, // More steps for better quality
          seed: Math.floor(Math.random() * 1000000),
          style_preset: "photographic", // Try different styles
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 60000,
        },
      )

      if (response.data && response.data.artifacts && response.data.artifacts[0]) {
        const b64 = response.data.artifacts[0].base64
        return Buffer.from(b64, "base64")
      }
    } catch (err) {
      const status = err.response?.status
      const errorMsg = err.response?.data?.message || err.message
      console.log(`❌ Stability AI failed: ${status} - ${errorMsg}`)

      // If content filtered, try next prompt variation
      if (status === 400 && errorMsg.includes("content")) {
        console.log("⚠️ Content filtered, trying alternative approach...")
        continue
      }
    }
  }
  return null
}

// Alternative image generation using different service
async function tryAlternativeImageGen(prompt) {
  // You can add other image generation APIs here
  // For now, return a message about the limitation
  console.log("⚠️ Alternative image generation not configured")
  return null
}

// Regular image generation (non-NSFW)
async function generateImage(prompt) {
  console.log(`🎨 Generating regular image for: "${prompt.substring(0, 50)}..."`)

  const keys = [process.env.STABILITY_API_KEY].filter(Boolean)

  if (keys.length === 0) {
    console.log("❌ No Stability AI keys available")
    return null
  }

  for (const key of keys) {
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
          seed: Math.floor(Math.random() * 1000000),
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 60000,
        },
      )

      if (response.data && response.data.artifacts && response.data.artifacts[0]) {
        const b64 = response.data.artifacts[0].base64
        console.log("✅ Regular image generated successfully")
        return Buffer.from(b64, "base64")
      }
    } catch (err) {
      const status = err.response?.status
      const errorMsg = err.response?.data?.message || err.message
      console.log(`❌ Image generation failed: ${status} - ${errorMsg}`)
    }
  }
  return null
}

// Bot commands with enhanced logging
bot.start((ctx) => {
  try {
    console.log(`👋 New user started: ${ctx.from.id} (${ctx.from.first_name})`)
    const name = ctx.from?.first_name || "there"
    ctx.reply(`🤖 Hey ${name}! Welcome to ULTRASOLX!

🚀 **What I can do:**
💬 Chat with multiple AI models
🎨 Generate images (including adult content)
🧠 Remember our conversation
⚡ Super fast responses with fallback

**Commands:**
/help - Show detailed help
/clear - Clear chat memory  
/stats - Your usage statistics
/image <prompt> - Generate an image
/nsfw <prompt> - Generate adult content image

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
• \`/nsfw your adult content prompt\`
• \`nsfw: your adult prompt\` (alternative format)
• \`prompt: your creative idea\`

**🛠️ Utility Commands:**
• \`/clear\` - Clear conversation memory
• \`/stats\` - See your usage statistics  

**✨ Features:**
• Multi-AI fallback system
• Conversation memory
• Adult content generation
• High-quality image generation

**NSFW Tips:**
• Be descriptive but not overly explicit
• Try artistic styles: "renaissance style", "oil painting"
• Use "artistic" or "photography" in your prompt

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
    console.log(`🧹 Cleared memory for chat ${chatId}`)
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

For adult content, use: \`/nsfw your prompt\`

Try to be descriptive for better results! ✨`)
    }

    console.log(`🎨 Image command from user ${ctx.from.id}: "${prompt}"`)
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

// New NSFW command
bot.command("nsfw", async (ctx) => {
  try {
    const prompt = ctx.message.text.replace("/nsfw", "").trim()
    if (!prompt) {
      return ctx.reply(`🔞 **NSFW Image Generation**

Usage: \`/nsfw your adult prompt here\`

Tips for better results:
• Be descriptive but tasteful
• Try: "artistic nude photography"
• Try: "renaissance style intimate scene"
• Try: "oil painting romantic couple"

⚠️ This feature uses advanced prompt techniques to bypass content filters.`)
    }

    console.log(`🔞 NSFW command from user ${ctx.from.id}: "${prompt}"`)
    await ctx.sendChatAction("upload_photo")
    const imageBuffer = await generateNSFWImage(prompt)

    if (imageBuffer) {
      return ctx.replyWithPhoto(
        { source: imageBuffer },
        {
          caption: `🔞 **Generated NSFW Image**\n📝 Prompt: "${prompt}"\n⚡ Enhanced generation`,
        },
      )
    }

    ctx.reply(`❌ NSFW image generation failed. 

**Possible reasons:**
• Content too explicit for AI filters
• Try more artistic descriptions
• Use terms like "artistic", "photography", "painting"

**Alternative:** Try rephrasing your prompt with artistic styles.`)
  } catch (error) {
    console.error("❌ Error in nsfw command:", error.message)
    ctx.reply("⚠️ NSFW image generation is temporarily unavailable.")
  }
})

// Enhanced message handler with better debugging
bot.on("message", async (ctx) => {
  const text = ctx.message?.text
  const chatId = ctx.chat?.id
  const userId = ctx.from?.id

  if (!text || !chatId || !userId) {
    console.log("⚠️ Received message without text, chatId, or userId")
    return
  }

  console.log(`📨 Message received from ${userId} in chat ${chatId}: "${text.substring(0, 100)}..."`)

  try {
    await ctx.sendChatAction("typing")

    // Handle various NSFW triggers
    if (
      text.toLowerCase().startsWith("nsfw") ||
      text.toLowerCase().startsWith("prompt:") ||
      text.toLowerCase().startsWith("generate image:") ||
      text.toLowerCase().includes("adult content") ||
      text.toLowerCase().includes("nude") ||
      text.toLowerCase().includes("sexy")
    ) {
      const prompt = text
        .replace(/^(nsfw|prompt:|generate image:)\s*/i, "")
        .replace(/adult content/gi, "")
        .trim()

      if (!prompt) {
        return ctx.reply("Please provide a prompt for image generation.")
      }

      console.log(`🔞 NSFW image request: "${prompt}"`)
      await ctx.sendChatAction("upload_photo")
      const imageBuffer = await generateNSFWImage(prompt)

      if (imageBuffer) {
        return ctx.replyWithPhoto(
          { source: imageBuffer },
          {
            caption: `🔞 Generated: "${prompt}"`,
          },
        )
      }
      return ctx.reply(`❌ Could not generate image. Try:
• More artistic descriptions
• "renaissance style intimate scene"
• "artistic photography of..."`)
    }

    // Regular AI chat
    console.log(`💬 Processing chat message from user ${userId}`)
    const reply = await askAI(chatId, text, userId)

    if (!reply) {
      console.log("❌ No reply generated")
      return ctx.reply("⚠️ I couldn't generate a response. Please try again.")
    }

    // Handle long messages
    if (reply.length > 4096) {
      const chunks = reply.match(/.{1,4000}/g) || [reply]
      console.log(`📝 Splitting long message into ${chunks.length} chunks`)
      for (let i = 0; i < chunks.length; i++) {
        await ctx.reply(chunks[i])
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } else {
      await ctx.reply(reply)
      console.log(`✅ Reply sent to user ${userId} (${reply.length} characters)`)
    }
  } catch (e) {
    console.error("❌ Unexpected error in message handler:", e.message)
    console.error("Stack trace:", e.stack)
    try {
      await ctx.reply("⚠️ Something went wrong. Please try again in a moment.")
    } catch (replyError) {
      console.error("❌ Failed to send error message:", replyError.message)
    }
  }
})

// Enhanced error handling
bot.catch((err, ctx) => {
  console.error("❌ Bot error:", err)
  console.error("Context:", {
    updateType: ctx.updateType,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
    message: ctx.message?.text?.substring(0, 100),
  })
  try {
    ctx.reply("⚠️ An error occurred. Please try again.")
  } catch (replyError) {
    console.error("❌ Failed to send error reply:", replyError.message)
  }
})

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...")
  bot.stop("SIGINT")
})

process.once("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully...")
  bot.stop("SIGTERM")
})

// Start bot with enhanced logging
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

    console.log("🔞 NSFW image generation enabled with enhanced prompts")
    console.log("💬 Chat responses enabled with fallback system")
  })
  .catch((err) => {
    console.error("❌ Failed to start bot:", err.message)
    console.error("Stack trace:", err.stack)
    process.exit(1)
  })

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error)
  console.error("Stack trace:", error.stack)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
})
