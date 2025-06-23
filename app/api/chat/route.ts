import { type NextRequest, NextResponse } from "next/server"

const AI_PROVIDERS = [
  {
    name: "Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    key: process.env.GEMINI_API_KEY,
    format: (messages: any[]) => ({
      contents: [
        {
          parts: [{ text: messages.at(-1).content }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
    extract: (res: any) => res.candidates?.[0]?.content?.parts?.[0]?.text || "",
    headers: (key: string) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    }),
  },
  {
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: process.env.GROQ_API_KEY,
    model: "mixtral-8x7b-32768",
    headers: (key: string) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  // Add other providers as needed
]

export async function POST(request: NextRequest) {
  try {
    const { message, messages } = await request.json()

    for (const provider of AI_PROVIDERS) {
      if (!provider.key) continue

      try {
        const body = provider.format
          ? provider.format([...messages, { role: "user", content: message }])
          : {
              model: provider.model,
              messages: [...messages, { role: "user", content: message }],
              temperature: 0.7,
              max_tokens: 1500,
            }

        const headers = provider.headers(provider.key)

        const response = await fetch(provider.url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        })

        const data = await response.json()

        const reply = provider.extract ? provider.extract(data) : data.choices?.[0]?.message?.content

        if (reply && reply.trim()) {
          return NextResponse.json({
            success: true,
            content: reply,
            provider: provider.name,
          })
        }
      } catch (error) {
        console.error(`${provider.name} failed:`, error)
        continue
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "All AI providers are currently unavailable",
      },
      { status: 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
