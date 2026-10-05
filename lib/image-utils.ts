/**
 * Utility to resolve cover photos, thumbnails, and posters securely.
 * Automatically wraps Bunny.net CDN thumbnails through the local proxy to prevent 403 Forbidden errors.
 */

export const DEFAULT_FALLBACK_POSTER = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80';
export const DEFAULT_MOVIE_POSTER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
export const DEFAULT_SERIES_POSTER = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80';

export function getSafeImageUrl(
  url?: string | null,
  fallback = DEFAULT_FALLBACK_POSTER
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // 1. Data URLs (e.g. client compressed base64 images)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 2. Bunny CDN thumbnail or Stream video thumbnail
  if (trimmed.includes('b-cdn.net')) {
    const guidMatch = trimmed.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (guidMatch) {
      return `/api/bunny/thumbnail?videoId=${guidMatch[1]}`;
    }
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  // 3. Bunny Storage direct path
  if (trimmed.includes('storage.bunnycdn.com')) {
    return `/api/bunny/stream?url=${encodeURIComponent(trimmed)}`;
  }

  // 4. Raw GUID passed directly as poster
  if (trimmed.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    return `/api/bunny/thumbnail?videoId=${trimmed}`;
  }

  // 5. Already proxied
  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }

  // 6. External web image
  return trimmed;
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_FALLBACK_POSTER
) {
  const target = e.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
