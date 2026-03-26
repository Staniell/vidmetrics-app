"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-center text-muted-foreground max-w-md">
        {message}
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-6">
        Try Again
      </Button>
    </div>
  )
}
