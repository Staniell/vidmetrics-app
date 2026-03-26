"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterBarProps {
  sort: string
  period: string
  searchQuery: string
  onSortChange: (sort: string) => void
  onPeriodChange: (period: string) => void
  onSearchChange: (query: string) => void
}

export function FilterBar({
  sort,
  period,
  searchQuery,
  onSortChange,
  onPeriodChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="views">Most Views</SelectItem>
          <SelectItem value="viewsInRange">Views This Period</SelectItem>
          <SelectItem value="likes">Most Likes</SelectItem>
          <SelectItem value="comments">Most Comments</SelectItem>
          <SelectItem value="date">Newest</SelectItem>
          <SelectItem value="engagement">Top Engagement</SelectItem>
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
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
