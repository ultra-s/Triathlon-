require("dotenv").config()
const fs = require("fs")

console.log("🔧 ULTRASOLX Quick Fix Tool")
console.log("=".repeat(40))

// Check .env file format
function checkEnvFile() {
  console.log("\n📋 Checking .env file format...")

  if (!fs.existsSync(".env")) {
    console.log("❌ .env file not found!")
    console.log("💡 Creating .env template...")

    const template = `# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_API_KEY2=your_backup_groq_key_here
TOGETHER_API_KEY=your_together_api_key_here
TOGETHER_API_KEY2=your_backup_together_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_API_KEY2=your_backup_openrouter_key_here
PAWAN_API_KEY=your_pawan_api_key_here
PAWAN_API_KEY2=your_backup_pawan_key_here
VANNA_API_KEY=your_vanna_api_key_here
VANNA_API_KEY2=your_backup_vanna_key_here
STABILITY_API_KEY=your_stability_api_key_here

# Configuration
PORT=3000
NODE_ENV=production`

    fs.writeFileSync(".env.template", template)
    console.log("✅ Created .env.template - copy and rename to .env")
    return false
  }

  const envContent = fs.readFileSync(".env", "utf8")
  const lines = envContent.split("\n")

  const issues = []

  // Check for common issues
  lines.forEach((line, index) => {
    if (line.includes("your_") && line.includes("_here")) {
      issues.push(`Line ${index + 1}: Placeholder value not replaced`)
    }
    if (line.includes(" = ") && !line.startsWith("#")) {
      issues.push(`Line ${index + 1}: Extra spaces around = (should be KEY=value)`)
    }
    if (line.includes('"') && !line.startsWith("#")) {
      issues.push(`Line ${index + 1}: Remove quotes around values`)
    }
  })

  if (issues.length > 0) {
    console.log("⚠️ Found .env formatting issues:")
    issues.forEach((issue) => console.log(`   ${issue}`))
    return false
  }

  console.log("✅ .env file format looks good")
  return true
}

// Validate API key formats
function validateAPIKeys() {
  console.log("\n🔑 Validating API key formats...")

  const validations = {
    BOT_TOKEN: {
      value: process.env.BOT_TOKEN,
      check: (val) => val && val.includes(":") && val.length > 40,
      message: "Should be format: 1234567890:AAAA...",
    },
    GEMINI_API_KEY: {
      value: process.env.GEMINI_API_KEY,
      check: (val) => val && val.startsWith("AIza") && val.length > 30,
      message: "Should start with 'AIza' and be 39+ characters",
    },
    GROQ_API_KEY: {
      value: process.env.GROQ_API_KEY,
      check: (val) => val && val.startsWith("gsk_") && val.length > 50,
      message: "Should start with 'gsk_' and be 50+ characters",
    },
    STABILITY_API_KEY: {
      value: process.env.STABILITY_API_KEY,
      check: (val) => val && val.startsWith("sk-") && val.length > 40,
      message: "Should start with 'sk-' and be 40+ characters",
    },
  }

  let allValid = true

  Object.entries(validations).forEach(([key, validation]) => {
    if (!validation.value) {
      console.log(`⚠️ ${key}: Missing`)
      allValid = false
    } else if (!validation.check(validation.value)) {
      console.log(`❌ ${key}: Invalid format - ${validation.message}`)
      allValid = false
    } else {
      console.log(`✅ ${key}: Format looks correct`)
    }
  })

  return allValid
}

// Generate test commands
function generateTestCommands() {
  console.log("\n🧪 Recommended test commands:")
  console.log("   npm run troubleshoot  # Full diagnostic")
  console.log("   npm run test         # Quick test")
  console.log("   npm start            # Start bot")
}

// Main execution
async function main() {
  const envOk = checkEnvFile()
  if (!envOk) return

  const keysOk = validateAPIKeys()
  generateTestCommands()

  if (keysOk) {
    console.log("\n🎉 Configuration looks good! Try running the bot.")
  } else {
    console.log("\n⚠️ Fix the issues above, then run the bot.")
  }
}

main()
