/**
 * Performance monitoring utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing an operation
   */
  start(label) {
    if (!this.enabled) return;
    
    this.metrics.set(label, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  /**
   * End timing an operation
   */
  end(label) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(label);
    if (!metric) {
      console.warn(`No metric found for: ${label}`);
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`⏱️  ${label}: ${metric.duration.toFixed(2)}ms`);

    return metric.duration;
  }

  /**
   * Measure a function execution time
   */
  async measure(label, fn) {
    if (!this.enabled) {
      return await fn();
    }

    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [label, data] of this.metrics.entries()) {
      if (data.duration !== null) {
        metrics[label] = data.duration;
      }
    }
    return metrics;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Log performance summary
   */
  summary() {
    if (!this.enabled) return;

    console.group('📊 Performance Summary');
    const metrics = this.getMetrics();
    
    Object.entries(metrics)
      .sort((a, b) => b[1] - a[1])
      .forEach(([label, duration]) => {
        const color = duration > 1000 ? 'red' : duration > 500 ? 'orange' : 'green';
        console.log(`%c${label}: ${duration.toFixed(2)}ms`, `color: ${color}`);
      });
    
    console.groupEnd();
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * React component performance wrapper
 */
export const withPerformance = (Component, componentName) => {
  return (props) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) { // More than one frame (60fps)
        console.warn(`⚠️  Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    });

    return <Component {...props} />;
  };
};

/**
 * Measure component render time
 */
export const useRenderTime = (componentName) => {
  const renderCount = React.useRef(0);
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔄 ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });
};

/**
 * Detect memory leaks
 */
export const detectMemoryLeaks = () => {
  if (!performance.memory) {
    console.warn('Memory API not available');
    return;
  }

  const used = performance.memory.usedJSHeapSize / 1048576;
  const total = performance.memory.totalJSHeapSize / 1048576;
  const limit = performance.memory.jsHeapSizeLimit / 1048576;

  console.group('💾 Memory Usage');
  console.log(`Used: ${used.toFixed(2)} MB`);
  console.log(`Total: ${total.toFixed(2)} MB`);
  console.log(`Limit: ${limit.toFixed(2)} MB`);
  console.log(`Usage: ${((used / limit) * 100).toFixed(2)}%`);
  console.groupEnd();

  if (used / limit > 0.9) {
    console.error('⚠️  High memory usage detected!');
  }
};

/**
 * Monitor bundle size
 */
export const logBundleSize = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const resources = performance.getEntriesByType('resource');
  const jsFiles = resources.filter(r => r.name.endsWith('.js'));
  const cssFiles = resources.filter(r => r.name.endsWith('.css'));

  const totalJS = jsFiles.reduce((sum, file) => sum + file.transferSize, 0);
  const totalCSS = cssFiles.reduce((sum, file) => sum + file.transferSize, 0);

  console.group('📦 Bundle Size');
  console.log(`JavaScript: ${(totalJS / 1024).toFixed(2)} KB`);
  console.log(`CSS: ${(totalCSS / 1024).toFixed(2)} KB`);
  console.log(`Total: ${((totalJS + totalCSS) / 1024).toFixed(2)} KB`);
  console.groupEnd();
};

/**
 * Monitor API call performance
 */
export const monitorAPICall = async (url, fetchFn) => {
  const label = `API: ${url}`;
  return await perfMonitor.measure(label, fetchFn);
};

export default perfMonitor;
