import { promises as fs } from 'node:fs';

import { NextResponse } from 'next/server';
import { instagramCredentials, missingAccountMessage, readAccountName } from '@/lib/instagram/accounts';
import { hostCarouselClip } from '@/lib/instagram/clip-host';
import { overlayLineError, parseOverlayLines, renderCarouselClip, type OverlayTheme } from '@/lib/video/carousel-clip';
import { createTmpFilePath, downloadToPath, ensureTmpDir, safeUnlink } from '@/lib/video/ffmpeg';

const CAPTION_LIMIT = 2200;
const SLIDE_MIN = 2;
const SLIDE_MAX = 10;
const REFERENCES = new Set(['logo', 'cart', 'uniforms', 'toppings']);
const VIDEO_DIRECTION =
  'A Greek frozen yogurt shop in Aventura or Sunny Isles. Follow the story in the prompt. The cup stays large: thick white yogurt, blue and white. A stranger can tell this is frozen yogurt. Fast cuts. Any words on screen are only these, spelled exactly: Greek frozen yogurt. High protein. Low sugar.';
const SUNNY_VIDEO_DIRECTION =
  'Sunny Isles One, a paperwork shop in Sunny Isles Beach. Follow the story in the prompt. Navy, gold, and white. Show the work being filed, not a portrait. Any words on screen name a real service and are spelled exactly: forms, divorce, immigration, taxes, business, translation, or insurance.';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Slide = {
  prompt: string;
  references: string[];
  images: string[];
  imageJobId: string;
  imageUrl: string;
  media: 'image' | 'video';
  lines: string[];
  videoJobId: string;
  sourceUrl: string;
  videoUrl: string;
  prepared: boolean;
  duration: number;
};

type CarouselItem = {
  type: 'image' | 'video';
  url: string;
};

type Page = {
  account: string;
  titi: boolean;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function pageFields(page: Page) {
  return page.account ? { account: page.account } : {};
}

function usesTiti(account: string) {
  return account === 'titi';
}

function isPublicHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function parseSlides(value: unknown): Slide[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const slide = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const references = stringList(slide.references).filter((name) => REFERENCES.has(name)).slice(0, 3);

    const media = asString(slide.media) === 'video' ? 'video' : 'image';
    const prepared = slide.prepared === true;
    const videoUrl = asString(slide.videoUrl);
    const durationValue = slide.duration == null || slide.duration === '' ? (media === 'video' ? 5 : 0) : Number(slide.duration);

    return {
      prompt: asString(slide.prompt),
      references,
      images: stringList(slide.images).filter(isPublicHttpsUrl).slice(0, 3),
      imageJobId: asString(slide.imageJobId),
      imageUrl: asString(slide.imageUrl),
      media,
      lines: media === 'video' ? parseOverlayLines(slide.text, slide.lines) : [],
      videoJobId: asString(slide.videoJobId),
      sourceUrl: asString(slide.sourceUrl) || (media === 'video' && !prepared ? videoUrl : ''),
      videoUrl: media === 'video' && prepared ? videoUrl : '',
      prepared: media === 'video' && prepared,
      duration: durationValue === 5 || durationValue === 10 || durationValue === 15 ? durationValue : 0,
    };
  });
}

function publicSlide(slide: Slide) {
  return {
    prompt: slide.prompt,
    ...(slide.references.length > 0 ? { references: slide.references } : {}),
    ...(slide.images.length > 0 ? { images: slide.images } : {}),
    ...(slide.imageJobId ? { imageJobId: slide.imageJobId } : {}),
    ...(slide.imageUrl ? { imageUrl: slide.imageUrl } : {}),
    ...(slide.media === 'video'
      ? {
          media: 'video' as const,
          text: slide.lines.join('\n'),
          duration: slide.duration,
          ...(slide.videoJobId ? { videoJobId: slide.videoJobId } : {}),
          ...(slide.sourceUrl ? { sourceUrl: slide.sourceUrl } : {}),
          ...(slide.videoUrl ? { videoUrl: slide.videoUrl } : {}),
          ...(slide.prepared ? { prepared: true } : {}),
        }
      : {}),
  };
}

