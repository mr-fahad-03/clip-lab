"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import VideoCard from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import ApiErrorFallback from "@/components/api-error-fallback"

export default function HomePage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageToken, setPageToken] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const router = useRouter()
  const observer = useRef()
  const [refreshKey, setRefreshKey] = useState(Date.now()) // Force refresh on reload
  const [error, setError] = useState(null)

  // Function to fetch videos with different parameters each time
  const fetchVideos = async (newFetch = true) => {
    try {
      if (newFetch) {
        setLoading(true)
        setError(null) // Clear any previous errors
      } else {
        setLoadingMore(true)
      }

      // Get user preferences from localStorage if available
      const watchHistory = JSON.parse(localStorage.getItem("watchHistory") || "[]")
      const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")

      // Determine which approach to use for content
      let endpoint = "videos"
      let params = `part=snippet,statistics&chart=mostPopular&maxResults=12&regionCode=US`

      // Add page token if loading more
      if (!newFetch && pageToken) {
        params += `&pageToken=${pageToken}`
      }

      // Personalization strategy
      if (newFetch) {
        // Use a different approach each time to ensure content variety
        const timestamp = new Date().getTime()
        const randomSeed = timestamp % 5 // Use timestamp to get a different approach on each reload

        if (randomSeed === 0 && watchHistory.length > 0) {
          // Approach 1: Use video category from watch history
          const randomVideo = watchHistory[Math.floor(Math.random() * watchHistory.length)]
          if (randomVideo && randomVideo.snippet && randomVideo.snippet.categoryId) {
            params = `part=snippet,statistics&chart=mostPopular&videoCategoryId=${randomVideo.snippet.categoryId}&maxResults=12&regionCode=US`
            console.log("Using watch history category:", randomVideo.snippet.categoryId)
          }
        } else if (randomSeed === 1 && searchHistory.length > 0) {
          // Approach 2: Use search history
          const randomSearch = searchHistory[Math.floor(Math.random() * searchHistory.length)]
          endpoint = "search"
          params = `part=snippet&q=${encodeURIComponent(randomSearch)}&type=video&maxResults=12`
          console.log("Using search history:", randomSearch)
        } else if (randomSeed === 2) {
          // Approach 3: Use a random category
          const categories = [1, 2, 10, 15, 17, 20, 22, 23, 24, 25, 26, 27, 28]
          const randomCategory = categories[Math.floor(Math.random() * categories.length)]
          params = `part=snippet,statistics&chart=mostPopular&videoCategoryId=${randomCategory}&maxResults=12&regionCode=US`
          console.log("Using random category:", randomCategory)
        } else if (randomSeed === 3 && watchHistory.length > 0) {
          // Approach 4: Use channel from watch history
          const randomVideo = watchHistory[Math.floor(Math.random() * watchHistory.length)]
          if (randomVideo && randomVideo.snippet && randomVideo.snippet.channelId) {
            endpoint = "search"
            params = `part=snippet&channelId=${randomVideo.snippet.channelId}&type=video&maxResults=12&order=date`
            console.log("Using channel from watch history:", randomVideo.snippet.channelId)
          }
        }
        // Approach 5: Default to most popular (already set)
      }

      // Add a timestamp parameter to prevent caching
      const timestamp = new Date().getTime()

      console.log(`Fetching videos with endpoint: ${endpoint}, params: ${params}`)
      const response = await fetch(`/api/youtube?endpoint=${endpoint}&${params}&_t=${timestamp}`)

      if (!response.ok) {
        const errorData = await response.json()

        // Check specifically for quota exceeded error
        if (errorData.error && errorData.error.includes("quota")) {
          throw new Error("YouTube API quota exceeded. Please try again later.")
        } else {
          throw new Error(`Failed to fetch videos: ${errorData.error || response.status}`)
        }
      }

      const data = await response.json()

      if (data.items && data.items.length > 0) {
        let processedVideos = data.items

        // If using search endpoint, we need to fetch video details to get statistics
        if (endpoint === "search") {
          try {
            const videoIds = data.items.map((item) => item.id.videoId).join(",")
            const detailsResponse = await fetch(
              `/api/youtube?endpoint=videos&part=snippet,statistics&id=${videoIds}&_t=${timestamp}`,
            )

            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json()

              if (detailsData.items && detailsData.items.length > 0) {
                // Map search results to video details
                processedVideos = data.items
                  .map((searchItem) => {
                    const videoDetails = detailsData.items.find((detailItem) => detailItem.id === searchItem.id.videoId)
                    return (
                      videoDetails || {
                        id: searchItem.id.videoId,
                        snippet: searchItem.snippet,
                        statistics: {},
                      }
                    )
                  })
                  .filter((item) => item !== null)
              }
            } else {
              console.warn("Could not fetch video details, continuing with search results only")
              // Format search results to match video format
              processedVideos = data.items.map((item) => ({
                id: item.id.videoId,
                snippet: item.snippet,
                statistics: {},
              }))
            }
          } catch (detailsError) {
            console.error("Error fetching video details:", detailsError)
            // Continue with search results only
            processedVideos = data.items.map((item) => ({
              id: item.id.videoId,
              snippet: item.snippet,
              statistics: {},
            }))
          }
        }

        if (newFetch) {
          setVideos(processedVideos)
        } else {
          setVideos((prev) => [...prev, ...processedVideos])
        }

        // Set the next page token if available
        setPageToken(data.nextPageToken || "")
        setHasMore(!!data.nextPageToken)
      } else {
        if (newFetch) {
          setVideos([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
      setError(error.message || "Failed to load videos")
      if (newFetch) {
        setVideos([]) // Clear videos on error for initial load
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load and reload on refreshKey change
  useEffect(() => {
    fetchVideos()
  }, [refreshKey])

  // Force refresh when the page is reloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This will run when the page is about to be reloaded
      localStorage.setItem("shouldRefresh", "true")
    }

    const checkForRefresh = () => {
      const shouldRefresh = localStorage.getItem("shouldRefresh")
      if (shouldRefresh === "true") {
        localStorage.removeItem("shouldRefresh")
        setRefreshKey(Date.now())
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("load", checkForRefresh)

    // Check if we need to refresh on mount
    checkForRefresh()

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("load", checkForRefresh)
    }
  }, [])

  // Set up intersection observer for infinite scrolling
  const lastVideoElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchVideos(false)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, loadingMore, hasMore],
  )

  const handleVideoClick = (videoId) => {
    router.push(`/watch?v=${videoId}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {!error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading
              ? Array(12)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="h-[180px] w-full rounded-lg" />
                      <div className="flex space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))
              : videos.map((video, index) => {
                  if (videos.length === index + 1) {
                    return (
                      <div ref={lastVideoElementRef} key={video.id}>
                        <VideoCard video={video} onClick={() => handleVideoClick(video.id)} />
                      </div>
                    )
                  } else {
                    return <VideoCard key={video.id} video={video} onClick={() => handleVideoClick(video.id)} />
                  }
                })}
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!hasMore && videos.length > 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">You've reached the end of the feed</p>
        )}
      </div>
      {error && <ApiErrorFallback message={error} isQuotaError={error.includes("quota")} />}
    </div>
  )
}
