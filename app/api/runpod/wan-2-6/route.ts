import { NextResponse } from 'next/server';
import {
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

const T2V_ENDPOINT = 'wan-2-6-t2v';
const I2V_ENDPOINT = 'wan-2-6-i2v';
const DURATIONS = new Set([5, 10, 15]);
const T2V_SIZES = new Set(['1280*720', '1920*1080', '720*1280', '1080*1920']);
const I2V_SIZES = new Set(['1280*720', '1920*1080']);

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
  const audio = String(bodyObj.audio ?? '').trim();
  const durationValue = bodyObj.duration == null || bodyObj.duration === '' ? 15 : Number(bodyObj.duration);
  const useImage = image.length > 0;
  const endpoint = useImage ? I2V_ENDPOINT : T2V_ENDPOINT;
  const requestedSize = String(bodyObj.size ?? (useImage ? '1280*720' : '720*1280'));
  const shotType = String(bodyObj.shotType ?? 'single');
  const allowedSizes = useImage ? I2V_SIZES : T2V_SIZES;

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (useImage && !isPublicHttpUrl(image)) {
    return jsonError('Image must be a public http(s) URL.', 400);
  }

  if (audio && !isPublicHttpUrl(audio)) {
    return jsonError('Audio must be a public http(s) URL.', 400);
  }

  if (!Number.isInteger(durationValue) || !DURATIONS.has(durationValue)) {
    return jsonError('Duration must be 5, 10, or 15 seconds.', 400);
  }

  if (shotType !== 'single' && shotType !== 'multi') {
    return jsonError('Shot type must be single or multi.', 400);
  }

  if (!allowedSizes.has(requestedSize)) {
    return jsonError(
      useImage
        ? 'Image-to-video size must be 1280*720 or 1920*1080.'
        : 'Text-to-video size must be 1280*720, 1920*1080, 720*1280, or 1080*1920.',
      400,
    );
  }

  const response = await fetch(`https://api.runpod.ai/v2/${endpoint}/run`, {
    method: 'POST',
    headers: runpodHeaders(apiKey),
    body: JSON.stringify({
      input: {
        prompt,
        ...(useImage ? { image } : {}),
        ...(audio ? { audio } : {}),
        duration: durationValue,
        size: requestedSize,
        shot_type: shotType,
        seed: -1,
        enable_prompt_expansion: false,
        ...(useImage ? { enable_safety_checker: true } : {}),
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
    endpoint,
  });
}