function parseItems(value: unknown): CarouselItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const type = record.type === 'video' || record.media === 'video' ? 'video' : 'image';
    const url = asString(record.url) || (type === 'video' ? asString(record.videoUrl) : asString(record.imageUrl));

    return url ? [{ type, url }] : [];
  });
}

function isFetchableUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (url.protocol !== 'https:') return false;
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host === 'metadata.google.internal') return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;

    return true;
  } catch {
    return false;
  }
}

function brandImage(slide: Slide, last: boolean) {
  let references = slide.references.slice(0, 3);

  if (references.length === 0) {
    references = last ? ['logo', 'uniforms'] : ['uniforms'];
  }

  if (last && !references.includes('logo')) {
    references = ['logo', ...references].slice(0, 3);
  }

  return { ...slide, references };
}

function referenceUrls(origin: string, references: string[], page: Page) {
  if (page.account === 'sunny-isles-one') {
    return references.filter((name) => name === 'logo').map(() => `${origin}/brand/sunny-isles-one/logo.png`);
  }

  return references.map((name) => `${origin}/brand/${name === 'toppings' ? 'toppings.jpg' : `${name}.png`}`);
}

function slideImages(origin: string, slide: Slide, page: Page) {
  return slide.images.length > 0 ? slide.images : referenceUrls(origin, slide.references, page);
}

function sunnyImage(slide: Slide, last: boolean) {
  const references = slide.references.includes('logo') || !last ? slide.references : ['logo', ...slide.references];
  const withLogo = last && !references.includes('logo') ? ['logo', ...references].slice(0, 3) : references.slice(0, 3);
  const chosen = withLogo.length > 0 ? withLogo : ['logo'];

  return { ...slide, references: last ? Array.from(new Set(['logo', ...chosen])).slice(0, 3) : chosen };
}

function prepareSlides(slides: Slide[], page: Page) {
  const lastImage = slides.reduce((found, slide, index) => (slide.media === 'video' ? found : index), -1);

  return slides.map((slide, index) => {
    if (slide.media === 'video') return slide;

    const last = index === lastImage;

    if (page.account === 'sunny-isles-one') return sunnyImage(slide, last);
    if (page.titi) return brandImage(slide, last);

    return slide;
  });
}

function clipDirection(page: Page) {
  if (page.titi) {
    return 'Follow the story beat in the prompt. The cup of Greek frozen yogurt stays large: thick white yogurt, blue and white. One short motion. No words, no letters, and no logo.';
  }

  if (page.account === 'sunny-isles-one') {
    return 'Follow the story beat in the prompt. The forms stay in the frame, navy, gold, and white. One short motion. No words, no letters, and no logo.';
  }

  return 'Follow the story beat in the prompt. One short motion. No words and no letters.';
}

function overlayTheme(page: Page): OverlayTheme {
  if (page.titi) return 'titi';
  if (page.account === 'sunny-isles-one') return 'sunny';
  return 'plain';
}

function sunnyPrompt(slide: Slide, drawLogo: boolean) {
  const logo = drawLogo
    ? 'Use the Sunny Isles One logo from the reference exactly as it is, same ONE letters, gold sun, and waves.'
    : 'Use the navy and gold from the logo reference. Do not redraw the logo.';

  return [
    slide.prompt,
    'This beat is part of one funny story. The paperwork is the subject. Name the service in large correct words: forms, divorce and family, immigration, taxes, business, applications, translation, or insurance. Navy, gold, and white. No stranger posing as the subject.',
    logo,
  ].join('\n');
}

function directedPrompt(slide: Slide) {
  const logo = slide.references.includes('logo')
    ? 'Use the circular logo from the logo reference exactly as it is, same letters and olive branch.'
    : 'Do not invent a logo.';

  return [
    slide.prompt,
    'This beat is part of one funny story. The cup or the topping bar stays large enough that a stranger knows it is Greek frozen yogurt. Any words are only these, spelled exactly: Greek frozen yogurt. High protein. Low sugar. Aventura and Sunny Isles. Deep blue, warm white, cream.',
    logo,
  ].join('\n');
}

