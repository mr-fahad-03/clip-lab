export async function GET() {
  const API_KEY = "AIzaSyBvrVT4liKsXAGGEM5CLU-yUK4GRMdkp_k"

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${API_KEY}`,
    )

    if (!response.ok) {
      const errorData = await response.json()
      return Response.json({
        success: false,
        status: response.status,
        error: errorData,
      })
    }

    const data = await response.json()
    return Response.json({
      success: true,
      message: "API key is working correctly!",
      data: data,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
