import { NextResponse } from 'next/server';
import { instagramCredentials, missingAccountMessage, readAccountName } from '@/lib/instagram/accounts';

const GRAPH_BASE = 'https://graph.instagram.com/v23.0';
const CAPTION_LIMIT = 2200;
const CAROUSEL_MIN = 2;
const CAROUSEL_MAX = 10;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function parseItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const type = record.type === 'video' || record.media === 'video' ? 'video' : 'image';
    const url = typeof record.url === 'string'
      ? record.url.trim()
      : type === 'video' && typeof record.videoUrl === 'string'
        ? record.videoUrl.trim()
        : typeof record.imageUrl === 'string'
          ? record.imageUrl.trim()
          : '';

    return url ? [{ type, url }] : [];
  });
}

function carouselReady(statusCode: string, detail: string | null) {
  return statusCode === 'FINISHED' || /^finished/i.test(detail ?? '');
}

function resolveAccount(value: unknown) {
  const parsed = readAccountName(value);

  if ('error' in parsed) {
    return { error: jsonError(parsed.error, 400) };
  }

  const auth = instagramCredentials(parsed.account);

  if (!auth) {
    return { error: jsonError(missingAccountMessage(parsed.account), 500) };
  }

  return { auth };
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
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const resolved = resolveAccount(input.account ?? input.business);

  if ('error' in resolved) {
    return resolved.error;
  }

  const auth = resolved.auth;
  const containerId = typeof input.containerId === 'string' ? input.containerId.trim() : '';
  const caption = typeof input.caption === 'string' ? input.caption.trim() : '';
  const videoUrl = typeof input.videoUrl === 'string' ? input.videoUrl.trim() : '';
  const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl.trim() : '';
  const imageUrls = stringList(input.imageUrls);
  const items = parseItems(input.items);
  const childContainerIds = stringList(input.childContainerIds);
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

  if (childContainerIds.length > 0) {
    if (childContainerIds.length < CAROUSEL_MIN || childContainerIds.length > CAROUSEL_MAX) {
      return jsonError(`A carousel needs ${CAROUSEL_MIN} to ${CAROUSEL_MAX} items.`, 400);
    }

    const checks = await Promise.all(
      childContainerIds.map(async (id) => ({
        id,
        status: await graphRequest(id, auth.accessToken, { fields: 'status_code,status' }, 'GET'),
      })),
    );
    const failed = checks.find((check) => !check.status.ok);

    if (failed) {
      return jsonError(graphMessage(failed.status.data, 'Instagram could not read a carousel item.'), failed.status.status);
    }

    const children = checks.map((check) => ({
      id: check.id,
      status: check.status.data.status_code ?? 'UNKNOWN',
      detail: check.status.data.status ?? null,
    }));
    const broken = children.find((child) => child.status === 'ERROR' || child.status === 'EXPIRED');

    if (broken) {
      return jsonError(`Instagram could not prepare one carousel item (${broken.status}).`, 502);
    }

    if (children.some((child) => !carouselReady(child.status, child.detail))) {
      return NextResponse.json({
        childContainerIds,
        children,
        status: 'IN_PROGRESS',
        mediaType: 'CAROUSEL',
        published: false,
      });
    }

    if (!caption) {
      return jsonError('A caption is required to publish the carousel.', 400);
    }

    const parent = await graphRequest(
      `${auth.accountId}/media`,
      auth.accessToken,
      {
        media_type: 'CAROUSEL',
        children: childContainerIds.join(','),
        caption,
      },
      'POST',
    );

    if (!parent.ok || !parent.data.id) {
      return jsonError(graphMessage(parent.data, 'Instagram could not create the carousel.'), parent.ok ? 502 : parent.status);
    }

    return NextResponse.json({
      containerId: parent.data.id,
      childContainerIds,
      status: 'IN_PROGRESS',
      mediaType: 'CAROUSEL',
      published: false,
    });
  }

  if (items.length > 0) {
    if (imageUrls.length > 0 || videoUrl || imageUrl) {
      return jsonError('Send carousel items on their own.', 400);
    }

    if (items.length < CAROUSEL_MIN || items.length > CAROUSEL_MAX) {
      return jsonError(`A carousel needs ${CAROUSEL_MIN} to ${CAROUSEL_MAX} items.`, 400);
    }

    if (items.some((item) => !isPublicHttpsUrl(item.url))) {
      return jsonError('Carousel items must be public https links.', 400);
    }

    const createdIds: string[] = [];

    for (const item of items) {
      const created = await graphRequest(
        `${auth.accountId}/media`,
        auth.accessToken,
        item.type === 'video'
          ? { media_type: 'VIDEO', video_url: item.url, is_carousel_item: 'true' }
          : { image_url: item.url, is_carousel_item: 'true' },
        'POST',
      );

      if (!created.ok || !created.data.id) {
        return NextResponse.json(
          {
            error: graphMessage(created.data, 'Instagram could not prepare a carousel item.'),
            childContainerIds: createdIds,
          },
          { status: created.ok ? 502 : created.status },
        );
      }

      createdIds.push(created.data.id);
    }

    return NextResponse.json({
      childContainerIds: createdIds,
      items,
      status: 'IN_PROGRESS',
      mediaType: 'CAROUSEL',
      published: false,
    });
  }

  if (imageUrls.length > 0) {
    if (videoUrl || imageUrl) {
      return jsonError('Send carousel images on their own.', 400);
    }

    if (imageUrls.length < CAROUSEL_MIN || imageUrls.length > CAROUSEL_MAX) {
      return jsonError(`A carousel needs ${CAROUSEL_MIN} to ${CAROUSEL_MAX} images.`, 400);
    }

    if (imageUrls.some((url) => !isPublicHttpsUrl(url))) {
      return jsonError('Carousel images must be public https links.', 400);
    }

    const createdIds: string[] = [];

    for (const url of imageUrls) {
      const created = await graphRequest(
        `${auth.accountId}/media`,
        auth.accessToken,
        { image_url: url, is_carousel_item: 'true' },
        'POST',
      );

      if (!created.ok || !created.data.id) {
        return NextResponse.json(
          {
            error: graphMessage(created.data, 'Instagram could not prepare a carousel image.'),
            childContainerIds: createdIds,
          },
          { status: created.ok ? 502 : created.status },
        );
      }

      createdIds.push(created.data.id);
    }

    return NextResponse.json({
      childContainerIds: createdIds,
      status: 'IN_PROGRESS',
      mediaType: 'CAROUSEL',
      published: false,
    });
  }

  if (videoUrl && imageUrl) {
    return jsonError('Send either a video URL or an image URL.', 400);
  }

  if (!videoUrl && !imageUrl) {
    return jsonError('A public video URL, image URL, carousel, or container id is required.', 400);
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
  const url = new URL(request.url);
  const resolved = resolveAccount(url.searchParams.get('account'));

  if ('error' in resolved) {
    return resolved.error;
  }

  const auth = resolved.auth;
  const containerId = url.searchParams.get('id')?.trim();

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
