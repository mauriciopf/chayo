import { NextResponse } from 'next/server';

const XAI_BASE_URL = 'https://api.x.ai/v1';

type XaiBatchSummary = {
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

type XaiBatchResultPage = {
  pagination_token?: string | null;
  results?: Array<{
    batch_request_id: string;
    batch_result?: {
      error?: string;
      response?: {
        video_generation?: {
          video?: {
            url?: string;
            duration?: number;
          };
        };
        video_extension?: {
          video?: {
            url?: string;
            duration?: number;
          };
        };
      };
    };
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readError(response: Response) {
  const text = await response.text();
  return text || 'Unknown xAI error';
}

export async function GET(_: Request, context: { params: Promise<{ batchId: string }> }) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return jsonError('Missing XAI_API_KEY environment variable.', 500);
  }

  const { batchId } = await context.params;

  if (!batchId) {
    return jsonError('Batch id is required.', 400);
  }

  const [batchResponse, resultsResponse] = await Promise.all([
    fetch(`${XAI_BASE_URL}/batches/${batchId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    }),
    fetch(`${XAI_BASE_URL}/batches/${batchId}/results?limit=100`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    }),
  ]);

  if (!batchResponse.ok) {
    return jsonError(`Failed to read xAI batch status: ${await readError(batchResponse)}`, batchResponse.status);
  }

  if (!resultsResponse.ok) {
    return jsonError(`Failed to read xAI batch results: ${await readError(resultsResponse)}`, resultsResponse.status);
  }

  const batch = (await batchResponse.json()) as XaiBatchSummary;
  const resultsData = (await resultsResponse.json()) as XaiBatchResultPage;

  const results = (resultsData.results ?? []).map((result) => {
    const generationVideo = result.batch_result?.response?.video_generation?.video;
    const extensionVideo = result.batch_result?.response?.video_extension?.video;
    const videoResult = generationVideo ?? extensionVideo;

    return {
      batchRequestId: result.batch_request_id,
      videoUrl: videoResult?.url ?? null,
      duration: videoResult?.duration ?? null,
      error: result.batch_result?.error ?? null,
      status: videoResult?.url ? 'succeeded' : result.batch_result?.error ? 'failed' : 'pending',
    };
  });

  return NextResponse.json({
    batch,
    results,
    paginationToken: resultsData.pagination_token ?? null,
  });
}