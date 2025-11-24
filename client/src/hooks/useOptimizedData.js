import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Optimized data fetching hook with caching and deduplication
 */
export const useOptimizedData = (fetchFunction, dependencies = [], options = {}) => {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    staleTime = 30 * 1000, // 30 seconds default
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, timestamp: 0 });
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Check cache
    const now = Date.now();
    const cacheAge = now - cacheRef.current.timestamp;
    
    if (!force && cacheRef.current.data && cacheAge < staleTime) {
      setData(cacheRef.current.data);
      setLoading(false);
      return cacheRef.current.data;
    }

    // Prevent duplicate requests
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      
      // Update cache
      cacheRef.current = {
        data: result,
        timestamp: Date.now()
      };

      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetchFunction, staleTime, onSuccess, onError]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cacheRef.current = { data: null, timestamp: 0 };
  }, []);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, dependencies);

  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cacheAge = Date.now() - cacheRef.current.timestamp;
      if (cacheAge > staleTime) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, staleTime, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isCached: cacheRef.current.data !== null
  };
};

/**
 * Debounced value hook for search inputs
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttled callback hook for scroll/resize events
 */
export const useThrottle = (callback, delay = 200) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options, hasIntersected]);

  return { targetRef, isIntersecting, hasIntersected };
};

export default useOptimizedData;
