import { NextResponse } from 'next/server';
import {
  WAN_DURATIONS,
  WAN_ENDPOINT_BASE,
  getRunpodApiKey,
  isWanDuration,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

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
  const durationValue = bodyObj.duration == null || bodyObj.duration === '' ? 5 : Number(bodyObj.duration);

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (!isPublicHttpUrl(image)) {
    return jsonError('A public http(s) image URL is required.', 400);
  }

  if (!Number.isInteger(durationValue) || !isWanDuration(durationValue)) {
    return jsonError(`Duration must be one of ${WAN_DURATIONS.join(', ')} seconds.`, 400);
  }

  const response = await fetch(`${WAN_ENDPOINT_BASE}/run`, {
    method: 'POST',
    headers: runpodHeaders(apiKey),
    body: JSON.stringify({
      input: {
        prompt,
        image,
        duration: durationValue,
        size: '1280*720',
        seed: -1,
        enable_safety_checker: true,
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
