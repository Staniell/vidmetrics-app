"use client"

import { useRef } from "react"
import {
  Eye,
  TrendingUp,
  Zap,
  Clock,
  Database,
  BarChart3,
  Search,
  ArrowDown,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  Timer,
  Gauge,
  Target,
  Layers,
  Activity,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

// ─── Animated tier bar ───
function TierBar({
  label,
  badge,
  badgeClass,
  percent,
  color,
  delay,
  description,
}: {
  label: string
  badge: string
  badgeClass: string
  percent: number
  color: string
  delay: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="outline" className={badgeClass}>
            {badge}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{
            width: `${percent}%`,
            animationDelay: delay,
          }}
        />
      </div>
    </div>
  )
}

// ─── Section heading ───
function SectionHeading({
  icon: Icon,
  number,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  number: string
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-mono font-semibold tracking-widest text-muted-foreground uppercase mb-1">
          {number}
        </p>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

// ─── Flow step ───
function FlowStep({
  icon: Icon,
  title,
  description,
  accent,
  isLast,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  accent: string
  isLast?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!isLast && (
          <div className="mt-2 h-full w-px bg-border" />
        )}
      </div>
      <div className={`pb-8 ${isLast ? "" : ""}`}>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </div>
  )
}

// ─── Snapshot timeline visual ───
function SnapshotTimeline() {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute top-5 left-0 right-0 h-px bg-border" />

      <div className="relative flex justify-between">
        {/* Snapshot 1 */}
        <div className="flex flex-col items-center">
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-500/10">
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-[11px] font-mono text-muted-foreground">
            10:00 AM
          </p>
          <p className="text-xs font-semibold mt-1">500,000</p>
          <p className="text-[10px] text-muted-foreground">views</p>
        </div>

        {/* Gap indicator */}
        <div className="flex flex-col items-center pt-1">
          <div className="relative z-10 flex h-8 items-center gap-1 rounded-full border bg-card px-3">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-mono text-muted-foreground">
              15 min
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-green-500">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs font-semibold">+150 views</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            = 10 views/min
          </p>
        </div>

        {/* Snapshot 2 */}
        <div className="flex flex-col items-center">
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/10">
            <Database className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-3 text-[11px] font-mono text-muted-foreground">
            10:15 AM
          </p>
          <p className="text-xs font-semibold mt-1">500,150</p>
          <p className="text-[10px] text-muted-foreground">views</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───
export default function HowItWorksPage() {
  const topRef = useRef<HTMLDivElement>(null)

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    window.history.replaceState(null, "", `#${id}`)
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
      {/* Hero */}
      <div ref={topRef} className="pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs text-muted-foreground mb-6">
          <Activity className="h-3.5 w-3.5" />
          Technical Deep Dive
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          How VidMetrics Works
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          YouTube only gives lifetime view counts. VidMetrics captures snapshots
          over time to calculate how many views each video gained in any period.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="mb-16 rounded-xl border bg-card/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Contents
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { id: "problem", label: "The Core Problem" },
            { id: "three-tiers", label: "Three-Tier View Tracking" },
            { id: "badges", label: "Badges & Indicators" },
            { id: "engagement", label: "Engagement Rate" },
            { id: "resurgence", label: "Resurgence Detection" },
            { id: "sorting", label: "Sorting & Filtering" },
            { id: "data-flow", label: "Data Flow" },
            { id: "quota", label: "API Quota" },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => scrollTo(e, id)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-24">
        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1: The Core Problem */}
        {/* ═══════════════════════════════════════════ */}
        <section id="problem" className="scroll-mt-20">
          <SectionHeading
            icon={Eye}
            number="01"
            title="The Core Problem"
            subtitle="YouTube's API only returns lifetime totals, not period-specific data"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3">
                  What YouTube gives you
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                    <span className="text-sm">Video A</span>
                    <span className="font-mono text-sm font-semibold">
                      10,000,000 views
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                    <span className="text-sm">Video B</span>
                    <span className="font-mono text-sm font-semibold">
                      500,000 views
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Lifetime totals only. Video A looks like the winner.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-500 mb-3">
                  What VidMetrics reveals
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                    <span className="text-sm">Video A</span>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-mono text-sm font-semibold">
                        +45K this month
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2">
                    <span className="text-sm">Video B</span>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-mono text-sm font-semibold">
                        +120K this month
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Video B is actually winning right now.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 2: Three-Tier System */}
        {/* ═══════════════════════════════════════════ */}
        <section id="three-tiers" className="scroll-mt-20">
          <SectionHeading
            icon={Layers}
            number="02"
            title="Three-Tier View Tracking"
            subtitle="Accuracy improves automatically as more snapshots accumulate"
          />

          {/* Tier accuracy bars */}
          <div className="space-y-6 mb-10">
            <TierBar
              label="Tier 1: Estimated"
              badge="Est."
              badgeClass="text-[10px] px-1.5 py-0"
              percent={25}
              color="bg-orange-500"
              delay="0ms"
              description="0-1 snapshots"
            />
            <TierBar
              label="Tier 2: Velocity"
              badge="Live"
              badgeClass="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400"
              percent={65}
              color="bg-blue-500"
              delay="200ms"
              description="2 snapshots, 5+ min apart"
            />
            <TierBar
              label="Tier 3: Tracked"
              badge="Exact"
              badgeClass="text-[10px] px-1.5 py-0 border-green-300 text-green-600 dark:border-green-700 dark:text-green-400"
              percent={100}
              color="bg-green-500"
              delay="400ms"
              description="Snapshots span 80%+ of period"
            />
          </div>

          {/* Tier details */}
          <div className="space-y-6">
            {/* Estimated */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Estimated{" "}
                      <Badge
                        variant="outline"
                        className="ml-1 text-[10px] px-1.5 py-0"
                      >
                        Est.
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      First visit — rough guess from lifetime data
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
                  <p className="text-muted-foreground mb-2">
                    {"// Age-decay weighted estimation"}
                  </p>
                  <p>
                    <span className="text-blue-500">baseDaily</span> ={" "}
                    totalViews / daysSincePublished
                  </p>
                  <p>
                    <span className="text-amber-500">ageFactor</span> = min(1,
                    30 / daysSincePublished)
                    <span className="text-muted-foreground"> // floor: 0.05</span>
                  </p>
                  <p>
                    <span className="text-green-500">viewsInRange</span> ={" "}
                    <span className="text-blue-500">baseDaily</span> *{" "}
                    <span className="text-amber-500">ageFactor</span> *
                    daysInRange
                  </p>
                </div>

                {/* Age factor visual */}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">
                    Age Factor Decay Curve
                  </p>
                  <div className="flex items-end gap-[3px] h-20">
                    {[
                      100, 100, 100, 100, 100, 95, 85, 75, 60, 50, 42, 35, 30,
                      25, 22, 18, 15, 13, 11, 10, 9, 8, 7, 6, 5, 5, 5, 5, 5,
                      5,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-orange-500/60 transition-all hover:bg-orange-500"
                        style={{ height: `${h}%` }}
                        title={`${i === 0 ? "New" : i < 5 ? `${i * 7}d` : `${i * 14}d`}: ${h}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      New
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      30 days
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      1 year
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      5+ years
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Velocity */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Velocity{" "}
                      <Badge
                        variant="outline"
                        className="ml-1 text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400"
                      >
                        Live
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Real measured rate, projected across the period
                    </p>
                  </div>
                </div>

                {/* Snapshot timeline */}
                <div className="rounded-lg border bg-muted/30 p-5">
                  <SnapshotTimeline />
                </div>

                <div className="mt-4 rounded-lg border bg-muted/30 p-4 font-mono text-xs">
                  <p>
                    <span className="text-blue-500">velocity</span> = 150 views
                    / 15 min ={" "}
                    <span className="font-semibold">10 views/min</span>
                  </p>
                  <p className="mt-1">
                    <span className="text-muted-foreground">
                      {"// "}Period: Last 30 days = 43,200 min
                    </span>
                  </p>
                  <p>
                    <span className="text-green-500">viewsInRange</span> = 10 *
                    43,200 ={" "}
                    <span className="font-semibold">432,000 views</span>
                  </p>
                </div>

                {/* Auto-upgrade timeline */}
                <div className="mt-5 flex items-center gap-3 rounded-lg bg-blue-500/5 border border-blue-500/20 px-4 py-3">
                  <RefreshCw className="h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Auto-upgrade:
                    </span>{" "}
                    VidMetrics silently re-fetches after 10 minutes, capturing a
                    second snapshot. Est. upgrades to Live automatically — just
                    leave the page open.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tracked */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Tracked{" "}
                      <span className="ml-1 text-xs text-muted-foreground font-normal">
                        (no badge — this is the gold standard)
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Exact view count delta from snapshots spanning the period
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs">
                  <p className="text-muted-foreground mb-2">
                    {"// "}Period: Last 30 days
                  </p>
                  <p>
                    Snapshot from 28 days ago:{" "}
                    <span className="text-blue-500">1,200,000</span> views
                  </p>
                  <p>
                    Snapshot from today:{" "}
                    <span className="text-blue-500">1,650,000</span> views
                  </p>
                  <p className="mt-2">
                    Coverage: 28/30 days = 93%{" "}
                    <span className="text-green-500">(above 80% threshold)</span>
                  </p>
                  <p className="mt-1">
                    <span className="text-green-500">viewsInRange</span> =
                    1,650,000 - 1,200,000 ={" "}
                    <span className="font-semibold">450,000</span>{" "}
                    <span className="text-green-500">(exact)</span>
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-lg bg-green-500/5 border border-green-500/20 px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-green-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Daily cron job
                    </span>{" "}
                    runs at midnight UTC, snapshotting all tracked channels.
                    After a few days of tracking, most data reaches this tier.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 3: Badges */}
        {/* ═══════════════════════════════════════════ */}
        <section id="badges" className="scroll-mt-20">
          <SectionHeading
            icon={BarChart3}
            number="03"
            title="Badges & Indicators"
            subtitle="Visual signals that convey data quality and video performance at a glance"
          />

          {/* Data source badges */}
          <h3 className="text-sm font-semibold mb-4">Data Source Badges</h3>
          <div className="grid gap-3 sm:grid-cols-3 mb-10">
            <Card className="border-orange-500/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    +45K views
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    Est.
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Rough estimate from video age & total views
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    +120K views
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400"
                  >
                    Live
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Real velocity measured & projected
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    +450K views
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Exact tracked count (no badge needed)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement badges */}
          <h3 className="text-sm font-semibold mb-4">Engagement Rate Badges</h3>
          <div className="grid gap-3 sm:grid-cols-3 mb-10">
            <Card>
              <CardContent className="p-4 text-center">
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mb-2"
                >
                  8.2% engagement
                </Badge>
                <p className="text-[11px] text-muted-foreground">
                  Above 5% — High engagement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 mb-2"
                >
                  3.5% engagement
                </Badge>
                <p className="text-[11px] text-muted-foreground">
                  2-5% — Medium engagement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="secondary" className="text-xs mb-2">
                  1.2% engagement
                </Badge>
                <p className="text-[11px] text-muted-foreground">
                  Below 2% — Low engagement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Age badge */}
          <h3 className="text-sm font-semibold mb-4">
            Age vs. Performance Badge
          </h3>
          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Without range data
                  </p>
                  <p className="text-sm">Mar 15, 2021</p>
                </div>
                <div className="rounded-lg bg-muted/30 border-green-500/20 border p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-green-500 mb-2">
                    With range data
                  </p>
                  <p className="text-sm">
                    Published{" "}
                    <span className="font-semibold">5 years ago</span> ·{" "}
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      45K views this period
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The contrast is the insight — a 5-year-old video pulling 45K
                views this month signals evergreen content worth studying.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 4: Engagement */}
        {/* ═══════════════════════════════════════════ */}
        <section id="engagement" className="scroll-mt-20">
          <SectionHeading
            icon={ThumbsUp}
            number="04"
            title="Engagement Rate"
            subtitle="How we measure audience interaction relative to views"
          />

          <Card>
            <CardContent className="p-6">
              {/* Formula */}
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="flex items-center gap-3 text-lg">
                    <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="font-mono font-semibold">likes</span>
                    </div>
                    <span className="text-muted-foreground">+</span>
                    <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-4 py-2">
                      <MessageCircle className="h-4 w-4 text-purple-500" />
                      <span className="font-mono font-semibold">comments</span>
                    </div>
                  </div>
                  <div className="my-2 mx-auto h-px w-48 bg-border" />
                  <div className="flex items-center gap-2 justify-center rounded-lg bg-green-500/10 px-4 py-2 mx-auto w-fit">
                    <Eye className="h-4 w-4 text-green-500" />
                    <span className="font-mono font-semibold">views</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    x 100 = engagement %
                  </p>
                </div>
              </div>

              {/* Example */}
              <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs mt-2">
                <p className="text-muted-foreground mb-2">{"// "}Example</p>
                <p>
                  likes: <span className="text-blue-500">50,000</span> +
                  comments: <span className="text-purple-500">10,000</span> ={" "}
                  60,000
                </p>
                <p>
                  views: <span className="text-green-500">2,000,000</span>
                </p>
                <p className="mt-1">
                  engagement = 60,000 / 2,000,000 x 100 ={" "}
                  <span className="font-semibold text-foreground">3.0%</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 5: Resurgence */}
        {/* ═══════════════════════════════════════════ */}
        <section id="resurgence" className="scroll-mt-20">
          <SectionHeading
            icon={Zap}
            number="05"
            title="Resurgence Detection"
            subtitle='Identifies "rising from the dead" videos outperforming their historical average'
          />

          <Card className="border-amber-500/20">
            <CardContent className="p-6">
              {/* Visual example */}
              <div className="flex items-center gap-3 mb-6 rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                <Zap className="h-5 w-5 shrink-0 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  12x historical avg
                </span>
              </div>

              {/* How it's calculated */}
              <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs mb-5">
                <p className="text-muted-foreground mb-2">
                  {"// "}How the multiplier is calculated
                </p>
                <p>
                  <span className="text-blue-500">historicalDailyAvg</span> =
                  totalViews / daysSincePublished
                </p>
                <p>
                  <span className="text-green-500">currentDailyRate</span> =
                  viewsInRange / daysInRange
                </p>
                <p className="mt-2">
                  <span className="text-amber-500">multiplier</span> ={" "}
                  <span className="text-green-500">currentDailyRate</span> /{" "}
                  <span className="text-blue-500">historicalDailyAvg</span>
                </p>
              </div>

              {/* Example scenario */}
              <div className="rounded-xl border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  Example Scenario
                </p>
                <p className="text-sm font-semibold mb-1">
                  &quot;How to Fix a Leaky Faucet&quot;
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Published 4 years ago
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Historical Average
                    </p>
                    <p className="text-lg font-mono font-semibold">
                      1,370
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        views/day
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      2M views / 1,460 days
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-1">
                      Current Rate
                    </p>
                    <p className="text-lg font-mono font-semibold">
                      15,000
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        views/day
                      </span>
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      11x historical average
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  This video is experiencing a resurgence — possibly trending
                  from a viral TikTok or a seasonal topic spike. A strong signal
                  for competitor analysis.
                </p>
              </div>

              {/* Rules */}
              <div className="mt-5 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Threshold: 5x
                    </span>{" "}
                    — video must get 5x its lifetime daily average to trigger
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Only real data
                    </span>{" "}
                    — only shows for Live or Tracked tiers, never for Estimated
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      No false positives
                    </span>{" "}
                    — Estimated tier always produces a multiplier below 1.0 by
                    design
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 6: Sorting */}
        {/* ═══════════════════════════════════════════ */}
        <section id="sorting" className="scroll-mt-20">
          <SectionHeading
            icon={Search}
            number="06"
            title="Sorting & Filtering"
            subtitle="Multiple ways to slice the data for competitor analysis"
          />

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {/* Sort options */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Sort Options
                </p>
                <div className="space-y-2">
                  {[
                    {
                      label: "Most Views",
                      desc: "Lifetime total views",
                      color: "bg-blue-500",
                    },
                    {
                      label: "Views This Period",
                      desc: "Views gained in selected range",
                      color: "bg-green-500",
                    },
                    {
                      label: "Most Likes",
                      desc: "Total likes",
                      color: "bg-pink-500",
                    },
                    {
                      label: "Most Comments",
                      desc: "Total comments",
                      color: "bg-purple-500",
                    },
                    {
                      label: "Newest",
                      desc: "Publish date (recent first)",
                      color: "bg-cyan-500",
                    },
                    {
                      label: "Top Engagement",
                      desc: "Engagement rate %",
                      color: "bg-amber-500",
                    },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2"
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${opt.color}`}
                      />
                      <div>
                        <p className="text-xs font-semibold">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Period options */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Time Period
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Controls both which videos appear and the date range for
                  &ldquo;views this period&rdquo; calculations.
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Last 7 days", range: "Today - 7d → Today" },
                    { label: "Last 30 days", range: "Today - 30d → Today" },
                    { label: "Last 90 days", range: "Today - 90d → Today" },
                    {
                      label: "All time",
                      range: "2005 → Today",
                    },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                    >
                      <span className="text-xs font-semibold">{p.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {p.range}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-5 mb-3">
                  Plus a real-time <span className="font-semibold text-foreground">search filter</span> that
                  matches video titles instantly (client-side, no API calls).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 7: Data Flow */}
        {/* ═══════════════════════════════════════════ */}
        <section id="data-flow" className="scroll-mt-20">
          <SectionHeading
            icon={Layers}
            number="07"
            title="Data Flow"
            subtitle="From channel URL to rendered insights"
          />

          <Card>
            <CardContent className="p-6">
              <FlowStep
                icon={Search}
                title="User pastes a channel URL or handle"
                description="Accepts youtube.com URLs, @handles, channel IDs, or plain text search. The parser identifies the format and resolves it."
                accent="bg-blue-500/10 text-blue-500"
              />
              <FlowStep
                icon={Database}
                title="YouTube API fetches channel + video data"
                description="Server-side only — your API key never reaches the browser. Fetches channel info, video IDs (filtered by period), and full video details in batches of 50."
                accent="bg-red-500/10 text-red-500"
              />
              <FlowStep
                icon={Clock}
                title="Snapshots captured in background"
                description="Every API response triggers a fire-and-forget snapshot capture. View counts are stored in the database with timestamps. This never blocks the response."
                accent="bg-purple-500/10 text-purple-500"
              />
              <FlowStep
                icon={BarChart3}
                title="View deltas calculated (three-tier system)"
                description="For each video, the system picks the best available tier based on snapshot coverage: Estimated → Velocity → Tracked. Resurgence multipliers are computed here too."
                accent="bg-green-500/10 text-green-500"
              />
              <FlowStep
                icon={Eye}
                title="Results rendered with badges and indicators"
                description="Channel card, trending carousel (top 10), charts (views over time + top engagement), and the full video grid with all badges, metrics, and sort/filter controls."
                accent="bg-amber-500/10 text-amber-500"
              />
              <FlowStep
                icon={RefreshCw}
                title="Silent re-fetch after 10 minutes"
                description="A second snapshot is captured automatically, upgrading Estimated data to Velocity (Live) tier. No user action required. Over days, daily cron jobs push data to Tracked tier."
                accent="bg-cyan-500/10 text-cyan-500"
                isLast
              />
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 8: Quota */}
        {/* ═══════════════════════════════════════════ */}
        <section id="quota" className="scroll-mt-20">
          <SectionHeading
            icon={Gauge}
            number="08"
            title="YouTube API Quota"
            subtitle="Designed to stay well within YouTube's free tier of 10,000 units/day"
          />

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                {[
                  {
                    op: "search.list",
                    units: 100,
                    when: "Each channel lookup",
                    pct: 100,
                  },
                  {
                    op: "channels.list",
                    units: 1,
                    when: "Each channel lookup",
                    pct: 1,
                  },
                  {
                    op: "videos.list",
                    units: 1,
                    when: "Each channel lookup",
                    pct: 1,
                  },
                  {
                    op: "videos.list (cron)",
                    units: 1,
                    when: "Per 50 tracked videos/day",
                    pct: 1,
                  },
                ].map((row) => (
                  <div key={row.op}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold">
                          {row.op}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {row.units} {row.units === 1 ? "unit" : "units"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {row.when}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted/30 p-4">
                <div className="grid gap-4 sm:grid-cols-3 text-center">
                  <div>
                    <p className="text-2xl font-mono font-bold">~102</p>
                    <p className="text-[11px] text-muted-foreground">
                      units per lookup
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold">10,000</p>
                    <p className="text-[11px] text-muted-foreground">
                      daily budget
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-mono font-bold">~98</p>
                    <p className="text-[11px] text-muted-foreground">
                      lookups per day
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Back to top */}
      <div className="mt-16 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.preventDefault()
            topRef.current?.scrollIntoView({ behavior: "smooth" })
          }}
        >
          Back to top
        </a>
      </div>
    </main>
  )
}
