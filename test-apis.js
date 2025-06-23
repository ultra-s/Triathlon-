require("dotenv").config()
const axios = require("axios")

// Test function for each API
async function testAPIs() {
  console.log("🧪 Testing API Keys...\n")

  // Test Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [{ parts: [{ text: "Hello, say hi back!" }] }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          timeout: 10000,
        },
      )
      console.log("✅ Gemini API: Working")
    } catch (error) {
      console.log(`❌ Gemini API: ${error.response?.status || error.message}`)
    }
  } else {
    console.log("⚠️ Gemini API: No key provided")
  }

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: "Hello, say hi back!" }],
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )
      console.log("✅ Groq API: Working")
    } catch (error) {
      console.log(`❌ Groq API: ${error.response?.status || error.message}`)
    }
  } else {
    console.log("⚠️ Groq API: No key provided")
  }

  // Test Together
  if (process.env.TOGETHER_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.together.xyz/v1/chat/completions",
        {
          model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
          messages: [{ role: "user", content: "Hello, say hi back!" }],
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      )
      console.log("✅ Together API: Working")
    } catch (error) {
      console.log(`❌ Together API: ${error.response?.status || error.message}`)
    }
  } else {
    console.log("⚠️ Together API: No key provided")
  }

  // Test OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "user", content: "Hello, say hi back!" }],
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ultrasolx.com",
            "X-Title": "ULTRASOLX Bot",
          },
          timeout: 10000,
        },
      )
      console.log("✅ OpenRouter API: Working")
    } catch (error) {
      console.log(`❌ OpenRouter API: ${error.response?.status || error.message}`)
    }
  } else {
    console.log("⚠️ OpenRouter API: No key provided")
  }

  // Test Stability AI
  if (process.env.STABILITY_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [{ text: "a simple red circle" }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        },
      )
      console.log("✅ Stability AI: Working")
    } catch (error) {
      console.log(`❌ Stability AI: ${error.response?.status || error.message}`)
    }
  } else {
    console.log("⚠️ Stability AI: No key provided")
  }

  console.log("\n🏁 API Testing Complete!")
}

testAPIs()