function videoDirection(page: Page) {
  if (page.titi) return VIDEO_DIRECTION;
  if (page.account === 'sunny-isles-one') return SUNNY_VIDEO_DIRECTION;
  return '';
}

async function publishMedia(origin: string, body: Record<string, unknown>, extra: Record<string, unknown>, page: Page) {
  const createResponse = await fetch(`${origin}/api/instagram/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ...pageFields(page) }),
    cache: 'no-store',
  });
  const created = await readJson(createResponse);

  if (!createResponse.ok) {
    return NextResponse.json({ ...extra, ...created, ...pageFields(page) }, { status: createResponse.status });
  }

  return NextResponse.json({
    stage: 'processing',
    containerId: created.containerId ?? null,
    status: created.status ?? 'IN_PROGRESS',
    ...extra,
    ...pageFields(page),
  });
}

async function advanceCarousel(
  origin: string,
  childContainerIds: string[],
  caption: string,
  extra: Record<string, unknown>,
  page: Page,
) {
  const response = await fetch(`${origin}/api/instagram/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childContainerIds, caption, ...pageFields(page) }),
    cache: 'no-store',
  });
  const body = await readJson(response);

  if (!response.ok) {
    return NextResponse.json(
      { ...extra, ...body, childContainerIds, caption, ...pageFields(page) },
      { status: response.status },
    );
  }

  const containerId = asString(body.containerId);

  return NextResponse.json({
    ...extra,
    stage: 'processing',
    kind: 'image',
    mediaType: 'CAROUSEL',
    ...(containerId ? { containerId } : {}),
    childContainerIds,
    ...(body.children ? { children: body.children } : {}),
    status: body.status ?? 'IN_PROGRESS',
    caption,
    ...pageFields(page),
  });
}

async function openCarousel(
  origin: string,
  items: CarouselItem[],
  caption: string,
  extra: Record<string, unknown>,
  page: Page,
) {
  if (!caption) {
    return jsonError('A caption is required to publish the carousel.', 400);
  }

  const createResponse = await fetch(`${origin}/api/instagram/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, caption, ...pageFields(page) }),
    cache: 'no-store',
  });
  const created = await readJson(createResponse);
  const childContainerIds = stringList(created.childContainerIds);

  if (!createResponse.ok) {
    return NextResponse.json(
      { ...extra, ...created, childContainerIds, caption, ...pageFields(page) },
      { status: createResponse.status },
    );
  }

  return advanceCarousel(origin, childContainerIds, caption, { ...extra, items }, page);
}

function slideItems(slides: Slide[]): CarouselItem[] {
  return slides.map((slide) => (
    slide.media === 'video'
      ? { type: 'video', url: slide.videoUrl }
      : { type: 'image', url: slide.imageUrl }
  ));
}

function carouselBody(slides: Slide[], caption: string, page: Page, extra: Record<string, unknown> = {}) {
  return {
    ...extra,
    kind: 'image' as const,
    mediaType: 'CAROUSEL' as const,
    slides: slides.map(publicSlide),
    caption,
    ...pageFields(page),
  };
}

async function startClip(origin: string, slide: Slide, page: Page) {
  const response = await fetch(`${origin}/api/runpod/wan-2-6`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: [slide.prompt, clipDirection(page)].filter(Boolean).join('\n'),
      duration: slide.duration,
      size: '1080*1920',
      shotType: 'single',
    }),
    cache: 'no-store',
  });
  const started = await readJson(response);

  return { response, started };
}

async function prepareClip(slide: Slide, page: Page) {
  if (!isFetchableUrl(slide.sourceUrl)) {
    throw new Error('The clip source must be a public https link.');
  }

  await ensureTmpDir();
  const sourcePath = createTmpFilePath('clip-source.mp4');
  const outputPath = createTmpFilePath('clip-carousel.mp4');

  try {
    await downloadToPath(slide.sourceUrl, sourcePath);
    await renderCarouselClip({
      sourcePath,
      outputPath,
      lines: slide.lines,
      theme: overlayTheme(page),
    });
    const bytes = new Uint8Array(await fs.readFile(outputPath));
    const videoUrl = await hostCarouselClip(bytes);

    return { ...slide, videoUrl, prepared: true };
  } finally {
    await safeUnlink(sourcePath);
    await safeUnlink(outputPath);
  }
}

async function startSlide(origin: string, slide: Slide, page: Page, drawLogo: boolean) {
  const prompt = page.titi ? directedPrompt(slide) : page.account === 'sunny-isles-one' ? sunnyPrompt(slide, drawLogo) : slide.prompt;
  const response = await fetch(`${origin}/api/runpod/nano-banana-2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      images: slideImages(origin, slide, page),
      resolution: '2k',
      aspectRatio: '4:5',
    }),
    cache: 'no-store',
  });
  const started = await readJson(response);

  return { response, started };
}

