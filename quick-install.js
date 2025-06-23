const { spawn } = require("child_process")
const fs = require("fs")

console.log("📦 ULTRASOLX Quick Install")
console.log("=".repeat(30))

// Check if package.json exists
if (!fs.existsSync("package.json")) {
  console.log("📝 Creating package.json...")

  const packageJson = {
    name: "ultrasolx-simple",
    version: "1.0.0",
    description: "Simple ULTRASOLX Bot",
    main: "simple-bot.js",
    scripts: {
      start: "node simple-bot.js",
      debug: "node debug-simple.js",
      "install-deps": "npm install node-telegram-bot-api axios dotenv",
    },
    dependencies: {
      "node-telegram-bot-api": "^0.64.0",
      axios: "^1.6.2",
      dotenv: "^16.3.1",
    },
  }

  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2))
  console.log("✅ package.json created")
}

// Install dependencies
console.log("📦 Installing dependencies...")
const install = spawn("npm", ["install"], { stdio: "inherit" })

install.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Dependencies installed!")
    console.log("\n🚀 Ready to start!")
    console.log("Run: node debug-simple.js")
  } else {
    console.log("❌ Installation failed")
  }
})
