"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, TrendingUp, Eye, Flame, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatNumber, formatDuration, formatRelativeAge } from "@/lib/format"
import type { VideoViewDelta } from "@/types"

const CARD_WIDTH = 300
const GAP = 16
const STEP = CARD_WIDTH + GAP

interface TrendingCarouselProps {
  videos: VideoViewDelta[]
}

export function TrendingCarousel({ videos }: TrendingCarouselProps) {
  const top = videos.slice(0, 10)
  const containerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [dragDelta, setDragDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  // Track container width on resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const trackWidth = top.length * CARD_WIDTH + (top.length - 1) * GAP
  const maxOffset = Math.max(0, trackWidth - containerWidth)
  const visibleCount = Math.max(1, Math.floor((containerWidth + GAP) / STEP))

  // Clamp index when container resizes
  const maxIndex = Math.max(0, top.length - visibleCount)
  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  const currentOffset = Math.min(index * STEP, maxOffset)
  const canScrollLeft = currentOffset > 0
  const canScrollRight = currentOffset < maxOffset

  const slide = useCallback(
    (dir: number) => {
      setIndex((prev) =>
        Math.max(0, Math.min(maxIndex, prev + dir * visibleCount))
      )
    },
    [maxIndex, visibleCount]
  )

  // --- Drag / swipe ---
  const startX = useRef(0)
  const startIndex = useRef(0)
  const hasDragged = useRef(false)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const velocityRef = useRef(0)
  const pointerType = useRef("")

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true)
      hasDragged.current = false
      startX.current = e.clientX
      lastX.current = e.clientX
      lastTime.current = Date.now()
      startIndex.current = index
      velocityRef.current = 0
      setDragDelta(0)
      pointerType.current = e.pointerType
      if (e.pointerType !== "touch") {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }
    },
    [index]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - startX.current
      if (Math.abs(dx) > 3) hasDragged.current = true

      const now = Date.now()
      const dt = now - lastTime.current
      if (dt > 0) {
        velocityRef.current = (e.clientX - lastX.current) / dt
      }
      lastX.current = e.clientX
      lastTime.current = now

      setDragDelta(dx)
    },
    [isDragging]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      setIsDragging(false)

      const dx = e.clientX - startX.current
      const momentum = velocityRef.current * 120
      const totalDx = -(dx + momentum)
      const cardsMoved = Math.round(totalDx / STEP)

      setIndex(
        Math.max(0, Math.min(maxIndex, startIndex.current + cardsMoved))
      )
      setDragDelta(0)

      if (pointerType.current !== "touch") {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      }
    },
    [isDragging, maxIndex]
  )

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const offset = -currentOffset + dragDelta

  if (top.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-sm font-semibold">Trending This Period</h3>
          <Badge variant="secondary" className="text-[10px]">
            Top {top.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => slide(-1)}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => slide(1)}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <div
          className="flex select-none cursor-grab active:cursor-grabbing"
          style={{
            gap: GAP,
            transform: `translateX(${offset}px)`,
            transition: isDragging
              ? "none"
              : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {top.map((video, i) => (
            <a
              key={video.videoId}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-shrink-0"
              style={{ width: CARD_WIDTH }}
              draggable={false}
            >
              <div className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {video.thumbnailUrl && (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover pointer-events-none"
                      sizes="300px"
                      draggable={false}
                    />
                  )}

                  {/* Rank badge */}
                  <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white backdrop-blur-sm">
                    {i + 1}
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(video.duration)}
                  </div>

                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Views in range overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs font-bold text-white">
                      +{formatNumber(video.viewsInRange)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="line-clamp-2 text-xs font-medium leading-snug group-hover:text-primary">
                    {video.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Published {formatRelativeAge(video.publishedAt)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {formatNumber(video.totalViews)} total
                    </span>
                    {video.dataSource !== "tracked" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {video.dataSource === "estimated" ? "Est." : "Live"}
                      </Badge>
                    )}
                    {video.dataSource !== "estimated" &&
                      video.resurgenceMultiplier >= 5 && (
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          <Zap className="h-3 w-3" />
                          {Math.round(video.resurgenceMultiplier)}x avg
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
