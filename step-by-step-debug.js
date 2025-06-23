console.log("🔍 STEP-BY-STEP DEBUG")
console.log("=".repeat(30))

async function stepByStepDebug() {
  const steps = [
    {
      name: "Check Node.js",
      test: () => {
        console.log(`Node.js version: ${process.version}`)
        return true
      },
    },
    {
      name: "Load dotenv",
      test: () => {
        require("dotenv").config()
        return true
      },
    },
    {
      name: "Check .env file",
      test: () => {
        const fs = require("fs")
        if (!fs.existsSync(".env")) throw new Error(".env file not found")
        return true
      },
    },
    {
      name: "Check BOT_TOKEN",
      test: () => {
        if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN not found")
        console.log(`BOT_TOKEN: ${process.env.BOT_TOKEN.substring(0, 10)}...`)
        return true
      },
    },
    {
      name: "Load Telegram library",
      test: () => {
        require("node-telegram-bot-api")
        return true
      },
    },
    {
      name: "Load axios",
      test: () => {
        require("axios")
        return true
      },
    },
    {
      name: "Test bot token",
      test: async () => {
        const axios = require("axios")
        const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`)
        if (!response.data.ok) throw new Error("Bot token invalid")
        console.log(`Bot: @${response.data.result.username}`)
        return true
      },
    },
    {
      name: "Create bot instance",
      test: () => {
        const TelegramBot = require("node-telegram-bot-api")
        const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false })
        return true
      },
    },
  ]

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    console.log(`\n${i + 1}️⃣ ${step.name}...`)

    try {
      await step.test()
      console.log(`   ✅ PASSED`)
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`)
      console.log(`\n🛑 Stopped at step ${i + 1}: ${step.name}`)
      console.log(`💡 Fix this error and run again.`)

      // Provide specific solutions
      if (error.message.includes("Cannot find module")) {
        console.log(`🔧 Solution: npm install ${error.message.split("'")[1]}`)
      } else if (error.message.includes(".env")) {
        console.log("🔧 Solution: Create .env file with your API keys")
      } else if (error.message.includes("BOT_TOKEN")) {
        console.log("🔧 Solution: Add BOT_TOKEN=your_token to .env file")
      } else if (error.message.includes("401")) {
        console.log("🔧 Solution: Get valid bot token from @BotFather")
      }

      return false
    }
  }

  console.log("\n🎉 ALL STEPS PASSED! Your bot should work.")
  return true
}

stepByStepDebug()
