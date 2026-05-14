import crypto from 'crypto';

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

  const requestIds = Array.from({ length: batchSize }, (_, index) => {
    const suffix = crypto.randomUUID().slice(0, 8);

    return `grok-imagine-extend-${String(index + 1).padStart(2, '0')}-${suffix}`;
  });

  // Create an empty batch first, then add structured requests.
  const createBatchResponse = await fetch(`${XAI_BASE_URL}/batches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `grok-imagine-extend-batch-${new Date().toISOString()}`,
    }),
  });

  if (!createBatchResponse.ok) {
    return jsonError(`Failed to create xAI batch: ${await readResponseText(createBatchResponse)}`, createBatchResponse.status);
  }

  const createdBatch = (await createBatchResponse.json()) as XaiBatchResponse;

  if (!createdBatch.batch_id) {
    return jsonError('xAI did not return a batch_id for the created batch.', 502);
  }

  const addRequestsResponse = await fetch(`${XAI_BASE_URL}/batches/${createdBatch.batch_id}/requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Extension batches send exactly one request shape per item: batch_request.video_extension.
      batch_requests: requestIds.map((batchRequestId) => ({
        batch_request_id: batchRequestId,
        batch_request: {
          video_extension: {
            model: 'grok-imagine-video',
            prompt,
            video: { url: videoUrl },
            duration,
          },
        },
      })),
    }),
  });

  if (!addRequestsResponse.ok) {
    return jsonError(`Failed to add extension requests to xAI batch: ${await readResponseText(addRequestsResponse)}`, addRequestsResponse.status);
  }

  const batchResponse = await fetch(`${XAI_BASE_URL}/batches/${createdBatch.batch_id}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store',
  });

  if (!batchResponse.ok) {
    return jsonError(`Failed to read xAI batch status: ${await readResponseText(batchResponse)}`, batchResponse.status);
  }

  const batch = (await batchResponse.json()) as XaiBatchResponse;

  return NextResponse.json({
    batch,
    requestIds,
    requestCount: batchSize,
    duration,
  });
}
