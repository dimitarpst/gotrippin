import { useState, useEffect, useCallback } from 'react';
import { searchImages, trackImageDownload, type UnsplashImage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useImageSearch() {
  const { accessToken, loading: authLoading } = useAuth();
  const [authReady, setAuthReady] = useState(false); // stable: flips true once after initial auth load
  const [query, setQuery] = useState<string>('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) setAuthReady(true);
  }, [authLoading]);

  const performSearch = useCallback(
    async (searchQuery: string, pageNum: number, isLoadingMore: boolean = false) => {
      if (!accessToken) {
        // Auth not ready yet (or user is logged out); don't attempt requests.
        return;
      }

      try {
        if (isLoadingMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const perPage = pageNum === 1 ? 9 : 12; // 9 for first page, 12 for subsequent
        const data = await searchImages(searchQuery, pageNum, perPage, accessToken);

        if (isLoadingMore) {
          // Filter out duplicates when loading more
          setImages((prev) => {
            const existingIds = new Set(prev.map(img => img.id));
            const newImages = data.results.filter(img => !existingIds.has(img.id));
            return [...prev, ...newImages];
          });
        } else {
          setImages(data.results);
        }

        setTotalPages(data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken],
  );

  // Search when query changes OR when auth first becomes ready
  // authReady is stable, preventing unnecessary re-searches on token refresh
  useEffect(() => {
    if (!query || !query.trim()) return;

    // While auth is loading, keep UI neutral (no failed requests / no spurious errors)
    if (!authReady) return;

    if (!accessToken) {
      setError("Authentication required");
      return;
    }

    if (query && query.trim()) {
      setPage(1);
      performSearch(query, 1, false);
    }
  }, [query, performSearch, authReady, accessToken]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, nextPage, true);
    }
  }, [loadingMore, page, totalPages, query, performSearch]);

  // Track download when user selects image
  const selectImage = useCallback(
    async (image: UnsplashImage) => {
      if (accessToken) {
        await trackImageDownload(image.links.download_location, accessToken);
      }
    },
    [accessToken],
  );

  return {
    images,
    loading,
    loadingMore,
    error,
    hasMore: page < totalPages,
    loadMore,
    setQuery,
    selectImage,
  };
}

