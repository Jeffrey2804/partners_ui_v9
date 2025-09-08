// ========================================
// 🚀 APP INITIALIZATION HOOK
// ========================================

import { useEffect, useState } from 'react';
import { createLogger } from '@utils/logger';
import { initializeTimezone, getCurrentTimezone, fetchGHLTimezone } from '@services/timezoneService';
import { GHL_CONFIG } from '@config/ghlConfig';

const appLogger = createLogger('AppInitialization');

/**
 * 🚀 Custom hook for app initialization
 * Now integrates with real GHL timezone service
 */
export const useAppInitialization = (locationId = null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timezone, setTimezone] = useState('America/Los_Angeles');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        appLogger.info('🚀 Starting app initialization with real GHL timezone...');
        setIsLoading(true);
        setError(null);

        const targetLocationId = locationId || GHL_CONFIG.locationId;
        appLogger.info('📍 Initializing for location:', targetLocationId);

        // Try to fetch real timezone from GHL
        let fetchedTimezone = null;

        try {
          // First try the dedicated timezone endpoint
          appLogger.info('🌍 Attempting to fetch timezone from GHL timezone API...');
          fetchedTimezone = await fetchGHLTimezone(targetLocationId);
          if (fetchedTimezone && fetchedTimezone !== 'America/Los_Angeles') {
            appLogger.success('✅ Successfully fetched timezone from GHL:', fetchedTimezone);
          } else {
            appLogger.warn('⚠️ GHL timezone API returned fallback, trying initialization service...');
            throw new Error('Timezone API returned fallback value');
          }
        } catch (ghlError) {
          appLogger.warn('⚠️ Direct timezone fetch failed, trying initialization service:', ghlError.message);

          // Fallback to full initialization service
          try {
            fetchedTimezone = await initializeTimezone(targetLocationId);
            if (fetchedTimezone && fetchedTimezone !== 'America/Los_Angeles') {
              appLogger.success('✅ Timezone initialized via service:', fetchedTimezone);
            } else {
              appLogger.warn('⚠️ Timezone service also returned fallback');
            }
          } catch (serviceError) {
            appLogger.warn('⚠️ Timezone service initialization failed:', serviceError.message);
            appLogger.info('🔄 Will use fallback timezone and continue app initialization');
          }
        }

        // Set the timezone (either fetched or fallback)
        const finalTimezone = fetchedTimezone || 'America/Los_Angeles';
        setTimezone(finalTimezone);

        // Test the timezone to make sure it's valid
        try {
          const testDate = new Date();
          const testFormatted = testDate.toLocaleString('en-US', { timeZone: finalTimezone });
          appLogger.info(`🕐 Timezone test successful. Current time in ${finalTimezone}: ${testFormatted}`);
        } catch (_timezoneError) {
          appLogger.warn(`⚠️ Timezone validation failed for ${finalTimezone}, using fallback`);
          setTimezone('America/Los_Angeles');
        }

        setIsInitialized(true);
        appLogger.success('✅ App initialization completed successfully');

      } catch (error) {
        appLogger.error('❌ App initialization failed:', error);
        setError(error.message);
        setTimezone('America/Los_Angeles'); // Always provide a fallback
        setIsInitialized(true); // Still mark as initialized to not block the app
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [locationId]);

  return {
    isInitialized,
    isLoading,
    error,
    timezone,
  };
};

/**
 * 🕒 Custom hook for timezone operations
 * Now integrates with real GHL timezone service
 */
export const useTimezone = () => {
  const [currentTimezone, setCurrentTimezone] = useState('America/Los_Angeles');

  useEffect(() => {
    // Try to get the current timezone from the service
    const timezone = getCurrentTimezone();
    if (timezone) {
      setCurrentTimezone(timezone);
    }
  }, []);

  const refreshTimezone = async (_newLocationId = null) => {
    try {
      // Get the latest timezone from the service
      const timezone = getCurrentTimezone();
      if (timezone) {
        setCurrentTimezone(timezone);
        return timezone;
      }
      return currentTimezone;
    } catch (_error) {
      return currentTimezone;
    }
  };

  const convertToLocalTime = (utcDate, format = 'datetime') => {
    // Enhanced date conversion using the real timezone
    try {
      const date = new Date(utcDate);
      if (isNaN(date.getTime())) {
        return utcDate;
      }

      const options = {
        timeZone: currentTimezone,
      };

      if (format === 'date') {
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
      } else if (format === 'time') {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
      } else {
        // datetime
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
      }

      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (_error) {
      // Fallback to simple conversion
      const date = new Date(utcDate);
      return format === 'date' ? date.toLocaleDateString() : date.toLocaleString();
    }
  };

  const convertToUTC = (localDate) => {
    // Simple UTC conversion
    try {
      return new Date(localDate).toISOString();
    } catch (_error) {
      return localDate;
    }
  };

  const formatForAPI = (date, includeTime = true) => {
    try {
      const d = new Date(date);
      return includeTime ? d.toISOString() : d.toISOString().split('T')[0];
    } catch (_error) {
      return date;
    }
  };

  const getTimezoneInfo = () => {
    return {
      timezone: currentTimezone,
      offset: new Date().getTimezoneOffset(),
      name: getTimezoneName(currentTimezone),
    };
  };

  const getTimezoneName = (timezone) => {
    const timezoneNames = {
      'America/New_York': 'Eastern Time',
      'America/Chicago': 'Central Time',
      'America/Denver': 'Mountain Time',
      'America/Los_Angeles': 'Pacific Time',
      'America/Phoenix': 'Mountain Standard Time',
      'UTC': 'Coordinated Universal Time',
    };

    return timezoneNames[timezone] || timezone;
  };

  return {
    timezone: currentTimezone,
    refreshTimezone,
    convertToLocalTime,
    convertToUTC,
    formatForAPI,
    getTimezoneInfo,
    isReady: () => true,
  };
};

export default useAppInitialization;
