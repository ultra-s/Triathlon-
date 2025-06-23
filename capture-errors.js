console.log("🔍 ULTRASOLX ERROR CAPTURE TOOL")
console.log("=".repeat(50))
console.log("This will run diagnostics and capture all errors.\n")

// Capture all console output
const originalConsoleError = console.error
const originalConsoleLog = console.log
const errorLogs = []
const allLogs = []

console.error = (...args) => {
  const errorMsg = args.join(" ")
  errorLogs.push(`❌ ERROR: ${errorMsg}`)
  allLogs.push(`❌ ERROR: ${errorMsg}`)
  originalConsoleError.apply(console, args)
}

console.log = (...args) => {
  const logMsg = args.join(" ")
  allLogs.push(`📝 LOG: ${logMsg}`)
  originalConsoleLog.apply(console, args)
}

// Capture uncaught exceptions
process.on("uncaughtException", (error) => {
  errorLogs.push(`💥 UNCAUGHT EXCEPTION: ${error.message}`)
  errorLogs.push(`📍 Stack: ${error.stack}`)
  console.error("💥 UNCAUGHT EXCEPTION:", error.message)
  console.error("📍 Stack:", error.stack)
})

process.on("unhandledRejection", (reason, promise) => {
  errorLogs.push(`🚫 UNHANDLED REJECTION: ${reason}`)
  console.error("🚫 UNHANDLED REJECTION:", reason)
})

async function runWithErrorCapture() {
  console.log("🚀 Starting error capture...")

  try {
    // Test 1: Basic Node.js
    console.log("\n1️⃣ Testing Node.js basics...")
    console.log(`Node version: ${process.version}`)

    // Test 2: File system
    console.log("\n2️⃣ Testing file system...")
    const fs = require("fs")
    console.log(`Current directory: ${process.cwd()}`)
    console.log(`Files: ${fs.readdirSync(".").join(", ")}`)

    // Test 3: dotenv
    console.log("\n3️⃣ Testing dotenv...")
    try {
      require("dotenv").config()
      console.log("✅ dotenv loaded")
    } catch (error) {
      console.error("❌ dotenv failed:", error.message)
      throw error
    }

    // Test 4: Environment variables
    console.log("\n4️⃣ Testing environment variables...")
    console.log(`BOT_TOKEN exists: ${!!process.env.BOT_TOKEN}`)
    console.log(`GROQ_API_KEY exists: ${!!process.env.GROQ_API_KEY}`)

    // Test 5: Dependencies
    console.log("\n5️⃣ Testing dependencies...")
    try {
      const TelegramBot = require("node-telegram-bot-api")
      console.log("✅ node-telegram-bot-api loaded")
    } catch (error) {
      console.error("❌ node-telegram-bot-api failed:", error.message)
      throw error
    }

    try {
      const axios = require("axios")
      console.log("✅ axios loaded")
    } catch (error) {
      console.error("❌ axios failed:", error.message)
      throw error
    }

    // Test 6: Bot token
    console.log("\n6️⃣ Testing bot token...")
    if (process.env.BOT_TOKEN) {
      try {
        const axios = require("axios")
        const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`, {
          timeout: 10000,
        })

        if (response.data.ok) {
          console.log("✅ Bot token valid")
        } else {
          console.error("❌ Bot token invalid")
        }
      } catch (error) {
        console.error("❌ Bot token test failed:", error.message)
        if (error.response) {
          console.error(`   Status: ${error.response.status}`)
          console.error(`   Data: ${JSON.stringify(error.response.data)}`)
        }
      }
    } else {
      console.error("❌ BOT_TOKEN not found")
    }

    // Test 7: Simple bot creation
    console.log("\n7️⃣ Testing bot creation...")
    try {
      const TelegramBot = require("node-telegram-bot-api")
      const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false })
      console.log("✅ Bot object created")

      // Test getMe
      const botInfo = await bot.getMe()
      console.log(`✅ Bot info: @${botInfo.username}`)
    } catch (error) {
      console.error("❌ Bot creation failed:", error.message)
      if (error.response) {
        console.error(`   Status: ${error.response.status}`)
        console.error(`   Data: ${JSON.stringify(error.response.data)}`)
      }
    }

    // Test 8: AI API
    console.log("\n8️⃣ Testing AI API...")
    if (process.env.GROQ_API_KEY) {
      try {
        const axios = require("axios")
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: "test" }],
            max_tokens: 5,
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
        console.error("❌ Groq API failed:", error.message)
        if (error.response) {
          console.error(`   Status: ${error.response.status}`)
          console.error(`   Data: ${JSON.stringify(error.response.data)}`)
        }
      }
    } else {
      console.log("⚠️ GROQ_API_KEY not set")
    }
  } catch (error) {
    console.error("💥 Test sequence failed:", error.message)
  }

  // Generate error report
  console.log("\n" + "=".repeat(50))
  console.log("📊 ERROR REPORT")
  console.log("=".repeat(50))

  if (errorLogs.length === 0) {
    console.log("🎉 NO ERRORS FOUND! Everything looks good.")
  } else {
    console.log(`🚨 Found ${errorLogs.length} error(s):\n`)
    errorLogs.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })

    console.log("\n💡 COMMON SOLUTIONS:")
    errorLogs.forEach((error) => {
      if (error.includes("Cannot find module")) {
        console.log("   • Run: npm install")
      }
      if (error.includes("401") || error.includes("Unauthorized")) {
        console.log("   • Check your BOT_TOKEN in .env file")
      }
      if (error.includes("ENOTFOUND")) {
        console.log("   • Check your internet connection")
      }
      if (error.includes("dotenv")) {
        console.log("   • Run: npm install dotenv")
      }
      if (error.includes("node-telegram-bot-api")) {
        console.log("   • Run: npm install node-telegram-bot-api")
      }
    })
  }

  console.log("\n📋 FULL LOG:")
  allLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`)
  })

  console.log("\n🏁 Error capture complete!")
}

runWithErrorCapture()
