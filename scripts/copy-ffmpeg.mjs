import { chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const destinationDir = path.join(process.cwd(), 'lib/video/bin');
const destination = path.join(destinationDir, 'ffmpeg');

let source;

try {
  source = require('ffmpeg-static');
} catch {
  console.error('ffmpeg-static is not installed.');
  process.exit(1);
}

if (typeof source !== 'string' || !existsSync(source)) {
  console.error('ffmpeg-static did not provide a binary.');
  process.exit(1);
}

mkdirSync(destinationDir, { recursive: true });
copyFileSync(source, destination);
chmodSync(destination, 0o755);

const copied = lstatSync(destination);

if (copied.isSymbolicLink() || statSync(destination).size < 1_000_000) {
  console.error('The copied ffmpeg binary is not a real file.');
  process.exit(1);
}

console.log(`Copied ffmpeg to ${destination}`);
