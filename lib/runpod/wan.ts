const RUNPOD_ENDPOINT_ID = 'wan-2-2-i2v-720';

export const WAN_ENDPOINT_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`;

export const WAN_DURATIONS = [5, 8, 10, 15] as const;

export type WanDuration = (typeof WAN_DURATIONS)[number];

export type WanJobStatus = {
  id?: string;
  status?: string;
  error?: unknown;
  output?: {
    video_url?: string;
    cost?: number;
  };
};

export function runpodErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function getRunpodApiKey(): string | null {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  return apiKey ? apiKey : null;
}

export function runpodHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function isWanDuration(value: number): value is WanDuration {
  return (WAN_DURATIONS as readonly number[]).includes(value);
}

export async function readRunpodBody(response: Response): Promise<WanJobStatus> {
  const text = await response.text();

  if (!text) {
    return { error: `Runpod request failed (${response.status}).` };
  }

  try {
    return JSON.parse(text) as WanJobStatus;
  } catch {
    return { error: text };
  }
}
