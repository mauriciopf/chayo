import { NextResponse } from 'next/server';

const XAI_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 50;
const MIN_DURATION = 2;
const DEFAULT_DURATION = 10;
const MAX_DURATION = 10;

type XaiBatchResponse = {
  batch_id: string;
  name: string;
  create_time: string;
  expire_time?: string | null;
  state: {
    num_requests: number;
    num_pending: number;
    num_success: number;
    num_error: number;
    num_cancelled: number;
  };
};

type XaiVideoExtensionStartResponse = {
  request_id: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readResponseText(response: Response) {
  const text = await response.text();
  return text || 'Unknown xAI error';
}

export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return jsonError('Missing XAI_API_KEY environment variable.', 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const bodyObj = body as Record<string, unknown>;
  const videoUrl = String(bodyObj.videoUrl ?? '').trim();
  const prompt = String(bodyObj.prompt ?? '').trim();
  const durationValue = Number(bodyObj.duration);
  const duration =
    Number.isFinite(durationValue) && durationValue >= MIN_DURATION && durationValue <= MAX_DURATION
      ? durationValue
      : DEFAULT_DURATION;
  const batchSizeValue = Number(bodyObj.batchSize);
  const batchSize =
    Number.isFinite(batchSizeValue) && batchSizeValue >= 1 && batchSizeValue <= MAX_BATCH_SIZE
      ? Math.round(batchSizeValue)
      : DEFAULT_BATCH_SIZE;

  if (!videoUrl) {
    return jsonError('A video URL is required.', 400);
  }

  if (!videoUrl.startsWith('https://')) {
    return jsonError('Video URL must be HTTPS.', 400);
  }

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  let requestResponses: XaiVideoExtensionStartResponse[];

  try {
    requestResponses = await Promise.all(
      Array.from({ length: batchSize }, async () => {
        const extensionResponse = await fetch(`${XAI_BASE_URL}/videos/extensions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-imagine-video',
            prompt,
            video: { url: videoUrl },
            duration,
          }),
        });

        if (!extensionResponse.ok) {
          throw new Error(`Failed to start extension request: ${await readResponseText(extensionResponse)}`);
        }

        return (await extensionResponse.json()) as XaiVideoExtensionStartResponse;
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start extension request.';
    return jsonError(message, 502);
  }

  const requestIds = requestResponses.map((item) => item.request_id).filter(Boolean);

  if (requestIds.length !== batchSize) {
    return jsonError('xAI did not return request_id for all extension requests.', 502);
  }

  const nowIso = new Date().toISOString();
  const batch: XaiBatchResponse = {
    batch_id: `extension-${nowIso}`,
    name: `grok-imagine-extend-requests-${nowIso}`,
    create_time: nowIso,
    expire_time: null,
    state: {
      num_requests: batchSize,
      num_pending: batchSize,
      num_success: 0,
      num_error: 0,
      num_cancelled: 0,
    },
  };

  return NextResponse.json({
    batch,
    requestIds,
    requestCount: batchSize,
    duration,
  });
}
