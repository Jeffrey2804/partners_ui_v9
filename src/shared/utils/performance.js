/**
 * Performance Monitoring Utilities
 * Tools for tracking and monitoring application performance
 */

import { logger } from './logger';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} name - Name of the operation
   * @returns {string} Timer ID
   */
  startTimer(name) {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(timerId, {
      name,
      startTime: performance.now(),
      endTime: null,
      duration: null,
    });

    logger.debug('Performance timer started', { name, timerId });
    return timerId;
  }

  /**
   * End timing an operation
   * @param {string} timerId - Timer ID from startTimer
   * @returns {Object} Performance metrics
   */
  endTimer(timerId) {
    const metric = this.metrics.get(timerId);
    if (!metric) {
      logger.warn('Timer not found', { timerId });
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    logger.debug('Performance timer ended', {
      name: metric.name,
      duration: `${metric.duration.toFixed(2)}ms`,
    });

    return metric;
  }

  /**
   * Measure function execution time
   * @param {Function} fn - Function to measure
   * @param {string} name - Name for the measurement
   * @returns {Promise<any>} Function result
   */
  async measureFunction(fn, name) {
    const timerId = this.startTimer(name);

    try {
      const result = await fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Get performance metrics
   * @param {string} name - Filter by operation name
   * @returns {Array} Array of performance metrics
   */
  getMetrics(name = null) {
    const metrics = Array.from(this.metrics.values());
    return name ? metrics.filter(m => m.name === name) : metrics;
  }

  /**
   * Get average duration for an operation
   * @param {string} name - Operation name
   * @returns {number} Average duration in milliseconds
   */
  getAverageDuration(name) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / metrics.length;
  }

  /**
   * Clear performance metrics
   * @param {string} name - Clear specific operation metrics
   */
  clearMetrics(name = null) {
    if (name) {
      for (const [timerId, metric] of this.metrics.entries()) {
        if (metric.name === name) {
          this.metrics.delete(timerId);
        }
      }
    } else {
      this.metrics.clear();
    }

    logger.debug('Performance metrics cleared', { name });
  }

  /**
   * Monitor memory usage
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }

  /**
   * Monitor network performance
   * @returns {Object} Network performance information
   */
  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }

  /**
   * Create performance observer
   * @param {string} type - Observer type
   * @param {Function} callback - Callback function
   */
  createObserver(type, callback) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(callback);
        observer.observe({ entryTypes: [type] });
        this.observers.set(type, observer);
        logger.debug('Performance observer created', { type });
      } catch (error) {
        logger.error('Failed to create performance observer', error, { type });
      }
    }
  }

  /**
   * Disconnect performance observers
   */
  disconnectObservers() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    logger.debug('Performance observers disconnected');
  }

  /**
   * Generate performance report
   * @returns {Object} Performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const memoryUsage = this.getMemoryUsage();
    const networkInfo = this.getNetworkInfo();

    const report = {
      timestamp: new Date().toISOString(),
      totalOperations: metrics.length,
      averageDuration: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
        : 0,
      operationsByType: {},
      memoryUsage,
      networkInfo,
    };

    // Group metrics by operation name
    for (const metric of metrics) {
      if (!report.operationsByType[metric.name]) {
        report.operationsByType[metric.name] = [];
      }
      report.operationsByType[metric.name].push(metric.duration);
    }

    // Calculate averages for each operation type
    for (const [name, durations] of Object.entries(report.operationsByType)) {
      report.operationsByType[name] = {
        count: durations.length,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
      };
    }

    return report;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
