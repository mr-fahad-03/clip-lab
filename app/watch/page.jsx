"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/header"
import VideoPlayer from "@/components/video-player"
import VideoInfo from "@/components/video-info"
import CommentSection from "@/components/comment-section"
import RelatedVideos from "@/components/related-videos"
import { Skeleton } from "@/components/ui/skeleton"
import ApiErrorFallback from "@/components/api-error-fallback"

export default function WatchPage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("v")
  const [videoDetails, setVideoDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Set up audio focus for background playback
  useEffect(() => {
    // Request audio focus to enable background audio playback
    const requestAudioFocus = async () => {
      try {
        // Create a silent audio context to keep audio focus
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        // Set gain to 0 (silent)
        gainNode.gain.value = 0

        // Connect nodes
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Start and immediately suspend (this keeps audio focus without playing sound)
        oscillator.start()
        await audioContext.suspend()

        return () => {
          oscillator.stop()
          audioContext.close()
        }
      } catch (e) {
        console.log("Error requesting audio focus:", e)
        return () => {}
      }
    }

    // Request audio focus
    let cleanup = () => {}
    requestAudioFocus().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    return cleanup
  }, [])

  useEffect(() => {
    // Update the Media Session API implementation to handle errors gracefully
    // Enable background audio playback with proper error handling
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && videoDetails) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: videoDetails.snippet.title,
          artist: videoDetails.snippet.channelTitle,
          album: "YouTube",
          artwork: [
            {
              src: videoDetails.snippet.thumbnails.high?.url || videoDetails.snippet.thumbnails.medium?.url || "",
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        })

        // Add media session action handlers
        navigator.mediaSession.setActionHandler("play", () => {
          // Handle play action
          console.log("Media session: play")
          document.dispatchEvent(new CustomEvent("media-play"))
        })

        navigator.mediaSession.setActionHandler("pause", () => {
          // Handle pause action
          console.log("Media session: pause")
          document.dispatchEvent(new CustomEvent("media-pause"))
        })

        // Set playback state
        navigator.mediaSession.playbackState = "playing"
      } catch (e) {
        console.log("Error setting up Media Session API:", e)
        // Don't show errors to users as this is an enhancement
      }
    }

    // Set document title to video title for better UX during background playback
    if (videoDetails) {
      document.title = `▶ ${videoDetails.snippet.title} - MyTube`
    }

    return () => {
      // Reset title when component unmounts
      document.title = "MyTube - YouTube Clone"
    }
  }, [videoDetails])

  // Keep the screen awake during video playback
  useEffect(() => {
    // Prevent screen from sleeping during video playback - with proper error handling
    let wakeLock = null

    const requestWakeLock = async () => {
      // Only try to use Wake Lock if it exists in the navigator
      if ("wakeLock" in navigator && navigator.wakeLock) {
        try {
          // Try to request a wake lock
          wakeLock = await navigator.wakeLock.request("screen")
          console.log("Wake Lock is active")
        } catch (err) {
          // Handle errors gracefully
          console.log(`Wake Lock error: ${err.name}, ${err.message}`)
          // Don't show errors to users as this is an enhancement, not core functionality
        }
      } else {
        console.log("Wake Lock API not supported in this browser")
      }
    }

    // Try to request wake lock, but don't worry if it fails
    try {
      requestWakeLock()
    } catch (e) {
      console.log("Could not request wake lock")
    }

    return () => {
      // Release wake lock if we have one when component unmounts
      if (wakeLock) {
        try {
          wakeLock.release().then(() => {
            console.log("Wake Lock released")
          })
        } catch (e) {
          console.log("Error releasing wake lock")
        }
      }
    }
  }, [videoId])

  const fetchVideoDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/youtube?endpoint=videos&part=snippet,statistics,contentDetails&id=${videoId}`)

      if (!response.ok) {
        const errorData = await response.json()

        // Check specifically for quota exceeded error
        if (errorData.error && errorData.error.includes("quota")) {
          throw new Error("YouTube API quota exceeded. Please try again later.")
        } else {
          throw new Error(`Failed to fetch video details: ${errorData.error || response.status}`)
        }
      }

      const data = await response.json()

      if (data.items && data.items.length > 0) {
        setVideoDetails(data.items[0])
      } else {
        throw new Error("Video not found")
      }
    } catch (error) {
      console.error("Error fetching video details:", error)
      setError(error.message || "Failed to load video")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!videoId) return

    fetchVideoDetails()
  }, [videoId])

  useEffect(() => {
    if (videoDetails) {
      // Save to watch history for personalization
      try {
        const watchHistory = JSON.parse(localStorage.getItem("watchHistory") || "[]")
        // Add to beginning of array, limit to 20 items
        const updatedHistory = [videoDetails, ...watchHistory.filter((v) => v.id !== videoDetails.id)].slice(0, 20)
        localStorage.setItem("watchHistory", JSON.stringify(updatedHistory))
      } catch (e) {
        console.error("Error updating watch history:", e)
      }
    }
  }, [videoDetails])

  if (!videoId) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold">Video not found</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <ApiErrorFallback message={error} isQuotaError={error.includes("quota")} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VideoPlayer videoId={videoId} />
            {loading ? (
              <div className="mt-4 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex justify-between">
                  <div className="flex space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              videoDetails && <VideoInfo video={videoDetails} />
            )}
            <CommentSection videoId={videoId} />
          </div>
          <div>
            <RelatedVideos videoId={videoId} />
          </div>
        </div>
      </div>
    </div>
  )
}
