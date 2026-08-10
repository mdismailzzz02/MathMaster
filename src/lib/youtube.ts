/**
 * YouTube Data API v3 helper
 * Uses VITE_YOUTUBE_API_KEY from your .env file.
 */

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

function getYouTubeKey(): string {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!key || key === "your_youtube_api_key_here") {
    throw new Error("VITE_YOUTUBE_API_KEY is not set.");
  }
  return key;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  description: string;
}

/**
 * Search for YouTube videos related to a math subtopic.
 * Returns up to `maxResults` videos (default 4).
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults = 4
): Promise<YouTubeVideo[]> {
  const key = getYouTubeKey();

  // Add "math tutorial" or "math lesson" to bias results toward educational content
  const fullQuery = `${query} math tutorial`;

  const params = new URLSearchParams({
    part: "snippet",
    q: fullQuery,
    type: "video",
    videoEmbeddable: "true",
    relevanceLanguage: "en",
    safeSearch: "strict",
    maxResults: String(maxResults),
    key,
  });

  const res = await fetch(`${YT_API_BASE}/search?${params}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const items: any[] = data.items ?? [];

  return items.map((item: any) => ({
    videoId: item.id?.videoId ?? "",
    title: item.snippet?.title ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url ??
      "",
    description: item.snippet?.description ?? "",
  }));
}
