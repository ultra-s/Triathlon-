console.log("🔍 ULTRASOLX COMPREHENSIVE DIAGNOSTIC")
console.log("=".repeat(60))
console.log("This will check everything needed for your bot to work.\n")

// Step 1: System Check
console.log("1️⃣ SYSTEM CHECK")
console.log("-".repeat(30))
console.log(`📦 Node.js version: ${process.version}`)
console.log(`💻 Platform: ${process.platform}`)
console.log(`🏗️ Architecture: ${process.arch}`)

const nodeVersion = Number.parseInt(process.version.slice(1))
if (nodeVersion < 16) {
  console.log("⚠️ WARNING: Node.js 16+ recommended for best compatibility")
} else {
  console.log("✅ Node.js version is compatible")
}

// Step 2: File System Check
console.log("\n2️⃣ FILE SYSTEM CHECK")
console.log("-".repeat(30))

const fs = require("fs")
const path = require("path")

// Check current directory
console.log(`📁 Current directory: ${process.cwd()}`)

// Check for essential files
const essentialFiles = [".env", "package.json"]
const optionalFiles = ["simple-bot.js", "ultrasolx-complete.js", "node_modules"]

essentialFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`)
  } else {
    console.log(`❌ ${file}: Missing`)
  }
})

optionalFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`)
  } else {
    console.log(`⚠️ ${file}: Not found`)
  }
})

// Step 3: Environment Variables Check
console.log("\n3️⃣ ENVIRONMENT VARIABLES CHECK")
console.log("-".repeat(30))

try {
  require("dotenv").config()
  console.log("✅ dotenv loaded successfully")
} catch (error) {
  console.log("❌ dotenv failed to load:", error.message)
  console.log("💡 Run: npm install dotenv")
}

// Check .env file content
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8")
  const lines = envContent.split("\n").filter((line) => line.trim() && !line.startsWith("#"))
  console.log(`📄 .env file has ${lines.length} configuration lines`)

  // Check specific variables
  const requiredVars = {
    BOT_TOKEN: "Telegram Bot Token",
    GROQ_API_KEY: "Groq AI API Key",
    GEMINI_API_KEY: "Google Gemini API Key",
    TOGETHER_API_KEY: "Together AI API Key",
    OPENROUTER_API_KEY: "OpenRouter API Key",
    STABILITY_API_KEY: "Stability AI API Key",
  }

  const optionalVars = {
    GROQ_API_KEY2: "Groq Backup Key",
    TOGETHER_API_KEY2: "Together Backup Key",
    OPENROUTER_API_KEY2: "OpenRouter Backup Key",
    PAWAN_API_KEY: "Pawan API Key",
    VANNA_API_KEY: "Vanna API Key",
  }

  console.log("\n🔑 Required API Keys:")
  Object.entries(requiredVars).forEach(([key, description]) => {
    const value = process.env[key]
    if (value) {
      console.log(`✅ ${key}: Present (${value.substring(0, 10)}...${value.slice(-5)})`)
    } else {
      console.log(`❌ ${key}: Missing - ${description}`)
    }
  })

  console.log("\n🔑 Optional API Keys:")
  Object.entries(optionalVars).forEach(([key, description]) => {
    const value = process.env[key]
    if (value) {
      console.log(`✅ ${key}: Present (${value.substring(0, 10)}...${value.slice(-5)})`)
    } else {
      console.log(`⚠️ ${key}: Not set - ${description}`)
    }
  })
} else {
  console.log("❌ .env file not found!")
  console.log("💡 Create .env file with your API keys")
}

// Step 4: Dependencies Check
console.log("\n4️⃣ DEPENDENCIES CHECK")
console.log("-".repeat(30))

const requiredDeps = [
  { name: "node-telegram-bot-api", description: "Telegram Bot Library" },
  { name: "axios", description: "HTTP Client" },
  { name: "dotenv", description: "Environment Variables" },
]

requiredDeps.forEach((dep) => {
  try {
    require(dep.name)
    console.log(`✅ ${dep.name}: Installed`)
  } catch (error) {
    console.log(`❌ ${dep.name}: Missing - ${dep.description}`)
    console.log(`   💡 Install with: npm install ${dep.name}`)
  }
})

// Check package.json
if (fs.existsSync("package.json")) {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
    console.log(`📦 Package: ${packageJson.name} v${packageJson.version}`)

    if (packageJson.dependencies) {
      const depCount = Object.keys(packageJson.dependencies).length
      console.log(`📋 Dependencies listed: ${depCount}`)
    }
  } catch (error) {
    console.log("⚠️ package.json exists but couldn't be parsed")
  }
} else {
  console.log("⚠️ package.json not found")
}

// Step 5: Network Connectivity Test
console.log("\n5️⃣ NETWORK CONNECTIVITY TEST")
console.log("-".repeat(30))

