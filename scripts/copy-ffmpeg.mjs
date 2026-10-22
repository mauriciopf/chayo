import { chmodSync, copyFileSync, createWriteStream, existsSync, lstatSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { get } from 'node:https';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const destinationDir = path.join(process.cwd(), 'lib/video/bin');
const destination = path.join(destinationDir, 'ffmpeg');

function installedBinary() {
  try {
    const source = require('ffmpeg-static');
    return typeof source === 'string' && existsSync(source) ? source : '';
  } catch {
    return '';
  }
}

function releaseTag() {
  try {
    const pkg = require('ffmpeg-static/package.json');
    return pkg['ffmpeg-static']['binary-release-tag'];
  } catch {
    return 'b6.1.1';
  }
}

function getUrl(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const request = get(url, { headers: { 'user-agent': 'chayo-build' } }, (response) => {
      const status = response.statusCode ?? 0;

      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();

        if (redirectsLeft <= 0) {
          reject(new Error(`Too many redirects for ${url}`));
          return;
        }

        const nextUrl = new URL(response.headers.location, url).href;
        resolve(getUrl(nextUrl, redirectsLeft - 1));
        return;
      }

      if (status !== 200) {
        response.resume();
        reject(new Error(`Download failed (${status}) for ${url}`));
        return;
      }

      resolve(response);
    });

    request.setTimeout(120_000, () => {
      request.destroy(new Error(`Download timed out for ${url}`));
    });
    request.on('error', reject);
  });
}

async function downloadBinary() {
  const release = releaseTag();
  const url = `https://github.com/eugeneware/ffmpeg-static/releases/download/${release}/ffmpeg-${os.platform()}-${os.arch()}.gz`;
  console.log(`Downloading ${url}`);
  const response = await getUrl(url);
  await pipeline(response, createGunzip(), createWriteStream(destination));
}

async function main() {
  mkdirSync(destinationDir, { recursive: true });
  const source = installedBinary();

  if (source) {
    copyFileSync(source, destination);
    console.log(`Copied ffmpeg from ${source}`);
  } else {
    console.log('ffmpeg-static has no binary yet. Downloading the release build.');
    await downloadBinary();
  }

  chmodSync(destination, 0o755);
  const copied = lstatSync(destination);

  if (copied.isSymbolicLink() || statSync(destination).size < 1_000_000) {
    console.error('The ffmpeg binary is not a real file.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
