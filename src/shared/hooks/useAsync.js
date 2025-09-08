import { useState, useCallback } from 'react';
import { logger } from '@utils/logger';

/**
 * Custom hook for handling async operations with loading and error states
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Whether to execute the function immediately
 * @returns {Object} Object containing data, loading, error, and execute function
 */
export const useAsync = (asyncFunction, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);

      logger.debug('Starting async operation', { functionName: asyncFunction.name });

      const result = await asyncFunction(...args);
      setData(result);

      logger.debug('Async operation completed successfully', {
        functionName: asyncFunction.name,
        resultSize: JSON.stringify(result).length,
      });

      return result;
    } catch (err) {
      logger.error('Async operation failed', err, { functionName: asyncFunction.name });
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  // Execute immediately if requested
  useState(() => {
    if (immediate) {
      execute();
    }
  });

  return {
    data,
    loading,
    error,
    execute,
    reset: () => {
      setData(null);
      setLoading(false);
      setError(null);
    },
  };
};

export default useAsync;
