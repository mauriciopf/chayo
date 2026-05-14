import crypto from 'crypto';

import { NextResponse } from 'next/server';

const XAI_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 50;
const DEFAULT_DURATION = 15;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function isFileEntry(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    'size' in value &&
    'type' in value
  );
}

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

  const formData = await request.formData();
  const prompt = String(formData.get('prompt') ?? '').trim();
  const imageEntry = formData.get('image');
  const durationValue = Number(formData.get('duration'));
  const duration =
    Number.isFinite(durationValue) && durationValue >= 1 && durationValue <= 15
      ? durationValue
      : DEFAULT_DURATION;
  const batchSizeValue = Number(formData.get('batchSize'));
  const batchSize =
    Number.isFinite(batchSizeValue) && batchSizeValue >= 1 && batchSizeValue <= MAX_BATCH_SIZE
      ? Math.round(batchSizeValue)
      : DEFAULT_BATCH_SIZE;

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  if (!isFileEntry(imageEntry) || imageEntry.size === 0) {
    return jsonError('A valid image upload is required.', 400);
  }

  if (!ALLOWED_IMAGE_TYPES.has(imageEntry.type)) {
    return jsonError('Only JPEG, PNG, or WebP images are supported.', 400);
  }

  if (imageEntry.size > MAX_IMAGE_BYTES) {
    return jsonError('Image must be 10 MB or smaller.', 400);
  }

  const imageBuffer = Buffer.from(await imageEntry.arrayBuffer());
  const imageDataUri = `data:${imageEntry.type};base64,${imageBuffer.toString('base64')}`;
  const requestIds = Array.from({ length: batchSize }, (_, index) => {
    const suffix = crypto.randomUUID().slice(0, 8);

    return `grok-imagine-video-${String(index + 1).padStart(2, '0')}-${suffix}`;
  });

  const jsonl = requestIds
    .map((batchRequestId) =>
      JSON.stringify({
        custom_id: batchRequestId,
        method: 'POST',
        url: '/v1/videos/generations',
        body: {
          model: 'grok-imagine-video',
          prompt,
          image: { url: imageDataUri },
          duration,
        },
      }),
    )
    .join('\n');

  const uploadBody = new FormData();
  uploadBody.append('file', new Blob([jsonl], { type: 'application/jsonl' }), 'grok-imagine-video-batch.jsonl');

  const uploadResponse = await fetch(`${XAI_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: uploadBody,
  });

  if (!uploadResponse.ok) {
    return jsonError(`Failed to upload batch file to xAI: ${await readResponseText(uploadResponse)}`, uploadResponse.status);
  }

  const uploadedFile = (await uploadResponse.json()) as { id?: string };

  if (!uploadedFile.id) {
    return jsonError('xAI did not return a file id for the uploaded batch file.', 502);
  }

  const batchResponse = await fetch(`${XAI_BASE_URL}/batches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `grok-imagine-video-batch-${new Date().toISOString()}`,
      input_file_id: uploadedFile.id,
    }),
  });

  if (!batchResponse.ok) {
    return jsonError(`Failed to create xAI batch: ${await readResponseText(batchResponse)}`, batchResponse.status);
  }

  const batch = (await batchResponse.json()) as XaiBatchResponse;

  return NextResponse.json({
    batch,
    requestIds,
    requestCount: batchSize,
    duration,
  });
}