"use client"

import { useState, useRef } from "react"
import { parseISO } from "date-fns"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import { formatDateShort } from "@/lib/format"

interface FilterBarProps {
  sort: string
  period: string
  rangeStart?: string
  rangeEnd?: string
  videoType: string
  searchQuery: string
  onSortChange: (sort: string) => void
  onPeriodChange: (period: string) => void
  onCustomRangeChange?: (start: string, end: string) => void
  onVideoTypeChange: (type: string) => void
  onSearchChange: (query: string) => void
}

export function FilterBar({
  sort,
  period,
  rangeStart,
  rangeEnd,
  videoType,
  searchQuery,
  onSortChange,
  onPeriodChange,
  onCustomRangeChange,
  onVideoTypeChange,
  onSearchChange,
}: FilterBarProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customApplied, setCustomApplied] = useState(false)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const customFrom =
    period === "custom" && customApplied && rangeStart
      ? parseISO(rangeStart)
      : undefined
  const customTo =
    period === "custom" && customApplied && rangeEnd
      ? parseISO(rangeEnd)
      : undefined

  function handlePeriodChange(value: string) {
    if (value === "custom") {
      // Don't call onPeriodChange yet — wait for the user to pick dates and Apply
      // Delay opening so the Select dropdown fully closes first
      if (openTimerRef.current) clearTimeout(openTimerRef.current)
      openTimerRef.current = setTimeout(() => setCustomOpen(true), 100)
      return
    }
    setCustomApplied(false)
    onPeriodChange(value)
  }

  function handleApplyRange(range: { from: Date; to: Date }) {
    const start = range.from.toISOString().split("T")[0]
    const end = range.to.toISOString().split("T")[0]
    setCustomApplied(true)
    onCustomRangeChange?.(start, end)
    setCustomOpen(false)
  }

  const customLabel =
    period === "custom" && customApplied && rangeStart && rangeEnd
      ? `${formatDateShort(rangeStart)} - ${formatDateShort(rangeEnd)}`
      : "Custom"

  // Show "custom" as the Select value only after applying; otherwise keep the previous preset visible
  const selectValue = period === "custom" && !customApplied ? "custom" : period

  const sortField = sort.endsWith("_asc") ? sort.slice(0, -4) : sort
  const sortAsc = sort.endsWith("_asc")

  function handleSortFieldChange(field: string) {
    onSortChange(sortAsc ? `${field}_asc` : field)
  }

  function handleToggleDirection() {
    onSortChange(sortAsc ? sortField : `${sortField}_asc`)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-1">
        <Select value={sortField} onValueChange={handleSortFieldChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="viewsInRange">Views This Period</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
            <SelectItem value="comments">Comments</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={handleToggleDirection}
          title={sortAsc ? "Ascending (click for descending)" : "Descending (click for ascending)"}
        >
          {sortAsc ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownWideNarrow className="h-4 w-4" />}
        </Button>
      </div>

      <DateRangePicker
        from={customFrom}
        to={customTo}
        onApply={handleApplyRange}
        open={customOpen}
        onOpenChange={setCustomOpen}
      >
        <div>
          <Select value={selectValue} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
              <SelectSeparator />
              <SelectItem value="custom">{customLabel}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DateRangePicker>

      <Select value={videoType} onValueChange={onVideoTypeChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="video">Videos</SelectItem>
          <SelectItem value="short">Shorts</SelectItem>
          <SelectItem value="live">Lives</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search videos..."
          className="pl-9"
        />
      </div>
    </div>
  )
}
