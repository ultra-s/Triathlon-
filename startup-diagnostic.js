require("dotenv").config()
const axios = require("axios")

async function diagnoseStartup() {
  console.log("🔍 ULTRASOLX Startup Diagnostic")
  console.log("=".repeat(50))

  // 1. Check Node.js version
  console.log(`📦 Node.js version: ${process.version}`)
  if (Number.parseInt(process.version.slice(1)) < 16) {
    console.log("⚠️ Warning: Node.js 16+ recommended")
  }

  // 2. Check environment variables
  console.log("\n🔑 Checking Environment Variables:")
  const requiredVars = [
    "BOT_TOKEN",
    "GROQ_API_KEY",
    "GEMINI_API_KEY",
    "TOGETHER_API_KEY",
    "OPENROUTER_API_KEY",
    "STABILITY_API_KEY",
  ]

  const missingVars = []
  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Present (${process.env[varName].substring(0, 10)}...)`)
    } else {
      console.log(`❌ ${varName}: Missing`)
      missingVars.push(varName)
    }
  })

  if (missingVars.length > 0) {
    console.log(`\n⚠️ Missing variables: ${missingVars.join(", ")}`)
    console.log("💡 Add these to your .env file")
    return false
  }

  // 3. Test Telegram Bot Token
  console.log("\n🤖 Testing Telegram Bot Token:")
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`, {
      timeout: 10000,
    })

    if (response.data.ok) {
      console.log(`✅ Bot token valid: @${response.data.result.username}`)
    } else {
      console.log("❌ Bot token invalid")
      return false
    }
  } catch (error) {
    console.log(`❌ Bot token test failed: ${error.message}`)
    return false
  }

  // 4. Quick API test
  console.log("\n🧪 Quick API Test:")
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    )

    console.log("✅ Groq API working")
  } catch (error) {
    console.log(`❌ Groq API failed: ${error.response?.status} - ${error.message}`)
  }

  // 5. Check dependencies
  console.log("\n📦 Checking Dependencies:")
  try {
    require("node-telegram-bot-api")
    console.log("✅ node-telegram-bot-api: Installed")
  } catch (error) {
    console.log("❌ node-telegram-bot-api: Missing - run 'npm install'")
    return false
  }

  try {
    require("axios")
    console.log("✅ axios: Installed")
  } catch (error) {
    console.log("❌ axios: Missing - run 'npm install'")
    return false
  }

  console.log("\n🎯 Diagnostic Result: READY TO START!")
  console.log("💡 Run 'node ultrasolx-complete.js' to start the bot")
  return true
}

diagnoseStartup()
