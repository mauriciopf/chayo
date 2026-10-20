import { NextResponse } from 'next/server';

const GRAPH_BASE = 'https://graph.instagram.com/v23.0';
const CAPTION_LIMIT = 2200;

export const dynamic = 'force-dynamic';

type GraphError = {
  error?: {
    message?: string;
  };
};

type GraphBody = GraphError & {
  id?: string;
  status_code?: string;
  status?: string;
  permalink?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function graphMessage(data: GraphBody, fallback: string) {
  const message = data.error?.message?.trim();
  return message || fallback;
}

function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function credentials() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const accountId = process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();

  if (!accessToken || !accountId) {
    return null;
  }

  return { accessToken, accountId };
}

async function graphRequest(path: string, accessToken: string, params: Record<string, string>, method: 'GET' | 'POST') {
  const search = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(
    method === 'GET' ? `${GRAPH_BASE}/${path}?${search}` : `${GRAPH_BASE}/${path}`,
    {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      body: method === 'POST' ? search : undefined,
      cache: 'no-store',
    },
  );
  const text = await response.text();
  let data: GraphBody = {};

  if (text) {
    try {
      data = JSON.parse(text) as GraphBody;
    } catch {
      data = { error: { message: text } };
    }
  }

  return { ok: response.ok, status: response.status, data };
}

export async function POST(request: Request) {
  const auth = credentials();

  if (!auth) {
    return jsonError('Instagram account credentials are not configured.', 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const containerId = typeof input.containerId === 'string' ? input.containerId.trim() : '';
  const caption = typeof input.caption === 'string' ? input.caption.trim() : '';
  const videoUrl = typeof input.videoUrl === 'string' ? input.videoUrl.trim() : '';
  const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl.trim() : '';
  const coverUrl = typeof input.coverUrl === 'string' ? input.coverUrl.trim() : '';
  const shareToFeed = input.shareToFeed !== false;

  if (caption.length > CAPTION_LIMIT) {
    return jsonError(`Caption must be ${CAPTION_LIMIT} characters or fewer.`, 400);
  }

  if (containerId) {
    const status = await graphRequest(containerId, auth.accessToken, { fields: 'status_code,status' }, 'GET');

    if (!status.ok) {
      return jsonError(graphMessage(status.data, 'Instagram could not read the media container.'), status.status);
    }

    const statusCode = status.data.status_code ?? 'UNKNOWN';

    if (statusCode !== 'FINISHED') {
      return NextResponse.json({
        containerId,
        status: statusCode,
        detail: status.data.status ?? null,
        published: false,
      });
    }

    const published = await graphRequest(`${auth.accountId}/media_publish`, auth.accessToken, { creation_id: containerId }, 'POST');

    if (!published.ok || !published.data.id) {
      return jsonError(graphMessage(published.data, 'Instagram could not publish the container.'), published.ok ? 502 : published.status);
    }

    const media = await graphRequest(published.data.id, auth.accessToken, { fields: 'permalink' }, 'GET');

    return NextResponse.json({
      containerId,
      status: 'PUBLISHED',
      published: true,
      mediaId: published.data.id,
      permalink: media.data.permalink ?? null,
    });
  }

  if (videoUrl && imageUrl) {
    return jsonError('Send either a video URL or an image URL.', 400);
  }

  if (!videoUrl && !imageUrl) {
    return jsonError('A public video URL, image URL, or container id is required.', 400);
  }

  const mediaUrl = videoUrl || imageUrl;

  if (!isPublicHttpsUrl(mediaUrl) || (coverUrl && !isPublicHttpsUrl(coverUrl))) {
    return jsonError('Media URLs must be public https links.', 400);
  }

  const params: Record<string, string> = { caption };

  if (videoUrl) {
    params.media_type = 'REELS';
    params.video_url = videoUrl;
    params.share_to_feed = shareToFeed ? 'true' : 'false';
    if (coverUrl) params.cover_url = coverUrl;
  } else {
    params.image_url = imageUrl;
  }

  const created = await graphRequest(`${auth.accountId}/media`, auth.accessToken, params, 'POST');

  if (!created.ok || !created.data.id) {
    return jsonError(graphMessage(created.data, 'Instagram could not create the media container.'), created.ok ? 502 : created.status);
  }

  return NextResponse.json({
    containerId: created.data.id,
    status: 'IN_PROGRESS',
    mediaType: videoUrl ? 'REELS' : 'IMAGE',
    published: false,
  });
}

export async function GET(request: Request) {
  const auth = credentials();

  if (!auth) {
    return jsonError('Instagram account credentials are not configured.', 500);
  }

  const containerId = new URL(request.url).searchParams.get('id')?.trim();

  if (!containerId) {
    return jsonError('Container id is required.', 400);
  }

  const status = await graphRequest(containerId, auth.accessToken, { fields: 'status_code,status' }, 'GET');

  if (!status.ok) {
    return jsonError(graphMessage(status.data, 'Instagram could not read the media container.'), status.status);
  }

  return NextResponse.json({
    containerId,
    status: status.data.status_code ?? 'UNKNOWN',
    detail: status.data.status ?? null,
    published: status.data.status_code === 'PUBLISHED',
  });
}
