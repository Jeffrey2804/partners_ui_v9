/**
 * Calendar-Timezone Connection Service
 *
 * This service manages the relationship between calendars and their timezones,
 * ensuring that each calendar uses its correct timezone for scheduling and slot fetching.
 */

import { getCalendarsList, getLocationTimezone } from './api/ghlCalendarService.js';
import { fetchGHLAllTimezones } from './timezoneService.js';
import { GHL_CONFIG } from '../../config/ghlConfig.js';

// Cache for calendar timezone mappings
const calendarTimezoneCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get timezone for a specific calendar
 * @param {string} calendarId - Calendar ID
 * @param {string} [locationId] - Location ID (optional, will use default from config)
 * @returns {Promise<Object>} Calendar timezone information
 */
export async function getCalendarTimezone(calendarId, locationId = null) {
  if (!calendarId) {
    throw new Error('Calendar ID is required');
  }

  const effectiveLocationId = locationId || GHL_CONFIG?.locationId;
  const cacheKey = `${calendarId}_${effectiveLocationId}`;

  // Check cache first
  const cached = calendarTimezoneCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    console.warn('🌍 Fetching timezone for calendar:', calendarId);

    // First, try to get timezone from calendar list
    const calendarsResponse = await getCalendarsList(effectiveLocationId);

    if (calendarsResponse.calendars) {
      const calendar = calendarsResponse.calendars.find(cal => cal.id === calendarId);

      if (calendar && calendar.timezone) {
        const timezoneInfo = {
          timezone: calendar.timezone,
          display: calendar.timezoneDisplay || formatTimezoneDisplay(calendar.timezone),
          source: 'calendar',
          calendarId,
          locationId: effectiveLocationId,
        };

        // Cache the result
        calendarTimezoneCache.set(cacheKey, {
          data: timezoneInfo,
          timestamp: Date.now(),
        });

        console.warn('✅ Found calendar-specific timezone:', calendar.timezone);
        return timezoneInfo;
      }
    }

    // Fallback: Get location timezone
    console.warn('📍 Calendar timezone not found, falling back to location timezone');
    const locationTimezone = await getLocationTimezone(effectiveLocationId);

    const timezoneInfo = {
      timezone: locationTimezone.timezone,
      display: locationTimezone.display,
      source: 'location',
      calendarId,
      locationId: effectiveLocationId,
    };

    // Cache the result
    calendarTimezoneCache.set(cacheKey, {
      data: timezoneInfo,
      timestamp: Date.now(),
    });

    console.warn('✅ Using location timezone:', locationTimezone.timezone);
    return timezoneInfo;

  } catch (error) {
    console.error('❌ Error fetching calendar timezone:', error.message);

    // Final fallback
    const fallbackTimezone = {
      timezone: 'America/Los_Angeles',
      display: formatTimezoneDisplay('America/Los_Angeles'),
      source: 'fallback',
      calendarId,
      locationId: effectiveLocationId,
      error: error.message,
    };

    // Cache the fallback result for a shorter duration
    calendarTimezoneCache.set(cacheKey, {
      data: fallbackTimezone,
      timestamp: Date.now() - (CACHE_DURATION - 60000), // Expires in 1 minute
    });

    return fallbackTimezone;
  }
}

/**
 * Get timezone mappings for multiple calendars
 * @param {string[]} calendarIds - Array of calendar IDs
 * @param {string} [locationId] - Location ID (optional)
 * @returns {Promise<Object>} Map of calendar ID to timezone info
 */
