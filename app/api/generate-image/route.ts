import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Extract prompt from message
    const prompt = message.replace(/^(\/image|nsfw|prompt:)\s*/i, "").trim()

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "No prompt provided",
        },
        { status: 400 },
      )
    }

    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 20,
      }),
    })

    const data = await response.json()

    if (data.artifacts && data.artifacts[0]) {
      const base64Image = data.artifacts[0].base64
      const imageUrl = `data:image/png;base64,${base64Image}`

      return NextResponse.json({
        success: true,
        imageUrl,
        provider: "Stability AI",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate image",
      },
      { status: 500 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Image generation failed",
      },
      { status: 500 },
    )
  }
}
