"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { formatDistanceToNow } from "date-fns"
import { Play, Trash2, Music, Video, FileVideo } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState([])
  const router = useRouter()

  useEffect(() => {
    try {
      const downloadsHistory = JSON.parse(localStorage.getItem("downloadsHistory") || "[]")
      setDownloads(downloadsHistory)
    } catch (e) {
      console.error("Error loading downloads history:", e)
      setDownloads([])
    }
  }, [])

  const handleDeleteDownload = (id, index) => {
    try {
      const updatedDownloads = downloads.filter((_, i) => i !== index)
      localStorage.setItem("downloadsHistory", JSON.stringify(updatedDownloads))
      setDownloads(updatedDownloads)
    } catch (e) {
      console.error("Error deleting download:", e)
    }
  }

  const handlePlayVideo = (id) => {
    router.push(`/watch?v=${id}`)
  }

  // Helper function to determine format icon
  const getFormatIcon = (format) => {
    if (!format) return <FileVideo className="h-3 w-3 text-white" />

    const formatLower = format.toLowerCase()
    if (formatLower.includes("audio") || formatLower.includes("mp3") || formatLower.includes("kbps")) {
      return <Music className="h-3 w-3 text-white" />
    }
    return <Video className="h-3 w-3 text-white" />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Downloads</h1>

        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No downloaded videos yet</p>
            <Button className="mt-4" onClick={() => router.push("/")}>
              Browse videos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads.map((download, index) => (
              <div key={download.id + index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden relative">
                    <img
                      src={download.thumbnail || "/placeholder.svg"}
                      alt={download.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 rounded-md px-2 py-1 flex items-center">
                      {getFormatIcon(download.format)}
                      <span className="text-xs text-white ml-1">{download.format}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{download.title}</h3>
                    <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Format: {download.format}</span>
                      <span className="mx-1">•</span>
                      <span>
                        Downloaded {formatDistanceToNow(new Date(download.downloadDate), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => handlePlayVideo(download.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteDownload(download.id, index)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
