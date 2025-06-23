require("dotenv").config()
const axios = require("axios")
const fs = require("fs")

class APITroubleshooter {
  constructor() {
    this.results = {}
    this.solutions = {}
  }

  async diagnoseAll() {
    console.log("🔧 ULTRASOLX API Troubleshooter")
    console.log("=".repeat(60))
    console.log("This tool will help identify and fix API issues.\n")

    // Check environment setup first
    await this.checkEnvironment()

    // Test each API with detailed diagnostics
    await this.diagnoseGemini()
    await this.diagnoseGroq()
    await this.diagnoseTogether()
    await this.diagnoseOpenRouter()
    await this.diagnosePawan()
    await this.diagnoseVanna()
    await this.diagnoseStability()

    // Generate report and solutions
    this.generateReport()
    this.provideSolutions()
  }

  async checkEnvironment() {
    console.log("🔍 Checking Environment Setup...")

    // Check .env file
    if (!fs.existsSync(".env")) {
      console.log("❌ .env file not found!")
      console.log("💡 Solution: Create a .env file with your API keys")
      return
    }

    console.log("✅ .env file found")

    // Check Node.js version
    const nodeVersion = process.version
    console.log(`📦 Node.js version: ${nodeVersion}`)

    if (Number.parseInt(nodeVersion.slice(1)) < 16) {
      console.log("⚠️ Node.js version is old. Recommended: v16 or higher")
    }

    // Check internet connectivity
    try {
      await axios.get("https://httpbin.org/ip", { timeout: 5000 })
      console.log("✅ Internet connection working")
    } catch (error) {
      console.log("❌ Internet connection issues detected")
      console.log("💡 Check your network connection")
    }

    console.log("")
  }

