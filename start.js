const { spawn } = require("child_process")
const fs = require("fs")

console.log("🚀 ULTRASOLX Bot Launcher")
console.log("=".repeat(40))

// Check environment
if (!fs.existsSync(".env")) {
  console.error("❌ .env file not found!")
  console.log("💡 Create .env file with your API keys")
  process.exit(1)
}

// Check required keys
const requiredKeys = ["BOT_TOKEN", "GROQ_API_KEY", "STABILITY_API_KEY"]
const missingKeys = requiredKeys.filter((key) => !process.env[key])

if (missingKeys.length > 0) {
  console.error(`❌ Missing required keys: ${missingKeys.join(", ")}`)
  process.exit(1)
}

console.log("✅ Environment check passed")
console.log("🤖 Starting ULTRASOLX Bot...")

// Start the bot
const bot = spawn("node", ["ultrasolx-complete.js"], {
  stdio: "inherit",
})

bot.on("close", (code) => {
  console.log(`\n🛑 Bot exited with code ${code}`)
  if (code !== 0) {
    console.log("🔄 Restarting in 5 seconds...")
    setTimeout(() => {
      spawn("node", ["start.js"], { stdio: "inherit" })
    }, 5000)
  }
})

bot.on("error", (error) => {
  console.error("❌ Failed to start bot:", error.message)
})
