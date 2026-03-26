"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-center text-muted-foreground">
        Something went wrong. Please try again.
      </p>
      <Button onClick={reset} variant="outline" className="mt-6">
        Try Again
      </Button>
    </div>
  )
}
