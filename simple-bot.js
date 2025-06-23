require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")

// Simple bot for testing
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

console.log("🤖 Simple ULTRASOLX Bot starting...")

// Test if bot token works
bot
  .getMe()
  .then((botInfo) => {
    console.log(`✅ Bot connected: @${botInfo.username}`)
  })
  .catch((error) => {
    console.error("❌ Bot token invalid:", error.message)
    process.exit(1)
  })

// Simple AI function
async function getSimpleAI(message) {
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: message }],
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
      return response.data.choices[0].message.content
    } catch (error) {
      console.log("❌ Groq failed:", error.response?.status)
    }
  }

  return "🤖 Hello! I'm ULTRASOLX bot. My AI providers are currently unavailable, but I'm working!"
}

// Basic commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 ULTRASOLX Bot is running!

✅ Bot token: Working
✅ Telegram API: Connected
🧪 AI APIs: Testing...

Send me any message to test AI responses!`,
  )
})

bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, "🧪 Testing AI...")

  const response = await getSimpleAI("Say 'AI test successful'")
  bot.sendMessage(chatId, `🤖 AI Response:\n${response}`)
})

// Handle all messages
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return

  const chatId = msg.chat.id
  console.log(`📨 Message: "${msg.text.substring(0, 50)}..."`)

  bot.sendChatAction(chatId, "typing")

  try {
    const response = await getSimpleAI(msg.text)
    bot.sendMessage(chatId, response)
    console.log("✅ Response sent")
  } catch (error) {
    console.error("❌ Error:", error.message)
    bot.sendMessage(chatId, "⚠️ Something went wrong, but I'm still here!")
  }
})

bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error.message)
})

console.log("🚀 Simple bot ready! Send /start to test")
