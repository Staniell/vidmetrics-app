"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  from: Date | undefined
  to: Date | undefined
  onApply: (range: { from: Date; to: Date }) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function DateRangePicker({
  from,
  to,
  onApply,
  open,
  onOpenChange,
  children,
}: DateRangePickerProps) {
  const [pending, setPending] = useState<DateRange | undefined>(
    from && to ? { from, to } : undefined
  )

  // Reset pending selection when the popover opens
  useEffect(() => {
    if (open) {
      setPending(from && to ? { from, to } : undefined)
    }
  }, [open, from, to])

  function handleSelect(range: DateRange | undefined) {
    setPending(range)
  }

  function handleApply() {
    if (pending?.from && pending?.to) {
      onApply({ from: pending.from, to: pending.to })
    }
  }

  const canApply = !!pending?.from && !!pending?.to

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
        <div className="p-3">
          <div className="hidden sm:block">
            <Calendar
              mode="range"
              selected={pending}
              onSelect={handleSelect}
              numberOfMonths={2}
              defaultMonth={
                pending?.from ??
                new Date(new Date().getFullYear(), new Date().getMonth() - 1)
              }
            />
          </div>
          <div className="block sm:hidden">
            <Calendar
              mode="range"
              selected={pending}
              onSelect={handleSelect}
              numberOfMonths={1}
            />
          </div>
          <div className="flex items-center justify-between border-t px-3 pt-3">
            <p className="text-sm text-muted-foreground">
              {pending?.from && pending?.to
                ? `${format(pending.from, "MMM d, yyyy")} - ${format(pending.to, "MMM d, yyyy")}`
                : "Select a date range"}
            </p>
            <Button size="sm" disabled={!canApply} onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
