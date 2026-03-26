# Channel Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline channel comparison to the channel detail page so users can compare two YouTube channels' stats and charts side-by-side.

**Architecture:** A "Compare" button on the channel page reveals a `ChannelInput`. Submitting a second channel updates the URL to `/channel/MrBeast?vs=PewDiePie` and renders a comparison section (stat cards, overlaid charts, aggregate stats) between the ChannelCard and the existing content. The `useChannel` hook is refactored to accept external sort/period/range so both instances stay synchronized.

**Tech Stack:** Next.js 16 App Router, React 19, Recharts 3.x, Tailwind CSS v4, shadcn/ui

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/use-channel.ts` | Modify | Accept optional external sort/period/range overrides |
| `src/app/channel/[handle]/page.tsx` | Modify | Read `vs` param, second `useChannel`, lift filter state, render compare UI |
| `src/components/compare-stat-cards.tsx` | Create | Side-by-side channel stat cards with winner highlighting |
| `src/components/compare-charts.tsx` | Create | Dynamic-imported overlaid views + engagement charts |
| `src/components/compare-aggregates.tsx` | Create | Head-to-head aggregate stats row |

---

### Task 1: Refactor `useChannel` to Accept External Filter Overrides

**Files:**
- Modify: `src/hooks/use-channel.ts`

The hook currently owns `sort`, `period`, `rangeStart`, `rangeEnd` state internally. We need it to accept optional external values so the channel page can synchronize two instances.

- [ ] **Step 1: Add options parameter to `useChannel`**

Add an optional second parameter for external overrides. When provided, the hook uses external values instead of internal state. The hook's own setters become no-ops when externally controlled.

In `src/hooks/use-channel.ts`, change the function signature and add the options interface:

```typescript
interface UseChannelOptions {
  externalSort?: string
  externalPeriod?: string
  externalRangeStart?: string
  externalRangeEnd?: string
}
```

Change the function signature from:
```typescript
export function useChannel(initialHandle?: string): UseChannelReturn {
```
to:
```typescript
export function useChannel(initialHandle?: string, options?: UseChannelOptions): UseChannelReturn {
```

- [ ] **Step 2: Derive effective values from external or internal state**

After the existing `useState` calls (lines 85-91), add derived values that prefer external overrides:

```typescript
const effectiveSort = options?.externalSort ?? sort
const effectivePeriod = options?.externalPeriod ?? period
const effectiveRangeStart = options?.externalRangeStart ?? rangeStart
const effectiveRangeEnd = options?.externalRangeEnd ?? rangeEnd
```

Update the refs to use effective values (lines 100-107):
```typescript
sortRef.current = effectiveSort
periodRef.current = effectivePeriod
rangeStartRef.current = effectiveRangeStart
rangeEndRef.current = effectiveRangeEnd
```

- [ ] **Step 3: Replace internal state references with effective values throughout**

In `fetchMoreVideos` (line 200-220), replace `sort` and `period` with `effectiveSort` and `effectivePeriod`:
```typescript
const fetchMoreVideos = useCallback(async () => {
    if (!channel || !nextPageToken) return
    const controller = new AbortController()
    try {
      const data = await fetchVideosApi(
        channel.id,
        effectiveSort,
        effectivePeriod,
        controller.signal,
        nextPageToken
      )
      setVideos((prev) => [...prev, ...data.videos])
      setNextPageToken(data.nextPageToken || null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to load more videos")
    }
  }, [channel, nextPageToken, effectiveSort, effectivePeriod])
```

In the sort/period refetch effect (lines 229-253), replace `sort` and `period` dependencies:
```typescript
useEffect(() => {
    if (!channel) return
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false
      return
    }
    if (effectiveSort === "viewsInRange") return

    const controller = new AbortController()
    setIsLoading(true)

    fetchVideosApi(channel.id, effectiveSort, effectivePeriod, controller.signal)
      .then((data) => {
        setVideos(data.videos)
        setNextPageToken(data.nextPageToken || null)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to fetch videos")
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [effectiveSort, effectivePeriod, channel])
```

In the range sync effect (lines 261-267), use `effectivePeriod`:
```typescript
useEffect(() => {
    if (options?.externalPeriod) return  // externally controlled, skip sync
    if (period === "custom") return
    const { start, end } = rangeDatesFromPeriod(period)
    setRangeStart(start)
    setRangeEnd(end)
  }, [period, options?.externalPeriod])
```

In the views-in-range refetch effect (lines 286-305), use effective range values:
```typescript
useEffect(() => {
    if (!channel) return
    if (skipNextRangeEffectRef.current) {
      skipNextRangeEffectRef.current = false
      return
    }

    const controller = new AbortController()

    fetchViewsInRangeApi(channel.id, effectiveRangeStart, effectiveRangeEnd, controller.signal)
      .then((data) => {
        setRangeVideos(data.videos)
        setTrackedSince(data.trackedSince)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
      })

    return () => controller.abort()
  }, [effectiveRangeStart, effectiveRangeEnd, channel])
```

- [ ] **Step 4: Update the return object to use effective values**

In the return block (lines 307-325), use effective values for the exposed state:
```typescript
return {
    channel,
    videos,
    rangeVideos,
    isLoading,
    error,
    sort: effectiveSort,
    period: effectivePeriod,
    rangeStart: effectiveRangeStart,
    rangeEnd: effectiveRangeEnd,
    trackedSince,
    nextPageToken,
    fetchChannel,
    fetchMoreVideos,
    setSort,
    setPeriod,
    setCustomRange,
    retry,
  }
```

- [ ] **Step 5: Verify the existing single-channel page still works**

Run: `npm run build`
Expected: Build succeeds. The channel page passes no `options`, so all `effective*` values fall back to internal state — zero behavior change.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-channel.ts
git commit -m "refactor: useChannel accepts external filter overrides for comparison mode"
```

---

### Task 2: Create `CompareStatCards` Component

**Files:**
- Create: `src/components/compare-stat-cards.tsx`

Side-by-side channel info with winner highlighting on each numeric metric.

- [ ] **Step 1: Create the component file**

Create `src/components/compare-stat-cards.tsx`:

```tsx
import Image from "next/image"
import { Users, Eye, Video, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ChannelInfo } from "@/types"

interface CompareStatCardsProps {
  primary: ChannelInfo
  comparison: ChannelInfo
}

function winnerClass(a: number, b: number): { aClass: string; bClass: string } {
  if (a > b) return { aClass: "text-green-600 dark:text-green-400", bClass: "" }
  if (b > a) return { aClass: "", bClass: "text-green-600 dark:text-green-400" }
  return { aClass: "", bClass: "" }
}

function ChannelColumn({ channel, statClasses }: {
  channel: ChannelInfo
  statClasses: { subs: string; views: string; videos: string }
}) {
  return (
    <Card className="flex-1">
      <CardContent className="flex flex-col items-center gap-3 p-5">
        {channel.thumbnailUrl && (
          <Image
            src={channel.thumbnailUrl}
            alt={channel.title}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div className="text-center min-w-0">
          <h3 className="text-base font-semibold truncate">{channel.title}</h3>
          <p className="text-xs text-muted-foreground">{channel.handle}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <StatCell
            icon={<Users className="h-3.5 w-3.5" />}
            label="Subscribers"
            value={channel.subscriberCount > 0 ? formatNumber(channel.subscriberCount) : "Hidden"}
            className={statClasses.subs}
          />
          <StatCell
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Total Views"
            value={formatNumber(channel.viewCount)}
            className={statClasses.views}
          />
          <StatCell
            icon={<Video className="h-3.5 w-3.5" />}
            label="Videos"
            value={formatNumber(channel.videoCount)}
            className={statClasses.videos}
          />
          <StatCell
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Joined"
            value={formatDate(channel.publishedAt)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatCell({ icon, label, value, className }: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <span className={cn("text-sm font-semibold", className)}>{value}</span>
    </div>
  )
}

export function CompareStatCards({ primary, comparison }: CompareStatCardsProps) {
  const subs = winnerClass(primary.subscriberCount, comparison.subscriberCount)
  const views = winnerClass(primary.viewCount, comparison.viewCount)
  const videos = winnerClass(primary.videoCount, comparison.videoCount)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ChannelColumn
        channel={primary}
        statClasses={{ subs: subs.aClass, views: views.aClass, videos: videos.aClass }}
      />
      <ChannelColumn
        channel={comparison}
        statClasses={{ subs: subs.bClass, views: views.bClass, videos: videos.bClass }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds (component not yet mounted anywhere).

- [ ] **Step 3: Commit**

```bash
git add src/components/compare-stat-cards.tsx
git commit -m "feat: add CompareStatCards component for side-by-side channel stats"
```

---

### Task 3: Create `CompareCharts` Component

**Files:**
- Create: `src/components/compare-charts.tsx`

Overlaid line chart (views over time) and grouped bar chart (engagement) for two channels.

- [ ] **Step 1: Create the component file**

Create `src/components/compare-charts.tsx`:

```tsx
"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, formatDateShort, formatEngagement } from "@/lib/format"
import type { VideoMetrics } from "@/types"

interface CompareChartsProps {
  primaryVideos: VideoMetrics[]
  comparisonVideos: VideoMetrics[]
  primaryName: string
  comparisonName: string
}

function buildViewsData(
  primaryVideos: VideoMetrics[],
  comparisonVideos: VideoMetrics[],
  primaryName: string,
  comparisonName: string
) {
  const primarySorted = [...primaryVideos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)

  const comparisonSorted = [...comparisonVideos]
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
    .slice(-20)

  // Interleave both channels' videos by date for a shared timeline
  const all = [
    ...primarySorted.map((v) => ({ date: v.publishedAt, [primaryName]: v.viewCount })),
    ...comparisonSorted.map((v) => ({ date: v.publishedAt, [comparisonName]: v.viewCount })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Merge entries with the same date
  const merged: Record<string, Record<string, unknown>>[] = []
  for (const entry of all) {
    const label = formatDateShort(entry.date)
    const last = merged[merged.length - 1]
    if (last && last.label === label) {
      Object.assign(last, entry, { label })
    } else {
      merged.push({ ...entry, label })
    }
  }

  return merged
}

function buildEngagementData(
  primaryVideos: VideoMetrics[],
  comparisonVideos: VideoMetrics[],
  primaryName: string,
  comparisonName: string
) {
  const primaryTop = [...primaryVideos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5)

  const comparisonTop = [...comparisonVideos]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5)

  const maxLen = Math.max(primaryTop.length, comparisonTop.length)
  const data: Record<string, unknown>[] = []

  for (let i = 0; i < maxLen; i++) {
    const entry: Record<string, unknown> = { rank: `#${i + 1}` }
    if (primaryTop[i]) {
      entry[primaryName] = parseFloat(primaryTop[i].engagementRate.toFixed(2))
      entry[`${primaryName}_title`] = primaryTop[i].title
    }
    if (comparisonTop[i]) {
      entry[comparisonName] = parseFloat(comparisonTop[i].engagementRate.toFixed(2))
      entry[`${comparisonName}_title`] = comparisonTop[i].title
    }
    data.push(entry)
  }

  return data
}

export function CompareCharts({
  primaryVideos,
  comparisonVideos,
  primaryName,
  comparisonName,
}: CompareChartsProps) {
  const viewsData = buildViewsData(primaryVideos, comparisonVideos, primaryName, comparisonName)
  const engagementData = buildEngagementData(primaryVideos, comparisonVideos, primaryName, comparisonName)

  const tooltipStyle = {
    backgroundColor: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "12px",
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {viewsData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={viewsData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatNumber(v)}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "var(--color-foreground)" }}
                  formatter={(value) => [formatNumber(Number(value)), "Views"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={primaryName}
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey={comparisonName}
                  stroke="var(--color-chart-3)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Engagement Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {engagementData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={engagementData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="rank"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "var(--color-foreground)" }}
                  formatter={(value, name) => [formatEngagement(Number(value)), name]}
                />
                <Legend />
                <Bar dataKey={primaryName} fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey={comparisonName} fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/compare-charts.tsx
git commit -m "feat: add CompareCharts component with overlaid views and engagement charts"
```

---

### Task 4: Create `CompareAggregates` Component

**Files:**
- Create: `src/components/compare-aggregates.tsx`

Compact row of head-to-head aggregate stats.

- [ ] **Step 1: Create the component file**

Create `src/components/compare-aggregates.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatEngagement } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { VideoMetrics, VideoViewDelta } from "@/types"

interface CompareAggregatesProps {
  primaryVideos: VideoMetrics[]
  comparisonVideos: VideoMetrics[]
  primaryRangeVideos: VideoViewDelta[]
  comparisonRangeVideos: VideoViewDelta[]
  primaryName: string
  comparisonName: string
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((sum, v) => sum + v, 0) / arr.length
}

function typeBreakdown(videos: VideoMetrics[]): string {
  if (videos.length === 0) return "-"
  const counts = { video: 0, short: 0, live: 0 }
  for (const v of videos) counts[v.videoType]++
  const parts: string[] = []
  if (counts.video > 0) parts.push(`${Math.round((counts.video / videos.length) * 100)}% Videos`)
  if (counts.short > 0) parts.push(`${Math.round((counts.short / videos.length) * 100)}% Shorts`)
  if (counts.live > 0) parts.push(`${Math.round((counts.live / videos.length) * 100)}% Lives`)
  return parts.join(", ")
}

function winnerClass(a: number, b: number): { aClass: string; bClass: string } {
  if (a > b) return { aClass: "text-green-600 dark:text-green-400", bClass: "" }
  if (b > a) return { aClass: "", bClass: "text-green-600 dark:text-green-400" }
  return { aClass: "", bClass: "" }
}

export function CompareAggregates({
  primaryVideos,
  comparisonVideos,
  primaryRangeVideos,
  comparisonRangeVideos,
  primaryName,
  comparisonName,
}: CompareAggregatesProps) {
  const pAvgViews = avg(primaryVideos.map((v) => v.viewCount))
  const cAvgViews = avg(comparisonVideos.map((v) => v.viewCount))
  const pAvgEng = avg(primaryVideos.map((v) => v.engagementRate))
  const cAvgEng = avg(comparisonVideos.map((v) => v.engagementRate))
  const pTotalRange = primaryRangeVideos.reduce((sum, v) => sum + v.viewsInRange, 0)
  const cTotalRange = comparisonRangeVideos.reduce((sum, v) => sum + v.viewsInRange, 0)

  const viewsWin = winnerClass(pAvgViews, cAvgViews)
  const engWin = winnerClass(pAvgEng, cAvgEng)
  const rangeWin = winnerClass(pTotalRange, cTotalRange)

  const stats = [
    {
      label: "Avg Views/Video",
      primary: formatNumber(Math.round(pAvgViews)),
      comparison: formatNumber(Math.round(cAvgViews)),
      pClass: viewsWin.aClass,
      cClass: viewsWin.bClass,
    },
    {
      label: "Avg Engagement",
      primary: formatEngagement(pAvgEng),
      comparison: formatEngagement(cAvgEng),
      pClass: engWin.aClass,
      cClass: engWin.bClass,
    },
    {
      label: "Views in Period",
      primary: formatNumber(pTotalRange),
      comparison: formatNumber(cTotalRange),
      pClass: rangeWin.aClass,
      cClass: rangeWin.bClass,
    },
    {
      label: "Content Mix",
      primary: typeBreakdown(primaryVideos),
      comparison: typeBreakdown(comparisonVideos),
      pClass: "",
      cClass: "",
    },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {stat.label}
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-sm font-semibold", stat.pClass)} title={primaryName}>
                  {stat.primary}
                </span>
                <span className="text-[10px] text-muted-foreground">vs</span>
                <span className={cn("text-sm font-semibold", stat.cClass)} title={comparisonName}>
                  {stat.comparison}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/compare-aggregates.tsx
git commit -m "feat: add CompareAggregates component for head-to-head stats"
```

---

### Task 5: Wire Everything Into the Channel Page

**Files:**
- Modify: `src/app/channel/[handle]/page.tsx`

This is the integration task: read `vs` query param, instantiate second `useChannel`, lift filter state, add Compare button/input, and render the comparison section.

- [ ] **Step 1: Add imports and read `vs` query param**

At the top of `src/app/channel/[handle]/page.tsx`, update the imports:

```tsx
"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CircleHelp, GitCompareArrows, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useChannel } from "@/hooks/use-channel"
import { parseChannelInput } from "@/lib/parse-channel-input"
import { ChannelCard } from "@/components/channel-card"
import { ChannelInput } from "@/components/channel-input"
import { ChartsRow } from "@/components/charts-row"
import { FilterBar } from "@/components/filter-bar"
import { VideoGrid } from "@/components/video-grid"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { CompareStatCards } from "@/components/compare-stat-cards"
import { CompareAggregates } from "@/components/compare-aggregates"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CompareCharts = dynamic(
  () => import("@/components/compare-charts").then((mod) => mod.CompareCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    ),
  }
)
```

- [ ] **Step 2: Add comparison state and lifted filter state**

Inside `ChannelPage`, after `const decodedHandle = ...`, add:

```tsx
const searchParams = useSearchParams()
const vsParam = searchParams.get("vs")

// Lifted filter state shared between both channels
const [sharedSort, setSharedSort] = useState("views")
const [sharedPeriod, setSharedPeriod] = useState("30")
const [sharedRangeStart, setSharedRangeStart] = useState("")
const [sharedRangeEnd, setSharedRangeEnd] = useState("")

const setSharedCustomRange = useCallback((start: string, end: string) => {
  setSharedPeriod("custom")
  setSharedRangeStart(start)
  setSharedRangeEnd(end)
}, [])

// Compare input visibility
const [showCompareInput, setShowCompareInput] = useState(false)
```

- [ ] **Step 3: Wire both `useChannel` instances with shared filters**

Replace the existing `useChannel` call with two instances that receive external overrides when comparing:

```tsx
const isComparing = !!vsParam

const primary = useChannel(
  decodedHandle,
  isComparing
    ? {
        externalSort: sharedSort,
        externalPeriod: sharedPeriod,
        externalRangeStart: sharedRangeStart || undefined,
        externalRangeEnd: sharedRangeEnd || undefined,
      }
    : undefined
)

const comparison = useChannel(
  isComparing ? vsParam : undefined,
  isComparing
    ? {
        externalSort: sharedSort,
        externalPeriod: sharedPeriod,
        externalRangeStart: sharedRangeStart || undefined,
        externalRangeEnd: sharedRangeEnd || undefined,
      }
    : undefined
)
```

Replace all the destructured `primary` references. The old destructured variables (`channel`, `videos`, etc.) become `primary.channel`, `primary.videos`, etc. throughout the JSX.

- [ ] **Step 4: Sync lifted filter state from primary hook when not comparing**

When the user is NOT comparing, the primary hook manages its own filter state. When comparing starts (vsParam appears), we need to initialize shared state from the primary hook's current values. Add after the hook calls:

```tsx
// Initialize shared filters from primary when entering compare mode
useEffect(() => {
  if (isComparing && !sharedRangeStart) {
    setSharedSort(primary.sort)
    setSharedPeriod(primary.period)
    setSharedRangeStart(primary.rangeStart)
    setSharedRangeEnd(primary.rangeEnd)
  }
}, [isComparing])
```

- [ ] **Step 5: Add comparison navigation handlers**

After the filter state setup:

```tsx
const handleCompareSubmit = useCallback(
  async (input: string) => {
    const parsed = parseChannelInput(input)
    if (!parsed) return

    let handle: string
    if (parsed.type === "handle") {
      handle = parsed.value.replace(/^@/, "")
    } else {
      // Channel ID — resolve to handle via API
      try {
        const res = await fetch(`/api/channel?handle=${encodeURIComponent(input)}`)
        if (res.ok) {
          const data = await res.json()
          handle = data.channel?.handle?.replace(/^@/, "") || parsed.value
        } else {
          handle = parsed.value
        }
      } catch {
        handle = parsed.value
      }
    }

    setShowCompareInput(false)
    router.push(`/channel/${decodedHandle}?vs=${handle}`)
  },
  [router, decodedHandle]
)

const handleRemoveComparison = useCallback(() => {
  router.push(`/channel/${decodedHandle}`)
}, [router, decodedHandle])
```

- [ ] **Step 6: Update the JSX to render comparison UI**

Replace the existing JSX return with the full updated version. Key changes:
- Add Compare button + input next to ChannelCard
- Render CompareStatCards, CompareCharts, CompareAggregates when comparing
- Use `primary.*` instead of bare variable names
- FilterBar uses shared state when comparing, primary state otherwise

```tsx
return (
  <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
    <div className="space-y-6 pt-6">
      {primary.isLoading && !primary.channel && <LoadingState />}

      {primary.error && <ErrorState message={primary.error} onRetry={primary.retry} />}

      {primary.channel && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <ChannelCard channel={primary.channel} />
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:pt-2">
              {isComparing ? (
                <Button variant="outline" size="sm" onClick={handleRemoveComparison}>
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              ) : showCompareInput ? (
                <div className="flex items-center gap-2">
                  <ChannelInput onSubmit={handleCompareSubmit} compact />
                  <Button variant="ghost" size="sm" onClick={() => setShowCompareInput(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowCompareInput(true)}>
                  <GitCompareArrows className="h-4 w-4 mr-1" />
                  Compare
                </Button>
              )}
            </div>
          </div>

          {/* Comparison section */}
          {isComparing && (
            <>
              {comparison.isLoading && !comparison.channel && (
                <div className="space-y-4">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
              )}

              {comparison.error && (
                <ErrorState message={comparison.error} onRetry={comparison.retry} />
              )}

              {comparison.channel && (
                <div className="space-y-6">
                  <CompareStatCards
                    primary={primary.channel}
                    comparison={comparison.channel}
                  />

                  {primary.videos.length > 0 && comparison.videos.length > 0 && (
                    <CompareCharts
                      primaryVideos={primary.videos}
                      comparisonVideos={comparison.videos}
                      primaryName={primary.channel.title}
                      comparisonName={comparison.channel.title}
                    />
                  )}

                  {(primary.rangeVideos.length > 0 || comparison.rangeVideos.length > 0) && (
                    <CompareAggregates
                      primaryVideos={primary.videos}
                      comparisonVideos={comparison.videos}
                      primaryRangeVideos={primary.rangeVideos}
                      comparisonRangeVideos={comparison.rangeVideos}
                      primaryName={primary.channel.title}
                      comparisonName={comparison.channel.title}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {primary.videos.length > 0 && <ChartsRow videos={primary.videos} />}

          <FilterBar
            sort={isComparing ? sharedSort : primary.sort}
            period={isComparing ? sharedPeriod : primary.period}
            rangeStart={isComparing ? sharedRangeStart : primary.rangeStart}
            rangeEnd={isComparing ? sharedRangeEnd : primary.rangeEnd}
            videoType={videoType}
            searchQuery={searchQuery}
            onSortChange={isComparing ? setSharedSort : primary.setSort}
            onPeriodChange={isComparing ? setSharedPeriod : primary.setPeriod}
            onCustomRangeChange={isComparing ? setSharedCustomRange : primary.setCustomRange}
            onVideoTypeChange={setVideoType}
            onSearchChange={setSearchQuery}
          />

          {primary.rangeVideos.length > 0 && (() => {
            const hasEstimated = primary.rangeVideos.some((v) => v.dataSource === "estimated")
            const hasVelocity = primary.rangeVideos.some((v) => v.dataSource === "velocity")
            const allTracked = primary.rangeVideos.every((v) => v.dataSource === "tracked")

            let text = ""
            let tooltipText = ""

            if (allTracked && primary.trackedSince) {
              text = `Tracking since ${new Date(primary.trackedSince).toLocaleDateString()}`
              tooltipText = "View counts are based on exact snapshots recorded over the selected date range."
            } else if (hasVelocity) {
              text = "Based on live view velocity \u2014 accuracy improves over time."
              tooltipText = "We measured how fast each video is gaining views right now and projected that rate across the selected range. The longer we track, the more accurate it gets."
            } else if (hasEstimated) {
              text = "Estimating views \u2014 accuracy improves in ~10 min."
              tooltipText = "YouTube doesn\u2019t share how many views a video got in a specific time period. We\u2019re estimating based on each video\u2019s age and total views. In about 10 minutes, we\u2019ll take a second reading and use real view velocity instead."
            }

            if (!text) return null

            return (
              <TooltipProvider>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {text}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
              </TooltipProvider>
            )
          })()}

          <VideoGrid
            videos={filteredVideos}
            rangeVideos={filteredRangeVideos}
            sortByRange={(isComparing ? sharedSort : primary.sort) === "viewsInRange"}
          />

          {primary.nextPageToken && !searchQuery && (isComparing ? sharedSort : primary.sort) !== "viewsInRange" && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={primary.fetchMoreVideos}
                disabled={primary.isLoading}
              >
                {primary.isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  </main>
)
```

- [ ] **Step 7: Update the filtered video memos to use `primary.*`**

Update the `filteredVideos` and `filteredRangeVideos` memos to reference `primary.videos` and `primary.rangeVideos`:

```tsx
const filteredVideos = useMemo(() => {
  let result = primary.videos
  if (videoType !== "all") {
    result = result.filter((v) => v.videoType === videoType)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    result = result.filter((v) => v.title.toLowerCase().includes(q))
  }
  return result
}, [primary.videos, searchQuery, videoType])

const filteredRangeVideos = useMemo(() => {
  let result = primary.rangeVideos
  if (videoType !== "all") {
    result = result.filter((v) => v.videoType === videoType)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    result = result.filter((v) => v.title.toLowerCase().includes(q))
  }
  return result
}, [primary.rangeVideos, searchQuery, videoType])
```

- [ ] **Step 8: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/channel/\[handle\]/page.tsx
git commit -m "feat: wire channel comparison into detail page with vs query param"
```

---

### Task 6: Manual Verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test single-channel mode (no regression)**

Navigate to `http://localhost:3000/channel/MrBeast`
Expected: Page loads as before — ChannelCard, charts, filter bar, video grid. New "Compare" button visible next to ChannelCard.

- [ ] **Step 3: Test compare button flow**

1. Click "Compare" button
2. Expected: Compact ChannelInput appears with X dismiss button
3. Type a second channel (e.g., `@PewDiePie`) and submit
4. Expected: URL updates to `/channel/MrBeast?vs=PewDiePie`
5. Expected: Comparison section appears — stat cards side-by-side, overlaid charts, aggregate row
6. Expected: Winner metrics highlighted in green

- [ ] **Step 4: Test shared filters**

1. Change the period dropdown to "Last 7 days"
2. Expected: Both channels' data updates (aggregate stats change, charts may update)

- [ ] **Step 5: Test dismissing comparison**

1. Click "Remove" button next to ChannelCard
2. Expected: URL reverts to `/channel/MrBeast`, comparison section disappears

- [ ] **Step 6: Test shareable URL**

1. Navigate directly to `http://localhost:3000/channel/MrBeast?vs=PewDiePie`
2. Expected: Both channels load, comparison section renders on mount

- [ ] **Step 7: Test error state**

1. Navigate to `/channel/MrBeast?vs=InvalidChannel123`
2. Expected: Primary channel loads fine, comparison shows inline error with retry

- [ ] **Step 8: Test mobile responsiveness**

1. Resize browser to mobile width (~375px)
2. Expected: Stat cards stack vertically, charts stack vertically, aggregates stack vertically

- [ ] **Step 9: Final build check**

Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 10: Commit any fixes**

If any issues were found during testing, fix and commit:
```bash
git add -A
git commit -m "fix: address comparison feature issues found during manual testing"
```
