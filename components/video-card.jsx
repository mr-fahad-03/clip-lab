"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { formatNumber } from "@/lib/utils"

export default function VideoCard({ video, onClick }) {
  const { snippet, statistics } = video
  const thumbnailUrl = snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url
  const viewCount = statistics?.viewCount || 0
  const publishedAt = new Date(snippet.publishedAt)
  const [channelAvatar, setChannelAvatar] = useState(null)
  const [loading, setLoading] = useState(true)

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
      } finally {
        setLoading(false)
      }
    }

    fetchChannelDetails()
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

  return (
    <div className="cursor-pointer" onClick={onClick}>
      <div className="aspect-video overflow-hidden rounded-lg mb-2">
        <img
          src={thumbnailUrl || "/placeholder.svg"}
          alt={snippet.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {channelAvatar ? (
            <img
              src={channelAvatar || "/placeholder.svg"}
              alt={snippet.channelTitle}
              className="w-9 h-9 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
          ) : null}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${!channelAvatar || loading ? "flex" : "hidden"}`}
            style={{ backgroundColor: randomColor }}
          >
            {channelInitials}
          </div>
        </div>
        <div>
          <h3 className="font-medium line-clamp-2 text-sm">{snippet.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{snippet.channelTitle}</p>
          <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatNumber(viewCount)} views</span>
            <span className="mx-1">•</span>
            <span>{formatDistanceToNow(publishedAt, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
