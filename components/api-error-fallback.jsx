"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ApiErrorFallback({ message, isQuotaError = false }) {
  const router = useRouter()

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 my-8">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">
          {isQuotaError ? "API Quota Exceeded" : "Service Temporarily Unavailable"}
        </h3>
        <div className="text-amber-700 dark:text-amber-300 mb-6 max-w-md">
          <p>{message || "We're having trouble connecting to YouTube right now."}</p>
          {isQuotaError && (
            <p className="mt-3">
              The YouTube API has a daily limit on requests which has been reached. Please try again later or browse our
              recommended videos on the home page.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => router.push("/")} variant="outline">
            Go to Home Page
          </Button>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    </div>
  )
}
