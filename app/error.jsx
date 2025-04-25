"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Error({ error, reset }) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  // Handle the case where reset might not be a function
  const handleReset = () => {
    if (typeof reset === "function") {
      reset()
    } else {
      // Fallback: reload the current page
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{error?.message || "An unexpected error occurred"}</p>
      <div className="flex gap-4">
        <Button onClick={handleReset}>Try again</Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go back home
        </Button>
      </div>
    </div>
  )
}
