import { NextResponse } from 'next/server';

const CAPTION_LIMIT = 2200;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function publishMedia(origin: string, body: Record<string, unknown>, extra: Record<string, unknown>) {
  const createResponse = await fetch(`${origin}/api/instagram/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const created = await readJson(createResponse);

  if (!createResponse.ok) {
    return NextResponse.json(created, { status: createResponse.status });
  }

  return NextResponse.json({
    stage: 'processing',
    containerId: created.containerId ?? null,
    status: created.status ?? 'IN_PROGRESS',
    ...extra,
  });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const prompt = asString(input.prompt);
  const caption = asString(input.caption);
  const kind = asString(input.kind) || 'video';
  const videoUrl = asString(input.videoUrl);
  const imageUrl = asString(input.imageUrl);
  const videoJobId = asString(input.videoJobId);
  const imageJobId = asString(input.imageJobId);
  const containerId = asString(input.containerId);
  const duration = input.duration == null || input.duration === '' ? 15 : Number(input.duration);
  const size = asString(input.size) || '1080*1920';
  const shotType = asString(input.shotType) || 'multi';

  if (caption.length > CAPTION_LIMIT) {
    return jsonError(`Caption must be ${CAPTION_LIMIT} characters or fewer.`, 400);
  }

  if (containerId) {
    const statusResponse = await fetch(`${origin}/api/instagram/publish?id=${encodeURIComponent(containerId)}`, {
      cache: 'no-store',
    });
    const status = await readJson(statusResponse);

    if (!statusResponse.ok) {
      return NextResponse.json(status, { status: statusResponse.status });
    }

    if (status.status !== 'FINISHED') {
      return NextResponse.json({
        stage: status.status === 'PUBLISHED' ? 'published' : 'processing',
        containerId,
        status: status.status ?? 'UNKNOWN',
        detail: status.detail ?? null,
      });
    }

    const publishResponse = await fetch(`${origin}/api/instagram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ containerId }),
      cache: 'no-store',
    });
    const published = await readJson(publishResponse);

    if (!publishResponse.ok) {
      return NextResponse.json(published, { status: publishResponse.status });
    }

    return NextResponse.json({
      stage: 'published',
      containerId,
      mediaId: published.mediaId ?? null,
      permalink: published.permalink ?? null,
    });
  }

  if (videoJobId) {
    const statusResponse = await fetch(
      `${origin}/api/runpod/wan-2-6/status?id=${encodeURIComponent(videoJobId)}&endpoint=wan-2-6-t2v`,
      { cache: 'no-store' },
    );
    const status = await readJson(statusResponse);

    if (!statusResponse.ok) {
      return NextResponse.json(status, { status: statusResponse.status });
    }

    const readyUrl = asString(status.videoUrl);

    if (status.status !== 'COMPLETED' || !readyUrl) {
      return NextResponse.json({
        stage: 'generating',
        videoJobId,
        status: status.status ?? 'UNKNOWN',
        error: status.error ?? null,
      });
    }

    if (!caption) {
      return jsonError('A caption is required to publish the finished video.', 400);
    }

    const createResponse = await fetch(`${origin}/api/instagram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: readyUrl, caption, shareToFeed: true }),
      cache: 'no-store',
    });
    const created = await readJson(createResponse);

    if (!createResponse.ok) {
      return NextResponse.json(created, { status: createResponse.status });
    }

    return NextResponse.json({
      stage: 'processing',
      videoJobId,
      videoUrl: readyUrl,
      containerId: created.containerId ?? null,
      status: created.status ?? 'IN_PROGRESS',
    });
  }

  if (imageJobId) {
    const statusResponse = await fetch(
      `${origin}/api/runpod/nano-banana-2/status?id=${encodeURIComponent(imageJobId)}`,
      { cache: 'no-store' },
    );
    const status = await readJson(statusResponse);

    if (!statusResponse.ok) {
      return NextResponse.json(status, { status: statusResponse.status });
    }

    const readyUrl = asString(status.imageUrl);

    if (status.status !== 'COMPLETED' || !readyUrl) {
      return NextResponse.json({
        stage: 'generating',
        kind: 'image',
        imageJobId,
        status: status.status ?? 'UNKNOWN',
        error: status.error ?? null,
      });
    }

    if (!caption) {
      return jsonError('A caption is required to publish the finished image.', 400);
    }

    return publishMedia(origin, { imageUrl: readyUrl, caption }, { imageJobId, imageUrl: readyUrl });
  }

  if (videoUrl || imageUrl) {
    if (!caption) {
      return jsonError('A caption is required.', 400);
    }

    return publishMedia(
      origin,
      videoUrl ? { videoUrl, caption, shareToFeed: true } : { imageUrl, caption },
      videoUrl ? { videoUrl } : { imageUrl },
    );
  }

  if (!prompt) {
    return jsonError('Send a prompt, a media URL, a job id, or a container id.', 400);
  }

  if (kind === 'image') {
    const references = Array.isArray(input.references)
      ? input.references.filter((item): item is string => typeof item === 'string')
      : ['logo', 'bowl'];
    const allowed = new Set(['logo', 'cart', 'uniforms', 'bowl', 'toppings']);
    const images = references
      .filter((name) => allowed.has(name))
      .slice(0, 3)
      .map((name) => `${origin}/brand/${name === 'toppings' ? 'toppings.jpg' : `${name}.png`}`);
    const startResponse = await fetch(`${origin}/api/runpod/nano-banana-2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        images: images.length > 0 ? images : [`${origin}/brand/logo.png`, `${origin}/brand/bowl.png`],
        resolution: '2k',
        aspectRatio: '4:5',
      }),
      cache: 'no-store',
    });
    const started = await readJson(startResponse);

    if (!startResponse.ok) {
      return NextResponse.json(started, { status: startResponse.status });
    }

    return NextResponse.json({
      stage: 'generating',
      kind: 'image',
      imageJobId: started.id ?? null,
      status: started.status ?? 'IN_QUEUE',
    });
  }

  if (kind !== 'video') {
    return jsonError('Kind must be image or video.', 400);
  }

  const startResponse = await fetch(`${origin}/api/runpod/wan-2-6`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration, size, shotType }),
    cache: 'no-store',
  });
  const started = await readJson(startResponse);

  if (!startResponse.ok) {
    return NextResponse.json(started, { status: startResponse.status });
  }

  return NextResponse.json({
    stage: 'generating',
    kind: 'video',
    videoJobId: started.id ?? null,
    status: started.status ?? 'IN_QUEUE',
  });
}
