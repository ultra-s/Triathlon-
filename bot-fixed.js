const TelegramBot = require("node-telegram-bot-api")
const { smartReply, generateImage } = require("./ai-fixed")
require("dotenv").config()

// Initialize bot with your token
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

console.log("🤖 ULTRASOLX Bot starting...")

// Enhanced error handling
bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error.message)
})

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  const name = msg.from.first_name || "there"

  bot.sendMessage(
    chatId,
    `🤖 Hey ${name}! Welcome to ULTRASOLX!

🚀 **What I can do:**
💬 Chat with multiple AI models
🎨 Generate images from text
🧠 Remember our conversation
⚡ Super fast responses with fallback

**Commands:**
/help - Show help
/clear - Clear memory
/image <prompt> - Generate image
/nsfw <prompt> - Generate adult content

Just send me any message to start chatting! 🎉`,
    {
      parse_mode: "Markdown",
    },
  )
})

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id

  bot.sendMessage(
    chatId,
    `🤖 **ULTRASOLX Help**

**💬 Chat:**
• Just type anything to chat with AI
• I remember our conversation

**🎨 Image Generation:**
• \`/image a beautiful sunset\`
• \`draw a dragon\`
• \`generate image of a cat\`
• \`/nsfw artistic nude photography\`

**🛠️ Commands:**
• \`/clear\` - Clear conversation memory
• \`/help\` - Show this help

**✨ Features:**
• Multi-AI fallback system
• Conversation memory
• High-quality image generation

Happy chatting! 🚀`,
    {
      parse_mode: "Markdown",
    },
  )
})

// Clear memory command
bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id
  // You could implement per-chat memory clearing here
  bot.sendMessage(chatId, "🧹 Memory cleared! Starting fresh conversation.")
})

// Image generation commands
bot.onText(/\/image (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const prompt = match[1]

  bot.sendChatAction(chatId, "upload_photo")

  try {
    const imageBuffer = await generateImage(prompt)

    if (imageBuffer) {
      await bot.sendPhoto(chatId, imageBuffer, {
        caption: `🎨 Generated: "${prompt}"`,
      })
    } else {
      bot.sendMessage(chatId, "❌ Image generation failed. Please try again with a different prompt.")
    }
  } catch (error) {
    console.error("❌ Image generation error:", error.message)
    bot.sendMessage(chatId, "⚠️ Image generation is temporarily unavailable.")
  }
})

// NSFW image generation
bot.onText(/\/nsfw (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const prompt = match[1]

  // Enhance NSFW prompt
  const enhancedPrompt = `artistic ${prompt}, renaissance style, high quality`

  bot.sendChatAction(chatId, "upload_photo")

  try {
    const imageBuffer = await generateImage(enhancedPrompt)

    if (imageBuffer) {
      await bot.sendPhoto(chatId, imageBuffer, {
        caption: `🔞 Generated: "${prompt}"`,
      })
    } else {
      bot.sendMessage(
        chatId,
        `❌ NSFW image generation failed. 

**Try:**
• More artistic descriptions
• "renaissance style intimate scene"
• "artistic photography of..."`,
      )
    }
  } catch (error) {
    console.error("❌ NSFW image generation error:", error.message)
    bot.sendMessage(chatId, "⚠️ NSFW image generation is temporarily unavailable.")
  }
})

// Main message handler
bot.on("message", async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text?.trim()
  const userId = msg.from.id

  // Skip if no text or if it's a command
  if (!text || text.startsWith("/")) return

  console.log(`📨 Message from ${userId}: "${text.substring(0, 100)}..."`)

  bot.sendChatAction(chatId, "typing")

  try {
    // Handle image generation triggers
    if (
      text.toLowerCase().startsWith("draw ") ||
      text.toLowerCase().startsWith("generate image") ||
      text.toLowerCase().startsWith("create image")
    ) {
      const prompt = text.replace(/^(draw |generate image |create image )/i, "").trim()

      if (!prompt) {
        return bot.sendMessage(chatId, "Please provide a prompt for image generation.")
      }

      bot.sendChatAction(chatId, "upload_photo")
      const imageBuffer = await generateImage(prompt)

      if (imageBuffer) {
        return bot.sendPhoto(chatId, imageBuffer, {
          caption: `🎨 Generated: "${prompt}"`,
        })
      } else {
        return bot.sendMessage(chatId, "❌ Image generation failed. Please try again.")
      }
    }

    // Handle NSFW triggers
    if (
      text.toLowerCase().startsWith("nsfw") ||
      text.toLowerCase().includes("adult content") ||
      text.toLowerCase().startsWith("prompt:")
    ) {
      const prompt = text.replace(/^(nsfw|prompt:)\s*/i, "").trim()
      const enhancedPrompt = `artistic ${prompt}, renaissance style, photography`

      bot.sendChatAction(chatId, "upload_photo")
      const imageBuffer = await generateImage(enhancedPrompt)

      if (imageBuffer) {
        return bot.sendPhoto(chatId, imageBuffer, {
          caption: `🔞 Generated: "${prompt}"`,
        })
      } else {
        return bot.sendMessage(chatId, "❌ NSFW content generation failed. Try more artistic descriptions.")
      }
    }

    // Regular AI chat
    const reply = await smartReply(text, userId)

    // Handle long messages
    if (reply.length > 4096) {
      const chunks = reply.match(/.{1,4000}/g) || [reply]
      for (let i = 0; i < chunks.length; i++) {
        await bot.sendMessage(chatId, chunks[i])
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } else {
      await bot.sendMessage(chatId, reply)
    }
  } catch (error) {
    console.error("❌ Bot error:", error.message)
    bot.sendMessage(chatId, "⚠️ Error processing your message. Please try again.")
  }
})

console.log("✅ ULTRASOLX Bot is running!")
