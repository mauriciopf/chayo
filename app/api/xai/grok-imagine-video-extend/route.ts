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

type XaiUploadedFileResponse = {
  id?: string;
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

  const contentType = request.headers.get('content-type') ?? '';
  const isMultipart = contentType.includes('multipart/form-data');

  let videoUrl = '';
  let videoFileId = '';
  let prompt = '';
  let durationValue = Number.NaN;
  let batchSizeValue = Number.NaN;

  if (isMultipart) {
    const formData = await request.formData();
    prompt = String(formData.get('prompt') ?? '').trim();
    durationValue = Number(formData.get('duration'));
    batchSizeValue = Number(formData.get('batchSize'));
    const videoEntry = formData.get('video');

    if (!isFileEntry(videoEntry) || videoEntry.size === 0) {
      return jsonError('A valid video upload is required.', 400);
    }

    const uploadBody = new FormData();
    uploadBody.append('file', videoEntry, videoEntry.name || 'source-video.mp4');

    const uploadResponse = await fetch(`${XAI_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: uploadBody,
    });

    if (!uploadResponse.ok) {
      return jsonError(`Failed to upload source video to xAI: ${await readResponseText(uploadResponse)}`, uploadResponse.status);
    }

    const uploadedFile = (await uploadResponse.json()) as XaiUploadedFileResponse;

    if (!uploadedFile.id) {
      return jsonError('xAI did not return a file id for the uploaded source video.', 502);
    }

    videoFileId = uploadedFile.id;
  } else {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError('Request body must be valid JSON.', 400);
    }

    const bodyObj = body as Record<string, unknown>;
    videoUrl = String(bodyObj.videoUrl ?? '').trim();
    prompt = String(bodyObj.prompt ?? '').trim();
    durationValue = Number(bodyObj.duration);
    batchSizeValue = Number(bodyObj.batchSize);
  }

  const duration =
    Number.isFinite(durationValue) && durationValue >= MIN_DURATION && durationValue <= MAX_DURATION
      ? durationValue
      : DEFAULT_DURATION;
  const batchSize =
    Number.isFinite(batchSizeValue) && batchSizeValue >= 1 && batchSizeValue <= MAX_BATCH_SIZE
      ? Math.round(batchSizeValue)
      : DEFAULT_BATCH_SIZE;

  if (!videoUrl && !videoFileId) {
    return jsonError('A video URL is required.', 400);
  }

  if (videoUrl && !videoUrl.startsWith('https://')) {
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
            video: videoFileId ? { file_id: videoFileId } : { url: videoUrl },
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