function slideReady(slide: Slide) {
  return slide.media === 'video' ? slide.prepared && Boolean(slide.videoUrl) : Boolean(slide.imageUrl);
}

async function continueSlides(origin: string, slides: Slide[], caption: string, page: Page) {
  if (slides.length < SLIDE_MIN || slides.length > SLIDE_MAX) {
    return jsonError(`A carousel needs ${SLIDE_MIN} to ${SLIDE_MAX} slides.`, 400);
  }

  for (const slide of slides) {
    if (slide.media === 'video') {
      if (!slide.duration) {
        return jsonError('A video slide must be 5, 10, or 15 seconds.', 400);
      }

      if (slide.prepared) {
        if (!isPublicHttpsUrl(slide.videoUrl)) {
          return jsonError('A prepared video slide needs a public https link.', 400);
        }
        continue;
      }

      const lineError = overlayLineError(slide.lines);
      if (lineError) return jsonError(lineError, 400);

      if (!slide.prompt && !slide.sourceUrl && !slide.videoJobId) {
        return jsonError('Each video slide needs a prompt.', 400);
      }

      continue;
    }

    if (!slide.prompt && !slide.imageUrl) {
      return jsonError('Each carousel slide needs its own prompt.', 400);
    }
  }

  const branded = prepareSlides(slides, page);
  const lastImage = branded.reduce((found, slide, index) => (slide.media === 'video' ? found : index), -1);

  if (branded.some((slide) => slide.media !== 'video' && !slide.imageUrl && slideImages(origin, slide, page).length === 0)) {
    return jsonError('Each still slide needs brand references or 1 to 3 public https reference images.', 400);
  }

  const needsStart = branded.some((slide) => (
    slide.media === 'video'
      ? !slide.prepared && !slide.sourceUrl && !slide.videoJobId
      : !slide.imageUrl && !slide.imageJobId
  ));

  if (needsStart) {
    const startedSlides = await Promise.all(
      branded.map(async (slide, index) => {
        if (slide.media === 'video') {
          if (slide.prepared || slide.sourceUrl || slide.videoJobId) {
            return { slide, ok: true as const, started: {}, status: 200 };
          }

          const { response, started } = await startClip(origin, slide, page);
          const videoJobId = asString(started.id);

          if (!response.ok || !videoJobId) {
            return { slide, ok: false as const, started, status: response.ok ? 502 : response.status };
          }

          return { slide: { ...slide, videoJobId }, ok: true as const, started, status: response.status };
        }

        if (slide.imageUrl || slide.imageJobId) return { slide, ok: true as const, started: {}, status: 200 };

        const { response, started } = await startSlide(
          origin,
          slide,
          page,
          page.account === 'sunny-isles-one' && index === lastImage,
        );
        const imageJobId = asString(started.id);

        if (!response.ok || !imageJobId) {
          return { slide, ok: false as const, started, status: response.ok ? 502 : response.status };
        }

        return { slide: { ...slide, imageJobId }, ok: true as const, started, status: response.status };
      }),
    );
    const failed = startedSlides.find((item) => !item.ok);
    const nextSlides = startedSlides.map((item) => item.slide);

    if (failed) {
      return NextResponse.json(
        {
          ...failed.started,
          error: asString(failed.started.error) || 'Generation did not start.',
          stage: 'generating',
          ...carouselBody(nextSlides, caption, page),
        },
        { status: failed.status },
      );
    }

    return NextResponse.json({
      stage: 'generating',
      status: 'IN_QUEUE',
      ...carouselBody(nextSlides, caption, page),
    });
  }

  const polled = await Promise.all(
    branded.map(async (slide) => {
      if (slide.media === 'video') {
        if (slide.prepared || slide.sourceUrl) {
          return { slide, state: 'COMPLETED', error: '', failed: false, statusCode: 200 };
        }

        const statusResponse = await fetch(
          `${origin}/api/runpod/wan-2-6/status?id=${encodeURIComponent(slide.videoJobId)}&endpoint=wan-2-6-t2v`,
          { cache: 'no-store' },
        );
        const status = await readJson(statusResponse);

        if (!statusResponse.ok) {
          return {
            slide,
            state: 'FAILED',
            error: asString(status.error) || 'Video status could not be read.',
            failed: true,
            statusCode: statusResponse.status,
          };
        }

        const state = asString(status.status) || 'UNKNOWN';
        const sourceUrl = asString(status.videoUrl);

        if (state === 'COMPLETED' && sourceUrl) {
          if (!isFetchableUrl(sourceUrl)) {
            return { slide, state, error: 'The clip source must be a public https link.', failed: true, statusCode: 502 };
          }

          return { slide: { ...slide, sourceUrl }, state, error: '', failed: false, statusCode: 200 };
        }

        if (state !== 'IN_QUEUE' && state !== 'IN_PROGRESS') {
          return {
            slide,
            state,
            error: asString(status.error) || `Video generation ${state.toLowerCase()}.`,
            failed: true,
            statusCode: 502,
          };
        }

        return { slide, state, error: '', failed: false, statusCode: 200 };
      }

      if (slide.imageUrl) return { slide, state: 'COMPLETED', error: '', failed: false, statusCode: 200 };

      const statusResponse = await fetch(
        `${origin}/api/runpod/nano-banana-2/status?id=${encodeURIComponent(slide.imageJobId)}`,
        { cache: 'no-store' },
      );
      const status = await readJson(statusResponse);

      if (!statusResponse.ok) {
        return {
          slide,
          state: 'FAILED',
          error: asString(status.error) || 'Image status could not be read.',
          failed: true,
          statusCode: statusResponse.status,
        };
      }

      const state = asString(status.status) || 'UNKNOWN';
      const imageUrl = asString(status.imageUrl);

      if (state === 'COMPLETED' && imageUrl) {
        return { slide: { ...slide, imageUrl }, state, error: '', failed: false, statusCode: 200 };
      }

      if (state !== 'IN_QUEUE' && state !== 'IN_PROGRESS') {
        return {
          slide,
          state,
          error: asString(status.error) || `Image generation ${state.toLowerCase()}.`,
          failed: true,
          statusCode: 502,
        };
      }

      return { slide, state, error: '', failed: false, statusCode: 200 };
    }),
  );
  const failed = polled.find((item) => item.failed);

  if (failed) {
    return NextResponse.json(
      {
        error: failed.error,
        stage: 'generating',
        status: failed.state,
        ...carouselBody(polled.map((item) => item.slide), caption, page),
      },
      { status: failed.statusCode },
    );
  }

  const ready = polled.map((item) => item.slide);
  const pending = ready.find((slide) => slide.media === 'video' && !slide.prepared && Boolean(slide.sourceUrl));

  if (pending) {
    try {
      const prepared = await prepareClip(pending, page);
      const nextSlides = ready.map((slide) => (slide === pending ? prepared : slide));

      return NextResponse.json({
        stage: 'preparing',
        status: 'IN_PROGRESS',
        ...carouselBody(nextSlides, caption, page),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.split('\n').filter(Boolean).at(-1) : '';

      return NextResponse.json(
        {
          error: (message || 'The clip could not be prepared.').slice(0, 300),
          stage: 'preparing',
          ...carouselBody(ready, caption, page),
        },
        { status: 502 },
      );
    }
  }

  if (ready.every(slideReady)) {
    return openCarousel(origin, slideItems(ready), caption, carouselBody(ready, caption, page), page);
  }

  return NextResponse.json({
    stage: 'generating',
    status: polled.some((item) => item.state === 'IN_PROGRESS') ? 'IN_PROGRESS' : 'IN_QUEUE',
    ...carouselBody(ready, caption, page),
  });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const prompt = asString(input.prompt);
  const caption = asString(input.caption);
  const kind = asString(input.kind) || 'video';
  const videoUrl = asString(input.videoUrl);
  const imageUrl = asString(input.imageUrl);
  const imageUrls = stringList(input.imageUrls);
  const videoJobId = asString(input.videoJobId);
  const imageJobId = asString(input.imageJobId);
  const childContainerIds = stringList(input.childContainerIds);
  const containerId = asString(input.containerId);
  const slides = parseSlides(input.slides);
  const items = parseItems(input.items);
  const duration = input.duration == null || input.duration === '' ? 15 : Number(input.duration);
  const size = asString(input.size) || '1080*1920';
  const shotType = asString(input.shotType) || 'multi';
  const parsedAccount = readAccountName(input.account ?? input.business);

  if ('error' in parsedAccount) {
    return jsonError(parsedAccount.error, 400);
  }

  const page: Page = { account: parsedAccount.account, titi: usesTiti(parsedAccount.account) };

  if (!instagramCredentials(page.account)) {
    return jsonError(missingAccountMessage(page.account), 500);
  }

  if (caption.length > CAPTION_LIMIT) {
    return jsonError(`Caption must be ${CAPTION_LIMIT} characters or fewer.`, 400);
  }

  if (containerId) {
    const statusUrl = new URL(`${origin}/api/instagram/publish`);
    statusUrl.searchParams.set('id', containerId);
    if (page.account) statusUrl.searchParams.set('account', page.account);
    const statusResponse = await fetch(statusUrl, {
      cache: 'no-store',
    });
    const status = await readJson(statusResponse);

    if (!statusResponse.ok) {
      return NextResponse.json(status, { status: statusResponse.status });
    }

    if (status.status !== 'FINISHED') {
      return NextResponse.json({
        stage: status.status === 'PUBLISHED' ? 'published' : 'processing',
        containerId,
        status: status.status ?? 'UNKNOWN',
        detail: status.detail ?? null,
        ...pageFields(page),
      });
    }

    const publishResponse = await fetch(`${origin}/api/instagram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ containerId, ...pageFields(page) }),
      cache: 'no-store',
    });
    const published = await readJson(publishResponse);

    if (!publishResponse.ok) {
      return NextResponse.json(published, { status: publishResponse.status });
    }

    return NextResponse.json({
      stage: 'published',
      containerId,
      mediaId: published.mediaId ?? null,
      permalink: published.permalink ?? null,
      ...pageFields(page),
    });
  }

  if (childContainerIds.length > 0) {
    return advanceCarousel(
      origin,
      childContainerIds,
      caption,
      {
        ...(slides.length > 0 ? { slides: slides.map(publicSlide) } : {}),
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
        ...(items.length > 0 ? { items } : {}),
      },
      page,
    );
  }

  if (Array.isArray(input.slides) && input.slides.some((item) => {
    const slide = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const media = asString(slide.media);
    return media !== '' && media !== 'image' && media !== 'video';
  })) {
    return jsonError('A slide medium must be image or video.', 400);
  }

  if (slides.length > 0) {
    return continueSlides(origin, slides, caption, page);
  }

  if (imageJobId) {
    const statusResponse = await fetch(
      `${origin}/api/runpod/nano-banana-2/status?id=${encodeURIComponent(imageJobId)}`,
      { cache: 'no-store' },
    );
    const status = await readJson(statusResponse);

    if (!statusResponse.ok) {
      return NextResponse.json(status, { status: statusResponse.status });
    }

    const readyUrl = asString(status.imageUrl);

    if (status.status !== 'COMPLETED' || !readyUrl) {
      return NextResponse.json({
        stage: 'generating',
        kind: 'image',
        imageJobId,
        status: status.status ?? 'UNKNOWN',
        error: status.error ?? null,
        ...pageFields(page),
      });
    }

    if (!caption) {
      return jsonError('A caption is required to publish the finished image.', 400);
    }

    return publishMedia(origin, { imageUrl: readyUrl, caption }, { imageJobId, imageUrl: readyUrl }, page);
  }

  if (videoJobId) {
    const statusResponse = await fetch(
      `${origin}/api/runpod/wan-2-6/status?id=${encodeURIComponent(videoJobId)}&endpoint=wan-2-6-t2v`,
      { cache: 'no-store' },
    );
    const status = await readJson(statusResponse);

    if (!statusResponse.ok) {
      return NextResponse.json(status, { status: statusResponse.status });
    }

    const readyUrl = asString(status.videoUrl);

    if (status.status !== 'COMPLETED' || !readyUrl) {
      return NextResponse.json({
        stage: 'generating',
        videoJobId,
        status: status.status ?? 'UNKNOWN',
        error: status.error ?? null,
        ...pageFields(page),
      });
    }

    if (!caption) {
      return jsonError('A caption is required to publish the finished video.', 400);
    }

    const createResponse = await fetch(`${origin}/api/instagram/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: readyUrl, caption, shareToFeed: true, ...pageFields(page) }),
      cache: 'no-store',
    });
    const created = await readJson(createResponse);

    if (!createResponse.ok) {
      return NextResponse.json(created, { status: createResponse.status });
    }

    return NextResponse.json({
      stage: 'processing',
      videoJobId,
      videoUrl: readyUrl,
      containerId: created.containerId ?? null,
      status: created.status ?? 'IN_PROGRESS',
      ...pageFields(page),
    });
  }

  const directModes = [Boolean(videoUrl), Boolean(imageUrl), imageUrls.length > 0, items.length > 0].filter(Boolean).length;

  if (directModes > 1) {
    return jsonError('Send one video, one image, or one carousel.', 400);
  }

  if (items.length > 0) {
    return openCarousel(origin, items, caption, { items }, page);
  }

  if (imageUrls.length > 0) {
    return openCarousel(
      origin,
      imageUrls.map((url) => ({ type: 'image', url })),
      caption,
      { imageUrls },
      page,
    );
  }

  if (videoUrl || imageUrl) {
    if (!caption) {
      return jsonError('A caption is required.', 400);
    }

    return publishMedia(
      origin,
      videoUrl ? { videoUrl, caption, shareToFeed: true } : { imageUrl, caption },
      videoUrl ? { videoUrl } : { imageUrl },
      page,
    );
  }

  if (!prompt && kind !== 'image') {
    return jsonError('Send a prompt, slides, a media URL, a job id, or a container id.', 400);
  }

  if (kind === 'image') {
    return jsonError('Image posts are carousels. Send 2 to 10 slides, each with a prompt.', 400);
  }

  if (kind !== 'video') {
    return jsonError('Kind must be image or video.', 400);
  }

  if (!prompt) {
    return jsonError('Send a prompt, slides, a media URL, a job id, or a container id.', 400);
  }

  const startResponse = await fetch(`${origin}/api/runpod/wan-2-6`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: [prompt, videoDirection(page)].filter(Boolean).join('\n'),
      duration,
      size,
      shotType,
    }),
    cache: 'no-store',
  });
  const started = await readJson(startResponse);

  if (!startResponse.ok) {
    return NextResponse.json(started, { status: startResponse.status });
  }

  return NextResponse.json({
    stage: 'generating',
    kind: 'video',
    videoJobId: started.id ?? null,
    status: started.status ?? 'IN_QUEUE',
    ...pageFields(page),
  });
}
