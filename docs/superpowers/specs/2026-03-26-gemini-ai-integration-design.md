# Gemini AI Integration — Design Spec

**Date:** 2026-03-26
**Status:** Draft

## Context

VidMetrics is a YouTube analytics app that already collects rich channel and video data (metrics, engagement rates, view deltas, resurgence multipliers, content mix). Users currently interpret this data themselves. Integrating Gemini LLM into the channel detail page adds three capabilities:

1. **Auto-generated AI insights** — channel health, growth analysis, content strategy, actionable recommendations
2. **Conversational Q&A** — follow-up questions about the channel's performance in a chat panel
3. **Comparison analysis** — when two channels are compared (`?vs=`), AI analyzes the matchup

## SDK Choice

**Vercel AI SDK** (`ai` + `@ai-sdk/google`) over direct `@google/genai`:

- `useChat` handles streaming, message history, loading/error/abort states
- `generateObject` + Zod schemas give typed, validated structured output for insights
- One-line model swap if switching LLMs later
- Designed for the Next.js/Vercel stack this app runs on

**Model:** `gemini-2.0-flash` via Google AI Studio API key.

## New Dependencies

- `ai` (Vercel AI SDK v4)
- `@ai-sdk/google` (Google provider)
- `zod` (transitive, used for insights schema)

## New Environment Variable

```
GOOGLE_GENERATIVE_AI_API_KEY=<key>   # Google AI Studio API key (used by @ai-sdk/google)
```

Added to `.env.local` and Vercel project settings.

## File Structure

```
src/
  app/
    api/ai/
      insights/route.ts          # POST — structured insights generation
      chat/route.ts              # POST — streaming conversational chat
  components/
    ai/
      ai-insights-panel.tsx      # Auto-generated insights section
      ai-chat-panel.tsx          # Slide-out chat drawer (Sheet)
      ai-chat-message.tsx        # Individual message bubble
      ai-chat-input.tsx          # Chat input with send button
    ui/
      sheet.tsx                  # New shadcn/ui Sheet (slide-out panel)
      scroll-area.tsx            # New shadcn/ui ScrollArea (chat messages)
  hooks/
    use-ai-insights.ts           # Fetch + cache insights
  lib/
    ai/
      gemini.ts                  # google() model config
      prompts.ts                 # System prompts (insights, chat, comparison)
      context-builder.ts         # Condenses channel data for token efficiency
  types/
    index.ts                     # Extended with AI response types
  prisma/
    schema.prisma                # New AiInsightCache model
```

**Modified files:**
- `src/app/channel/[handle]/page.tsx` — render `<AiInsightsPanel>` and `<AiChatPanel>`
- `package.json` — add dependencies

## API Routes

### POST `/api/ai/insights`

**Request body:**
```typescript
{
  channelId: string
  channelData: CondensedChannelContext    // built by context-builder
  period: string
  comparisonChannel?: CondensedChannelContext  // present in comparison mode
}
```

**Behavior:**
1. Check `AiInsightCache` in Prisma — if a valid entry exists (same channelId + period + date, < 6 hours old), return it
2. On cache miss, call `generateObject()` with the insights Zod schema and the appropriate prompt (solo or comparison)
3. Store result in `AiInsightCache`
4. Return typed JSON

**Response (solo):**
```typescript
{
  healthScore: number           // 0-100
  healthSummary: string         // 1-2 sentence overview
  growthAnalysis: string        // growth trajectory analysis
  contentStrategy: string       // what content types/patterns are working
  recommendations: Array<{
    category: "titles" | "upload-schedule" | "content-mix" | "engagement" | "growth"
    title: string
    description: string
    priority: "high" | "medium" | "low"
  }>
}
```

**Response (comparison) — additional fields:**
```typescript
{
  // ...all solo fields for each channel...
  winner: string                // channelId of overall stronger channel
  headToHead: Array<{
    metric: string
    channel1Value: string
    channel2Value: string
    winner: string              // channelId
  }>
  channel1Advantages: string[]
  channel2Advantages: string[]
  comparisonSummary: string
  recommendations: Array<{
    category: "titles" | "upload-schedule" | "content-mix" | "engagement" | "growth" | "competitive"
    title: string
    description: string
    priority: "high" | "medium" | "low"
  }>  // tailored to competitive positioning
}
```

**Temperature:** 0.3 (deterministic for consistent insights)

### POST `/api/ai/chat`

**Request body:** Handled by Vercel AI SDK's `useChat` protocol — array of `{ role, content }` messages.

**Behavior:**
1. On first message, the system prompt includes the condensed channel context
2. Calls `streamText()` for SSE streaming response
3. Returns streaming `Response` per Vercel AI SDK protocol

**System prompt includes:**
- Role: YouTube content strategist for VidMetrics
- Channel context: condensed data from `context-builder.ts`
- Instructions: be concise, data-driven, cite specific videos/metrics when relevant

**Temperature:** 0.7 (conversational)

## Context Builder

`src/lib/ai/context-builder.ts` — reduces raw channel data to ~5K tokens:

