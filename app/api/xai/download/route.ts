import { NextRequest, NextResponse } from 'next/server';

// SSRF guard — only proxy URLs from xAI's video CDN
const ALLOWED_HOSTNAMES = new Set(['vidgen.x.ai']);

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS URLs are allowed.' }, { status: 400 });
  }

  if (!ALLOWED_HOSTNAMES.has(parsed.hostname)) {
    return NextResponse.json({ error: 'URL not allowed.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Failed to reach the video URL.' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream returned ${upstream.status}.` }, { status: upstream.status });
  }

  const filename = parsed.pathname.split('/').pop() ?? 'video.mp4';
  const contentType = upstream.headers.get('Content-Type') ?? 'video/mp4';
  const contentLength = upstream.headers.get('Content-Length');

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
  };

  if (contentLength) {
    headers['Content-Length'] = contentLength;
  }

  // Stream directly — avoids buffering the whole video in memory
  return new NextResponse(upstream.body, { headers });
}
