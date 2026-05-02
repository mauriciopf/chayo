/**
 * Instagram Graph API Types
 * @see https://developers.facebook.com/docs/instagram-basic-display-api/reference/media
 */

export type IGMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export interface IGMedia {
  id: string;
  media_type: IGMediaType;
  media_url: string;
  thumbnail_url?: string; // For videos
  permalink: string;
  caption?: string;
  timestamp: string;
}

export interface IGMediaResponse {
  data: IGMedia[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface InstagramFeedError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}
