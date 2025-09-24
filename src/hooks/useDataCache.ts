import { useState, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface UseDataCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age before considering stale
}

export const useDataCache = <T>(
  key: string,
  options: UseDataCacheOptions = {}
) => {
  const { ttl = 5 * 60 * 1000, maxAge = 10 * 60 * 1000 } = options; // 5min TTL, 10min max age
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());

  const get = useCallback((cacheKey: string): T | null => {
    const entry = cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Si es muy viejo, eliminar del cache
    if (age > maxAge) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      return null;
    }

    return entry.data;
  }, [cache, maxAge]);

  const set = useCallback((cacheKey: string, data: T) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        key: cacheKey
      });
      return newCache;
    });
  }, []);

  const isStale = useCallback((cacheKey: string): boolean => {
    const entry = cache.get(cacheKey);
    if (!entry) return true;

    const now = Date.now();
    const age = now - entry.timestamp;
    return age > ttl;
  }, [cache, ttl]);

  const isLoading = useCallback((cacheKey: string): boolean => {
    return loadingRef.current.has(cacheKey);
  }, []);

  const setLoading = useCallback((cacheKey: string, loading: boolean) => {
    if (loading) {
      loadingRef.current.add(cacheKey);
    } else {
      loadingRef.current.delete(cacheKey);
    }
  }, []);

  const invalidate = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  const getOrFetch = useCallback(async (
    cacheKey: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T | null> => {
    // Si ya está cargando, no hacer otra petición
    if (isLoading(cacheKey)) {
      return get(cacheKey);
    }

    // Si no es forzado y tenemos datos frescos, devolverlos
    if (!forceRefresh) {
      const cached = get(cacheKey);
      if (cached && !isStale(cacheKey)) {
        return cached;
      }
    }

    // Cargar datos
    setLoading(cacheKey, true);
    try {
      const data = await fetchFn();
      set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${cacheKey}:`, error);
      return get(cacheKey); // Devolver datos en cache si hay error
    } finally {
      setLoading(cacheKey, false);
    }
  }, [get, set, isStale, isLoading, setLoading]);

  return {
    get,
    set,
    isStale,
    isLoading,
    invalidate,
    getOrFetch
  };
};


