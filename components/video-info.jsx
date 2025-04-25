"use client"

import { useState, useEffect } from "react"
import { formatNumber, formatDate } from "@/lib/utils"
import {
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Headphones,
  Video,
  Volume2,
  VolumeX,
  PictureInPicture,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast.ts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function VideoInfo({ video }) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [channelAvatar, setChannelAvatar] = useState(null)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("mp4")
  const [selectedQuality, setSelectedQuality] = useState("720")
  const { toast } = useToast()
  const { snippet, statistics } = video

  // Player control states
  const [isAudioMode, setIsAudioMode] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Direct download services for personal use
  const DOWNLOAD_SERVICES = [
    {
      name: "Y2Mate",
      getUrl: (videoId) => `https://www.y2mate.com/youtube/${videoId}`,
      icon: "https://www.y2mate.com/themes/images/logo.png",
    },
    {
      name: "SaveFrom",
      getUrl: (videoId) =>
        `https://en.savefrom.net/1-youtube-video-downloader-400/?url=https://www.youtube.com/watch?v=${videoId}`,
      icon: "https://en.savefrom.net/img/logo_sf.png",
    },
    {
      name: "YTMP3",
      getUrl: (videoId) => `https://ytmp3.cc/youtube-to-mp3/?url=https://www.youtube.com/watch?v=${videoId}`,
      icon: "https://ytmp3.cc/icon.png",
    },
    {
      name: "9xBuddy",
      getUrl: (videoId) => `https://9xbuddy.com/process?url=https://www.youtube.com/watch?v=${videoId}`,
      icon: "https://9xbuddy.com/assets/favicon/favicon-32x32.png",
    },
    {
      name: "YT1s",
      getUrl: (videoId) => `https://yt1s.com/youtube-to-mp3/${videoId}`,
      icon: "https://yt1s.com/statics/image/logo.svg",
    },
  ]

  useEffect(() => {
    const fetchChannelDetails = async () => {
      try {
        const response = await fetch(`/api/youtube?endpoint=channels&part=snippet&id=${snippet.channelId}`)
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          setChannelAvatar(data.items[0].snippet.thumbnails.default?.url)
        }
      } catch (error) {
        console.error("Error fetching channel details:", error)
      }
    }

    fetchChannelDetails()

    // Set up event listeners for player control updates
    const handlePlayerControlUpdate = () => {
      if (typeof window !== "undefined" && window.playerControls) {
        setIsAudioMode(window.playerControls.isAudioMode || false)
        setIsMuted(window.playerControls.isMuted || false)
        setIsFullscreen(window.playerControls.isFullscreen || false)
      }
    }

    // Check for control updates every second
    const intervalId = setInterval(handlePlayerControlUpdate, 1000)

    return () => clearInterval(intervalId)
  }, [snippet.channelId])

  // Generate initials for fallback avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const channelInitials = getInitials(snippet.channelTitle)
  const randomColor = `hsl(${(snippet.channelId.charCodeAt(0) * 10) % 360}, 70%, 60%)`

  const handleDownload = async (service) => {
    try {
      setIsDownloading(true)
      setDownloadProgress(30)

      // Save to downloads history
      try {
        const downloadsHistory = JSON.parse(localStorage.getItem("downloadsHistory") || "[]")
        const newDownload = {
          id: video.id,
          title: snippet.title,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
          format: `${selectedFormat.toUpperCase()} (${service.name})`,
          downloadDate: new Date().toISOString(),
        }

        localStorage.setItem("downloadsHistory", JSON.stringify([newDownload, ...downloadsHistory]))
      } catch (e) {
        console.error("Error saving download history:", e)
      }

      // Open the download service in a new tab
      window.open(service.getUrl(video.id), "_blank")

      // Show success message
      toast({
        title: "Download Started",
        description: `Opening ${service.name} to download your video. Complete the process there.`,
        duration: 5000,
      })

      // Simulate progress completion
      setDownloadProgress(100)
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
        setShowDownloadDialog(false)
      }, 2000)
    } catch (error) {
      console.error("Error downloading video:", error)
      setIsDownloading(false)
      setDownloadProgress(0)

      toast({
        title: "Download Failed",
        description: `Failed to download: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Direct download using our API route
  const handleDirectDownload = async () => {
    try {
      setIsDownloading(true)
      setDownloadProgress(30)

      // Call our API route
      const downloadUrl = `/api/download?v=${video.id}&format=${selectedFormat}&quality=${selectedQuality}`

      // Open in new tab
      window.open(downloadUrl, "_blank")

      // Save to downloads history
      try {
        const downloadsHistory = JSON.parse(localStorage.getItem("downloadsHistory") || "[]")
        const newDownload = {
          id: video.id,
          title: snippet.title,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
          format: `${selectedFormat.toUpperCase()} ${selectedQuality}p (Direct)`,
          downloadDate: new Date().toISOString(),
        }

        localStorage.setItem("downloadsHistory", JSON.stringify([newDownload, ...downloadsHistory]))
      } catch (e) {
        console.error("Error saving download history:", e)
      }

      // Show success message
      toast({
        title: "Download Started",
        description: "Your download has started in a new tab.",
        duration: 5000,
      })

      // Simulate progress completion
      setDownloadProgress(100)
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
        setShowDownloadDialog(false)
      }, 2000)
    } catch (error) {
      console.error("Error downloading video:", error)
      setIsDownloading(false)
      setDownloadProgress(0)

      toast({
        title: "Download Failed",
        description: `Failed to download: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Player control functions
  const toggleAudioMode = () => {
    if (typeof window !== "undefined" && window.playerControls && window.playerControls.toggleAudioMode) {
      window.playerControls.toggleAudioMode()
      setIsAudioMode(!isAudioMode)
    }
  }

  const toggleMute = () => {
    if (typeof window !== "undefined" && window.playerControls && window.playerControls.toggleMute) {
      window.playerControls.toggleMute()
      setIsMuted(!isMuted)
    }
  }

  const enablePictureInPicture = () => {
    if (typeof window !== "undefined" && window.playerControls && window.playerControls.enablePictureInPicture) {
      window.playerControls.enablePictureInPicture()
    }
  }

  const toggleFullscreen = () => {
    if (typeof window !== "undefined" && window.playerControls && window.playerControls.toggleFullscreen) {
      window.playerControls.toggleFullscreen()
      setIsFullscreen(!isFullscreen)
    }
  }

  return (
    <div className="mt-4">
      <h1 className="text-xl font-semibold mb-2">{snippet.title}</h1>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10">
            {channelAvatar ? (
              <img
                src={channelAvatar || "/placeholder.svg"}
                alt={snippet.channelTitle}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.style.display = "none"
                  e.target.nextSibling.style.display = "flex"
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${!channelAvatar ? "flex" : "hidden"}`}
              style={{ backgroundColor: randomColor }}
            >
              {channelInitials}
            </div>
          </div>
          <div>
            <h3 className="font-medium">{snippet.channelTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {statistics.subscriberCount ? formatNumber(statistics.subscriberCount) + " subscribers" : ""}
            </p>
          </div>
          <Button variant="secondary" className="ml-2">
            Subscribe
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full">
            <Button variant="ghost" size="sm" className="rounded-l-full">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {formatNumber(statistics.likeCount || 0)}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" className="rounded-r-full">
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDownloadDialog(true)}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        
        </div>
      </div>

      {/* Video Controls - Moved from VideoPlayer component */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="secondary"
          size="sm"
          className={`${isAudioMode ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
          onClick={toggleAudioMode}
        >
          {isAudioMode ? <Video className="h-4 w-4 mr-1" /> : <Headphones className="h-4 w-4 mr-1" />}
          {isAudioMode ? "Switch to Video" : "Audio Only Mode"}
        </Button>

        <Button variant="secondary" size="sm" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>

        <Button variant="secondary" size="sm" onClick={enablePictureInPicture}>
          <PictureInPicture className="h-4 w-4 mr-1" />
          P-in-P
        </Button>

       
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mt-4">
        <div className="flex gap-2 text-sm">
          <span>{formatNumber(statistics.viewCount || 0)} views</span>
          <span>{formatDate(snippet.publishedAt)}</span>
        </div>
        <div className={`mt-2 text-sm whitespace-pre-wrap ${showFullDescription ? "" : "line-clamp-2"}`}>
          {snippet.description}
        </div>
        {snippet.description && snippet.description.length > 100 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 p-0 h-auto font-medium"
            onClick={() => setShowFullDescription(!showFullDescription)}
          >
            {showFullDescription ? (
              <span className="flex items-center">
                Show less <ChevronUp className="ml-1 h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center">
                Show more <ChevronDown className="ml-1 h-4 w-4" />
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Video</DialogTitle>
            <DialogDescription>
              Select your preferred format to download "{snippet.title.substring(0, 50)}..."
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="services">Download Services</TabsTrigger>
                <TabsTrigger value="direct">Direct Download</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Download Services</AlertTitle>
                  <AlertDescription>
                    These services will help you download the video. Click on one to continue.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-3">
                  {DOWNLOAD_SERVICES.map((service) => (
                    <Button
                      key={service.name}
                      variant="outline"
                      className="flex justify-between items-center w-full h-auto py-3"
                      onClick={() => handleDownload(service)}
                      disabled={isDownloading}
                    >
                      <div className="flex items-center">
                        <img
                          src={service.icon || "/placeholder.svg"}
                          alt={service.name}
                          className="w-6 h-6 mr-3 object-contain"
                          onError={(e) => {
                            e.target.style.display = "none"
                          }}
                        />
                        <span>{service.name}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="direct" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Direct Download</AlertTitle>
                  <AlertDescription>Choose your preferred format and quality for direct download.</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Format</Label>
                    <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mp4" id="mp4" />
                        <Label htmlFor="mp4">MP4 Video</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mp3" id="mp3" />
                        <Label htmlFor="mp3">MP3 Audio</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {selectedFormat === "mp4" && (
                    <div>
                      <Label className="text-base font-medium">Quality</Label>
                      <RadioGroup
                        value={selectedQuality}
                        onValueChange={setSelectedQuality}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="360" id="360p" />
                          <Label htmlFor="360p">360p</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="480" id="480p" />
                          <Label htmlFor="480p">480p</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="720" id="720p" />
                          <Label htmlFor="720p">720p</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="1080" id="1080p" />
                          <Label htmlFor="1080p">1080p</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {selectedFormat === "mp3" && (
                    <div>
                      <Label className="text-base font-medium">Quality</Label>
                      <RadioGroup
                        value={selectedQuality}
                        onValueChange={setSelectedQuality}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="128" id="128kbps" />
                          <Label htmlFor="128kbps">128 kbps</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="192" id="192kbps" />
                          <Label htmlFor="192kbps">192 kbps</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="256" id="256kbps" />
                          <Label htmlFor="256kbps">256 kbps</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2">
                          <RadioGroupItem value="320" id="320kbps" />
                          <Label htmlFor="320kbps">320 kbps</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <Button onClick={handleDirectDownload} className="w-full" disabled={isDownloading}>
                    {isDownloading ? "Processing..." : "Download Now"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {isDownloading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                </div>
                <p className="text-sm text-center mt-2">
                  {downloadProgress < 100 ? `Processing... ${Math.round(downloadProgress)}%` : "Completing download..."}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDownloadDialog(false)} disabled={isDownloading}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
