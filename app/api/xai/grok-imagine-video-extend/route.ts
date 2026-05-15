import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';

import {
  createTmpFilePath,
  downloadToPath,
  ensureTmpDir,
  probeVideoDurationSeconds,
  safeUnlink,
  trimVideoSegment,
  writeUploadedFileToPath,
} from '@/lib/video/ffmpeg';

const XAI_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 50;
const MIN_DURATION = 2;
const DEFAULT_DURATION = 10;
const MAX_DURATION = 10;
const MAX_EXTENSION_INPUT_SECONDS = 15;
const INTER_REQUEST_DELAY_MS = 1100;
const RATE_LIMIT_RETRY_BASE_DELAY_MS = 1200;
const MAX_RATE_LIMIT_RETRIES = 5;

export const runtime = 'nodejs';

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

type SourceProcessing = {
  strategy: 'passthrough' | 'trim-last-15s';
  originalDurationSeconds: number;
  preparedDurationSeconds: number;
  trimStartSeconds: number;
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

/**
 * Prepare a video file for xAI extension by probing, trimming if necessary,
 * and uploading to xAI's file storage.
 * Returns the file ID and metadata about the preparation process.
 */
async function prepareVideoSourceForExtension(
  inputPath: string,
  apiKey: string,
  originalFileName: string = 'source-video.mp4'
): Promise<{ fileId: string; sourceProcessing: SourceProcessing }> {
  const originalDurationSeconds = await probeVideoDurationSeconds(inputPath);

  let uploadPath = inputPath;
  let trimStartSeconds = 0;
  let strategy: SourceProcessing['strategy'] = 'passthrough';
  let preparedDurationSeconds = originalDurationSeconds;

  if (originalDurationSeconds > MAX_EXTENSION_INPUT_SECONDS) {
    trimStartSeconds = Math.max(0, originalDurationSeconds - MAX_EXTENSION_INPUT_SECONDS);
    strategy = 'trim-last-15s';
    preparedDurationSeconds = MAX_EXTENSION_INPUT_SECONDS;

    const preparedPath = createTmpFilePath('prepared.mp4');

    try {
      await trimVideoSegment({
        inputPath,
        outputPath: preparedPath,
        startSeconds: trimStartSeconds,
        durationSeconds: MAX_EXTENSION_INPUT_SECONDS,
      });
      uploadPath = preparedPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trim video.';
      throw new Error(`Failed to prepare video: ${message}`);
    }
  }

  const preparedBuffer = await fs.readFile(uploadPath);

  const uploadBody = new FormData();
  uploadBody.append('file', new Blob([preparedBuffer], { type: 'video/mp4' }), originalFileName);

  const uploadResponse = await fetch(`${XAI_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: uploadBody,
  });

  if (!uploadResponse.ok) {
    const errorText = await readResponseText(uploadResponse);
    throw new Error(`Failed to upload source video to xAI: ${errorText}`);
  }

  const uploadedFile = (await uploadResponse.json()) as XaiUploadedFileResponse;

  if (!uploadedFile.id) {
    throw new Error('xAI did not return a file id for the uploaded source video.');
  }

  const sourceProcessing: SourceProcessing = {
    strategy,
    originalDurationSeconds,
    preparedDurationSeconds,
    trimStartSeconds,
  };

  // Clean up any temporary prepared file (not the original input path)
  if (uploadPath !== inputPath) {
    await safeUnlink(uploadPath);
  }

  return { fileId: uploadedFile.id, sourceProcessing };
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readResponseText(response: Response) {
  const text = await response.text();
  return text || 'Unknown xAI error';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitedResponse(status: number, text: string) {
  if (status === 429) {
    return true;
  }

  const normalized = text.toLowerCase();
  return (
    normalized.includes('too many requests') ||
    normalized.includes('rate limit') ||
    normalized.includes('resource has been exhausted')
  );
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
  let sourceProcessing: SourceProcessing | null = null;

  if (isMultipart) {
    await ensureTmpDir();
    const formData = await request.formData();
    prompt = String(formData.get('prompt') ?? '').trim();
    durationValue = Number(formData.get('duration'));
    batchSizeValue = Number(formData.get('batchSize'));
    const videoEntry = formData.get('video');

    if (!isFileEntry(videoEntry) || videoEntry.size === 0) {
      return jsonError('A valid video upload is required.', 400);
    }

    const originalPath = createTmpFilePath('upload-original.mp4');

    try {
      await writeUploadedFileToPath(videoEntry, originalPath);

      const result = await prepareVideoSourceForExtension(
        originalPath,
        apiKey,
        videoEntry.name || 'source-video.mp4'
      );

      videoFileId = result.fileId;
      sourceProcessing = result.sourceProcessing;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to prepare uploaded source video.';
      return jsonError(`Failed to prepare uploaded source video: ${message}`, 500);
    } finally {
      await safeUnlink(originalPath);
    }
  } else {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError('Request body must be valid JSON.', 400);
    }

    const bodyObj = body as Record<string, unknown>;
    const requestVideoUrl = String(bodyObj.videoUrl ?? '').trim();
    prompt = String(bodyObj.prompt ?? '').trim();
    durationValue = Number(bodyObj.duration);
    batchSizeValue = Number(bodyObj.batchSize);

    if (!requestVideoUrl) {
      return jsonError('A video URL is required.', 400);
    }

    if (!requestVideoUrl.startsWith('https://')) {
      return jsonError('Video URL must be HTTPS.', 400);
    }

    // Download, probe, trim if needed, and upload the video source
    await ensureTmpDir();
    const downloadedPath = createTmpFilePath('downloaded-source.mp4');

    try {
      await downloadToPath(requestVideoUrl, downloadedPath);

      const result = await prepareVideoSourceForExtension(downloadedPath, apiKey, 'extension-source.mp4');

      videoFileId = result.fileId;
      sourceProcessing = result.sourceProcessing;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to prepare video from URL.';
      return jsonError(`Failed to prepare video from URL: ${message}`, 500);
    } finally {
      await safeUnlink(downloadedPath);
    }
  }

  const duration =
    Number.isFinite(durationValue) && durationValue >= MIN_DURATION && durationValue <= MAX_DURATION
      ? durationValue
      : DEFAULT_DURATION;
  const batchSize =
    Number.isFinite(batchSizeValue) && batchSizeValue >= 1 && batchSizeValue <= MAX_BATCH_SIZE
      ? Math.round(batchSizeValue)
      : DEFAULT_BATCH_SIZE;

  if (!videoFileId) {
    return jsonError('Failed to prepare video source.', 400);
  }

  if (!prompt) {
    return jsonError('A prompt is required.', 400);
  }

  const requestResponses: XaiVideoExtensionStartResponse[] = [];

  try {
    for (let index = 0; index < batchSize; index += 1) {
      let started = false;

      for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
        const extensionResponse = await fetch(`${XAI_BASE_URL}/videos/extensions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-imagine-video',
            prompt,
            video: { file_id: videoFileId },
            duration,
          }),
        });

        if (extensionResponse.ok) {
          requestResponses.push((await extensionResponse.json()) as XaiVideoExtensionStartResponse);
          started = true;
          break;
        }

        const errorText = await readResponseText(extensionResponse);
        const isRateLimited = isRateLimitedResponse(extensionResponse.status, errorText);

        if (isRateLimited && attempt < MAX_RATE_LIMIT_RETRIES) {
          const retryDelay = RATE_LIMIT_RETRY_BASE_DELAY_MS * (attempt + 1);
          await sleep(retryDelay);
          continue;
        }

        throw new Error(`Failed to start extension request: ${errorText}`);
      }

      if (!started) {
        throw new Error('Failed to start extension request after retrying rate limits.');
      }

      if (index < batchSize - 1) {
        await sleep(INTER_REQUEST_DELAY_MS);
      }
    }
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
    sourceProcessing,
  });
}
