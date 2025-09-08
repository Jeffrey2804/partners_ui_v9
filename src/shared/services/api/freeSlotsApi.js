// ========================================
// 🎯 UNIFIED FREE SLOTS API - CLEAN VERSION
// ========================================
// Single source of truth for GHL free slots functionality
// Based on official GHL API documentation for /calendars/{calendarId}/free-slots
//
// API Reference:
// - Response format: { "_dates_": {...}, "slots": [...] }
// - Date range limit: Maximum 31 days (inclusive)
// - Supported parameters: startDate, endDate, timezone, userId, userIds
// - Timestamp format: milliseconds (e.g., 1548898600000)
// ========================================

import { GHL_CONFIG } from '@config/ghlConfig';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_MS = 31 * DAY_MS; // inclusive window
const DEBUG = (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production' && process?.env?.GHL_DEBUG !== '0');

/**
 * 🎯 Fetch free slots from GHL Calendar API
 * @param {Object} params - Parameters
 * @param {string} params.calendarId - Calendar ID (required)
 * @param {string|number|Date} params.startDate - Start date (required)
 * @param {string|number|Date} params.endDate - End date (required)
 * @param {string} [params.timeZone] - Timezone (optional, e.g., "America/Chihuahua")
 * @param {string} [params.userId] - User ID filter (optional)
 * @param {string[]|string} [params.userIds] - Multiple user IDs filter (optional)
 * @param {AbortSignal} [params.signal] - Optional AbortController signal
 * @returns {Promise<Object>} - Standardized response
 */
export async function fetchFreeSlots({
  calendarId,
  startDate,
  endDate,
  timeZone = null,
  userId = null,
  userIds = null,
  signal,
} = {}) {
  // Validate required parameters
  if (!calendarId || !startDate || !endDate) {
    throw new Error('calendarId, startDate, and endDate are required');
  }

  if (typeof calendarId !== 'string') {
    throw new Error('Invalid calendar ID: must be a string');
  }

  try {
    // Convert dates to milliseconds (GHL API format)
    const startMs = normalizeDateToMs(startDate);
    const endMs = normalizeDateToMs(endDate);

    // Validate date range (GHL API limit: 31 days maximum inclusive)
    if ((endMs - startMs) > (MAX_RANGE_MS - 1)) {
      const days = Math.ceil((endMs - startMs) / DAY_MS);
      throw new Error(`Date range too large: ${days} days. Maximum allowed: 31 days.`);
    }

    // Build API URL with query parameters per GHL documentation
    const params = new URLSearchParams();
    params.append('startDate', String(startMs));
    params.append('endDate', String(endMs));

    if (timeZone) params.append('timezone', timeZone);
    if (userId) params.append('userId', userId);
    if (userIds) appendUserIds(params, userIds, GHL_CONFIG?.userIdsStyle || 'repeat'); // 'repeat' | 'csv'

    const apiUrl = `https://services.leadconnectorhq.com/calendars/${encodeURIComponent(calendarId)}/free-slots?${params.toString()}`;

    // Make API request
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${GHL_CONFIG.token}`,
      'Version': GHL_CONFIG.version,
    };
    if (GHL_CONFIG?.locationId) {
      headers['Location-Id'] = GHL_CONFIG.locationId;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;

      try {
        const parsedError = JSON.parse(errorText);
        errorMessage = parsedError.message || parsedError.error || errorMessage;
      } catch (_e) {
        errorMessage = errorText || errorMessage;
      }

      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired API token');
      } else if (response.status === 403) {
        throw new Error('Permission denied: Insufficient calendar access');
      } else if (response.status === 404) {
        throw new Error(`Calendar not found: ${calendarId}`);
      } else {
        throw new Error(`API Error: ${errorMessage}`);
      }
    }

    const data = await response.json();

    // Parse GHL response format based on official API documentation
    // Response structure: { "_dates_": {...}, "slots": [...] }
    let slots = [];
    let dates = {};

    if (DEBUG) {
      // Avoid logging entire payload in production
      // Note: For sensitive data policies, prefer masking.
      try {
        // Slice to avoid huge console spam
        const sampleData = JSON.stringify(data).slice(0, 500);

        console.warn('🔍 GHL API Raw Response:', {
          keys: Object.keys(data || {}),
          hasSlots: !!data?.slots,
          hasDates: !!data?._dates_,
          sampleData,
        });
      } catch {}
    }

    // Handle the documented _dates_ object structure
    if (data?._dates_ && typeof data._dates_ === 'object') {
      dates = data._dates_;

      Object.keys(dates).forEach(dateKey => {
        const dayData = dates[dateKey];
        if (dayData?.slots && Array.isArray(dayData.slots)) {
          const dateSlotsWithInfo = dayData.slots.map(slot => ({
            ...(typeof slot === 'object' ? slot : { startTime: slot }),
            date: dateKey,
          }));
          slots.push(...dateSlotsWithInfo);
        }
      });
    }

    // Also check for direct slots array (fallback)
    if (Array.isArray(data?.slots)) {
      // Assume strings or objects of slot entries
      slots = [...slots, ...data.slots.map(s => (typeof s === 'object' ? s : { startTime: s }))];
    }

    // Check for any date-like keys in the response (YYYY-MM-DD or YYYYMMDD)
    const dateKeys = Object.keys(data || {}).filter(key =>
      /^\d{4}-\d{2}-\d{2}$/.test(key) || /^\d{8}$/.test(key),
    );

    if (dateKeys.length > 0) {
      if (DEBUG) {

        console.warn('🗓️ Found date keys:', dateKeys);
      }
      dateKeys.forEach(dateKey => {
        const dayData = data[dateKey];
        if (!dayData) return;

        if (Array.isArray(dayData)) {
          // Handle weird object-to-string conversion issue
          const normalizedSlots = dayData.map(slot => {
            const normalizedSlot = normalizeSlotObject(slot);
            return {
              ...(typeof normalizedSlot === 'object' ? normalizedSlot : { startTime: normalizedSlot }),
              date: dateKey,
              slot: typeof normalizedSlot === 'string' ? normalizedSlot : JSON.stringify(normalizedSlot),
            };
          });
          slots.push(...normalizedSlots);
        } else if (dayData?.slots && Array.isArray(dayData.slots)) {
          if (DEBUG) {

            console.warn(`📅 Found ${dayData.slots.length} slots for ${dateKey}`);
          }
          const dateSpecificSlots = dayData.slots.map(slot => {
            const iso = typeof slot === 'string' ? slot : slot?.startTime || slot?.start || slot;
            return {
              startTime: iso,
              date: dateKey,
              slot: iso, // Keep the original ISO if it is a string
              timezone: typeof iso === 'string' && iso.includes('-07:00') ? 'America/Los_Angeles' : undefined,
            };
          });
          slots.push(...dateSpecificSlots);
        }
      });
    }

    // Final fallback - check if data itself is an array
    if (Array.isArray(data) && data.length > 0) {
      if (DEBUG) {

        console.warn('📋 Data is array, using directly');
      }
      slots = data.map(s => (typeof s === 'object' ? s : { startTime: s }));
    }

    if (DEBUG) {

      console.warn('🎯 Final parsed slots:', {
        totalSlots: slots.length,
        firstSlot: slots[0],
        slotTypes: slots.slice(0, 3).map(s => typeof s),
      });
    }

    return {
      success: true,
      slots,
      dates, // Include the _dates_ object from the API response
      totalSlots: slots.length,
      dateRange: {
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString(),
        days: Math.ceil((endMs - startMs) / DAY_MS),
      },
      meta: {
        calendarId,
        timeZone,
        userId,
        userIds,
        startDate: startMs,
        endDate: endMs,
        requestTimestamp: new Date().toISOString(),
      },
      rawResponse: DEBUG ? data : undefined, // avoid returning entire payload in prod
    };

  } catch (error) {
    return {
      success: false,
      slots: [],
      dates: {},
      totalSlots: 0,
      error: error?.message || String(error),
      meta: {
        calendarId,
        timeZone,
        userId,
        userIds,
        requestTimestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * 🎯 Convenience function to fetch free slots for a specific date with calendar timezone
 * @param {string} calendarId - Calendar ID (required)
 * @param {Date|string|number} date - Date to fetch slots for (required)
 * @param {string} [timeZone] - Timezone (optional, will auto-detect from calendar if not provided)
 * @param {string} [userId] - User ID to filter by (optional)
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<Object>} - Standardized free slots response
 */
export async function fetchFreeSlotsForDate(calendarId, date, timeZone = null, userId = null, signal) {
  const selectedDate = new Date(normalizeDateToMs(date));

  // Validate date
  if (isNaN(selectedDate.getTime())) {
    throw new Error(`Invalid date provided: ${date}`);
  }

  // Auto-detect timezone from calendar if not provided
  let effectiveTimezone = timeZone;
  if (!effectiveTimezone) {
    try {
      const { getCalendarTimezone } = await import('../calendarTimezoneService');
      const calendarTimezoneInfo = await getCalendarTimezone(calendarId);
      effectiveTimezone = calendarTimezoneInfo.timezone;
      if (DEBUG) {

        console.warn('🎯 Auto-detected timezone for calendar:', calendarId, '->', effectiveTimezone);
      }
    } catch (err) {
      if (DEBUG) {

        console.warn('⚠️ Failed to auto-detect calendar timezone, using fallback:', err?.message);
      }
      effectiveTimezone = 'America/Los_Angeles';
    }
  }

  // Use UTC dates to avoid timezone confusion
  const year = selectedDate.getUTCFullYear();
  const month = selectedDate.getUTCMonth();
  const day = selectedDate.getUTCDate();

  const startDate = Date.UTC(year, month, day, 0, 0, 0, 0);
  const endDate = Date.UTC(year, month, day, 23, 59, 59, 999);

  const response = await fetchFreeSlots({
    calendarId,
    startDate,
    endDate,
    timeZone: effectiveTimezone,
    userId,
    signal,
  });

  // Add timezone information to the response
  if (response.success) {
    response.meta = {
      ...response.meta,
      detectedTimezone: effectiveTimezone,
      timezoneSource: timeZone ? 'provided' : 'auto-detected',
    };
  }

  // For single-day requests, filter slots to only include the requested date
  if (response.success && response.slots.length > 0) {
    const requestedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; // "YYYY-MM-DD"

    const isOnRequestedDate = (iso) => typeof iso === 'string' && iso.startsWith(requestedDateStr);

    const daySlots = response.slots.filter(slot => {
      if (typeof slot === 'string') return isOnRequestedDate(slot);
      if (slot && typeof slot === 'object') {
        const candidates = [
          slot.startTime,
          slot.start,
          slot.from,
          slot.time,
          slot.slot, // sometimes we tuck the original ISO here
        ].filter(Boolean);
        return candidates.some(isOnRequestedDate);
      }
      return false;
    });

    return {
      ...response,
      slots: daySlots,
      totalSlots: daySlots.length,
    };
  }

  return response;
}

/**
 * 🎯 Fetch free slots using a broader date range window
 * @param {string} calendarId - Calendar ID (required)
 * @param {Date|string|number} centerDate - Center date for the range (required)
 * @param {number} [daysBefore=7] - Days before center date to include
 * @param {number} [daysAfter=7] - Days after center date to include
 * @param {string} [timeZone] - Timezone (sent to API if provided)
 * @param {string} [userId] - User ID to filter by (optional)
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<Object>} - Standardized free slots response
 */
export async function fetchFreeSlotsRange(calendarId, centerDate, daysBefore = 7, daysAfter = 7, timeZone = null, userId = null, signal) {
  const centerMs = normalizeDateToMs(centerDate);
  const center = new Date(centerMs);

  // Validate date
  if (isNaN(center.getTime())) {
    throw new Error(`Invalid center date provided: ${centerDate}`);
  }

  // Create broader date range in UTC by offsetting raw ms
  const startDate = new Date(center.getTime() - (daysBefore * DAY_MS));
  const endDate = new Date(center.getTime() + (daysAfter * DAY_MS));

  return await fetchFreeSlots({
    calendarId,
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    timeZone,
    userId,
    signal,
  });
}

/**
 * 🔧 Helper: append userIds with style
 * @param {URLSearchParams} params
 * @param {string[]|string} userIds
 * @param {'repeat'|'csv'} style - 'repeat' (userIds=a&userIds=b) or 'csv' (userIds=a,b)
 */
function appendUserIds(params, userIds, style = 'repeat') {
  if (!userIds) return;
  if (Array.isArray(userIds)) {
    if (style === 'csv') {
      params.append('userIds', userIds.join(','));
    } else {
      userIds.forEach(id => params.append('userIds', id));
    }
  } else if (typeof userIds === 'string') {
    params.append('userIds', userIds);
  }
}

/**
 * 🔧 Helper function to normalize different date formats to milliseconds
 * @param {Date|string|number} date - Date in various formats
 * @returns {number} - Timestamp in milliseconds
 */
function normalizeDateToMs(date) {
  if (date instanceof Date) return date.getTime();

  if (typeof date === 'number') {
    // Heuristic: treat < 1e11 as seconds
    return date < 1e11 ? date * 1000 : date;
  }

  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${date}`);
    }
    return parsed.getTime();
  }

  throw new Error(`Unsupported date format: ${typeof date}`);
}

/**
 * 🔧 Helper function to normalize slot objects that come back as character-indexed objects
 * @param {Object|string} slot - Slot data from GHL API
 * @returns {string|Object} - Normalized slot data
 */
function normalizeSlotObject(slot) {
  if (typeof slot === 'string') return slot;

  if (slot && typeof slot === 'object') {
    const keys = Object.keys(slot);
    const isCharacterIndexed = keys.length > 0 && keys.every(key => /^\d+$/.test(key));

    if (isCharacterIndexed) {
      const sortedKeys = keys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      const reconstructedString = sortedKeys.map(key => slot[key]).join('');
      if (DEBUG) {

        console.warn('🔧 Reconstructed slot string:', reconstructedString);
      }
      return reconstructedString;
    }
  }

  return slot;
}

// Export the main function as default for backward compatibility
export default fetchFreeSlots;
