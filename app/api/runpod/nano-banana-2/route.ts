import { NextResponse } from 'next/server';
import {
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

const ENDPOINT = 'google-nano-banana-2-edit';
const RESOLUTIONS = new Set(['1k', '2k', '4k']);
const ASPECT_RATIOS = new Set(['1:1', '3:2', '2:3', '4:5', '5:4', '16:9', '9:16']);

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPublicHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
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

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  const resolution = typeof input.resolution === 'string' ? input.resolution : '2k';
  const aspectRatio = typeof input.aspectRatio === 'string' ? input.aspectRatio : '4:5';
  const images = Array.isArray(input.images) ? input.images.filter((item): item is string => typeof item === 'string') : [];

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (!RESOLUTIONS.has(resolution)) {
    return jsonError('Resolution must be 1k, 2k, or 4k.', 400);
  }

  if (!ASPECT_RATIOS.has(aspectRatio)) {
    return jsonError('Aspect ratio must be 1:1, 3:2, 2:3, 4:5, 5:4, 16:9, or 9:16.', 400);
  }

  if (images.length < 1 || images.length > 3 || images.some((image) => !isPublicHttpsUrl(image))) {
    return jsonError('Send 1 to 3 public https reference images.', 400);
  }

  const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT}/run`, {
    method: 'POST',
    headers: runpodHeaders(apiKey),
    body: JSON.stringify({
      input: {
        prompt,
        images,
        resolution,
        aspect_ratio: aspectRatio,
        output_format: 'jpeg',
        enable_base64_output: false,
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
    endpoint: ENDPOINT,
    resolution,
    aspectRatio,
  });
}
