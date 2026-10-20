import { NextResponse } from 'next/server';
import {
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

const ENDPOINT = 'google-nano-banana-2-edit';

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function findImageUrl(value: unknown): string | null {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    if (value.includes('runpod.ai') || /\.(png|jpe?g|webp)(\?|$)/i.test(value)) {
      return value;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);
      if (found) return found;
    }
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = findImageUrl(nested);
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

  const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT}/status/${encodeURIComponent(id)}`, {
    headers: runpodHeaders(apiKey),
    cache: 'no-store',
  });

  const data = await readRunpodBody(response);

  if (!response.ok) {
    return jsonError(runpodErrorMessage(data.error, 'Runpod status request failed.'), response.status);
  }

  const output = data.output as { image_url?: string; cost?: number } | undefined;

  return NextResponse.json({
    id: data.id ?? id,
    status: data.status ?? 'UNKNOWN',
    endpoint: ENDPOINT,
    imageUrl: output?.image_url ?? findImageUrl(data.output) ?? null,
    cost: output?.cost ?? null,
    output: data.output ?? null,
    error: data.error == null ? null : runpodErrorMessage(data.error, 'Runpod job failed.'),
  });
}
