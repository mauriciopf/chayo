import { NextResponse } from 'next/server';
import {
  WAN_ENDPOINT_BASE,
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function findVideoUrl(value: unknown): string | null {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    if (value.includes('video.runpod.ai') || /\.(mp4|webm|mov)(\?|$)/i.test(value)) {
      return value;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideoUrl(item);
      if (found) return found;
    }
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = findVideoUrl(nested);
      if (found) return found;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const apiKey = getRunpodApiKey();

  if (!apiKey) {
    return jsonError('Missing RUNPOD_API_KEY environment variable.', 500);
  }

  const id = new URL(request.url).searchParams.get('id')?.trim();

  if (!id) {
    return jsonError('Job id is required.', 400);
  }

  const response = await fetch(`${WAN_ENDPOINT_BASE}/status/${encodeURIComponent(id)}`, {
    headers: runpodHeaders(apiKey),
    cache: 'no-store',
  });

  const data = await readRunpodBody(response);

  if (!response.ok) {
    return jsonError(runpodErrorMessage(data.error, 'Runpod status request failed.'), response.status);
  }

  return NextResponse.json({
    id: data.id ?? id,
    status: data.status ?? 'UNKNOWN',
    videoUrl: data.output?.video_url ?? findVideoUrl(data.output) ?? null,
    cost: data.output?.cost ?? null,
    output: data.output ?? null,
    error: data.error == null ? null : runpodErrorMessage(data.error, 'Runpod job failed.'),
  });
}
