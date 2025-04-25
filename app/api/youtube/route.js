import { fetchYoutubeApi } from '@/lib/youtube-api';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400 }
      );
    }

    // Remove endpoint from searchParams and convert to string
    searchParams.delete('endpoint');
    const params = searchParams.toString();

    const data = await fetchYoutubeApi(endpoint, params);
    return new Response(JSON.stringify(data));

  } catch (error) {
    console.error('YouTube API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch data from YouTube API' }),
      { status: error.status || 500 }
    );
  }
} 