export async function getCalendarTimezones(calendarIds, locationId = null) {
  if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
    return {};
  }

  const effectiveLocationId = locationId || GHL_CONFIG?.locationId;
  console.warn('🌍 Fetching timezones for multiple calendars:', calendarIds);

  try {
    // Fetch all calendars at once for efficiency
    const calendarsResponse = await getCalendarsList(effectiveLocationId);
    const calendars = calendarsResponse.calendars || [];

    // Get location timezone as fallback
    const locationTimezone = await getLocationTimezone(effectiveLocationId);

    const timezoneMap = {};

    for (const calendarId of calendarIds) {
      const calendar = calendars.find(cal => cal.id === calendarId);

      if (calendar && calendar.timezone) {
        timezoneMap[calendarId] = {
          timezone: calendar.timezone,
          display: calendar.timezoneDisplay || formatTimezoneDisplay(calendar.timezone),
          source: 'calendar',
          calendarId,
          locationId: effectiveLocationId,
        };
      } else {
        timezoneMap[calendarId] = {
          timezone: locationTimezone.timezone,
          display: locationTimezone.display,
          source: 'location',
          calendarId,
          locationId: effectiveLocationId,
        };
      }

      // Cache individual results
      const cacheKey = `${calendarId}_${effectiveLocationId}`;
      calendarTimezoneCache.set(cacheKey, {
        data: timezoneMap[calendarId],
        timestamp: Date.now(),
      });
    }

    console.warn('✅ Retrieved timezones for calendars:', Object.keys(timezoneMap));
    return timezoneMap;

  } catch (error) {
    console.error('❌ Error fetching calendar timezones:', error.message);

    // Return fallback for all calendars
    const fallbackMap = {};
    calendarIds.forEach(calendarId => {
      fallbackMap[calendarId] = {
        timezone: 'America/Los_Angeles',
        display: formatTimezoneDisplay('America/Los_Angeles'),
        source: 'fallback',
        calendarId,
        locationId: effectiveLocationId,
        error: error.message,
      };
    });

    return fallbackMap;
  }
}

/**
 * Update calendar timezone cache
 * @param {string} calendarId - Calendar ID
 * @param {string} timezone - New timezone
 * @param {string} [locationId] - Location ID
 */
export function updateCalendarTimezoneCache(calendarId, timezone, locationId = null) {
  const effectiveLocationId = locationId || GHL_CONFIG?.locationId;
  const cacheKey = `${calendarId}_${effectiveLocationId}`;

  const timezoneInfo = {
    timezone,
    display: formatTimezoneDisplay(timezone),
    source: 'manual',
    calendarId,
    locationId: effectiveLocationId,
  };

  calendarTimezoneCache.set(cacheKey, {
    data: timezoneInfo,
    timestamp: Date.now(),
  });

  console.warn('📝 Updated calendar timezone cache:', { calendarId, timezone });
}

/**
 * Clear timezone cache
 * @param {string} [calendarId] - Optional calendar ID to clear specific entry
 */
export function clearCalendarTimezoneCache(calendarId = null) {
  if (calendarId) {
    // Clear specific calendar entries
    const keysToDelete = [];
    for (const key of calendarTimezoneCache.keys()) {
      if (key.startsWith(`${calendarId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => calendarTimezoneCache.delete(key));
    console.warn('🗑️ Cleared timezone cache for calendar:', calendarId);
  } else {
    // Clear all cache
    calendarTimezoneCache.clear();
    console.warn('🗑️ Cleared all timezone cache');
  }
}

/**
 * Get all available timezones for a location
 * @param {string} [locationId] - Location ID (optional)
 * @returns {Promise<string[]>} Array of timezone strings
 */
export async function getAvailableTimezones(locationId = null) {
  const effectiveLocationId = locationId || GHL_CONFIG?.locationId;

  try {
    console.warn('🌐 Fetching available timezones for location:', effectiveLocationId);
    const timezones = await fetchGHLAllTimezones(effectiveLocationId);
    return timezones || [];
  } catch (error) {
    console.error('❌ Error fetching available timezones:', error.message);
    return [
      'America/Los_Angeles',
      'America/Chicago',
      'America/New_York',
      'America/Denver',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
    ];
  }
}

/**
 * Format timezone for display
 * @param {string} timezone - Timezone string
 * @returns {string} Formatted timezone display
 */
function formatTimezoneDisplay(timezone) {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const localTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (localTime.getTime() - utc.getTime()) / (1000 * 60 * 60);

    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset);
    const minutes = (absOffset - hours) * 60;
    const offsetStr = `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const abbreviation = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || '';

    return `${offsetStr} ${timezone} ${abbreviation ? `(${abbreviation})` : ''}`.trim();
  } catch (_error) {
    return timezone;
  }
}

/**
 * Validate if a timezone is valid
 * @param {string} timezone - Timezone to validate
 * @returns {boolean} Whether the timezone is valid
 */
export function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get cache statistics (for debugging)
 * @returns {Object} Cache statistics
 */
export function getCalendarTimezoneCacheStats() {
  const stats = {
    totalEntries: calendarTimezoneCache.size,
    entries: [],
  };

  for (const [key, value] of calendarTimezoneCache.entries()) {
    stats.entries.push({
      key,
      timezone: value.data.timezone,
      source: value.data.source,
      age: Math.round((Date.now() - value.timestamp) / 1000),
      isExpired: Date.now() - value.timestamp > CACHE_DURATION,
    });
  }

  return stats;
}
