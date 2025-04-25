export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("v")
  const format = searchParams.get("format") || "mp4"
  const quality = searchParams.get("quality") || "720"

  if (!videoId) {
    return Response.json({ error: "Video ID is required" }, { status: 400 })
  }

  try {
    // For personal use only - redirect to a reliable download service
    let downloadUrl = ""

    // Choose the most reliable service based on format
    if (format === "mp3") {
      // For MP3 audio downloads
      downloadUrl = `https://www.y2mate.com/youtube-mp3/${videoId}`
    } else {
      // For MP4 video downloads
      downloadUrl = `https://www.y2mate.com/youtube/${videoId}`
    }

    // Return a redirect response
    return Response.redirect(downloadUrl)
  } catch (error) {
    console.error("Download error:", error)
    return Response.json(
      {
        error: "Failed to process download request",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
