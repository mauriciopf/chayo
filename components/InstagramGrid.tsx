'use client';

import { useEffect, useState } from 'react';
import { IGMedia, IGMediaResponse } from '@/lib/instagram/types';
import { InstagramPost } from './InstagramPost';
import { LoadingGrid } from './LoadingGrid';

export function InstagramGrid() {
  const [posts, setPosts] = useState<IGMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/instagram/feed?limit=50');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Instagram posts');
        }

        const data: IGMediaResponse = await response.json();
        setPosts(data.data);
      } catch (err) {
        console.error('Error fetching Instagram feed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Instagram feed');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return <LoadingGrid />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <p className="text-gray-600 dark:text-gray-400">No posts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
      {posts.map((post) => (
        <InstagramPost key={post.id} post={post} />
      ))}
    </div>
  );
}