  async diagnoseGemini() {
    console.log("🔍 Diagnosing Gemini API...")

    const key = process.env.GEMINI_API_KEY

    if (!key) {
      this.results.gemini = { status: "missing", error: "No API key provided" }
      console.log("❌ Gemini API key missing")
      return
    }

    if (key.length < 30) {
      this.results.gemini = { status: "invalid", error: "API key too short" }
      console.log("❌ Gemini API key appears invalid (too short)")
      return
    }

    try {
      console.log("   Testing API call...")
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [{ parts: [{ text: "Hello" }] }],
          generationConfig: { maxOutputTokens: 10 },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          timeout: 15000,
        },
      )

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      if (reply) {
        this.results.gemini = { status: "working", response: reply }
        console.log("✅ Gemini API working correctly")
      } else {
        this.results.gemini = { status: "no_response", error: "Empty response" }
        console.log("⚠️ Gemini API responding but no content returned")
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message

      this.results.gemini = { status: "error", code: status, error: message }

      switch (status) {
        case 400:
          console.log("❌ Gemini API: Bad Request (400)")
          console.log("   Possible causes: Invalid request format, blocked content")
          break
        case 403:
          console.log("❌ Gemini API: Forbidden (403)")
          console.log("   Possible causes: Invalid API key, API not enabled")
          break
        case 429:
          console.log("❌ Gemini API: Rate Limited (429)")
          console.log("   Possible causes: Too many requests, quota exceeded")
          break
        default:
          console.log(`❌ Gemini API: Error ${status} - ${message}`)
      }
    }
    console.log("")
  }

  async diagnoseGroq() {
    console.log("🔍 Diagnosing Groq API...")

    const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY2].filter(Boolean)

    if (keys.length === 0) {
      this.results.groq = { status: "missing", error: "No API keys provided" }
      console.log("❌ No Groq API keys found")
      return
    }

    console.log(`   Found ${keys.length} Groq key(s)`)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      console.log(`   Testing key ${i + 1}...`)

      if (!key.startsWith("gsk_")) {
        console.log(`   ❌ Key ${i + 1}: Invalid format (should start with 'gsk_')`)
        continue
      }

      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        if (reply) {
          this.results.groq = { status: "working", key: i + 1, response: reply }
          console.log(`   ✅ Key ${i + 1}: Working correctly`)
          return
        }
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message

        switch (status) {
          case 401:
            console.log(`   ❌ Key ${i + 1}: Unauthorized (401) - Invalid API key`)
            break
          case 429:
            console.log(`   ❌ Key ${i + 1}: Rate Limited (429) - Try again later`)
            break
          case 400:
            console.log(`   ❌ Key ${i + 1}: Bad Request (400) - ${message}`)
            break
          default:
            console.log(`   ❌ Key ${i + 1}: Error ${status} - ${message}`)
        }
      }
    }

    this.results.groq = { status: "all_failed", error: "All keys failed" }
    console.log("❌ All Groq keys failed")
    console.log("")
  }

  async diagnoseTogether() {
    console.log("🔍 Diagnosing Together AI...")

    const keys = [process.env.TOGETHER_API_KEY, process.env.TOGETHER_API_KEY2].filter(Boolean)

    if (keys.length === 0) {
      this.results.together = { status: "missing", error: "No API keys provided" }
      console.log("❌ No Together AI keys found")
      return
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      console.log(`   Testing key ${i + 1}...`)

      try {
        const response = await axios.post(
          "https://api.together.xyz/v1/chat/completions",
          {
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        if (reply) {
          this.results.together = { status: "working", key: i + 1, response: reply }
          console.log(`   ✅ Key ${i + 1}: Working correctly`)
          return
        }
      } catch (error) {
        const status = error.response?.status
        console.log(`   ❌ Key ${i + 1}: Error ${status} - ${error.response?.data?.error?.message || error.message}`)
      }
    }

    this.results.together = { status: "all_failed", error: "All keys failed" }
    console.log("")
  }

  async diagnoseOpenRouter() {
    console.log("🔍 Diagnosing OpenRouter...")

    const keys = [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY2].filter(Boolean)

    if (keys.length === 0) {
      this.results.openrouter = { status: "missing", error: "No API keys provided" }
      console.log("❌ No OpenRouter keys found")
      return
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      console.log(`   Testing key ${i + 1}...`)

      try {
        // First try to get account info
        const accountResponse = await axios.get("https://openrouter.ai/api/v1/auth/key", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
          timeout: 10000,
        })

        console.log(`   💰 Credit balance: $${accountResponse.data.data.credit_balance}`)

        // Then test chat completion
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "mistralai/mistral-7b-instruct:free",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ultrasolx.com",
              "X-Title": "ULTRASOLX Bot",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        if (reply) {
          this.results.openrouter = {
            status: "working",
            key: i + 1,
            response: reply,
            balance: accountResponse.data.data.credit_balance,
          }
          console.log(`   ✅ Key ${i + 1}: Working correctly`)
          return
        }
      } catch (error) {
        const status = error.response?.status
        const message = error.response?.data?.error?.message || error.message

        if (status === 402) {
          console.log(`   ❌ Key ${i + 1}: Insufficient credits (402)`)
        } else if (status === 401) {
          console.log(`   ❌ Key ${i + 1}: Invalid API key (401)`)
        } else {
          console.log(`   ❌ Key ${i + 1}: Error ${status} - ${message}`)
        }
      }
    }

    this.results.openrouter = { status: "all_failed", error: "All keys failed" }
    console.log("")
  }

  async diagnosePawan() {
    console.log("🔍 Diagnosing Pawan API...")

    const keys = [process.env.PAWAN_API_KEY, process.env.PAWAN_API_KEY2].filter(Boolean)

    if (keys.length === 0) {
      this.results.pawan = { status: "missing", error: "No API keys provided" }
      console.log("❌ No Pawan keys found")
      return
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      console.log(`   Testing key ${i + 1}...`)

      try {
        const response = await axios.post(
          "https://api.pawan.krd/cosmosrp/v1/chat/completions",
          {
            model: "pai-001-rp",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        )

        const reply = response.data.choices?.[0]?.message?.content
        if (reply) {
          this.results.pawan = { status: "working", key: i + 1, response: reply }
          console.log(`   ✅ Key ${i + 1}: Working correctly`)
          return
        }
      } catch (error) {
        const status = error.response?.status
        console.log(`   ❌ Key ${i + 1}: Error ${status} - ${error.response?.data?.error?.message || error.message}`)
      }
    }

    this.results.pawan = { status: "all_failed", error: "All keys failed" }
    console.log("")
  }

  async diagnoseVanna() {
    console.log("🔍 Diagnosing Vanna API...")

    const keys = [process.env.VANNA_API_KEY, process.env.VANNA_API_KEY2].filter(Boolean)

    if (keys.length === 0) {
      this.results.vanna = { status: "missing", error: "No API keys provided" }
      console.log("❌ No Vanna keys found")
      return
    }

    console.log("⚠️ Vanna API testing skipped (specialized SQL API)")
    this.results.vanna = { status: "skipped", error: "Specialized API - manual testing required" }
    console.log("")
  }

  async diagnoseStability() {
    console.log("🔍 Diagnosing Stability AI...")

    const key = process.env.STABILITY_API_KEY

    if (!key) {
      this.results.stability = { status: "missing", error: "No API key provided" }
      console.log("❌ Stability AI key missing")
      return
    }

    try {
      // First check account balance
      console.log("   Checking account balance...")
      const balanceResponse = await axios.get("https://api.stability.ai/v1/user/balance", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
        timeout: 10000,
      })

      const credits = balanceResponse.data.credits
      console.log(`   💰 Credits available: ${credits}`)

      if (credits < 1) {
        this.results.stability = { status: "no_credits", error: "Insufficient credits", credits }
        console.log("❌ Insufficient credits for image generation")
        return
      }

      // Test image generation with minimal settings
      console.log("   Testing image generation (this may take 15-30 seconds)...")
      const response = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [{ text: "red dot" }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 45000,
        },
      )

      if (response.data.artifacts && response.data.artifacts[0]) {
        this.results.stability = {
          status: "working",
          credits: credits,
          imageGenerated: true,
        }
        console.log("✅ Stability AI working correctly")
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message

      this.results.stability = { status: "error", code: status, error: message }

      switch (status) {
        case 401:
          console.log("❌ Stability AI: Invalid API key (401)")
          break
        case 402:
          console.log("❌ Stability AI: Insufficient credits (402)")
          break
        case 429:
          console.log("❌ Stability AI: Rate limited (429)")
          break
        default:
          console.log(`❌ Stability AI: Error ${status} - ${message}`)
      }
    }
    console.log("")
  }

  generateReport() {
    console.log("📊 DIAGNOSTIC REPORT")
    console.log("=".repeat(60))

    const working = []
    const failed = []
    const missing = []

    Object.entries(this.results).forEach(([api, result]) => {
      if (result.status === "working") {
        working.push(api)
      } else if (result.status === "missing") {
        missing.push(api)
      } else {
        failed.push(api)
      }
    })

    console.log(`✅ Working APIs (${working.length}): ${working.join(", ") || "None"}`)
    console.log(`❌ Failed APIs (${failed.length}): ${failed.join(", ") || "None"}`)
    console.log(`⚠️ Missing APIs (${missing.length}): ${missing.join(", ") || "None"}`)

    console.log(`\n🎯 Bot Status: ${working.length > 0 ? "READY" : "NEEDS FIXES"}`)
    console.log("")
  }

  provideSolutions() {
    console.log("💡 SOLUTIONS & FIXES")
    console.log("=".repeat(60))

    Object.entries(this.results).forEach(([api, result]) => {
      if (result.status !== "working") {
        console.log(`\n🔧 ${api.toUpperCase()} Issues:`)

        switch (result.status) {
          case "missing":
            console.log("   Problem: No API key provided")
            console.log(`   Solution: Add ${api.toUpperCase()}_API_KEY to your .env file`)
            this.printAPIKeyInstructions(api)
            break

          case "error":
            if (result.code === 401) {
              console.log("   Problem: Invalid API key")
              console.log("   Solution: Check your API key is correct and active")
            } else if (result.code === 429) {
              console.log("   Problem: Rate limited")
              console.log("   Solution: Wait 5-10 minutes and try again")
            } else if (result.code === 402) {
              console.log("   Problem: Insufficient credits/quota")
              console.log("   Solution: Add credits to your account or upgrade plan")
            } else {
              console.log(`   Problem: API error (${result.code})`)
              console.log("   Solution: Check API status and documentation")
            }
            break

          case "no_credits":
            console.log("   Problem: No credits available")
            console.log("   Solution: Add credits to your Stability AI account")
            break

          case "all_failed":
            console.log("   Problem: All API keys failed")
            console.log("   Solution: Check all keys are valid and have quota")
            break
        }
      }
    })

    console.log("\n🚀 NEXT STEPS:")
    const workingCount = Object.values(this.results).filter((r) => r.status === "working").length

    if (workingCount === 0) {
      console.log("1. Fix at least one API key issue above")
      console.log("2. Run 'npm run test' to verify fixes")
      console.log("3. Then run 'npm start' to launch the bot")
    } else if (workingCount < 3) {
      console.log("1. Your bot will work but consider fixing more APIs for better reliability")
      console.log("2. Run 'npm start' to launch the bot")
    } else {
      console.log("1. Your bot is ready! Run 'npm start' to launch")
      console.log("2. Consider fixing remaining APIs for maximum reliability")
    }
  }

  printAPIKeyInstructions(api) {
    const instructions = {
      gemini: "   Get key from: https://makersuite.google.com/app/apikey",
      groq: "   Get key from: https://console.groq.com/keys",
      together: "   Get key from: https://api.together.xyz/settings/api-keys",
      openrouter: "   Get key from: https://openrouter.ai/keys",
      pawan: "   Get key from: https://pawan.krd/",
      stability: "   Get key from: https://platform.stability.ai/account/keys",
    }

    if (instructions[api]) {
      console.log(instructions[api])
    }
  }
}

// Run the troubleshooter
const troubleshooter = new APITroubleshooter()
troubleshooter.diagnoseAll().catch((error) => {
  console.error("❌ Troubleshooter failed:", error.message)
})
