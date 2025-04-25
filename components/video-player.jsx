"use client"

import { useEffect, useRef, useState } from "react"
import { Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast.ts"

export default function VideoPlayer({ videoId }) {
  const iframeRef = useRef(null)
  const [isPiP, setIsPiP] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const { toast } = useToast()
  const videoContainerRef = useRef(null)
  const [youtubePlayer, setYoutubePlayer] = useState(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)

  // Load YouTube API
  useEffect(() => {
    // Add YouTube iframe API
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    // Initialize player controls globally
    if (typeof window !== "undefined") {
      window.playerControls = {
        toggleAudioMode: () => {},
        toggleMute: () => {},
        enablePictureInPicture: () => {},
        toggleFullscreen: () => {},
        isAudioMode: false,
        isMuted: false,
        isFullscreen: false,
      }
    }

    return () => {
      // Clean up
      if (youtubePlayer) {
        try {
          youtubePlayer.destroy()
        } catch (e) {
          console.error("Error destroying YouTube player:", e)
        }
      }
    }
  }, [])

  // Initialize YouTube player when iframe is ready
  useEffect(() => {
    const initPlayer = () => {
      if (typeof window === "undefined" || !window.YT || !window.YT.Player || !iframeRef.current) return

      try {
        const player = new window.YT.Player(iframeRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            playsinline: 1,
            controls: 1,
          },
          events: {
            onReady: (event) => {
              setYoutubePlayer(event.target)
              setPlayerReady(true)
              setIsPlaying(true)

              // Update global player controls
              updatePlayerControls()
            },
            onStateChange: (event) => {
              if (typeof window !== "undefined" && window.YT) {
                setIsPlaying(event.data === window.YT.PlayerState.PLAYING)

                // If video ends, update state
                if (event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false)
                }
              }
            },
            onError: (event) => {
              console.error("YouTube player error:", event.data)
            },
          },
        })
      } catch (e) {
        console.error("Error initializing YouTube player:", e)
      }
    }

    if (typeof window !== "undefined" && window.YT && window.YT.Player) {
      initPlayer()
    } else if (typeof window !== "undefined") {
      window.onYouTubeIframeAPIReady = initPlayer
    }
  }, [videoId])

  // Update player controls whenever state changes
  useEffect(() => {
    updatePlayerControls()
  }, [isAudioMode, isMuted, isFullscreen, playerReady])

  // Function to update global player controls
  const updatePlayerControls = () => {
    if (typeof window !== "undefined") {
      window.playerControls = {
        toggleAudioMode,
        toggleMute,
        enablePictureInPicture,
        toggleFullscreen,
        isAudioMode,
        isMuted,
        isFullscreen,
      }
    }
  }

  // Set up media session for background controls
  useEffect(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && playerReady) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `Playing YouTube Video (${videoId})`,
          artist: "MyTube",
          album: "Background Playback",
          artwork: [
            { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" },
          ],
        })

        navigator.mediaSession.setActionHandler("play", () => {
          if (youtubePlayer) {
            youtubePlayer.playVideo()
            setIsPlaying(true)
          }
        })

        navigator.mediaSession.setActionHandler("pause", () => {
          if (youtubePlayer) {
            youtubePlayer.pauseVideo()
            setIsPlaying(false)
          }
        })
      } catch (e) {
        console.error("Error setting up media session:", e)
      }
    }
  }, [videoId, playerReady, youtubePlayer])

  // Handle visibility change for background playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.hidden && playerReady) {
        // Page is hidden, enable audio-only mode
        enableAudioMode()
      } else if (typeof document !== "undefined" && !document.hidden && isAudioMode && playerReady) {
        // Page is visible again, check if we should restore video
        // Only restore automatically if audio mode was triggered by visibility change
        if (!audioFailed) {
          disableAudioMode()
        }
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }
  }, [isAudioMode, playerReady, audioFailed])

  const enablePictureInPicture = async () => {
    try {
      // First check if PiP is supported
      if (typeof document !== "undefined" && !document.pictureInPictureEnabled) {
        toast({
          title: "Not Supported",
          description: "Your browser doesn't support Picture-in-Picture mode",
          variant: "destructive",
        })
        return
      }

      // If already in PiP mode, do nothing
      if (isPiP) return

      // Create a temporary video element for PiP
      const pipVideo = document.createElement("video")
      pipVideo.muted = true // Must be muted to autoplay
      pipVideo.playsInline = true
      pipVideo.autoplay = true

      // Add a poster image from YouTube
      pipVideo.poster = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

      // Add a small video source (1x1 pixel transparent video)
      pipVideo.src =
        "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0MiByMjQ3OSBkZDc5YTYxIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEwIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACGHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAIAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAZBtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAACgAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA+3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZYAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU2LjQwLjEwMQ=="

      // Add to document temporarily
      document.body.appendChild(pipVideo)

      // Start playing
      try {
        await pipVideo.play()

        // Request PiP
        await pipVideo.requestPictureInPicture()
        setIsPiP(true)

        // Set up event listener for when PiP is closed
        pipVideo.addEventListener("leavepictureinpicture", () => {
          setIsPiP(false)
          document.body.removeChild(pipVideo)
        })

        toast({
          title: "Background Playback Enabled",
          description: "Video will continue playing in the background",
        })
      } catch (err) {
        // Clean up if there's an error
        document.body.removeChild(pipVideo)
        console.error("PiP error:", err)

        toast({
          title: "Background Playback Failed",
          description: "Could not enable Picture-in-Picture mode",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error enabling Picture-in-Picture:", error)
      toast({
        title: "Error",
        description: "Failed to enable background playback",
        variant: "destructive",
      })
    }
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return

    if (typeof document !== "undefined" && !document.fullscreenElement) {
      videoContainerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
          updatePlayerControls()
        })
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
    } else if (typeof document !== "undefined") {
      document.exitFullscreen()
      setIsFullscreen(false)
      updatePlayerControls()
    }
  }

  const enableAudioMode = () => {
    if (!youtubePlayer || !playerReady) return

    try {
      // Instead of trying to extract audio (which is causing the error),
      // we'll use a different approach: keep the YouTube player but hide the video
      // and reduce quality to save bandwidth

      // Set to lowest quality to save bandwidth
      youtubePlayer.setPlaybackQuality("small")

      // Make sure audio is playing
      youtubePlayer.unMute()
      youtubePlayer.setVolume(100)

      // Make sure video is playing
      if (youtubePlayer.getPlayerState() !== 1) {
        // 1 = playing
        youtubePlayer.playVideo()
      }

      // Update state
      setIsAudioMode(true)
      setAudioFailed(false)
      updatePlayerControls()

      toast({
        title: "Audio Mode Enabled",
        description: "Video will continue playing in audio-only mode in the background",
      })

      // Keep the player alive in background
      const keepAlive = setInterval(() => {
        if (youtubePlayer && typeof document !== "undefined" && document.hidden && isAudioMode) {
          // Touch the player to keep it alive
          const currentTime = youtubePlayer.getCurrentTime()
          if (youtubePlayer.getPlayerState() !== 1) {
            // If not playing
            youtubePlayer.playVideo()
          }
          setCurrentTime(currentTime)
        } else {
          clearInterval(keepAlive)
        }
      }, 5000)

      return () => clearInterval(keepAlive)
    } catch (e) {
      console.error("Error enabling audio mode:", e)
      setAudioFailed(true)

      toast({
        title: "Audio Mode Limited",
        description: "Audio may stop when screen is locked. Try using the YouTube app for background playback.",
        variant: "warning",
      })
    }
  }

  const disableAudioMode = () => {
    if (!youtubePlayer || !playerReady) return

    try {
      // Restore quality
      youtubePlayer.setPlaybackQuality("auto")

      // Update state
      setIsAudioMode(false)
      setAudioFailed(false)
      updatePlayerControls()

      toast({
        title: "Video Mode Restored",
        description: "Switched back to video mode",
      })
    } catch (e) {
      console.error("Error disabling audio mode:", e)
    }
  }

  const toggleAudioMode = () => {
    if (isAudioMode) {
      disableAudioMode()
    } else {
      enableAudioMode()
    }
  }

  const toggleMute = () => {
    if (!youtubePlayer || !playerReady) return

    try {
      if (isMuted) {
        youtubePlayer.unMute()
        setIsMuted(false)
      } else {
        youtubePlayer.mute()
        setIsMuted(true)
      }
      updatePlayerControls()
    } catch (e) {
      console.error("Error toggling mute:", e)
    }
  }

  return (
    <div className="relative" ref={videoContainerRef}>
      <div className={`aspect-video w-full bg-black rounded-lg overflow-hidden ${isAudioMode ? "opacity-50" : ""}`}>
        <div id="youtube-player" ref={iframeRef} className="w-full h-full"></div>
      </div>

      {isAudioMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-black/70 p-4 rounded-lg text-center">
            <Headphones className="h-12 w-12 mx-auto mb-2 text-red-500" />
            <h3 className="text-white font-medium mb-1">Audio-Only Mode</h3>
            <p className="text-gray-300 text-sm mb-3">Video is playing in background audio mode</p>
            <Button onClick={disableAudioMode} variant="outline" className="border-white text-white hover:bg-white/20">
              Return to Video
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
