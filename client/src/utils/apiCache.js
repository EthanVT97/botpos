/**
 * Simple in-memory cache for API responses
 */
class APICache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${url}:${paramString}`;
  }

  /**
   * Get cached data if not stale
   */
  get(url, params = {}, maxAge = 60000) {
    const key = this.generateKey(url, params);
    const timestamp = this.timestamps.get(key);
    
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > maxAge) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * Set cache data
   */
  set(url, params = {}, data) {
    const key = this.generateKey(url, params);
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete specific cache entry
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Invalidate cache by URL pattern
   */
  invalidate(urlPattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiCache = new APICache();

/**
 * Cache middleware for axios
 */
export const cacheMiddleware = (config) => {
  // Only cache GET requests
  if (config.method?.toLowerCase() !== 'get') {
    return config;
  }

  const cacheTime = config.cacheTime || 60000; // 1 minute default
  const cached = apiCache.get(config.url, config.params, cacheTime);

  if (cached) {
    console.log('📦 Cache hit:', config.url);
    // Return cached data
    return Promise.resolve({
      ...config,
      data: cached,
      cached: true
    });
  }

  return config;
};

/**
 * Cache response interceptor
 */
export const cacheResponseInterceptor = (response) => {
  // Only cache successful GET requests
  if (response.config.method?.toLowerCase() === 'get' && response.status === 200) {
    apiCache.set(response.config.url, response.config.params, response.data);
  }

  return response;
};

/**
 * Invalidate cache on mutations
 */
export const invalidateCacheOnMutation = (config) => {
  const method = config.method?.toLowerCase();
  
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    // Extract resource from URL
    const resource = config.url?.split('/')[1]; // e.g., /api/products -> products
    
    if (resource) {
      console.log('🗑️  Invalidating cache for:', resource);
      apiCache.invalidate(resource);
    }
  }

  return config;
};

export default apiCache;
