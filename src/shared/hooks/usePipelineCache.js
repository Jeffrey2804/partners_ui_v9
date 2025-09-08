import { useState, useEffect, useCallback } from 'react';
import { uiLogger } from '@utils/logger';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'pipeline_data_cache';

export const usePipelineCache = () => {
  const [cache, setCache] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
          setCache(parsed.data);
          setLastUpdated(new Date(parsed.timestamp));
          uiLogger.debug('Loaded pipeline data from cache');
        } else {
          localStorage.removeItem(CACHE_KEY);
          uiLogger.debug('Cache expired, removed from localStorage');
        }
      }
    } catch (error) {
      uiLogger.error('Error loading cache from localStorage', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Save data to cache
  const setCachedData = useCallback((data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };

      setCache(data);
      setLastUpdated(new Date());
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      uiLogger.debug('Saved pipeline data to cache');
    } catch (error) {
      uiLogger.error('Error saving cache to localStorage', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      setCache(null);
      setLastUpdated(null);
      localStorage.removeItem(CACHE_KEY);
      uiLogger.debug('Cleared pipeline cache');
    } catch (error) {
      uiLogger.error('Error clearing cache', error);
    }
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cache || !lastUpdated) return false;
    return Date.now() - lastUpdated.getTime() < CACHE_DURATION;
  }, [cache, lastUpdated]);

  // Get cache age in minutes
  const getCacheAge = useCallback(() => {
    if (!lastUpdated) return null;
    return Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60));
  }, [lastUpdated]);

  return {
    cache,
    lastUpdated,
    setCachedData,
    clearCache,
    isCacheValid,
    getCacheAge,
  };
};

export default usePipelineCache;
