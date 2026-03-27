import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { geminiFlash } from "@/lib/ai/gemini"
import { buildInsightsPrompt, buildComparisonInsightsPrompt } from "@/lib/ai/prompts"
import { prisma } from "@/lib/prisma"
import type { CondensedChannelContext } from "@/types"

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
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

const recommendationSchema = z.object({
  category: z.enum(["titles", "upload-schedule", "content-mix", "engagement", "growth", "competitive"]),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]),
})

const soloInsightsSchema = z.object({
  healthScore: z.number().min(0).max(100),
  healthSummary: z.string(),
  growthAnalysis: z.string(),
  contentStrategy: z.string(),
  recommendations: z.array(recommendationSchema).min(3).max(5),
})

const comparisonInsightsSchema = soloInsightsSchema.extend({
  winner: z.string(),
  headToHead: z.array(
    z.object({
      metric: z.string(),
      channel1Value: z.string(),
      channel2Value: z.string(),
      winner: z.string(),
    })
  ),
  channel1Advantages: z.array(z.string()),
  channel2Advantages: z.array(z.string()),
  comparisonSummary: z.string(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "AI request limit reached. Try again tomorrow.", code: "RATE_LIMITED" },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const {
      channelId,
      channelData,
      period,
      comparisonChannel,
      force,
    } = body as {
      channelId: string
      channelData: CondensedChannelContext
      period: string
      comparisonChannel?: CondensedChannelContext
      force?: boolean
    }

    if (!channelId || !channelData || !period) {
      return NextResponse.json(
        { error: "Missing required fields", code: "BAD_REQUEST" },
        { status: 400 }
      )
    }

    const comparisonChannelId = comparisonChannel?.channelId ?? null
    const isComparison = !!comparisonChannel

    // Check cache (unless force refresh)
    if (!force) {
      const cutoff = new Date(Date.now() - CACHE_TTL_MS)
      const cached = await prisma.aiInsightCache.findFirst({
        where: {
          channelId,
          comparisonChannelId,
          period,
          generatedAt: { gte: cutoff },
        },
        orderBy: { generatedAt: "desc" },
      })

      if (cached) {
        return NextResponse.json(cached.response)
      }
    }

    // Generate with Gemini
    const prompt = isComparison
      ? buildComparisonInsightsPrompt(channelData, comparisonChannel!)
      : buildInsightsPrompt(channelData)

    const schema = isComparison ? comparisonInsightsSchema : soloInsightsSchema

    const { object } = await generateObject({
      model: geminiFlash,
      schema,
      prompt,
      temperature: 0.3,
    })

    // Store in cache
    prisma.aiInsightCache
      .create({
        data: {
          channelId,
          comparisonChannelId,
          period,
          response: JSON.parse(JSON.stringify(object)),
        },
      })
      .catch(() => {})

    return NextResponse.json(object)
  } catch (err) {
    console.error("AI insights error:", err)
    const message = err instanceof Error ? err.message : String(err)
    const isQuota = message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate")
    return NextResponse.json(
      {
        error: isQuota
          ? "AI quota exceeded. Please try again later."
          : "Failed to generate insights. Please try again.",
        code: isQuota ? "QUOTA_EXCEEDED" : "AI_ERROR",
      },
      { status: isQuota ? 429 : 500 }
    )
  }
}
