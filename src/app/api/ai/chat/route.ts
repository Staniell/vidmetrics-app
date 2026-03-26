import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { geminiFlash } from "@/lib/ai/gemini"
import { buildChatPrompt } from "@/lib/ai/prompts"
import type { CondensedChannelContext } from "@/types"

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 50
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Chat limit reached. Try again tomorrow.", code: "RATE_LIMITED" },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { messages, channelContext, comparisonContext } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>
      channelContext: CondensedChannelContext
      comparisonContext?: CondensedChannelContext
    }

    if (!messages || !channelContext) {
      return NextResponse.json(
        { error: "Missing required fields", code: "BAD_REQUEST" },
        { status: 400 }
      )
    }

    const systemPrompt = buildChatPrompt(channelContext, comparisonContext)

    const result = streamText({
      model: geminiFlash,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error("AI chat error:", err)
    return NextResponse.json(
      { error: "Failed to process chat message. Please try again.", code: "AI_ERROR" },
      { status: 500 }
    )
  }
}
