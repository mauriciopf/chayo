import { NextResponse } from 'next/server';
import {
  getRunpodApiKey,
  readRunpodBody,
  runpodErrorMessage,
  runpodHeaders,
} from '@/lib/runpod/wan';

const ENDPOINT = 'vidu-q3-t2v';
const RESOLUTIONS = new Set(['540p', '720p', '1080p']);
const ASPECT_RATIOS = new Set(['16:9', '9:16', '4:3', '3:4', '1:1']);
const MOVEMENT = new Set(['auto', 'small', 'medium', 'large']);
const STYLES = new Set(['general', 'anime']);

export const dynamic = 'force-dynamic';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function flag(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  return fallback;
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
  const duration = input.duration == null || input.duration === '' ? 15 : Number(input.duration);
  const resolution = String(input.resolution ?? '1080p');
  const aspectRatio = String(input.aspectRatio ?? '9:16');
  const movement = String(input.movementAmplitude ?? 'auto');
  const style = String(input.style ?? 'general');
  const generateAudio = flag(input.generateAudio, true);
  const bgm = flag(input.bgm, true);

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (!Number.isInteger(duration) || duration < 1 || duration > 16) {
    return jsonError('Duration must be from 1 to 16 seconds.', 400);
  }

  if (!RESOLUTIONS.has(resolution)) {
    return jsonError('Resolution must be 540p, 720p, or 1080p.', 400);
  }

  if (!ASPECT_RATIOS.has(aspectRatio)) {
    return jsonError('Aspect ratio must be 16:9, 9:16, 4:3, 3:4, or 1:1.', 400);
  }

  if (!MOVEMENT.has(movement)) {
    return jsonError('Movement must be auto, small, medium, or large.', 400);
  }

  if (!STYLES.has(style)) {
    return jsonError('Style must be general or anime.', 400);
  }

  const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT}/run`, {
    method: 'POST',
    headers: runpodHeaders(apiKey),
    body: JSON.stringify({
      input: {
        prompt,
        style,
        resolution,
        duration,
        aspect_ratio: aspectRatio,
        movement_amplitude: movement,
        generate_audio: generateAudio,
        bgm,
        seed: -1,
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
    duration,
    resolution,
    aspectRatio,
    generateAudio,
    bgm,
  });
}
