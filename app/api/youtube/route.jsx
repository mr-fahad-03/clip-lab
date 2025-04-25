export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")

  // Create a new URLSearchParams object without the endpoint parameter
  const apiParams = new URLSearchParams()

  // Copy all parameters except endpoint
  searchParams.forEach((value, key) => {
    if (key !== "endpoint" && key !== "_t") {
      apiParams.append(key, value)
    }
  })

  // Add the API key
  apiParams.append("key", "AIzaSyAMJZ1gzKQmRtvBJOEP3fjbJgR510kcp4Q")

  // Build the full URL
  const apiUrl = `https://www.googleapis.com/youtube/v3/${endpoint}?${apiParams.toString()}`

  try {
    console.log("Fetching from YouTube API:", apiUrl)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(apiUrl, {
      headers: {
        Referer: "https://mytube.vercel.app/",
        Origin: "https://mytube.vercel.app",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Try to parse error response if possible
      let errorData
      try {
        errorData = await response.json()
      } catch (parseError) {
        errorData = { message: `Status ${response.status}: ${response.statusText}` }
      }

      console.error("YouTube API error:", errorData)

      // Check for quota exceeded error
      const isQuotaExceeded =
        errorData.error?.message?.includes("quota") ||
        errorData.error?.errors?.some((e) => e.reason === "quotaExceeded")

      // Return a more user-friendly error
      return Response.json(
        {
          error: isQuotaExceeded
            ? "YouTube API quota exceeded. Please try again later."
            : `YouTube API error: Status ${response.status}: ${errorData.error?.message || response.statusText}`,
          details: errorData,
          status: response.status,
        },
        { status: response.status },
      )
    }

    // Get the response text first to ensure it's complete
    const responseText = await response.text()

    // Validate that we have a proper JSON response
    if (!responseText || responseText.trim() === "") {
      throw new Error("Empty response from YouTube API")
    }

    // Parse the JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parsing YouTube API response:", parseError)
      console.error("Response text:", responseText.substring(0, 200) + "...") // Log first 200 chars
      throw new Error(`Failed to parse YouTube API response: ${parseError.message}`)
    }

    return Response.json(data)
  } catch (error) {
    console.error("Error fetching from YouTube API:", error)

    // Return a proper error response
    return Response.json(
      {
        error:
          error.name === "AbortError"
            ? "Request timed out. Please try again."
            : error.message || "An error occurred while fetching data",
        timestamp: new Date().toISOString(),
      },
      { status: error.name === "AbortError" ? 504 : 500 },
    )
  }
}
