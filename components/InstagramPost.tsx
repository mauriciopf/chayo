import Image from 'next/image';
import { IGMedia } from '@/lib/instagram/types';

interface InstagramPostProps {
  post: IGMedia;
}

export function InstagramPost({ post }: InstagramPostProps) {
  const imageUrl = post.media_type === 'VIDEO' && post.thumbnail_url 
    ? post.thumbnail_url 
    : post.media_url;

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800"
    >
      <Image
        src={imageUrl}
        alt={post.caption || 'Instagram post'}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center p-4">
        {post.caption && (
          <p className="text-white text-sm text-center line-clamp-4">
            {post.caption}
          </p>
        )}
      </div>

      {/* Video indicator */}
      {post.media_type === 'VIDEO' && (
        <div className="absolute top-2 right-2 bg-black/70 rounded-full p-2">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      )}

      {/* Carousel indicator */}
      {post.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-2 right-2 bg-black/70 rounded-full p-2">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </a>
  );
}
