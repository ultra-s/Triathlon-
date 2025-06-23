const fs = require("fs")
const { spawn } = require("child_process")

console.log("🔧 ULTRASOLX AUTO-FIX TOOL")
console.log("=".repeat(40))

async function autoFix() {
  let fixesApplied = 0

  // Fix 1: Create package.json if missing
  if (!fs.existsSync("package.json")) {
    console.log("📝 Creating package.json...")
    const packageJson = {
      name: "ultrasolx-bot",
      version: "1.0.0",
      description: "ULTRASOLX Telegram Bot",
      main: "simple-bot.js",
      scripts: {
        start: "node simple-bot.js",
        debug: "node comprehensive-diagnostic.js",
        fix: "node auto-fix.js",
      },
      dependencies: {
        "node-telegram-bot-api": "^0.64.0",
        axios: "^1.6.2",
        dotenv: "^16.3.1",
      },
    }
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2))
    console.log("✅ package.json created")
    fixesApplied++
  }

  // Fix 2: Create .env template if missing
  if (!fs.existsSync(".env")) {
    console.log("📝 Creating .env template...")
    const envTemplate = `# Telegram Bot Token (get from @BotFather)
BOT_TOKEN=8062381062:AAEnTsxL5WGFfJrvFs9gWvnFl9Mu9r0zOkE

# AI API Keys
GROQ_API_KEY=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
GROQ_API_KEY2=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
GEMINI_API_KEY=AIzaSyCM7n1Due-hRigNiwYNNIAleM_S9fKNnmw
TOGETHER_API_KEY=tgp_v1_kvuqn2MKuTucVZcwBr11rBdQSFm3aodEJvV05lwcOOg
TOGETHER_API_KEY2=tgp_v1_X8pygLhxwIax5RGDWSAkbVYINo92JVYaYaNpTP48lNw
OPENROUTER_API_KEY=sk-or-v1-67228ff7cc20dbe5632b9b6f1d1f30e4d2f5001abed3a8a865947fd1caf8
OPENROUTER_API_KEY2=sk-or-v1-cd335f0fc7b1049e5d8f2e98287acbd3811d78a55dbb1938afa593bc58c
STABILITY_API_KEY=sk-4XceYbf8Ske47GLRgPqb4NHsknWuMYJN7TqNlpswHZSnWKtV
PAWAN_API_KEY=pk-uneWGPPjkJkjBaPMUHZYWjeaLUOaQkZDSVoIUqJkecaCgMcg
PAWAN_API_KEY2=pk-aqqjHBzUtMHStymAKzdBkgrjDSYKouUznKkAROOGYjgnZscf
VANNA_API_KEY=vn-613ce0317e9a421b886b182f1555e2cf
VANNA_API_KEY2=vn-567daf7268ff486c896d662c830e996b

# Configuration
PORT=3000
NODE_ENV=production`

    fs.writeFileSync(".env", envTemplate)
    console.log("✅ .env file created with your API keys")
    fixesApplied++
  }

  // Fix 3: Install dependencies if node_modules missing
  if (!fs.existsSync("node_modules")) {
    console.log("📦 Installing dependencies...")
    return new Promise((resolve) => {
      const install = spawn("npm", ["install"], { stdio: "inherit" })
      install.on("close", (code) => {
        if (code === 0) {
          console.log("✅ Dependencies installed")
          fixesApplied++
        } else {
          console.log("❌ Dependency installation failed")
        }
        resolve(fixesApplied)
      })
    })
  }

  return fixesApplied
}

autoFix().then((fixes) => {
  console.log(`\n🎯 Applied ${fixes} fixes`)
  console.log("🚀 Now run: node comprehensive-diagnostic.js")
})
