import { NextResponse } from 'next/server';
import {
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

const P_VIDEO_ENDPOINT = 'https://api.runpod.ai/v2/p-video/run';
const ASPECT_RATIOS = new Set(['16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '1:1']);

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const apiKey = getRunpodApiKey();

  if (!apiKey) {
    return jsonError('Missing RUNPOD_API_KEY environment variable.', 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const bodyObj = body as Record<string, unknown>;
  const prompt = String(bodyObj.prompt ?? '').trim();
  const image = String(bodyObj.image ?? '').trim();
  const aspectRatio = String(bodyObj.aspectRatio ?? '9:16');
  const durationValue = bodyObj.duration == null || bodyObj.duration === '' ? 5 : Number(bodyObj.duration);

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (image && !isPublicHttpUrl(image)) {
    return jsonError('Image must be a public http(s) URL.', 400);
  }

  if (!Number.isInteger(durationValue) || durationValue < 1 || durationValue > 10) {
    return jsonError('Duration must be from 1 to 10 seconds.', 400);
  }

  if (!ASPECT_RATIOS.has(aspectRatio)) {
    return jsonError('Aspect ratio must be 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, or 1:1.', 400);
  }

  const response = await fetch(P_VIDEO_ENDPOINT, {
    method: 'POST',
    headers: runpodHeaders(apiKey),
    body: JSON.stringify({
      input: {
        prompt,
        ...(image ? { image } : {}),
        duration: durationValue,
        resolution: '720p',
        aspect_ratio: aspectRatio,
        fps: 24,
        seed: -1,
        draft: false,
        save_audio: true,
        prompt_upsampling: true,
      },
    }),
    cache: 'no-store',
  });

  const data = await readRunpodBody(response);

  if (!response.ok || !data.id) {
    return jsonError(runpodErrorMessage(data.error, 'Runpod request failed.'), response.ok ? 502 : response.status);
  }

  return NextResponse.json({
    id: data.id,
    status: data.status ?? 'IN_QUEUE',
  });
}
