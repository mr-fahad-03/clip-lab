"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"
import ApiErrorFallback from "@/components/api-error-fallback"

export default function CommentSection({ videoId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setError(null)
        const response = await fetch(
          `/api/youtube?endpoint=commentThreads&part=snippet&videoId=${videoId}&maxResults=20`,
        )

        if (!response.ok) {
          const errorData = await response.json()

          // Check specifically for quota exceeded error
          if (errorData.error && errorData.error.includes("quota")) {
            throw new Error("YouTube API quota exceeded. Please try again later.")
          } else {
            throw new Error(`Failed to fetch comments: ${errorData.error || response.status}`)
          }
        }

        const data = await response.json()
        setComments(data.items || [])
      } catch (error) {
        console.error("Error fetching comments:", error)
        setError(error.message || "Failed to load comments")
      } finally {
        setLoading(false)
      }
    }

    if (videoId) {
      fetchComments()
    }
  }, [videoId])

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    // In a real app, you would send this to the API
    console.log("Comment submitted:", commentText)
    setCommentText("")
  }

  // Generate initials for fallback avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">
        {loading ? <Skeleton className="h-6 w-32" /> : `${formatNumber(comments.length)} Comments`}
      </h3>

      {error ? (
        <ApiErrorFallback message={error} isQuotaError={error.includes("quota")} />
      ) : (
        <>
          <div className="flex gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-300 font-medium">YO</span>
            </div>
            <form onSubmit={handleCommentSubmit} className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => setCommentText("")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!commentText.trim()}>
                  Comment
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))
              : comments.map((comment) => {
                  const { snippet } = comment.snippet.topLevelComment
                  const authorInitials = getInitials(snippet.authorDisplayName)
                  const randomColor = `hsl(${(snippet.authorChannelId?.value?.charCodeAt(0) * 10) % 360 || 0}, 70%, 60%)`

                  return (
                    <div key={comment.id} className="flex gap-4">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {snippet.authorProfileImageUrl ? (
                          <img
                            src={snippet.authorProfileImageUrl || "/placeholder.svg"}
                            alt={snippet.authorDisplayName}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${!snippet.authorProfileImageUrl ? "flex" : "hidden"}`}
                          style={{ backgroundColor: randomColor }}
                        >
                          {authorInitials}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{snippet.authorDisplayName}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(snippet.publishedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-1">{snippet.textDisplay}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {formatNumber(snippet.likeCount || 0)}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
          </div>
        </>
      )}
    </div>
  )
}
