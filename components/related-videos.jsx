"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast.ts"
import ApiErrorFallback from "@/components/api-error-fallback"

export default function RelatedVideos({ videoId }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [videoDetails, setVideoDetails] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const response = await fetch(
          `/api/youtube?endpoint=videos&part=snippet,contentDetails,statistics&id=${videoId}`,
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error: ${response.status}`)
        }

        const data = await response.json()
        if (data.items && data.items.length > 0) {
          setVideoDetails(data.items[0])
          return data.items[0]
        }
        return null
      } catch (error) {
        console.error("Error fetching video details:", error)
        setError(`Failed to load video details: ${error.message}`)
        return null
      }
    }

    const fetchRelatedVideos = async (details) => {
      try {
        setLoading(true)

        // Skip the relatedToVideoId approach since it's causing 404 errors
        // Instead, use a combination of channel videos and search by title/tags

        if (details && details.snippet) {
          const channelVideos = await fetchChannelVideos(details.snippet.channelId)
          let tagVideos = []
          let titleVideos = []

          // Try to get videos with similar tags
          if (details.snippet.tags && details.snippet.tags.length > 0) {
            // Get a random tag from the video
            const randomTag = details.snippet.tags[Math.floor(Math.random() * details.snippet.tags.length)]
            tagVideos = await fetchVideosByKeyword(randomTag)
          }

          // Try to get videos with similar title keywords
          if (details.snippet.title) {
            // Extract meaningful keywords from the title
            const titleWords = details.snippet.title
              .split(" ")
              .filter((word) => word.length > 4) // Only use words longer than 4 characters
              .filter((word) => !["official", "video", "music", "lyrics", "audio"].includes(word.toLowerCase()))

            if (titleWords.length > 0) {
              const randomWord = titleWords[Math.floor(Math.random() * titleWords.length)]
              titleVideos = await fetchVideosByKeyword(randomWord)
            }
          }

          // Combine all videos
          const allVideos = [...channelVideos, ...tagVideos, ...titleVideos].filter(
            (item) => item.id.videoId !== videoId,
          )

          // Remove duplicates
          const uniqueVideos = Array.from(new Map(allVideos.map((item) => [item.id.videoId, item])).values())

          // Fetch video statistics for each related video
          if (uniqueVideos.length > 0) {
            const videoIds = uniqueVideos.map((item) => item.id.videoId).join(",")
            try {
              const statsResponse = await fetch(`/api/youtube?endpoint=videos&part=statistics&id=${videoIds}`)

              if (!statsResponse.ok) {
                throw new Error(`Video stats request failed: ${statsResponse.status}`)
              }

              const statsData = await statsResponse.json()

              // Merge statistics with video data
              const videosWithStats = uniqueVideos.map((item) => {
                const stats = statsData.items?.find((statItem) => statItem.id === item.id.videoId)
                return {
                  ...item,
                  statistics: stats?.statistics || {},
                }
              })

              setVideos(videosWithStats)
            } catch (statsError) {
              console.error("Error fetching video statistics:", statsError)
              // Continue with videos without stats
              setVideos(uniqueVideos)
            }
          } else {
            // If we still don't have videos, fetch popular videos as a fallback
            await fetchPopularVideos()
          }
        } else {
          // If we don't have video details, fetch popular videos
          await fetchPopularVideos()
        }
      } catch (error) {
        console.error("Error fetching related videos:", error)
        setError(`Failed to load related videos: ${error.message}`)

        // Try popular videos as a last resort
        await fetchPopularVideos()
      } finally {
        setLoading(false)
      }
    }

    const fetchChannelVideos = async (channelId) => {
      if (!channelId) return []

      try {
        const response = await fetch(
          `/api/youtube?endpoint=search&part=snippet&channelId=${channelId}&type=video&maxResults=10&order=date`,
        )

        if (!response.ok) {
          throw new Error(`Channel videos request failed: ${response.status}`)
        }

        const data = await response.json()
        return data.items || []
      } catch (error) {
        console.error("Error fetching channel videos:", error)
        return []
      }
    }

    const fetchVideosByKeyword = async (keyword) => {
      if (!keyword) return []

      try {
        const response = await fetch(
          `/api/youtube?endpoint=search&part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=10`,
        )

        if (!response.ok) {
          throw new Error(`Keyword search request failed: ${response.status}`)
        }

        const data = await response.json()
        return data.items || []
      } catch (error) {
        console.error(`Error fetching videos for keyword "${keyword}":`, error)
        return []
      }
    }

    const fetchPopularVideos = async () => {
      try {
        const response = await fetch(
          `/api/youtube?endpoint=videos&part=snippet,statistics&chart=mostPopular&maxResults=15&regionCode=US`,
        )

        if (!response.ok) {
          throw new Error(`Popular videos request failed: ${response.status}`)
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          // Convert the format to match search results
          const formattedVideos = data.items.map((item) => ({
            ...item,
            id: { videoId: item.id },
          }))

          setVideos(formattedVideos)
        } else {
          setVideos([])
        }
      } catch (error) {
        console.error("Error fetching popular videos:", error)
        setVideos([])
      }
    }

    if (videoId) {
      fetchVideoDetails().then((details) => {
        fetchRelatedVideos(details)

        // Save to watch history for personalization
        if (details) {
          try {
            const watchHistory = JSON.parse(localStorage.getItem("watchHistory") || "[]")
            // Add to beginning of array, limit to 20 items
            const updatedHistory = [details, ...watchHistory.filter((v) => v.id !== details.id)].slice(0, 20)
            localStorage.setItem("watchHistory", JSON.stringify(updatedHistory))
          } catch (e) {
            console.error("Error updating watch history:", e)
          }
        }
      })
    }
  }, [videoId])

  const handleVideoClick = (videoId) => {
    router.push(`/watch?v=${videoId}`)
  }

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Related Videos</h3>
      {error ? (
        <ApiErrorFallback message={error} isQuotaError={error.includes("quota")} />
      ) : (
        <div className="space-y-3">
          {loading ? (
            Array(8)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Skeleton className="h-24 w-40 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
          ) : videos.length > 0 ? (
            videos.map((video) => (
              <div
                key={video.id.videoId}
                className="flex gap-2 cursor-pointer"
                onClick={() => handleVideoClick(video.id.videoId)}
              >
                <div className="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden">
                  <img
                    src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url}
                    alt={video.snippet.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm line-clamp-2">{video.snippet.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.snippet.channelTitle}</p>
                  <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatNumber(video.statistics?.viewCount || 0)} views</span>
                    <span className="mx-1">•</span>
                    <span>
                      {formatDistanceToNow(new Date(video.snippet.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No related videos found</div>
          )}
        </div>
      )}
    </div>
  )
}
