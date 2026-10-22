import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createTmpFilePath, ensureTmpDir, runFfmpeg } from './ffmpeg';

const WIDTH = 1080;
const HEIGHT = 1350;
const FONT_DIR = path.join(process.cwd(), 'lib/video/fonts');

const THEMES = {
  titi: { band: '1C3C80', text: 'F9F6EF' },
  sunny: { band: '0A1F4A', text: 'C9A24A' },
  plain: { band: '1A1A1A', text: 'F7F3EA' },
} as const;

export type OverlayTheme = keyof typeof THEMES;

export function parseOverlayLines(text: unknown, lines: unknown) {
  const source = Array.isArray(lines) ? lines : typeof text === 'string' ? text.split(/\r?\n/) : [];
  return source.map((line) => (typeof line === 'string' ? line.trim() : '')).filter(Boolean);
}

export function overlayLineError(lines: string[]) {
  if (lines.length < 1 || lines.length > 3) {
    return 'A video slide needs 1 to 3 lines of overlay text.';
  }

  if (lines.some((line) => line.length > 36)) {
    return 'Each overlay line must be 36 characters or fewer.';
  }

  return null;
}

function assColor(hex: string) {
  const red = hex.slice(0, 2);
  const green = hex.slice(2, 4);
  const blue = hex.slice(4, 6);
  return `&H00${blue}${green}${red}`.toUpperCase();
}

function escapeAss(line: string) {
  return line.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

function filterPath(filePath: string) {
  return filePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function scriptFor(lines: string[], theme: OverlayTheme) {
  const colors = THEMES[theme];
  const longest = Math.max(...lines.map((line) => line.length));
  const fontSize = Math.max(42, Math.min(68, Math.floor(940 / (longest * 0.52))));
  const lineGap = Math.round(fontSize * 0.28);
  const textBlock = fontSize * lines.length + lineGap * Math.max(0, lines.length - 1);
  const bandHeight = Math.round(textBlock + fontSize * 1.15);
  const bandTop = HEIGHT - bandHeight;
  const marginV = Math.max(48, Math.round((bandHeight - textBlock) / 2));
  const band = assColor(colors.band);
  const text = assColor(colors.text);
  const spoken = lines.map(escapeAss).join('\\N');

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${WIDTH}
PlayResY: ${HEIGHT}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Band,Inter,40,${band},&H000000FF,${band},${band},1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Offer,Inter,${fontSize},${text},&H000000FF,${text},${band},1,0,0,0,100,100,0,0,1,0,0,2,70,70,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,1:00:00.00,Band,,0,0,0,,{\\an7\\pos(0,${bandTop})\\p1}m 0 0 l ${WIDTH} 0 ${WIDTH} ${bandHeight} 0 ${bandHeight}{\\p0}
Dialogue: 1,0:00:00.00,1:00:00.00,Offer,,0,0,0,,${spoken}
`;
}

export async function renderCarouselClip({
  sourcePath,
  outputPath,
  lines,
  theme,
}: {
  sourcePath: string;
  outputPath: string;
  lines: string[];
  theme: OverlayTheme;
}) {
  await ensureTmpDir();
  const scriptPath = createTmpFilePath('overlay.ass');
  await fs.writeFile(scriptPath, scriptFor(lines, theme), 'utf8');
  const filter = [
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${WIDTH}:${HEIGHT}`,
    `subtitles=${filterPath(scriptPath)}:fontsdir=${filterPath(FONT_DIR)}:original_size=${WIDTH}x${HEIGHT}`,
  ].join(',');
  let probed = '';

  try {
    await runFfmpeg(['-i', sourcePath]);
  } catch (error) {
    probed = error instanceof Error ? error.message : '';
  }

  const audioArgs = /Audio:/.test(probed)
    ? ['-map', '0:a:0', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2']
    : [];

  try {
    await runFfmpeg([
      '-y',
      '-i',
      sourcePath,
      ...(audioArgs.length > 0 ? [] : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000']),
      '-filter_complex',
      `[0:v]${filter}[v]`,
      '-map',
      '[v]',
      ...(audioArgs.length > 0 ? audioArgs : ['-map', '1:a:0', '-shortest', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2']),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outputPath,
    ]);
  } finally {
    await fs.unlink(scriptPath).catch(() => undefined);
  }
}
