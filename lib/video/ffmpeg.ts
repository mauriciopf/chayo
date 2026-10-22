import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { accessSync, chmodSync, constants, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import ffmpegPath from 'ffmpeg-static';

const TMP_DIR = path.join(os.tmpdir(), 'chayo-video-pipeline');
const require = createRequire(import.meta.url);

function ffmpegCandidates() {
  const candidates = [process.env.FFMPEG_PATH, ffmpegPath];

  try {
    const resolved = require('ffmpeg-static') as string | null;
    if (resolved) candidates.push(resolved);
  } catch {
    // The package is absent from this bundle.
  }

  candidates.push(path.join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'));

  return candidates.filter((candidate): candidate is string => Boolean(candidate));
}

function getFfmpegPath(): string {
  for (const candidate of ffmpegCandidates()) {
    if (!existsSync(candidate)) continue;

    try {
      accessSync(candidate, constants.X_OK);
    } catch {
      try {
        chmodSync(candidate, 0o755);
        accessSync(candidate, constants.X_OK);
      } catch {
        continue;
      }
    }

    return candidate;
  }

  return 'ffmpeg';
}

export async function ensureTmpDir() {
  await fs.mkdir(TMP_DIR, { recursive: true });
}

export function createTmpFilePath(name: string) {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return path.join(TMP_DIR, `${token}-${name}`);
}

export async function runFfmpeg(args: string[]) {
  const ffmpeg = getFfmpegPath();

  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`${error.message} (${ffmpeg})`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr || `ffmpeg exited with code ${code}.`));
    });
  });
}

export async function writeUploadedFileToPath(file: File, filePath: string) {
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

export async function probeVideoDurationSeconds(inputPath: string) {
  const ffmpeg = getFfmpegPath();

  const probeOutput = await new Promise<string>((resolve, reject) => {
    const child = spawn(ffmpeg, ['-i', inputPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`${error.message} (${ffmpeg})`));
    });

    child.on('close', () => {
      resolve(stderr);
    });
  });

  const durationMatch = probeOutput.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);

  if (!durationMatch) {
    throw new Error('Failed to probe video duration.');
  }

  const hours = Number(durationMatch[1]);
  const minutes = Number(durationMatch[2]);
  const seconds = Number(durationMatch[3]);

  return hours * 3600 + minutes * 60 + seconds;
}

export async function trimVideoSegment({
  inputPath,
  outputPath,
  startSeconds,
  durationSeconds,
}: {
  inputPath: string;
  outputPath: string;
  startSeconds: number;
  durationSeconds: number;
}) {
  await runFfmpeg([
    '-y',
    '-ss',
    String(Math.max(0, startSeconds)),
    '-i',
    inputPath,
    '-t',
    String(Math.max(0.1, durationSeconds)),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    outputPath,
  ]);
}

export async function concatVideos({
  inputPaths,
  outputPath,
}: {
  inputPaths: string[];
  outputPath: string;
}) {
  if (inputPaths.length < 2) {
    throw new Error('At least two input videos are required to concatenate.');
  }

  const listPath = createTmpFilePath('concat-list.txt');
  const listContent = inputPaths
    .map((inputPath) => `file '${inputPath.replace(/'/g, "'\\''")}'`)
    .join('\n');

  await fs.writeFile(listPath, listContent, 'utf8');

  try {
    await runFfmpeg([
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      outputPath,
    ]);
  } finally {
    await safeUnlink(listPath);
  }
}

export async function downloadToPath(url: string, outputPath: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download video (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
}

export async function safeUnlink(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup failures.
  }
}
