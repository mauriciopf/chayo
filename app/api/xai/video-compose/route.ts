import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';

import {
  concatVideos,
  createTmpFilePath,
  downloadToPath,
  ensureTmpDir,
  safeUnlink,
  writeUploadedFileToPath,
} from '@/lib/video/ffmpeg';

export const runtime = 'nodejs';

const ALLOWED_HOSTNAMES = new Set(['vidgen.x.ai']);

function isFileEntry(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    'size' in value &&
    'type' in value
  );
}

function isAllowedVideoUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_HOSTNAMES.has(parsed.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  await ensureTmpDir();

  const formData = await request.formData();
  const originalVideoEntry = formData.get('originalVideo');
  const extensionVideoUrl = String(formData.get('extensionVideoUrl') ?? '').trim();

  if (!isFileEntry(originalVideoEntry) || originalVideoEntry.size === 0) {
    return NextResponse.json({ error: 'A valid original video upload is required.' }, { status: 400 });
  }

  if (!extensionVideoUrl || !isAllowedVideoUrl(extensionVideoUrl)) {
    return NextResponse.json({ error: 'A valid extension video URL is required.' }, { status: 400 });
  }

  const originalPath = createTmpFilePath('original.mp4');
  const extensionPath = createTmpFilePath('extension.mp4');
  const outputPath = createTmpFilePath('composed.mp4');

  try {
    await writeUploadedFileToPath(originalVideoEntry, originalPath);
    await downloadToPath(extensionVideoUrl, extensionPath);

    await concatVideos({
      inputPaths: [originalPath, extensionPath],
      outputPath,
    });

    const composedBuffer = await fs.readFile(outputPath);

    return new Response(composedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="composed-video.mp4"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to compose final video.';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await Promise.all([safeUnlink(originalPath), safeUnlink(extensionPath), safeUnlink(outputPath)]);
  }
}
