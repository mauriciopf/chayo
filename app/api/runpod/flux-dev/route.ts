import { NextResponse } from 'next/server';
import {
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

const ENDPOINT = 'black-forest-labs-flux-1-dev';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function dimension(value: unknown, fallback: number) {
  const size = value == null || value === '' ? fallback : Number(value);
  return Number.isInteger(size) && size >= 256 && size <= 1536 && size % 64 === 0 ? size : null;
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
  const width = dimension(input.width, 1024);
  const height = dimension(input.height, 1280);

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (width == null || height == null) {
    return jsonError('Width and height must be multiples of 64 between 256 and 1536.', 400);
  }

  const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT}/run`, {
    method: 'POST',
    headers: runpodHeaders(apiKey),
    body: JSON.stringify({
      input: {
        prompt,
        negative_prompt:
          'text, letters, words, logo, watermark, signature, blurry, low quality, distorted',
        width,
        height,
        num_inference_steps: 28,
        guidance: 7.5,
        seed: -1,
        image_format: 'jpeg',
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
    width,
    height,
  });
}