async function testConnectivity() {
  const axios = require("axios")

  const testUrls = [
    { name: "Google", url: "https://www.google.com" },
    { name: "Telegram API", url: "https://api.telegram.org" },
    { name: "Groq API", url: "https://api.groq.com" },
    { name: "Stability AI", url: "https://api.stability.ai" },
  ]

  for (const test of testUrls) {
    try {
      await axios.get(test.url, { timeout: 5000 })
      console.log(`✅ ${test.name}: Reachable`)
    } catch (error) {
      console.log(`❌ ${test.name}: Unreachable (${error.code || error.message})`)
    }
  }
}

// Step 6: Telegram Bot Token Test
console.log("\n6️⃣ TELEGRAM BOT TOKEN TEST")
console.log("-".repeat(30))

async function testBotToken() {
  if (!process.env.BOT_TOKEN) {
    console.log("❌ BOT_TOKEN not found in environment")
    return false
  }

  try {
    const axios = require("axios")
    const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`, {
      timeout: 10000,
    })

    if (response.data.ok) {
      const bot = response.data.result
      console.log("✅ Bot token is VALID!")
      console.log(`   🤖 Bot name: ${bot.first_name}`)
      console.log(`   👤 Username: @${bot.username}`)
      console.log(`   🆔 Bot ID: ${bot.id}`)
      console.log(`   ✅ Can join groups: ${bot.can_join_groups}`)
      console.log(`   📝 Can read messages: ${bot.can_read_all_group_messages}`)
      return true
    } else {
      console.log("❌ Bot token validation failed")
      return false
    }
  } catch (error) {
    console.log("❌ Bot token test failed:")
    if (error.response?.status === 401) {
      console.log("   🔑 Token is invalid or expired")
      console.log("   💡 Get a new token from @BotFather")
    } else if (error.code === "ENOTFOUND") {
      console.log("   🌐 Network connection issue")
    } else {
      console.log(`   ❓ ${error.message}`)
    }
    return false
  }
}

// Step 7: AI APIs Test
console.log("\n7️⃣ AI APIS QUICK TEST")
console.log("-".repeat(30))

async function testAIAPIs() {
  const axios = require("axios")

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: "Hi" }],
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
      console.log("✅ Groq API: Working")
    } catch (error) {
      console.log(`❌ Groq API: Failed (${error.response?.status || error.code})`)
    }
  } else {
    console.log("⚠️ Groq API: No key provided")
  }

  // Test Stability AI
  if (process.env.STABILITY_API_KEY) {
    try {
      const response = await axios.get("https://api.stability.ai/v1/user/balance", {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        timeout: 10000,
      })
      console.log(`✅ Stability AI: Working (${response.data.credits} credits)`)
    } catch (error) {
      console.log(`❌ Stability AI: Failed (${error.response?.status || error.code})`)
    }
  } else {
    console.log("⚠️ Stability AI: No key provided")
  }
}

// Step 8: Generate Report
async function generateReport() {
  console.log("\n8️⃣ RUNNING TESTS...")
  console.log("-".repeat(30))

  await testConnectivity()
  const botTokenValid = await testBotToken()
  await testAIAPIs()

  console.log("\n" + "=".repeat(60))
  console.log("📊 DIAGNOSTIC SUMMARY")
  console.log("=".repeat(60))

  // Count issues
  let criticalIssues = 0
  let warnings = 0

  if (!fs.existsSync(".env")) criticalIssues++
  if (!process.env.BOT_TOKEN) criticalIssues++
  if (!botTokenValid) criticalIssues++

  try {
    require("node-telegram-bot-api")
  } catch {
    criticalIssues++
  }

  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) warnings++

  console.log(`🚨 Critical Issues: ${criticalIssues}`)
  console.log(`⚠️ Warnings: ${warnings}`)

  if (criticalIssues === 0) {
    console.log("\n🎉 EXCELLENT! Your bot is ready to run!")
    console.log("🚀 Next steps:")
    console.log("   1. Run: node simple-bot.js")
    console.log("   2. Go to Telegram and send /start to your bot")
    console.log("   3. Test with some messages")
  } else {
    console.log("\n🔧 ISSUES FOUND - Fix these before starting:")
    if (!fs.existsSync(".env")) {
      console.log("   • Create .env file with your API keys")
    }
    if (!process.env.BOT_TOKEN) {
      console.log("   • Add BOT_TOKEN to .env file")
    }
    if (!botTokenValid) {
      console.log("   • Get valid bot token from @BotFather")
    }
    try {
      require("node-telegram-bot-api")
    } catch {
      console.log("   • Run: npm install node-telegram-bot-api axios dotenv")
    }
  }

  if (warnings > 0) {
    console.log("\n💡 RECOMMENDATIONS:")
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      console.log("   • Add at least one AI API key for chat functionality")
    }
  }

  console.log("\n🏁 Diagnostic Complete!")
}

// Run the diagnostic
generateReport().catch((error) => {
  console.error("\n❌ Diagnostic failed:", error.message)
})
