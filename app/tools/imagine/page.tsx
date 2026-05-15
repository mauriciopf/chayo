'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type InputMode = 'generate' | 'upload-extend';

type BatchSummary = {
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

type BatchResult = {
  batchRequestId: string;
  videoUrl: string | null;
  duration: number | null;
  error: string | null;
  status: 'pending' | 'succeeded' | 'failed';
};

type BatchSucceededResult = BatchResult & {
  videoUrl: string;
};

type BatchStatusResponse = {
  batch: BatchSummary;
  results: BatchResult[];
  paginationToken: string | null;
};

type StartBatchResponse = {
  batch: BatchSummary;
  requestIds: string[];
  requestCount: number;
  duration: number;
  sourceProcessing?: {
    strategy: 'passthrough' | 'trim-last-15s';
    originalDurationSeconds: number;
    preparedDurationSeconds: number;
    trimStartSeconds: number;
  } | null;
};

type UploadPipelineStage = 'idle' | 'preparing' | 'extending' | 'finalizing' | 'ready';

type SourceType = 'generation' | 'upload' | `extension_${number}`;

type ExtensionComposer = {
  level: number;
  sourceType: SourceType;
  sourceVideoId: string;
  sourceVideoUrl: string;
  accumulatedBefore: number;
};

type ExtensionLevelState = {
  level: number;
  sourceType: SourceType;
  sourceVideoId: string;
  sourceVideoUrl: string;
  accumulatedBefore: number;
  configuredDuration: number;
  startResponse: StartBatchResponse;
  statusResponse: BatchStatusResponse | null;
};

function isSucceededWithVideo(result: BatchResult): result is BatchSucceededResult {
  return result.status === 'succeeded' && Boolean(result.videoUrl);
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[linear-gradient(90deg,#f5d27a,#d3a54a)] transition-all duration-500" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function GrokImagineVideoBatchPage() {
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [prompt, setPrompt] = useState('A cinematic slow-motion shot with warm highlights and a polished luxury feel, NO DIALOGUE.');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadVideoFile, setUploadVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(15);
  const [batchSize, setBatchSize] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startResponse, setStartResponse] = useState<StartBatchResponse | null>(null);
  const [statusResponse, setStatusResponse] = useState<BatchStatusResponse | null>(null);

  const [composer, setComposer] = useState<ExtensionComposer | null>(null);
  const [extensionLevels, setExtensionLevels] = useState<ExtensionLevelState[]>([]);
  const [extendPrompt, setExtendPrompt] = useState('');
  const [extendDuration, setExtendDuration] = useState(10);
  const [extendBatchSize, setExtendBatchSize] = useState(5);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);
  const [isRefreshingExtend, setIsRefreshingExtend] = useState(false);
  const [uploadPipelineStage, setUploadPipelineStage] = useState<UploadPipelineStage>('idle');
  const [uploadProcessingSummary, setUploadProcessingSummary] = useState<StartBatchResponse['sourceProcessing'] | null>(null);
  const [isComposingFinalVideo, setIsComposingFinalVideo] = useState(false);
  const [autoComposeStartedByRequestId, setAutoComposeStartedByRequestId] = useState<Set<string>>(new Set());
  const [composeStateByRequestId, setComposeStateByRequestId] = useState<Map<string, 'composing' | 'ready' | 'failed'>>(new Map());
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composedVideosByRequestId, setComposedVideosByRequestId] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(imageFile);
    setImagePreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      composedVideosByRequestId.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
    };
  }, [composedVideosByRequestId]);

  useEffect(() => {
    if (composedVideosByRequestId.size > 0) {
      console.log(`📹 Composed videos available: ${composedVideosByRequestId.size} total`);
      composedVideosByRequestId.forEach((url, requestId) => {
        console.log(`  - Request ${requestId}: ${url.substring(0, 50)}...`);
      });
    }
  }, [composedVideosByRequestId]);

  const completedCount = useMemo(() => {
    if (!statusResponse) {
      return 0;
    }

    return statusResponse.batch.state.num_success + statusResponse.batch.state.num_error;
  }, [statusResponse]);

  const totalCount = statusResponse?.batch.state.num_requests ?? startResponse?.requestCount ?? 0;
  const pendingCount = statusResponse?.batch.state.num_pending ?? 0;
  const isDone = totalCount > 0 && pendingCount === 0;
  const uploadSucceededCount = extensionLevels[0]?.statusResponse?.results.filter(isSucceededWithVideo).length ?? 0;
  const composedReadyCount = Array.from(composeStateByRequestId.values()).filter((value) => value === 'ready').length;
  const bestUploadSuccessResult = extensionLevels[0]?.statusResponse?.results.find(isSucceededWithVideo) ?? null;
  const bestUploadSuccessRequestId = bestUploadSuccessResult?.batchRequestId ?? null;
  const bestUploadComposeState = bestUploadSuccessRequestId ? composeStateByRequestId.get(bestUploadSuccessRequestId) : undefined;
  const isBestUploadAlreadyComposed = Boolean(
    bestUploadSuccessRequestId &&
      (bestUploadComposeState === 'ready' || composedVideosByRequestId.has(bestUploadSuccessRequestId))
  );

  const getOrdinal = (value: number) => {
    if (value === 1) {
      return '1st';
    }
    if (value === 2) {
      return '2nd';
    }
    if (value === 3) {
      return '3rd';
    }

    return `${value}th`;
  };

  const getComposerLabel = () => {
    if (!composer) {
      return '';
    }

    if (composer.sourceType === 'upload') {
      return `Uploaded source video ${composer.sourceVideoId}`;
    }

    if (composer.sourceType === 'generation') {
      return `Generation video ${composer.sourceVideoId}`;
    }

    const sourceLevel = Number(composer.sourceType.split('_')[1]);

    return `${getOrdinal(sourceLevel)} extension result ${composer.sourceVideoId}`;
  };

  const loadStatus = async (batchId: string) => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/xai/batches/${batchId}`, {
        cache: 'no-store',
      });

      const data = (await response.json()) as BatchStatusResponse & { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Failed to read batch status.');
        return;
      }

      setStatusResponse(data);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadExtensionStatus = async (level: number, requestIds: string[]) => {
    setIsRefreshingExtend(true);
    setExtendError(null);

    if (requestIds.length === 0) {
      setExtendError('No extension request IDs were returned for polling.');
      setIsRefreshingExtend(false);
      return;
    }

    try {
      const response = await fetch('/api/xai/videos/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestIds }),
      });

      const data = (await response.json()) as BatchStatusResponse & { error?: string };

      if (!response.ok) {
        setExtendError(data.error ?? 'Failed to read extension request status.');
        return;
      }

      setExtensionLevels((current) =>
        current.map((item) =>
          item.level === level
            ? {
                ...item,
                statusResponse: data,
              }
            : item,
        ),
      );

      // Incrementally auto-compose each newly succeeded extension result.
      if (level === 1 && inputMode === 'upload-extend' && uploadVideoFile) {
        const succeededResults = data.results.filter(isSucceededWithVideo);
        const pendingCompositions = succeededResults.filter((result) => {
          const requestId = result.batchRequestId;
          if (!requestId) {
            return false;
          }

          if (autoComposeStartedByRequestId.has(requestId)) {
            return false;
          }

          if (composedVideosByRequestId.has(requestId)) {
            return false;
          }

          const composeState = composeStateByRequestId.get(requestId);
          return composeState !== 'composing' && composeState !== 'ready';
        });

        if (pendingCompositions.length > 0) {
          setComposeError(null);
          setUploadPipelineStage('finalizing');
          setAutoComposeStartedByRequestId((current) => {
            const next = new Set(current);
            pendingCompositions.forEach((result) => {
              next.add(result.batchRequestId);
            });
            return next;
          });

          setIsComposingFinalVideo(true);

          const results = await Promise.allSettled(
            pendingCompositions.map((result) => composeUploadResult(result.batchRequestId, result.videoUrl))
          );

          const failedCount = results.filter((result) => result.status === 'rejected').length;
          if (failedCount > 0) {
            setComposeError(
              `${failedCount} of ${pendingCompositions.length} new composition(s) failed. You can retry manually.`
            );
          }

          setIsComposingFinalVideo(false);
        }

        const succeededCount = succeededResults.length;
        const readyCount = succeededResults.filter(
          (result) => composeStateByRequestId.get(result.batchRequestId) === 'ready' || composedVideosByRequestId.has(result.batchRequestId)
        ).length;

        if (succeededCount === 0) {
          setUploadPipelineStage('extending');
        } else if (readyCount >= succeededCount) {
          setUploadPipelineStage('ready');
        } else {
          setUploadPipelineStage('finalizing');
        }
      }
    } finally {
      setIsRefreshingExtend(false);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
  };

  const handleUploadVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExtendError(null);
    const file = event.target.files?.[0] ?? null;
    setUploadVideoFile(file);
  };

  const startExtensionRequests = async ({
    sourceVideoUrl,
    sourceVideoFile,
    nextPrompt,
    nextDuration,
    nextRequestCount,
  }: {
    sourceVideoUrl?: string;
    sourceVideoFile?: File | null;
    nextPrompt: string;
    nextDuration: number;
    nextRequestCount: number;
  }) => {
    const hasFile = Boolean(sourceVideoFile);

    const response = await fetch('/api/xai/grok-imagine-video-extend', {
      method: 'POST',
      headers: hasFile
        ? undefined
        : {
            'Content-Type': 'application/json',
          },
      body: hasFile
        ? (() => {
            const formData = new FormData();
            formData.append('video', sourceVideoFile as File);
            formData.append('prompt', nextPrompt);
            formData.append('duration', String(nextDuration));
            formData.append('batchSize', String(nextRequestCount));
            return formData;
          })()
        : JSON.stringify({
            videoUrl: sourceVideoUrl,
            prompt: nextPrompt,
            duration: nextDuration,
            batchSize: nextRequestCount,
          }),
    });

    const data = (await response.json()) as StartBatchResponse & { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to start extension requests.');
    }

    return data;
  };

  const composeUploadResult = async (requestId: string, extensionVideoUrl: string) => {
    if (!uploadVideoFile) {
      throw new Error('Original uploaded video is no longer available for final composition.');
    }

    setComposeStateByRequestId((current) => {
      const next = new Map(current);
      next.set(requestId, 'composing');
      return next;
    });

    try {
      const formData = new FormData();
      formData.append('originalVideo', uploadVideoFile);
      formData.append('extensionVideoUrl', extensionVideoUrl);

      const response = await fetch('/api/xai/video-compose', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? 'Failed to compose final video.');
      }

      const blob = await response.blob();
      const nextObjectUrl = URL.createObjectURL(blob);

      setComposedVideosByRequestId((current) => {
        const next = new Map(current);
        const existing = next.get(requestId);
        if (existing) {
          URL.revokeObjectURL(existing);
        }
        next.set(requestId, nextObjectUrl);
        return next;
      });

      setComposeStateByRequestId((current) => {
        const next = new Map(current);
        next.set(requestId, 'ready');
        return next;
      });
    } catch (composeErr) {
      const message = composeErr instanceof Error ? composeErr.message : 'Failed to compose final video.';
      setComposeError(message);
      setComposeStateByRequestId((current) => {
        const next = new Map(current);
        next.set(requestId, 'failed');
        return next;
      });
      throw composeErr;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!imageFile) {
      setError('Upload an image before starting the batch.');
      return;
    }

    if (!prompt.trim()) {
      setError('Add a prompt before starting the batch.');
      return;
    }

    const formData = new FormData();
    formData.append('prompt', prompt.trim());
    formData.append('image', imageFile);
    formData.append('duration', String(duration));
    formData.append('batchSize', String(batchSize));

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/xai/grok-imagine-video-batch', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as StartBatchResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to start the batch.');
      }

      setStartResponse(data);
      setStatusResponse({
        batch: data.batch,
        results: [],
        paginationToken: null,
      });
      setComposer(null);
      setExtensionLevels([]);
      setExtendPrompt('');
      setExtendError(null);
      // Load initial status immediately after the batch is created.
      await loadStatus(data.batch.batch_id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to start the batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectGenerationForExtension = (result: BatchResult) => {
    if (!result.videoUrl) {
      return;
    }

    setComposer({
      level: 1,
      sourceType: 'generation',
      sourceVideoId: result.batchRequestId,
      sourceVideoUrl: result.videoUrl,
      accumulatedBefore: 0,
    });
    setExtendError(null);
  };

  const selectExtensionResultForPromotion = (levelItem: ExtensionLevelState, result: BatchResult) => {
    if (!result.videoUrl) {
      return;
    }

    const isAlreadySelected =
      composer?.level === levelItem.level + 1 &&
      composer.sourceType === `extension_${levelItem.level}` &&
      composer.sourceVideoId === result.batchRequestId;

    if (isAlreadySelected) {
      // Deselecting returns to override mode for the current level.
      setComposer({
        level: levelItem.level,
        sourceType: levelItem.sourceType,
        sourceVideoId: levelItem.sourceVideoId,
        sourceVideoUrl: levelItem.sourceVideoUrl,
        accumulatedBefore: levelItem.accumulatedBefore,
      });
      setExtendError(null);
      return;
    }

    const accumulatedAfterThisLevel =
      levelItem.accumulatedBefore + (result.duration ?? levelItem.configuredDuration);

    setComposer({
      level: levelItem.level + 1,
      sourceType: `extension_${levelItem.level}`,
      sourceVideoId: result.batchRequestId,
      sourceVideoUrl: result.videoUrl,
      accumulatedBefore: accumulatedAfterThisLevel,
    });

    // Choosing a different branch invalidates deeper levels until a new submit happens.
    setExtensionLevels((current) => current.filter((item) => item.level <= levelItem.level));
    setExtendError(null);
  };

  const handleExtendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExtendError(null);

    if (!composer) {
      setExtendError('Select a video before creating extension requests.');
      return;
    }

    if (!extendPrompt.trim()) {
      setExtendError('Add an extension prompt before starting the batch.');
      return;
    }

    if (extendDuration < 2 || extendDuration > 10) {
      setExtendError('Extension duration must be between 2 and 10 seconds.');
      return;
    }

    setIsSubmittingExtend(true);

    try {
      const data = await startExtensionRequests({
        sourceVideoUrl: composer.sourceVideoUrl,
        sourceVideoFile: composer.sourceType === 'upload' ? uploadVideoFile : null,
        nextPrompt: extendPrompt.trim(),
        nextDuration: extendDuration,
        nextRequestCount: extendBatchSize,
      });

      const nextLevel: ExtensionLevelState = {
        level: composer.level,
        sourceType: composer.sourceType,
        sourceVideoId: composer.sourceVideoId,
        sourceVideoUrl: composer.sourceVideoUrl,
        accumulatedBefore: composer.accumulatedBefore,
        configuredDuration: extendDuration,
        startResponse: data,
        statusResponse: {
          batch: data.batch,
          results: [],
          paginationToken: null,
        },
      };

      setExtensionLevels((current) => {
        const kept = current.filter((item) => item.level < composer.level);
        const updated = [...kept, nextLevel];
        updated.sort((a, b) => a.level - b.level);
        return updated;
      });

      await loadExtensionStatus(composer.level, data.requestIds);
    } catch (submitError) {
      setExtendError(submitError instanceof Error ? submitError.message : 'Failed to start extension requests.');
    } finally {
      setIsSubmittingExtend(false);
    }
  };

  const handleUploadExtendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExtendError(null);
    setComposeError(null);
    setUploadPipelineStage('preparing');

    setComposedVideosByRequestId((current) => {
      current.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
      return new Map();
    });
    setAutoComposeStartedByRequestId(new Set());
    setComposeStateByRequestId(new Map());

    if (!uploadVideoFile) {
      setExtendError('Upload a source video before creating extension requests.');
      setUploadPipelineStage('idle');
      return;
    }

    if (!extendPrompt.trim()) {
      setExtendError('Add an extension prompt before starting extension requests.');
      setUploadPipelineStage('idle');
      return;
    }

    if (extendDuration < 2 || extendDuration > 10) {
      setExtendError('Extension duration must be between 2 and 10 seconds.');
      setUploadPipelineStage('idle');
      return;
    }

    setIsSubmittingExtend(true);

    try {
      const data = await startExtensionRequests({
        sourceVideoFile: uploadVideoFile,
        nextPrompt: extendPrompt.trim(),
        nextDuration: extendDuration,
        nextRequestCount: extendBatchSize,
      });

      setUploadProcessingSummary(data.sourceProcessing ?? null);
      setUploadPipelineStage('extending');

      const nextLevel: ExtensionLevelState = {
        level: 1,
        sourceType: 'upload',
        sourceVideoId: uploadVideoFile.name,
        sourceVideoUrl: '',
        accumulatedBefore: 0,
        configuredDuration: extendDuration,
        startResponse: data,
        statusResponse: {
          batch: data.batch,
          results: [],
          paginationToken: null,
        },
      };

      setComposer(null);
      setExtensionLevels([nextLevel]);
      await loadExtensionStatus(1, data.requestIds);
    } catch (submitError) {
      setExtendError(submitError instanceof Error ? submitError.message : 'Failed to start extension requests.');
      setUploadPipelineStage('idle');
    } finally {
      setIsSubmittingExtend(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,210,122,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(211,165,74,0.14),_transparent_30%),linear-gradient(180deg,_rgba(13,13,13,0.98),_rgba(5,5,5,1))]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#d3a54a]">xAI video tool</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">Grok Imagine video studio</h1>
            <p className="max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
              Choose how to start: generate from a still image, or upload a video and extend it immediately. You can keep extending by selecting any successful result.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-12">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_120px_rgba(0,0,0,0.4)] backdrop-blur sm:p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">Choose a starting point</h2>
              <p className="text-sm leading-6 text-stone-400">Generate a new video from image, or upload a video and start extension requests right away.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => {
                  setInputMode('generate');
                  setError(null);
                  setExtendError(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${inputMode === 'generate' ? 'bg-[#d3a54a] text-black' : 'text-stone-300 hover:bg-white/10'}`}
              >
                Generate from image
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('upload-extend');
                  setError(null);
                  setExtendError(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${inputMode === 'upload-extend' ? 'bg-[#d3a54a] text-black' : 'text-stone-300 hover:bg-white/10'}`}
              >
                Upload to extend
              </button>
            </div>

            {inputMode === 'generate' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
            {/* Prompt */}
            <div className="space-y-2">
              <label htmlFor="batch-prompt" className="block text-sm font-medium text-stone-200">
                Prompt <span className="text-stone-500">(required)</span>
              </label>
              <textarea
                id="batch-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-[#d3a54a] focus:ring-2 focus:ring-[#d3a54a]/20"
                placeholder="Describe the motion, pacing, mood, and visual style…"
              />
              <p className="text-xs text-stone-500">All requests share this exact prompt — make it specific.</p>
            </div>

            {/* Source image */}
            <div className="space-y-2">
              <label htmlFor="batch-image" className="block text-sm font-medium text-stone-200">
                Source image — starting frame <span className="text-stone-500">(required)</span>
              </label>
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
                <input
                  id="batch-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  required
                  className="block w-full text-sm text-stone-300 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#d3a54a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-[#f5d27a]"
                />
                <p className="mt-2 text-xs leading-5 text-stone-500">PNG, JPG, or WEBP · max 10 MB. Grok uses this as the first frame and animates forward.</p>
              </div>
            </div>

            {/* Duration slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="batch-duration" className="block text-sm font-medium text-stone-200">Duration</label>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">{duration}s</span>
              </div>
              <input
                id="batch-duration"
                type="range"
                min={1}
                max={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-[#d3a54a]"
              />
              <div className="flex justify-between text-[0.65rem] text-stone-600">
                <span>1s</span><span>15s (max)</span>
              </div>
            </div>

            {/* Batch size slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="batch-size" className="block text-sm font-medium text-stone-200">Batch size</label>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">{batchSize} requests</span>
              </div>
              <input
                id="batch-size"
                type="range"
                min={1}
                max={50}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full accent-[#d3a54a]"
              />
              <div className="flex justify-between text-[0.65rem] text-stone-600">
                <span>1</span><span>50</span>
              </div>
            </div>

            {imagePreview ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                <p className="px-4 pt-3 text-xs font-medium uppercase tracking-[0.28em] text-stone-500">Preview — starting frame</p>
                <img src={imagePreview} alt="Selected source image" className="mt-2 h-64 w-full object-cover" />
              </div>
            ) : null}

            {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5d27a,#c98d2e)] px-6 py-4 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Starting batch…' : `Start ${batchSize}-request batch`}
            </button>
            </form>
            ) : (
            <form onSubmit={handleUploadExtendSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="upload-video" className="block text-sm font-medium text-stone-200">
                  Source video <span className="text-stone-500">(required)</span>
                </label>
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
                  <input
                    id="upload-video"
                    type="file"
                    accept="video/mp4,video/*"
                    onChange={handleUploadVideoChange}
                    required
                    className="block w-full text-sm text-stone-300 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#d3a54a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-[#f5d27a]"
                  />
                  <p className="mt-2 text-xs leading-5 text-stone-500">Upload any source clip. We automatically use the last 15 seconds as extension input and keep your full original for final composition.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="upload-extend-prompt" className="block text-sm font-medium text-stone-200">
                  Extension prompt <span className="text-stone-500">(required)</span>
                </label>
                <textarea
                  id="upload-extend-prompt"
                  value={extendPrompt}
                  onChange={(event) => setExtendPrompt(event.target.value)}
                  rows={4}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-[#d3a54a] focus:ring-2 focus:ring-[#d3a54a]/20"
                  placeholder="Describe what should happen next in the uploaded video..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="upload-extend-duration" className="block text-sm font-medium text-stone-200">Extension duration</label>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">{extendDuration}s</span>
                </div>
                <input
                  id="upload-extend-duration"
                  type="range"
                  min={2}
                  max={10}
                  value={extendDuration}
                  onChange={(e) => setExtendDuration(Number(e.target.value))}
                  className="w-full accent-[#d3a54a]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="upload-extend-request-count" className="block text-sm font-medium text-stone-200">Extension request count</label>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">{extendBatchSize} requests</span>
                </div>
                <input
                  id="upload-extend-request-count"
                  type="range"
                  min={1}
                  max={50}
                  value={extendBatchSize}
                  onChange={(e) => setExtendBatchSize(Number(e.target.value))}
                  className="w-full accent-[#d3a54a]"
                />
              </div>

              {extendError ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{extendError}</div> : null}
              {composeError ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{composeError}</div> : null}

              {(uploadPipelineStage !== 'idle' || uploadProcessingSummary) ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-stone-300">
                  <p className="font-medium uppercase tracking-[0.18em] text-stone-400">Pipeline stage</p>
                  <p className="mt-2 text-sm text-white">
                    {uploadPipelineStage === 'preparing'
                      ? 'Preparing source (auto trim to last 15s)...'
                      : uploadPipelineStage === 'extending'
                        ? 'Extending with xAI requests...'
                        : uploadPipelineStage === 'finalizing'
                          ? `Composing full videos ${composedReadyCount}/${uploadSucceededCount || 0}...`
                          : uploadPipelineStage === 'ready'
                            ? `Composed ${composedReadyCount} full video(s) from succeeded extensions.`
                            : 'Idle'}
                  </p>
                  {uploadProcessingSummary ? (
                    <p className="mt-2 leading-5 text-stone-400">
                      Source duration: {uploadProcessingSummary.originalDurationSeconds.toFixed(1)}s. Prepared input: {uploadProcessingSummary.preparedDurationSeconds.toFixed(1)}s
                      {uploadProcessingSummary.strategy === 'trim-last-15s'
                        ? ` (trimmed from ${uploadProcessingSummary.trimStartSeconds.toFixed(1)}s to end).`
                        : ' (no trim required).'}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmittingExtend}
                className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5d27a,#c98d2e)] px-6 py-4 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingExtend ? 'Starting extension requests…' : `Start ${extendBatchSize} extension requests`}
              </button>

              {bestUploadSuccessResult ? (
                <button
                  type="button"
                  disabled={
                    !uploadVideoFile ||
                    isBestUploadAlreadyComposed ||
                    bestUploadComposeState === 'composing'
                  }
                  onClick={() => {
                    if (bestUploadSuccessResult?.videoUrl) {
                      setIsComposingFinalVideo(true);
                      void composeUploadResult(bestUploadSuccessResult.batchRequestId, bestUploadSuccessResult.videoUrl).finally(() => {
                        setIsComposingFinalVideo(false);
                      });
                    }
                  }}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-6 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bestUploadComposeState === 'composing'
                    ? 'Composing best result…'
                    : isBestUploadAlreadyComposed
                      ? 'Best result already composed'
                      : 'Create seamless final from best result'}
                </button>
              ) : null}
            </form>
            )}
          </div>

          {composer ? (
            <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/5 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.4)] backdrop-blur sm:p-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-white">
                  {composer.level === 1 ? 'Create 1st extension' : `Create ${getOrdinal(composer.level)} extension`}
                </h2>
                <p className="text-sm leading-6 text-stone-400">
                  Extending {getComposerLabel()}. If no extension result is selected, submit overrides this level.
                </p>
              </div>

              <form onSubmit={handleExtendSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="extend-prompt" className="block text-sm font-medium text-stone-200">
                    Extension prompt <span className="text-stone-500">(required)</span>
                  </label>
                  <textarea
                    id="extend-prompt"
                    value={extendPrompt}
                    onChange={(event) => setExtendPrompt(event.target.value)}
                    rows={4}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-stone-500 focus:border-[#d3a54a] focus:ring-2 focus:ring-[#d3a54a]/20"
                    placeholder="Describe how the video should continue from the current source frame..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="extend-duration" className="block text-sm font-medium text-stone-200">Extension duration</label>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">
                      {extendDuration}s (total: {composer.accumulatedBefore + extendDuration}s)
                    </span>
                  </div>
                  <input
                    id="extend-duration"
                    type="range"
                    min={2}
                    max={10}
                    value={extendDuration}
                    onChange={(e) => setExtendDuration(Number(e.target.value))}
                    className="w-full accent-[#d3a54a]"
                  />
                  <div className="flex justify-between text-[0.65rem] text-stone-600">
                    <span>2s</span><span>10s (max extension)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="extend-batch-size" className="block text-sm font-medium text-stone-200">Extension request count</label>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-200">{extendBatchSize} requests</span>
                  </div>
                  <input
                    id="extend-batch-size"
                    type="range"
                    min={1}
                    max={50}
                    value={extendBatchSize}
                    onChange={(e) => setExtendBatchSize(Number(e.target.value))}
                    className="w-full accent-[#d3a54a]"
                  />
                  <div className="flex justify-between text-[0.65rem] text-stone-600">
                    <span>1</span><span>50</span>
                  </div>
                </div>

                {extendError ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{extendError}</div> : null}

                <button
                  type="submit"
                  disabled={isSubmittingExtend}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5d27a,#c98d2e)] px-6 py-4 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingExtend ? 'Starting extension requests…' : `Start ${extendBatchSize} extension requests`}
                </button>
              </form>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Batch status</h2>
                <p className="mt-1 text-sm text-stone-400">Read on demand — click refresh to check the latest state from xAI.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${!startResponse ? 'bg-white/8 text-stone-400' : isDone ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}>
                {!startResponse ? 'Idle' : isDone ? 'Complete' : 'Processing'}
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm text-stone-300">
              {startResponse?.batch.batch_id ? (
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={() => loadStatus(startResponse.batch.batch_id)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh status'}
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total" value={String(totalCount)} />
                <StatCard label="Done" value={String(completedCount)} />
                <StatCard label="Pending" value={String(pendingCount)} />
                <StatCard label="Errors" value={String(statusResponse?.batch.state.num_error ?? 0)} />
              </div>

              <ProgressBar completed={completedCount} total={totalCount} />

              {!isDone && startResponse ? (
                <p className="text-xs leading-5 text-stone-500">Video generation typically completes within minutes. Click «Refresh status» to check progress.</p>
              ) : null}

              {startResponse?.batch.batch_id ? (
                <div className="space-y-2 rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Batch id</p>
                  <p className="break-all text-sm text-white">{startResponse.batch.batch_id}</p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoChip label="Requests" value={String(startResponse?.requestCount ?? 10)} />
                <InfoChip label="Duration" value={`${startResponse?.duration ?? 15}s`} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Returned videos</h2>
                <p className="mt-1 text-sm text-stone-400">Signed URLs expire after ~1 hour — download each video promptly.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.28em] text-stone-500">{statusResponse?.results.length ?? 0} of {totalCount || batchSize}</span>
            </div>

            <div className="mt-6 space-y-4">
              {statusResponse?.results.length ? (
                statusResponse.results.map((result) => (
                  <VideoCard
                    key={result.batchRequestId}
                    result={result}
                    isSelected={
                      composer?.level === 1 &&
                      composer.sourceType === 'generation' &&
                      composer.sourceVideoId === result.batchRequestId
                    }
                    onSelectForExtension={() => selectGenerationForExtension(result)}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-stone-400">
                  {inputMode === 'generate'
                    ? 'Enter a prompt, upload a source image, and click start. Video results appear here once xAI processes each request.'
                    : 'Upload a source video, add an extension prompt, and click start. Extension results appear here after request polling.'}
                </div>
              )}
            </div>
          </div>

          {composedVideosByRequestId.size > 0 ? (
            <div className="rounded-[2rem] border border-emerald-300/30 bg-emerald-300/[0.05] p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">
                  {composedVideosByRequestId.size === 1 ? 'Composed video' : 'Composed videos'}
                </h2>
                <p className="text-sm text-stone-300">
                  {composedVideosByRequestId.size === 1
                    ? 'This combines the original upload and the extension result into one continuous output.'
                    : `Generated ${composedVideosByRequestId.size} composition${composedVideosByRequestId.size > 1 ? 's' : ''} combining the original upload with each successful extension.`}
                </p>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from(composedVideosByRequestId.entries()).map(([requestId, objectUrl], index) => (
                  <div key={requestId || `composed-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <video controls preload="metadata" src={objectUrl} className="w-full bg-black" style={{ aspectRatio: '16 / 9' }} />
                    <div className="p-3">
                      <a
                        href={objectUrl}
                        download={`composed-${requestId && requestId.length > 8 ? requestId.slice(0, 8) : `result-${index + 1}`}.mp4`}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-300/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-300/30"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {extensionLevels.map((levelItem) => {
            const levelStatus = levelItem.statusResponse;
            const levelTotal = levelStatus?.batch.state.num_requests ?? levelItem.startResponse.requestCount;
            const levelDone =
              (levelStatus?.batch.state.num_success ?? 0) +
              (levelStatus?.batch.state.num_error ?? 0);
            const levelPending = levelStatus?.batch.state.num_pending ?? 0;
            const levelIsDone = levelTotal > 0 && levelPending === 0;

            return (
              <div key={levelItem.level} className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.03] p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{getOrdinal(levelItem.level)} extension results</h2>
                    <p className="mt-1 text-sm text-stone-400">
                      Total generated duration for this level: {levelItem.accumulatedBefore + levelItem.configuredDuration}s
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${levelIsDone ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}>
                    {levelIsDone ? 'Complete' : 'Processing'}
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-sm text-stone-300">
                  <button
                    type="button"
                    disabled={isRefreshingExtend}
                    onClick={() => {
                      void loadExtensionStatus(levelItem.level, levelItem.startResponse.requestIds);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRefreshingExtend ? 'Refreshing...' : 'Refresh extension requests'}
                  </button>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Total" value={String(levelTotal)} />
                    <StatCard label="Done" value={String(levelDone)} />
                    <StatCard label="Pending" value={String(levelPending)} />
                    <StatCard label="Errors" value={String(levelStatus?.batch.state.num_error ?? 0)} />
                  </div>

                  <ProgressBar completed={levelDone} total={levelTotal} />

                  {levelStatus?.results.length ? (
                    <div className="space-y-4">
                      {levelStatus.results.map((result) => (
                        <VideoCard
                          key={`${levelItem.level}-${result.batchRequestId}`}
                          result={result}
                          isSelected={
                            composer?.level === levelItem.level + 1 &&
                            composer.sourceType === `extension_${levelItem.level}` &&
                            composer.sourceVideoId === result.batchRequestId
                          }
                          onSelectForExtension={() => selectExtensionResultForPromotion(levelItem, result)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-sm leading-6 text-stone-400">
                      Extension videos will appear here. Select one to promote to the next level, or select none to override this level.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

// ── VideoCard ─────────────────────────────────────────────────────────────────
// Downloads via fetch→blob so cross-origin signed URLs save correctly.
// Falls back to window.open if CORS blocks the fetch.

function VideoCard({
  result,
  isSelected,
  onSelectForExtension,
}: {
  result: BatchResult;
  isSelected?: boolean;
  onSelectForExtension?: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const isModerationBlocked = result.error === 'Blocked by content moderation; try a safer prompt.';

  const handleDownload = async () => {
    if (!result.videoUrl) return;
    setIsDownloading(true);
    setDownloadFailed(false);

    try {
      // Route through our server proxy to avoid CORS on xAI signed URLs
      const proxyUrl = `/api/xai/download?url=${encodeURIComponent(result.videoUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('proxy fetch failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${result.batchRequestId}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch {
      setDownloadFailed(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-3xl border ${isSelected ? 'border-[#d3a54a] bg-[#d3a54a]/10' : 'border-white/10 bg-black/30'}`}>
      {/* card header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.25em] text-stone-500">{result.batchRequestId}</p>
          <p className="text-sm text-white">
            {result.status === 'succeeded' ? 'Completed' : result.status === 'failed' ? 'Failed' : 'Processing…'}
          </p>
        </div>
        {result.duration ? (
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-stone-200">{result.duration}s</span>
        ) : null}
      </div>

      {/* video or waiting state */}
      {result.videoUrl ? (
        <>
          <video
            controls
            preload="metadata"
            src={result.videoUrl}
            className="w-full bg-black"
            style={{ aspectRatio: '16 / 9' }}
          />
          {/* download footer */}
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {onSelectForExtension ? (
                <button
                  type="button"
                  onClick={onSelectForExtension}
                  className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:w-auto ${isSelected ? 'bg-[#d3a54a] text-black hover:bg-[#f5d27a]' : 'border border-white/15 bg-white/[0.06] text-stone-200 hover:bg-white/10'}`}
                >
                  {isSelected ? '✓ Selected' : '↗ Select for extension'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#d3a54a] px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-[#f5d27a] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isDownloading ? 'Downloading…' : downloadFailed ? 'Download failed — retry' : '↓ Download .mp4'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-44 items-center justify-center px-6 text-center text-sm text-stone-400">
          {result.error ? (
            <div className="space-y-1">
              <p className="text-red-300">{result.error}</p>
              {isModerationBlocked ? (
                <p className="text-xs text-stone-400">Try a neutral continuation prompt without sensitive themes, explicit violence, or sexual content.</p>
              ) : null}
            </div>
          ) : (
            'Waiting for video URL — refresh status when the batch completes.'
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.28em] text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 px-4 py-3 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}