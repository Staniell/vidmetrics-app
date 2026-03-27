import type { CondensedChannelContext } from "@/types"

function channelSummary(ctx: CondensedChannelContext): string {
  const hasRangeData = ctx.topByViews.length > 0

  const base = `Channel: ${ctx.title} (${ctx.handle})
Subscribers: ${ctx.subscriberCount.toLocaleString()}
Total views: ${ctx.viewCount.toLocaleString()}
Videos: ${ctx.videoCount}
Joined: ${ctx.publishedAt}
Content mix: ${ctx.contentMix.video}% videos, ${ctx.contentMix.short}% shorts, ${ctx.contentMix.live}% live
Avg views/video: ${ctx.avgViewsPerVideo.toLocaleString()}
Avg engagement rate: ${ctx.avgEngagementRate}%`

  if (!hasRangeData) {
    return `${base}

Note: Period-specific view data is not available for this analysis. Base your insights on the channel-level metrics above.`
  }

  return `${base}
Views in selected period: ${ctx.totalViewsInRange.toLocaleString()}

Top videos by views in range:
${ctx.topByViews.map((v, i) => `${i + 1}. "${v.title}" — ${v.viewsInRange.toLocaleString()} views (${v.engagementRate}% engagement, type: ${v.videoType}, resurgence: ${v.resurgenceMultiplier.toFixed(1)}x, data: ${v.dataSource})`).join("\n")}

Top videos by engagement:
${ctx.topByEngagement.map((v, i) => `${i + 1}. "${v.title}" — ${v.engagementRate}% engagement (${v.viewsInRange.toLocaleString()} views, type: ${v.videoType})`).join("\n")}

${ctx.trending.length > 0 ? `Trending/resurgent videos (gaining views faster than historical average):
${ctx.trending.map((v, i) => `${i + 1}. "${v.title}" — ${v.resurgenceMultiplier.toFixed(1)}x normal rate`).join("\n")}` : "No videos currently trending above historical average."}`
}

export function buildInsightsPrompt(ctx: CondensedChannelContext): string {
  return `You are a YouTube analytics expert. Analyze the following channel data and provide a health assessment, growth analysis, content strategy evaluation, and actionable recommendations.

Be concise, data-driven, and specific. Reference actual video titles and metrics. Focus on patterns and actionable insights, not obvious observations.

${channelSummary(ctx)}`
}

export function buildComparisonInsightsPrompt(
  ctx1: CondensedChannelContext,
  ctx2: CondensedChannelContext
): string {
  return `You are a YouTube analytics expert. Compare these two channels and provide competitive analysis.

Be concise and data-driven. Reference specific videos and metrics. Identify clear strengths, weaknesses, and opportunities for each channel.

--- CHANNEL 1 ---
${channelSummary(ctx1)}

--- CHANNEL 2 ---
${channelSummary(ctx2)}`
}

export function buildChatPrompt(
  ctx: CondensedChannelContext,
  comparisonCtx?: CondensedChannelContext
): string {
  const base = `You are a YouTube content strategist assistant for VidMetrics. Be concise, data-driven, and cite specific videos/metrics when relevant. Give actionable advice.

You have access to the following channel data:

${channelSummary(ctx)}`

  if (comparisonCtx) {
    return `${base}

You also have comparison data for a second channel:

${channelSummary(comparisonCtx)}

When answering, consider both channels and their competitive positioning.`
  }

  return base
}
