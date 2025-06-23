console.log("🧪 TESTING YOUR BOT FILES")
console.log("=".repeat(40))

const fs = require("fs")

// Check what files you have
console.log("📁 Available files:")
const files = fs.readdirSync(".")
files.forEach((file) => {
  if (file.endsWith(".js") || file === ".env" || file === "package.json") {
    console.log(`   📄 ${file}`)
  }
})

// Test each bot file
const botFiles = ["simple-bot.js", "ultrasolx-complete.js", "bot-fixed.js", "enhanced-bot-fixed.js"]

console.log("\n🤖 Testing bot files...")

botFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`\n🔍 Testing ${file}:`)
    try {
      // Try to require the file (syntax check)
      delete require.cache[require.resolve(`./${file}`)]
      require(`./${file}`)
      console.log(`   ✅ ${file}: Syntax OK`)
    } catch (error) {
      console.log(`   ❌ ${file}: Error - ${error.message}`)
      if (error.stack) {
        console.log(`   📍 Stack: ${error.stack.split("\n")[1]}`)
      }
    }
  } else {
    console.log(`   ⚠️ ${file}: Not found`)
  }
})

console.log("\n🏁 File testing complete!")
