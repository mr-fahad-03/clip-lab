"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Header from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { formatNumber } from "@/lib/utils"
import ApiErrorFallback from "@/components/api-error-fallback"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return

      setLoading(true)
      try {
        const response = await fetch(
          `/api/youtube?endpoint=search&part=snippet&q=${encodeURIComponent(query)}&maxResults=25&type=video`,
        )

        if (!response.ok) {
          const errorData = await response.json()

          // Check specifically for quota exceeded error
          if (errorData.error && errorData.error.includes("quota")) {
            throw new Error("YouTube API quota exceeded. Please try again later.")
          } else {
            throw new Error(`Failed to fetch search results: ${errorData.error || response.status}`)
          }
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          // Fetch video statistics for each search result
          try {
            const videoIds = data.items.map((item) => item.id.videoId).join(",")
            const statsResponse = await fetch(
              `/api/youtube?endpoint=videos&part=statistics,contentDetails&id=${videoIds}`,
            )

            if (!statsResponse.ok) {
              console.warn("Could not fetch video statistics, continuing with basic results")
              setResults(data.items)
            } else {
              const statsData = await statsResponse.json()

              // Merge statistics with video data
              const videosWithStats = data.items.map((item) => {
                const stats = statsData.items?.find((statItem) => statItem.id === item.id.videoId)
                return {
                  ...item,
                  statistics: stats?.statistics || {},
                  contentDetails: stats?.contentDetails || {},
                }
              })

              setResults(videosWithStats)
            }
          } catch (statsError) {
            console.error("Error fetching video statistics:", statsError)
            // Continue with the search results even without stats
            setResults(data.items)
          }

          // Save search query to history
          try {
            const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")
            if (!searchHistory.includes(query)) {
              const updatedHistory = [query, ...searchHistory].slice(0, 20)
              localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))
            }
          } catch (e) {
            console.error("Error updating search history:", e)
          }
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Error fetching search results:", error)
        setError(error.message || "Failed to load search results")
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  const handleVideoClick = (videoId) => {
    router.push(`/watch?v=${videoId}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Search results for: {query}</h1>

        {error ? (
          <ApiErrorFallback message={error} isQuotaError={error.includes("quota")} />
        ) : (
          <div className="space-y-4">
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-48 sm:h-36 w-full sm:w-64 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                ))
            ) : results.length > 0 ? (
              results.map((video) => (
                <div
                  key={video.id.videoId}
                  className="flex flex-col sm:flex-row gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg"
                  onClick={() => handleVideoClick(video.id.videoId)}
                >
                  <div className="w-full sm:w-64 aspect-video sm:h-36 rounded-lg overflow-hidden">
                    <img
                      src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url}
                      alt={video.snippet.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-medium line-clamp-2">{video.snippet.title}</h2>
                    <div className="flex flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatNumber(video.statistics?.viewCount || 0)} views</span>
                      <span className="mx-1">•</span>
                      <span>
                        {formatDistanceToNow(new Date(video.snippet.publishedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
                      <span className="text-sm">{video.snippet.channelTitle}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 hidden sm:block">
                      {video.snippet.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No results found for "{query}"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
