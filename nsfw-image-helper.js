require("dotenv").config()
const axios = require("axios")

// Alternative NSFW prompt techniques
const NSFW_PROMPT_ENHANCERS = [
  "artistic nude photography",
  "renaissance style intimate scene",
  "oil painting romantic couple",
  "classical art nude figure",
  "artistic boudoir photography",
  "fine art intimate portrait",
  "sculptural nude study",
  "artistic sensual photography",
]

const STYLE_PREFIXES = [
  "renaissance style",
  "baroque painting",
  "oil painting",
  "watercolor painting",
  "charcoal drawing",
  "artistic photography",
  "fine art style",
  "classical art",
]

function enhanceNSFWPrompt(originalPrompt) {
  // Remove explicit terms and replace with artistic ones
  let enhanced = originalPrompt
    .replace(/\bsex\b/gi, "intimate")
    .replace(/\bporn\b/gi, "artistic")
    .replace(/\bexplicit\b/gi, "sensual")
    .replace(/\bnsfw\b/gi, "")
    .trim()

  // Add artistic style
  const randomStyle = STYLE_PREFIXES[Math.floor(Math.random() * STYLE_PREFIXES.length)]
  enhanced = `${randomStyle} ${enhanced}`

  return enhanced
}

async function generateEnhancedNSFW(prompt) {
  const enhancedPrompt = enhanceNSFWPrompt(prompt)
  console.log(`🎨 Enhanced prompt: "${enhancedPrompt}"`)

  try {
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
      {
        text_prompts: [
          { text: enhancedPrompt, weight: 1.2 },
          { text: "high quality, detailed, artistic", weight: 0.8 },
          { text: "blurry, low quality, censored, blocked", weight: -1 },
        ],
        cfg_scale: 15, // Higher adherence to prompt
        height: 512,
        width: 512,
        samples: 1,
        steps: 40, // More steps for better quality
        style_preset: "photographic",
        sampler: "K_DPM_2_ANCESTRAL", // Different sampler
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

    if (response.data.artifacts && response.data.artifacts[0]) {
      return Buffer.from(response.data.artifacts[0].base64, "base64")
    }
  } catch (error) {
    console.log(`❌ Enhanced NSFW generation failed: ${error.response?.status} - ${error.response?.data?.message}`)
  }

  return null
}

module.exports = { enhanceNSFWPrompt, generateEnhancedNSFW }
