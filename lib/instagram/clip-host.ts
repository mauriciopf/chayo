import { createClient } from '@supabase/supabase-js';

const BUCKET = 'carousel';

function hostError(message: string) {
  return new Error(message);
}

export async function hostCarouselClip(bytes: Uint8Array) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw hostError('Carousel clips need the Supabase URL and service role so Instagram can fetch the file.');
  }

  if (bytes.byteLength > 45 * 1024 * 1024) {
    throw hostError('The carousel clip is too large to host.');
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const existing = await supabase.storage.getBucket(BUCKET);

  if (existing.error) {
    const created = await supabase.storage.createBucket(BUCKET, { public: true });
    const message = created.error?.message ?? '';

    if (created.error && !/already exists/i.test(message)) {
      throw hostError(message || 'The carousel clip store could not be created.');
    }
  }

  const objectPath = `clips/${crypto.randomUUID()}.mp4`;
  const uploaded = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: 'video/mp4',
    cacheControl: '31536000',
    upsert: false,
  });

  if (uploaded.error) {
    throw hostError(uploaded.error.message || 'The carousel clip could not be stored.');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const publicUrl = data.publicUrl?.trim() ?? '';

  if (!publicUrl.startsWith('https://')) {
    throw hostError('The carousel clip has no public https link.');
  }

  return publicUrl;
}
