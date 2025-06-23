const fs = require("fs")
const axios = require("axios")
require("dotenv").config()

const memoryPath = "./memory.json"

// Initialize memory file if it doesn't exist
function initializeMemory() {
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify([], null, 2))
    console.log("✅ Memory file initialized")
  }
}

// Fixed image generation - OpenRouter doesn't support DALL-E 3 directly
async function generateImage(prompt) {
  console.log(`🎨 Generating image for: "${prompt.substring(0, 50)}..."`)

  // Try Stability AI first (your working method)
  if (process.env.STABILITY_API_KEY) {
    try {
      const res = await axios.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 20,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 60000,
        },
      )

      if (res.data.artifacts && res.data.artifacts[0]) {
        const base64Image = res.data.artifacts[0].base64
        // Save image temporarily and return buffer
        const imageBuffer = Buffer.from(base64Image, "base64")
        console.log("✅ Image generated with Stability AI")
        return imageBuffer
      }
    } catch (error) {
      console.log(
        `❌ Stability AI failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
      )
    }
  }

  // Alternative: Try OpenRouter with a text-to-image model (if available)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      // OpenRouter doesn't have direct image generation, but we can try their API
      console.log("⚠️ OpenRouter image generation not directly supported")
    } catch (error) {
      console.log(`❌ OpenRouter image failed: ${error.message}`)
    }
  }

  return null
}

function saveMemory(message) {
  try {
    let history = []

    // Read existing memory safely
    if (fs.existsSync(memoryPath)) {
      const data = fs.readFileSync(memoryPath, "utf-8")
      if (data.trim()) {
        history = JSON.parse(data)
      }
    }

    // Add new message
    history.push({
      ...message,
      timestamp: new Date().toISOString(),
    })

    // Keep only last 500 messages
    if (history.length > 500) {
      history = history.slice(-500)
    }

    // Save back to file
    fs.writeFileSync(memoryPath, JSON.stringify(history, null, 2))
    console.log(`💾 Memory saved: ${history.length} messages`)
  } catch (error) {
    console.error("❌ Error saving memory:", error.message)
  }
}

function getMemory() {
  try {
    if (fs.existsSync(memoryPath)) {
      const data = fs.readFileSync(memoryPath, "utf-8")
      if (data.trim()) {
        return JSON.parse(data)
      }
    }
    return []
  } catch (error) {
    console.error("❌ Error reading memory:", error.message)
    return []
  }
}

async function smartReply(userMsg, userId = "default") {
  console.log(`💬 Processing message from ${userId}: "${userMsg.substring(0, 100)}..."`)

  // Save user message
  saveMemory({ role: "user", content: userMsg, userId })

  // Get conversation history (last 10 messages for context)
  const history = getMemory().slice(-10)
  const messages = history.map((h) => ({ role: h.role, content: h.content }))

  // Fixed API configurations with your actual environment variables
  const models = [
    {
      name: "Groq (Mixtral)",
      call: async () => {
        const res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: messages.length > 0 ? messages : [{ role: "user", content: userMsg }],
            temperature: 0.7,
            max_tokens: 1500,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          },
        )
        return res.data.choices[0].message.content
      },
    },
    {
      name: "Groq (Backup)",
      call: async () => {
        if (!process.env.GROQ_API_KEY2) throw new Error("No backup key")
        const res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "mixtral-8x7b-32768",
            messages: messages.length > 0 ? messages : [{ role: "user", content: userMsg }],
            temperature: 0.7,
            max_tokens: 1500,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY2}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          },
        )
        return res.data.choices[0].message.content
      },
    },
    {
      name: "Together AI",
      call: async () => {
        const res = await axios.post(
          "https://api.together.xyz/v1/chat/completions",
          {
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: messages.length > 0 ? messages : [{ role: "user", content: userMsg }],
            temperature: 0.7,
            max_tokens: 1500,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          },
        )
        return res.data.choices[0].message.content
      },
    },
    {
      name: "OpenRouter",
      call: async () => {
        const res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "mistralai/mistral-7b-instruct:free",
            messages: messages.length > 0 ? messages : [{ role: "user", content: userMsg }],
            temperature: 0.7,
            max_tokens: 1500,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ultrasolx.com",
              "X-Title": "ULTRASOLX Bot",
            },
            timeout: 30000,
          },
        )
        return res.data.choices[0].message.content
      },
    },
    {
      name: "Gemini",
      call: async () => {
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: userMsg }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          },
          {
            timeout: 30000,
          },
        )
        return res.data.candidates[0].content.parts[0].text
      },
    },
  ]

  // Try each model until one works
  for (const model of models) {
    try {
      console.log(`🔄 Trying ${model.name}...`)
      const reply = await model.call()

      if (reply && reply.trim()) {
        console.log(`✅ ${model.name} succeeded`)
        saveMemory({ role: "assistant", content: reply, userId, provider: model.name })
        return `${reply}\n\n_✨ Powered by ${model.name}_`
      }
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message
      console.error(`❌ ${model.name} failed: ${status} - ${message}`)
    }
  }

  console.log("❌ All AI models failed")
  return "⚠️ All AI APIs failed. Please try again later."
}

// Initialize memory on startup
initializeMemory()

module.exports = { smartReply, generateImage, saveMemory, getMemory }
