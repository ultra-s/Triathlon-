const { spawn } = require("child_process")
const fs = require("fs")
require("dotenv").config()

console.log("🚀 ULTRASOLX Safe Startup")
console.log("=".repeat(40))

// Pre-flight checks
function preflightCheck() {
  console.log("🔍 Running pre-flight checks...")

  // Check .env file
  if (!fs.existsSync(".env")) {
    console.error("❌ .env file not found!")
    console.log("💡 Create .env file with your API keys")
    return false
  }

  // Check critical environment variables
  const critical = ["BOT_TOKEN"]
  for (const key of critical) {
    if (!process.env[key]) {
      console.error(`❌ Missing critical variable: ${key}`)
      return false
    }
  }

  // Check if bot file exists
  if (!fs.existsSync("ultrasolx-complete.js")) {
    console.error("❌ Bot file 'ultrasolx-complete.js' not found!")
    return false
  }

  console.log("✅ Pre-flight checks passed")
  return true
}

// Start bot with monitoring
function startBot() {
  console.log("🤖 Starting ULTRASOLX Bot...")

  const bot = spawn("node", ["ultrasolx-complete.js"], {
    stdio: ["inherit", "inherit", "inherit"],
  })

  bot.on("spawn", () => {
    console.log("✅ Bot process started successfully")
  })

  bot.on("close", (code, signal) => {
    console.log(`\n🛑 Bot stopped (code: ${code}, signal: ${signal})`)

    if (code === 1) {
      console.log("❌ Bot crashed - check error messages above")
    } else if (code === 0) {
      console.log("✅ Bot stopped gracefully")
    } else {
      console.log("⚠️ Bot stopped unexpectedly")
    }

    // Auto-restart on crash (but not on manual stop)
    if (code !== 0 && signal !== "SIGINT" && signal !== "SIGTERM") {
      console.log("🔄 Restarting bot in 5 seconds...")
      setTimeout(startBot, 5000)
    }
  })

  bot.on("error", (error) => {
    console.error("❌ Failed to start bot process:", error.message)
  })

  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    console.log("\n🛑 Received stop signal, shutting down...")
    bot.kill("SIGINT")
    setTimeout(() => process.exit(0), 2000)
  })
}

// Main execution
if (preflightCheck()) {
  startBot()
} else {
  console.log("\n💡 Fix the issues above and try again")
  process.exit(1)
}
