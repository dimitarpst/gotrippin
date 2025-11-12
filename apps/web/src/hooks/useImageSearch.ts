import { useState, useEffect, useCallback } from 'react';
import { searchImages, trackImageDownload, type UnsplashImage } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';

export function useImageSearch() {
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get session token on mount and auth changes
  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token || null);
    };

    getToken();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setToken(session?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const performSearch = useCallback(
    async (searchQuery: string, pageNum: number, isLoadingMore: boolean = false) => {
      if (!token) return;

      try {
        if (isLoadingMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const perPage = pageNum === 1 ? 9 : 12; // 9 for first page, 12 for subsequent
        const data = await searchImages(searchQuery, pageNum, perPage, token);

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
    [token],
  );

  // Search when query changes (but not on mount if empty)
  useEffect(() => {
    if (query && query.trim()) {
      setPage(1);
      performSearch(query, 1, false);
    }
  }, [query, performSearch]);

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
      if (token) {
        await trackImageDownload(image.links.download_location, token);
      }
    },
    [token],
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

