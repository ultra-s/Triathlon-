require("dotenv").config()
const axios = require("axios")

// Enhanced test function with detailed diagnostics
async function testAPIsDetailed() {
  console.log("🧪 ULTRASOLX API Diagnostics\n")
  console.log("=".repeat(50))

  const results = {
    working: [],
    failed: [],
    missing: [],
  }

  // Test Gemini API
  console.log("\n🔍 Testing Gemini API...")
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [{ parts: [{ text: "Say 'API test successful'" }] }],
          generationConfig: { maxOutputTokens: 20 },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          timeout: 15000,
        },
      )

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      console.log("✅ Gemini API: Working")
      console.log(`   Response: "${reply?.substring(0, 50)}..."`)
      results.working.push("Gemini")
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message
      console.log(`❌ Gemini API: ${status} - ${message}`)
      results.failed.push(`Gemini (${status})`)
    }
  } else {
    console.log("⚠️ Gemini API: No key provided")
    results.missing.push("Gemini")
  }

  // Test Groq API
  console.log("\n🔍 Testing Groq API...")
  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY2].filter(Boolean)

  if (groqKeys.length > 0) {
    let groqWorking = false

    for (let i = 0; i < groqKeys.length; i++) {
      try {
        console.log(`   Testing Groq key ${i + 1}...`)
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: "Say 'API test successful'" }],
            max_tokens: 20,
          },
          {
            headers: {
              Authorization: `Bearer ${groqKeys[i]}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        console.log(`✅ Groq API Key ${i + 1}: Working`)
        console.log(`   Response: "${reply?.substring(0, 50)}..."`)
        groqWorking = true
        break
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message
        console.log(`❌ Groq API Key ${i + 1}: ${status} - ${message}`)
      }
    }

    if (groqWorking) {
      results.working.push("Groq")
    } else {
      results.failed.push("Groq (all keys failed)")
    }
  } else {
    console.log("⚠️ Groq API: No keys provided")
    results.missing.push("Groq")
  }

  // Test Together AI
  console.log("\n🔍 Testing Together AI...")
  const togetherKeys = [process.env.TOGETHER_API_KEY, process.env.TOGETHER_API_KEY2].filter(Boolean)

  if (togetherKeys.length > 0) {
    let togetherWorking = false

    for (let i = 0; i < togetherKeys.length; i++) {
      try {
        console.log(`   Testing Together key ${i + 1}...`)
        const response = await axios.post(
          "https://api.together.xyz/v1/chat/completions",
          {
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [{ role: "user", content: "Say 'API test successful'" }],
            max_tokens: 20,
          },
          {
            headers: {
              Authorization: `Bearer ${togetherKeys[i]}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        console.log(`✅ Together AI Key ${i + 1}: Working`)
        console.log(`   Response: "${reply?.substring(0, 50)}..."`)
        togetherWorking = true
        break
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message
        console.log(`❌ Together AI Key ${i + 1}: ${status} - ${message}`)
      }
    }

    if (togetherWorking) {
      results.working.push("Together AI")
    } else {
      results.failed.push("Together AI (all keys failed)")
    }
  } else {
    console.log("⚠️ Together AI: No keys provided")
    results.missing.push("Together AI")
  }

  // Test OpenRouter
  console.log("\n🔍 Testing OpenRouter...")
  const openrouterKeys = [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY2].filter(Boolean)

  if (openrouterKeys.length > 0) {
    let openrouterWorking = false

    for (let i = 0; i < openrouterKeys.length; i++) {
      try {
        console.log(`   Testing OpenRouter key ${i + 1}...`)
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "mistralai/mistral-7b-instruct:free",
            messages: [{ role: "user", content: "Say 'API test successful'" }],
            max_tokens: 20,
          },
          {
            headers: {
              Authorization: `Bearer ${openrouterKeys[i]}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ultrasolx.com",
              "X-Title": "ULTRASOLX Bot",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        console.log(`✅ OpenRouter Key ${i + 1}: Working`)
        console.log(`   Response: "${reply?.substring(0, 50)}..."`)
        openrouterWorking = true
        break
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message
        console.log(`❌ OpenRouter Key ${i + 1}: ${status} - ${message}`)
      }
    }

    if (openrouterWorking) {
      results.working.push("OpenRouter")
    } else {
      results.failed.push("OpenRouter (all keys failed)")
    }
  } else {
    console.log("⚠️ OpenRouter: No keys provided")
    results.missing.push("OpenRouter")
  }

  // Test Pawan API
  console.log("\n🔍 Testing Pawan API...")
  const pawanKeys = [process.env.PAWAN_API_KEY, process.env.PAWAN_API_KEY2].filter(Boolean)

  if (pawanKeys.length > 0) {
    let pawanWorking = false

    for (let i = 0; i < pawanKeys.length; i++) {
      try {
        console.log(`   Testing Pawan key ${i + 1}...`)
        const response = await axios.post(
          "https://api.pawan.krd/cosmosrp/v1/chat/completions",
          {
            model: "pai-001-rp",
            messages: [{ role: "user", content: "Say 'API test successful'" }],
            max_tokens: 20,
          },
          {
            headers: {
              Authorization: `Bearer ${pawanKeys[i]}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        console.log(`✅ Pawan API Key ${i + 1}: Working`)
        console.log(`   Response: "${reply?.substring(0, 50)}..."`)
        pawanWorking = true
        break
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message
        console.log(`❌ Pawan API Key ${i + 1}: ${status} - ${message}`)
      }
    }

    if (pawanWorking) {
      results.working.push("Pawan")
    } else {
      results.failed.push("Pawan (all keys failed)")
    }
  } else {
    console.log("⚠️ Pawan API: No keys provided")
    results.missing.push("Pawan")
  }

  // Test Stability AI
  console.log("\n🔍 Testing Stability AI...")
  if (process.env.STABILITY_API_KEY) {
    try {
      console.log("   Generating test image (this may take 10-30 seconds)...")
      const response = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [{ text: "a simple red circle on white background" }],
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
          timeout: 45000,
        },
      )

      if (response.data.artifacts && response.data.artifacts[0]) {
        console.log("✅ Stability AI: Working")
        console.log("   Image generated successfully!")
        results.working.push("Stability AI")
      } else {
        console.log("❌ Stability AI: No image data returned")
        results.failed.push("Stability AI (no data)")
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message
      console.log(`❌ Stability AI: ${status} - ${message}`)
      results.failed.push(`Stability AI (${status})`)
    }
  } else {
    console.log("⚠️ Stability AI: No key provided")
    results.missing.push("Stability AI")
  }

  // Summary
  console.log("\n" + "=".repeat(50))
  console.log("📊 TEST SUMMARY")
  console.log("=".repeat(50))

  console.log(`\n✅ Working APIs (${results.working.length}):`)
  results.working.forEach((api) => console.log(`   • ${api}`))

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed APIs (${results.failed.length}):`)
    results.failed.forEach((api) => console.log(`   • ${api}`))
  }

  if (results.missing.length > 0) {
    console.log(`\n⚠️ Missing Keys (${results.missing.length}):`)
    results.missing.forEach((api) => console.log(`   • ${api}`))
  }

  console.log(`\n🎯 Bot Status: ${results.working.length > 0 ? "READY TO RUN" : "NEEDS CONFIGURATION"}`)

  if (results.working.length === 0) {
    console.log("\n🚨 WARNING: No working AI providers found!")
    console.log("   The bot needs at least one working AI API to function.")
  } else if (results.working.length < 3) {
    console.log("\n⚠️ NOTICE: Limited AI providers available.")
    console.log("   Consider fixing failed APIs for better reliability.")
  } else {
    console.log("\n🎉 EXCELLENT: Multiple AI providers working!")
    console.log("   Your bot has great fallback coverage.")
  }

  console.log("\n🏁 Diagnostic Complete!")
}

// Run the detailed test
testAPIsDetailed().catch((error) => {
  console.error("❌ Test script failed:", error.message)
})
