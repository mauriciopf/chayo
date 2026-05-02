import { IGMediaResponse, InstagramFeedError } from './types';

const INSTAGRAM_GRAPH_API_BASE = 'https://graph.instagram.com';

export class InstagramClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Fetch user's Instagram media
   * @param userId - Instagram Business Account ID
   * @param limit - Number of posts to fetch (default: 25, max: 100)
   */
  async fetchUserMedia(userId: string, limit: number = 25): Promise<IGMediaResponse> {
    const fields = [
      'id',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'caption',
      'timestamp',
    ].join(',');

    const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const error: InstagramFeedError = await response.json();
      throw new Error(
        error.error?.message || `Instagram API error: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get user's Instagram account info
   */
  async getUserInfo(userId: string): Promise<any> {
    const fields = 'id,username,account_type,media_count';
    const url = `${INSTAGRAM_GRAPH_API_BASE}/${userId}?fields=${fields}&access_token=${this.accessToken}`;

    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      const error: InstagramFeedError = await response.json();
      throw new Error(
        error.error?.message || `Instagram API error: ${response.status}`
      );
    }

    return response.json();
  }
}

/**
 * Get Instagram client instance (server-side only)
 */
export function getInstagramClient(): InstagramClient {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'INSTAGRAM_ACCESS_TOKEN is not defined in environment variables'
    );
  }

  return new InstagramClient(accessToken);
}