**Condensed payload includes:**
- Channel summary: title, handle, subs, total views, video count, join date, description
- Content mix: % video vs short vs live
- Aggregate stats: avg views/video, avg engagement rate, total views in selected period
- Top 20 videos by views in range: title, views, viewsInRange, engagement rate, video type, published date, resurgence multiplier, data source
- Top 10 by engagement rate: same fields
- Trending videos: any with resurgence multiplier > 1.5

**For comparison mode:** same structure for both channels, plus relative stats (subscriber ratio, engagement gap, content mix differences).

## UI Components

### AiInsightsPanel

Renders below the channel card(s), above the charts section. Uses existing shadcn/ui `Card` components.

**Solo mode layout:**
- Health score badge (color-coded: green > 70, yellow > 40, red ≤ 40) + health summary
- Growth analysis paragraph
- Content strategy paragraph
- Recommendation cards in a grid (category badge, priority indicator, title, description)
- "Ask AI" button (opens chat Sheet)

**Comparison mode layout:**
- Winner callout banner
- Head-to-head metrics table
- Advantages for each channel (bulleted lists)
- Comparison summary paragraph
- Competitive recommendations
- "Ask AI" button

**Loading state:** Skeleton cards matching the layout.
**Error state:** Inline error with retry, using existing `error-state.tsx` pattern.

### AiChatPanel

shadcn `Sheet` component, slides in from the right.

**Layout:**
- Header: "AI Assistant — @ChannelHandle" with close button
- Scrollable message area (`ScrollArea`)
- Suggested starter questions (chips) shown when no messages yet:
  - "What content is performing best?"
  - "How can I improve engagement?"
  - "What should I post next?"
  - (Comparison mode: "Who's winning and why?", "Where does each channel have an advantage?")
- Input bar at bottom: text input + send button
- Streaming indicator while assistant is responding

### AiChatMessage

Message bubble component:
- User messages: right-aligned, themed background
- Assistant messages: left-aligned, rendered as markdown (supports bold, lists, etc.)
- Streaming text: characters appear progressively

### New shadcn/ui Primitives

**Sheet** (`src/components/ui/sheet.tsx`):
- Based on `@radix-ui/react-dialog` (already a transitive dep from popover)
- Slides from right edge, overlay backdrop
- Standard shadcn/ui Sheet pattern

**ScrollArea** (`src/components/ui/scroll-area.tsx`):
- Based on `@radix-ui/react-scroll-area`
- Used for chat message container
- Standard shadcn/ui ScrollArea pattern

## Hooks

### useAiInsights

```typescript
useAiInsights(
  channelData: CondensedChannelContext | null,
  comparisonData: CondensedChannelContext | null,
  period: string
): {
  insights: AiInsights | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}
```

- Fetches from `/api/ai/insights` when channel data becomes available
- Deduplicates requests (won't re-fetch if channelId + period haven't changed)
- `refresh()` bypasses cache (passes `force: true` to API)

### Chat (useChat from Vercel AI SDK)

No custom hook needed. `useChat` from `ai/react` is used directly in `AiChatPanel`:

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: "/api/ai/chat",
  body: { channelContext: condensedData },
})
```

## Database

### New Prisma Model

```prisma
model AiInsightCache {
  id                  String   @id @default(cuid())
  channelId           String
  comparisonChannelId String?
  period              String
  response            Json
  generatedAt         DateTime @default(now())

  @@index([channelId, comparisonChannelId, period, generatedAt])
}
```

Cache lookup: find entry where `channelId` + `comparisonChannelId` + `period` match and `generatedAt` is within the last 6 hours.

## Rate Limiting

In-memory per-IP counter (acceptable for small-scale app):
- 20 insight generations per IP per day
- 50 chat messages per IP per day
- Returns 429 with message: "AI request limit reached. Try again tomorrow."
- Resets on cold start (soft limit by design)

## Integration Point

In `src/app/channel/[handle]/page.tsx`:

```tsx
// After channel cards, before charts
{channel && (
  <AiInsightsPanel
    channelData={condensedChannelData}
    comparisonData={vsChannel ? condensedComparisonData : null}
    period={sharedPeriod}
  />
)}

// Chat panel (controlled by state)
<AiChatPanel
  open={chatOpen}
  onOpenChange={setChatOpen}
  channelData={condensedChannelData}
  comparisonData={vsChannel ? condensedComparisonData : null}
  channelHandle={channel.handle}
/>
```

## Verification Plan

1. **Unit test prompts**: Verify `context-builder.ts` produces correct condensed output for various channel sizes
2. **API route testing**: Hit `/api/ai/insights` and `/api/ai/chat` with sample data, verify response shapes
3. **Cache verification**: Call insights twice for the same channel — second call should return cached result (check `generatedAt` timestamp)
4. **Streaming verification**: Open chat, send a message, confirm characters stream in progressively (not all at once)
5. **Comparison mode**: Load a channel with `?vs=` param, verify insights panel shows comparison layout
6. **Rate limiting**: Send 21 insight requests from same IP, verify 429 on the 21st
7. **Visual check**: Verify insights panel styling matches existing card/badge patterns, chat Sheet slides smoothly
8. **Error handling**: Set invalid API key, verify graceful error display (not crash)
9. **Build check**: `npm run build` passes with no TypeScript errors
