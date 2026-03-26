"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react"
import { Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { HeroCarousel } from "@/components/hero-carousel"
import { parseChannelInput } from "@/lib/parse-channel-input"
import { formatNumber } from "@/lib/format"

type SearchResult = {
  id: string
  title: string
  handle: string
  thumbnailUrl: string
  subscriberCount: number
}

interface ChannelInputProps {
  onSubmit: (input: string) => void
  isLoading?: boolean
  compact?: boolean
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim()
  return (
    trimmed.startsWith("http") ||
    trimmed.startsWith("youtube.com") ||
    trimmed.startsWith("www.youtube.com") ||
    trimmed.includes("youtube.com/") ||
    trimmed.startsWith("@") ||
    (trimmed.startsWith("UC") && trimmed.length >= 24)
  )
}

function ChannelAvatar({
  title,
  thumbnailUrl,
  size = 32,
}: {
  title: string
  thumbnailUrl: string
  size?: number
}) {
  const [imgError, setImgError] = useState(false)

  if (thumbnailUrl && !imgError) {
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }

  const initial = title.charAt(0).toUpperCase() || "?"
  return (
    <div
      className="rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  )
}

function SearchDropdown({
  results,
  isSearching,
  query,
  onSelect,
  activeIndex,
}: {
  results: SearchResult[]
  isSearching: boolean
  query: string
  onSelect: (result: SearchResult) => void
  activeIndex: number
}) {
  if (!query.trim() || isLikelyUrl(query)) return null
  if (!isSearching && results.length === 0 && query.trim().length >= 2)
    return (
      <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
        No channels found
      </div>
    )

  if (!isSearching && results.length === 0) return null

  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
      {isSearching && results.length === 0 ? (
        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching channels...
        </div>
      ) : (
        <ul role="listbox">
          {results.map((result, index) => (
            <li
              key={result.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(result)
              }}
            >
              <ChannelAvatar
                title={result.title}
                thumbnailUrl={result.thumbnailUrl}
                size={36}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate text-sm">
                  {result.title}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {result.handle && <span>{result.handle}</span>}
                  {result.handle && result.subscriberCount > 0 && (
                    <span> &middot; </span>
                  )}
                  {result.subscriberCount > 0 && (
                    <span>
                      {formatNumber(result.subscriberCount)} subscribers
                    </span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {isSearching && results.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border-t">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </div>
      )}
    </div>
  )
}

export function ChannelInput({
  onSubmit,
  isLoading,
  compact,
}: ChannelInputProps) {
  const [value, setValue] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedValue = useDebounce(value, 300)

  // Fetch search results when debounced value changes
  useEffect(() => {
    const query = debouncedValue.trim()

    if (query.length < 2 || isLikelyUrl(debouncedValue)) {
      setResults([])
      setIsSearching(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsSearching(true)

    fetch(`/api/channel/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data.results || [])
          setIsSearching(false)
          setShowDropdown(true)
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setIsSearching(false)
      })

    return () => controller.abort()
  }, [debouncedValue])

  // Show searching state immediately when typing (before debounce fires)
  useEffect(() => {
    const query = value.trim()
    if (query.length >= 2 && !isLikelyUrl(value)) {
      setIsSearching(true)
      setShowDropdown(true)
    }
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setValue(result.handle || result.title)
      setShowDropdown(false)
      setResults([])
      onSubmit(result.handle || result.id)
    },
    [onSubmit]
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setShowDropdown(false)

    const parsed = parseChannelInput(value)
    if (!parsed) {
      toast.error("Please enter a valid YouTube channel URL or @handle")
      return
    }

    onSubmit(value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      )
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === "Escape") {
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  function handleChange(newValue: string) {
    setValue(newValue)
    setActiveIndex(-1)
    if (!newValue.trim()) {
      setResults([])
      setShowDropdown(false)
      setIsSearching(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div ref={containerRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0 || (value.trim().length >= 2 && !isLikelyUrl(value)))
                setShowDropdown(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search channel or paste URL"
            className="pl-9 border-transparent bg-muted/50 focus-visible:bg-muted"
            disabled={isLoading}
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
          />
          {showDropdown && (
            <SearchDropdown
              results={results}
              isSearching={isSearching}
              query={value}
              onSelect={handleSelect}
              activeIndex={activeIndex}
            />
          )}
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </form>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center pt-16 pb-8 px-4">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Analyze any YouTube channel
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-lg text-center">
        Paste a competitor&apos;s channel URL to see which videos are crushing
        it. Get instant insights on views, engagement, and trends.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
      >
        <div ref={containerRef} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0 || (value.trim().length >= 2 && !isLikelyUrl(value)))
                setShowDropdown(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search a YouTube channel or paste URL"
            className="h-12 pl-10 text-base"
            disabled={isLoading}
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
          />
          {showDropdown && (
            <SearchDropdown
              results={results}
              isSearching={isSearching}
              query={value}
              onSelect={handleSelect}
              activeIndex={activeIndex}
            />
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 px-8"
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze Channel"}
        </Button>
      </form>

      <HeroCarousel onSelect={onSubmit} />
    </div>
  )
}
