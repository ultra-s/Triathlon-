console.log("🔍 Starting Simple Bot Debug...")

// Step 1: Check Node.js
console.log(`📦 Node.js version: ${process.version}`)

// Step 2: Check dotenv
try {
  require("dotenv").config()
  console.log("✅ dotenv loaded")
} catch (error) {
  console.log("❌ dotenv failed:", error.message)
  process.exit(1)
}

// Step 3: Check environment variables
console.log("\n🔑 Environment Variables:")
console.log(`BOT_TOKEN: ${process.env.BOT_TOKEN ? "Present" : "Missing"}`)
console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "Present" : "Missing"}`)

if (!process.env.BOT_TOKEN) {
  console.log("❌ BOT_TOKEN is required!")
  console.log("💡 Add BOT_TOKEN=your_token to .env file")
  process.exit(1)
}

// Step 4: Check dependencies
console.log("\n📦 Checking Dependencies:")
try {
  const TelegramBot = require("node-telegram-bot-api")
  console.log("✅ node-telegram-bot-api: OK")
} catch (error) {
  console.log("❌ node-telegram-bot-api missing")
  console.log("💡 Run: npm install node-telegram-bot-api")
  process.exit(1)
}

try {
  const axios = require("axios")
  console.log("✅ axios: OK")
} catch (error) {
  console.log("❌ axios missing")
  console.log("💡 Run: npm install axios")
  process.exit(1)
}

// Step 5: Test bot token
console.log("\n🤖 Testing Bot Token...")
const TelegramBot = require("node-telegram-bot-api")

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false })

bot
  .getMe()
  .then((botInfo) => {
    console.log("✅ Bot token is valid!")
    console.log(`   Bot name: ${botInfo.first_name}`)
    console.log(`   Bot username: @${botInfo.username}`)
    console.log(`   Bot ID: ${botInfo.id}`)

    console.log("\n🚀 Everything looks good! Starting simple bot...")
    startSimpleBot()
  })
  .catch((error) => {
    console.log("❌ Bot token test failed:")
    console.log(`   Error: ${error.message}`)

    if (error.message.includes("401")) {
      console.log("💡 Bot token is invalid or expired")
      console.log("   Get a new token from @BotFather on Telegram")
    } else if (error.message.includes("network")) {
      console.log("💡 Network connection issue")
      console.log("   Check your internet connection")
    }

    process.exit(1)
  })

function startSimpleBot() {
  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

  console.log("🤖 Simple ULTRASOLX Bot is now running!")
  console.log("📱 Go to Telegram and send /start to your bot")

  // Basic start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    const name = msg.from.first_name || "there"

    console.log(`👋 /start command from ${name} (${msg.from.id})`)

    bot.sendMessage(
      chatId,
      `🤖 Hello ${name}! 

✅ ULTRASOLX Bot is working!
✅ Telegram connection: OK
✅ Bot token: Valid

🧪 **Test commands:**
/test - Test AI response
/ping - Simple ping test
/info - Bot information

Just send me any message to chat! 🎉`,
    )
  })

  // Test command
  bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id
    console.log(`🧪 /test command from user ${msg.from.id}`)

    bot.sendMessage(chatId, "🧪 Testing AI...")

    // Test AI if available
    if (process.env.GROQ_API_KEY) {
      try {
        const axios = require("axios")
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: "Say 'AI test successful'" }],
            max_tokens: 50,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const aiResponse = response.data.choices[0].message.content
        bot.sendMessage(chatId, `✅ AI Test Result:\n${aiResponse}`)
        console.log("✅ AI test successful")
      } catch (error) {
        bot.sendMessage(chatId, `❌ AI Test Failed:\n${error.response?.status || error.message}`)
        console.log("❌ AI test failed:", error.response?.status)
      }
    } else {
      bot.sendMessage(chatId, "⚠️ No AI API key configured")
    }
  })

  // Ping command
  bot.onText(/\/ping/, (msg) => {
    const chatId = msg.chat.id
    console.log(`🏓 /ping from user ${msg.from.id}`)
    bot.sendMessage(chatId, "🏓 Pong! Bot is responsive.")
  })

  // Info command
  bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id
    const uptime = process.uptime()
    const minutes = Math.floor(uptime / 60)
    const seconds = Math.floor(uptime % 60)

    bot.sendMessage(
      chatId,
      `ℹ️ **Bot Information:**

🤖 Name: ULTRASOLX
⏱️ Uptime: ${minutes}m ${seconds}s
📦 Node.js: ${process.version}
🔑 APIs: ${process.env.GROQ_API_KEY ? "Configured" : "Not configured"}
💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    )
  })

  // Handle all other messages
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return

    const chatId = msg.chat.id
    const text = msg.text

    console.log(`💬 Message from ${msg.from.first_name}: "${text.substring(0, 50)}..."`)

    bot.sendChatAction(chatId, "typing")

    // Simple AI response or fallback
    let response = "🤖 I received your message! "

    if (process.env.GROQ_API_KEY) {
      try {
        const axios = require("axios")
        const aiResponse = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: text }],
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          },
        )

        response = aiResponse.data.choices[0].message.content + "\n\n_✨ Powered by Groq_"
        console.log("✅ AI response generated")
      } catch (error) {
        response += "My AI is currently unavailable, but I'm still here to help!"
        console.log("❌ AI failed:", error.response?.status)
      }
    } else {
      response += "My AI isn't configured yet, but the bot is working perfectly!"
    }

    bot.sendMessage(chatId, response)
  })

  // Error handling
  bot.on("polling_error", (error) => {
    console.error("❌ Polling error:", error.message)
  })

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down bot...")
    bot.stopPolling()
    process.exit(0)
  })
}
