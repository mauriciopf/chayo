import { NextResponse } from 'next/server';

const XAI_BASE_URL = 'https://api.x.ai/v1';

type XaiVideoResult = {
  status?: 'pending' | 'done' | 'failed' | 'expired' | string;
  code?: string;
  block_reason?: string;
  error?: {
    code?: string;
    message?: string;
  };
  video?: {
    url?: string | null;
    duration?: number;
  };
};

function isModerationBlock(result: XaiVideoResult) {
  const code = (result.code ?? result.error?.code ?? '').toLowerCase();
  const blockReason = (result.block_reason ?? '').toLowerCase();
  const message = (result.error?.message ?? '').toLowerCase();

  return (
    blockReason.includes('content_policy_violation') ||
    message.includes('content moderation') ||
    (code.includes('invalid_argument') && message.includes('rejected'))
  );
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readError(response: Response) {
  const text = await response.text();
  return text || 'Unknown xAI error';
}

export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return jsonError('Missing XAI_API_KEY environment variable.', 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON.', 400);
  }

  const bodyObj = body as Record<string, unknown>;
  const rawRequestIds = Array.isArray(bodyObj.requestIds) ? bodyObj.requestIds : [];
  const requestIds = rawRequestIds
    .map((item) => String(item ?? '').trim())
    .filter((value) => value.length > 0);

  if (requestIds.length === 0) {
    return jsonError('At least one request id is required.', 400);
  }

  const responses = await Promise.all(
    requestIds.map(async (requestId) => {
      const response = await fetch(`${XAI_BASE_URL}/videos/${requestId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          requestId,
          result: null as XaiVideoResult | null,
          httpError: await readError(response),
        };
      }

      return {
        requestId,
        result: (await response.json()) as XaiVideoResult,
        httpError: null,
      };
    }),
  );

  let numSuccess = 0;
  let numError = 0;
  let numPending = 0;

  const results = responses.map(({ requestId, result, httpError }) => {
    if (httpError) {
      numError += 1;
      return {
        batchRequestId: requestId,
        videoUrl: null,
        duration: null,
        error: httpError,
        status: 'failed' as const,
      };
    }

    if (!result) {
      numPending += 1;
      return {
        batchRequestId: requestId,
        videoUrl: null,
        duration: null,
        error: null,
        status: 'pending' as const,
      };
    }

    const status = result.status;

    if (status === 'done' && result.video?.url) {
      numSuccess += 1;
      return {
        batchRequestId: requestId,
        videoUrl: result.video.url,
        duration: result.video.duration ?? null,
        error: null,
        status: 'succeeded' as const,
      };
    }

    if (status === 'failed' || status === 'expired') {
      numError += 1;

      const errorMessage = isModerationBlock(result)
        ? 'Blocked by content moderation; try a safer prompt.'
        : result.error?.message ?? `Request ${status}.`;

      return {
        batchRequestId: requestId,
        videoUrl: null,
        duration: null,
        error: errorMessage,
        status: 'failed' as const,
      };
    }

    numPending += 1;
    return {
      batchRequestId: requestId,
      videoUrl: null,
      duration: null,
      error: null,
      status: 'pending' as const,
    };
  });

  const nowIso = new Date().toISOString();

  return NextResponse.json({
    batch: {
      batch_id: 'extension-requests',
      name: 'grok-imagine-extension-requests',
      create_time: nowIso,
      expire_time: null,
      state: {
        num_requests: requestIds.length,
        num_pending: numPending,
        num_success: numSuccess,
        num_error: numError,
        num_cancelled: 0,
      },
    },
    results,
    paginationToken: null,
  });
}
