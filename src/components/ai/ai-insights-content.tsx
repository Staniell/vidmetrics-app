"use client"

import { RefreshCw, Sparkles, TrendingUp, LayoutGrid, Lightbulb, Swords, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { CondensedChannelContext, AiInsights, AiComparisonInsights, AiRecommendation } from "@/types"

interface AiInsightsContentProps {
  insights: AiInsights | AiComparisonInsights | null
  channelData: CondensedChannelContext | null
  comparisonData: CondensedChannelContext | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
}

const categoryIcons: Record<string, React.ReactNode> = {
  titles: <Sparkles className="h-4 w-4" />,
  "upload-schedule": <TrendingUp className="h-4 w-4" />,
  "content-mix": <LayoutGrid className="h-4 w-4" />,
  engagement: <Lightbulb className="h-4 w-4" />,
  growth: <TrendingUp className="h-4 w-4" />,
  competitive: <Swords className="h-4 w-4" />,
}

function healthScoreColor(score: number): string {
  if (score > 70) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
  if (score > 40) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
  return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
}

function RecommendationCard({ rec }: { rec: AiRecommendation }) {
  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{categoryIcons[rec.category]}</span>
        <span className="text-sm font-medium flex-1">{rec.title}</span>
        <Badge variant="outline" className={cn("text-[10px] capitalize", priorityColors[rec.priority])}>
          {rec.priority}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{rec.description}</p>
    </div>
  )
}

export function InsightsSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function AiInsightsContent({
  insights,
  channelData,
  comparisonData,
  isLoading,
  error,
  onRefresh,
}: AiInsightsContentProps) {
  const isComparison = !!comparisonData
  const comparisonInsights = insights as AiComparisonInsights | null

  if (isLoading && !insights) return <InsightsSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-muted-foreground">Click refresh to load insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Health score + summary */}
      <div className="flex items-start gap-3">
        <Badge variant="outline" className={cn("text-lg font-bold px-3 py-1 shrink-0", healthScoreColor(insights.healthScore))}>
          {insights.healthScore}
        </Badge>
        <p className="text-sm text-muted-foreground">{insights.healthSummary}</p>
      </div>

      {/* Comparison winner banner */}
      {isComparison && comparisonInsights?.winner && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">
            Overall edge: <span className="text-primary">{comparisonInsights.winner}</span>
          </span>
        </div>
      )}

      {/* Head-to-head (comparison only) */}
      {isComparison && comparisonInsights?.headToHead && channelData && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Head to Head</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Metric</th>
                  <th className="px-3 py-2 text-right font-medium">{channelData.title}</th>
                  <th className="px-3 py-2 text-right font-medium">{comparisonData!.title}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonInsights.headToHead.map((h, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{h.metric}</td>
                    <td className={cn("px-3 py-2 text-right", h.winner === channelData.channelId && "font-semibold text-primary")}>
                      {h.channel1Value}
                    </td>
                    <td className={cn("px-3 py-2 text-right", h.winner === comparisonData!.channelId && "font-semibold text-primary")}>
                      {h.channel2Value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advantages (comparison only) */}
      {isComparison && comparisonInsights?.channel1Advantages && channelData && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{channelData.title} strengths</p>
            <ul className="space-y-1">
              {comparisonInsights.channel1Advantages.map((a, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">+</span> {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{comparisonData!.title} strengths</p>
            <ul className="space-y-1">
              {comparisonInsights.channel2Advantages.map((a, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">+</span> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Growth & strategy (solo) */}
      {!isComparison && (
        <>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Growth</p>
            <p className="text-sm">{insights.growthAnalysis}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content Strategy</p>
            <p className="text-sm">{insights.contentStrategy}</p>
          </div>
        </>
      )}

      {/* Comparison summary */}
      {isComparison && comparisonInsights?.comparisonSummary && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analysis</p>
          <p className="text-sm">{comparisonInsights.comparisonSummary}</p>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommendations</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {insights.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      </div>
    </div>
  )
}
