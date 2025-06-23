require("dotenv").config()
const axios = require("axios")

async function debugBot() {
  console.log("🔍 ULTRASOLX Bot Debug Tool")
  console.log("=".repeat(50))

  // Test 1: Check if bot token is valid
  console.log("\n1️⃣ Testing Telegram Bot Token...")
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`)
    if (response.data.ok) {
      console.log("✅ Bot token is valid")
      console.log(`   Bot name: ${response.data.result.first_name}`)
      console.log(`   Bot username: @${response.data.result.username}`)
    }
  } catch (error) {
    console.log("❌ Bot token is invalid or expired")
    console.log("💡 Get a new token from @BotFather on Telegram")
    return
  }

  // Test 2: Check AI API responses
  console.log("\n2️⃣ Testing AI API Responses...")
  const testMessage = "Hello, please respond with 'API test successful'"

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: testMessage }],
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      )

      const reply = response.data.choices?.[0]?.message?.content
      if (reply) {
        console.log("✅ Groq API responding correctly")
        console.log(`   Response: "${reply.substring(0, 100)}..."`)
      }
    } catch (error) {
      console.log(
        `❌ Groq API failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  // Test 3: Check NSFW image generation
  console.log("\n3️⃣ Testing NSFW Image Generation...")
  if (process.env.STABILITY_API_KEY) {
    try {
      // Test with a mild NSFW prompt
      const nsfwPrompt = "artistic nude photography, renaissance style"
      console.log(`   Testing prompt: "${nsfwPrompt}"`)

      const response = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [
            { text: nsfwPrompt, weight: 1 },
            { text: "blurry, low quality, censored", weight: -1 },
          ],
          cfg_scale: 12,
          height: 512,
          width: 512,
          samples: 1,
          steps: 30,
          style_preset: "photographic",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 45000,
        },
      )

      if (response.data.artifacts && response.data.artifacts[0]) {
        console.log("✅ NSFW image generation working")
        console.log("   Image generated successfully with enhanced settings")
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      if (status === 400 && message.includes("content")) {
        console.log("❌ NSFW content blocked by Stability AI filters")
        console.log("💡 Solutions:")
        console.log("   • Use more artistic language")
        console.log("   • Try 'renaissance style intimate scene'")
        console.log("   • Use 'artistic photography' prefix")
        console.log("   • Consider alternative image generation services")
      } else {
        console.log(`❌ NSFW image generation failed: ${status} - ${message}`)
      }
    }
  }

  // Test 4: Check account balances
  console.log("\n4️⃣ Checking Account Balances...")

  // Stability AI balance
  if (process.env.STABILITY_API_KEY) {
    try {
      const response = await axios.get("https://api.stability.ai/v1/user/balance", {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
      })
      console.log(`💰 Stability AI credits: ${response.data.credits}`)
    } catch (error) {
      console.log("❌ Could not check Stability AI balance")
    }
  }

  // OpenRouter balance
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await axios.get("https://openrouter.ai/api/v1/auth/key", {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      })
      console.log(`💰 OpenRouter balance: $${response.data.data.credit_balance}`)
    } catch (error) {
      console.log("❌ Could not check OpenRouter balance")
    }
  }

  console.log("\n🏁 Debug Complete!")
  console.log("\n💡 Recommendations:")
  console.log("1. If bot token is valid but not responding, restart the bot")
  console.log("2. For NSFW issues, try the enhanced bot with artistic prompts")
  console.log("3. Check account balances and add credits if needed")
  console.log("4. Use /nsfw command for adult content instead of 'nsfw:' prefix")
}

debugBot()
