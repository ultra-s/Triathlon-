require("dotenv").config()
const { smartReply, generateImage } = require("./ai-fixed")

async function testBot() {
  console.log("🧪 Testing Fixed ULTRASOLX Bot")
  console.log("=".repeat(40))

  // Test 1: AI Chat
  console.log("\n1️⃣ Testing AI Chat...")
  try {
    const reply = await smartReply('Hello, please respond with "test successful"', "test-user")
    console.log("✅ AI Chat working")
    console.log(`Response: "${reply.substring(0, 100)}..."`)
  } catch (error) {
    console.log("❌ AI Chat failed:", error.message)
  }

  // Test 2: Image Generation
  console.log("\n2️⃣ Testing Image Generation...")
  try {
    const imageBuffer = await generateImage("a simple red circle")
    if (imageBuffer) {
      console.log("✅ Image generation working")
      console.log(`Generated image buffer size: ${imageBuffer.length} bytes`)
    } else {
      console.log("❌ Image generation returned null")
    }
  } catch (error) {
    console.log("❌ Image generation failed:", error.message)
  }

  console.log("\n🏁 Test Complete!")
}

testBot()
