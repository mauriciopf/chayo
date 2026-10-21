import { NextResponse } from 'next/server';
import { instagramCredentials, missingAccountMessage, readAccountName } from '@/lib/instagram/accounts';

const CAPTION_LIMIT = 2200;
const SLIDE_MIN = 2;
const SLIDE_MAX = 10;
const REFERENCES = new Set(['logo', 'cart', 'uniforms', 'bowl', 'toppings']);
const VIDEO_DIRECTION =
  'Greek fantasy lifestyle in Aventura or Sunny Isles, cinematic, a life that invites you to taste the yogurt. Not a product close-up. No logo and no written words.';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Slide = {
  prompt: string;
  references: string[];
  images: string[];
  imageJobId: string;
  imageUrl: string;
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

    return {
      prompt: asString(slide.prompt),
      references,
      images: stringList(slide.images).filter(isPublicHttpsUrl).slice(0, 3),
      imageJobId: asString(slide.imageJobId),
      imageUrl: asString(slide.imageUrl),
    };
  });
}

function brandSlides(slides: Slide[]) {
  return slides.map((slide, index) => {
    const last = index === slides.length - 1;
    let references = slide.references.slice(0, 3);

    if (references.length === 0) {
      references = last ? ['logo', 'uniforms'] : ['uniforms'];
    }

    if (last && !references.includes('logo')) {
      references = ['logo', ...references].slice(0, 3);
    }

    return { ...slide, references };
  });
}

function referenceUrls(origin: string, references: string[]) {
  return references.map((name) => `${origin}/brand/${name === 'toppings' ? 'toppings.jpg' : `${name}.png`}`);
}

function slideImages(origin: string, slide: Slide) {
  return slide.images.length > 0 ? slide.images : referenceUrls(origin, slide.references);
}

function directedPrompt(slide: Slide) {
  const logo = slide.references.includes('logo')
    ? 'Use the circular logo from the logo reference exactly as it is, same letters and olive branch, small and clean. No other text.'
    : 'No logo, no letters, and no watermark.';
  const place = slide.references.includes('bowl') ? 'Ignore any city name on the bowl. The place is Aventura or Sunny Isles.' : '';

  return [
    slide.prompt,
    'Greek fantasy lifestyle in Aventura or Sunny Isles. A person is living in the picture. The frozen yogurt is why they stay. Not a catalog photo of a cup.',
    place,
    logo,
  ]
    .filter(Boolean)
    .join('\n');
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
  imageUrls: string[],
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
    body: JSON.stringify({ imageUrls, caption, ...pageFields(page) }),
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

  return advanceCarousel(origin, childContainerIds, caption, { ...extra, imageUrls }, page);
}

async function startSlide(origin: string, slide: Slide, page: Page) {
  const response = await fetch(`${origin}/api/runpod/nano-banana-2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: page.titi ? directedPrompt(slide) : slide.prompt,
      images: slideImages(origin, slide),
      resolution: '2k',
      aspectRatio: '4:5',
    }),
    cache: 'no-store',
  });
  const started = await readJson(response);

  return { response, started };
}

async function continueSlides(origin: string, slides: Slide[], caption: string, page: Page) {
  if (slides.length < SLIDE_MIN || slides.length > SLIDE_MAX) {
    return jsonError(`A carousel needs ${SLIDE_MIN} to ${SLIDE_MAX} images.`, 400);
  }

  if (slides.some((slide) => !slide.prompt && !slide.imageUrl)) {
    return jsonError('Each carousel slide needs its own prompt.', 400);
  }

  const branded = page.titi ? brandSlides(slides) : slides;

  if (branded.some((slide) => !slide.imageUrl && slideImages(origin, slide).length === 0)) {
    return jsonError('Each slide needs brand references or 1 to 3 public https reference images.', 400);
  }

  const missing = branded.filter((slide) => !slide.imageUrl);

  if (missing.length === 0) {
    return openCarousel(
      origin,
      branded.map((slide) => slide.imageUrl),
      caption,
      { slides: branded },
      page,
    );
  }

  if (missing.some((slide) => !slide.imageJobId)) {
    const startedSlides = await Promise.all(
      branded.map(async (slide) => {
        if (slide.imageUrl || slide.imageJobId) return { slide, ok: true as const, started: {}, status: 200 };

        const { response, started } = await startSlide(origin, slide, page);
        const imageJobId = asString(started.id);

        if (!response.ok || !imageJobId) {
          return { slide, ok: false as const, started, status: response.ok ? 502 : response.status };
        }

        return { slide: { ...slide, imageJobId }, ok: true as const, started, status: response.status };
      }),
    );
    const failed = startedSlides.find((item) => !item.ok);

    if (failed) {
      return NextResponse.json(
        {
          ...failed.started,
          error: asString(failed.started.error) || 'Image generation did not start.',
          stage: 'generating',
          kind: 'image',
          mediaType: 'CAROUSEL',
          slides: startedSlides.map((item) => item.slide),
          caption,
          ...pageFields(page),
        },
        { status: failed.status },
      );
    }

    return NextResponse.json({
      stage: 'generating',
      kind: 'image',
      mediaType: 'CAROUSEL',
      status: 'IN_QUEUE',
      slides: startedSlides.map((item) => item.slide),
      caption,
      ...pageFields(page),
    });
  }

  const polled = await Promise.all(
    branded.map(async (slide) => {
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
        kind: 'image',
        mediaType: 'CAROUSEL',
        status: failed.state,
        slides: polled.map((item) => item.slide),
        caption,
        ...pageFields(page),
      },
      { status: failed.statusCode },
    );
  }

  const ready = polled.map((item) => item.slide);

  if (ready.every((slide) => slide.imageUrl)) {
    return openCarousel(
      origin,
      ready.map((slide) => slide.imageUrl),
      caption,
      { slides: ready },
      page,
    );
  }

  return NextResponse.json({
    stage: 'generating',
    kind: 'image',
    mediaType: 'CAROUSEL',
    status: polled.some((item) => item.state === 'IN_PROGRESS') ? 'IN_PROGRESS' : 'IN_QUEUE',
    slides: ready,
    caption,
    ...pageFields(page),
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
        ...(slides.length > 0 ? { slides } : {}),
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
      },
      page,
    );
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

  const directModes = [Boolean(videoUrl), Boolean(imageUrl), imageUrls.length > 0].filter(Boolean).length;

  if (directModes > 1) {
    return jsonError('Send one video, one image, or a list of carousel images.', 400);
  }

  if (imageUrls.length > 0) {
    return openCarousel(origin, imageUrls, caption, { imageUrls }, page);
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
      prompt: page.titi ? `${prompt}\n${VIDEO_DIRECTION}` : prompt,
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
