"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { ChannelInput } from "@/components/channel-input"
import { parseChannelInput } from "@/lib/parse-channel-input"

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"
  const showSearch = !isHomePage

  const handleSearch = useCallback(
    async (input: string) => {
      const parsed = parseChannelInput(input)
      if (!parsed) return

      if (parsed.type === "handle") {
        const clean = parsed.value.replace(/^@/, "")
        router.push(`/channel/${clean}`)
      } else {
        // Channel ID — resolve via API then navigate
        try {
          const res = await fetch(`/api/channel?handle=${encodeURIComponent(input)}`)
          if (res.ok) {
            const data = await res.json()
            const handle = data.channel?.handle?.replace(/^@/, "")
            if (handle) {
              router.push(`/channel/${handle}`)
              return
            }
          }
        } catch {}
        router.push(`/channel/${parsed.value}`)
      }
    },
    [router]
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold tracking-tight">VidMetrics</span>
            <span className="hidden text-sm text-muted-foreground sm:inline-block">
              Competitor Analysis
            </span>
          </Link>
        </div>
        {showSearch && (
          <div className="flex-1 max-w-md">
            <ChannelInput onSubmit={handleSearch} compact />
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            How It Works
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
