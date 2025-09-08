// ========================================
// 🔧 FREE SLOTS UTILITY FUNCTIONS
// ========================================
// Reusable utility functions for free slot operations
// Keeps the main components clean and modular
// ========================================

import { createLogger } from '@utils/logger';

const utils = createLogger('FreeSlotsUtils');

// ---------- helpers ----------
function isBoxedString(v) {
  return v && typeof v === 'object' && Object.prototype.toString.call(v) === '[object String]';
}

function toPrimitiveString(v) {
  if (typeof v === 'string') return v;
  if (isBoxedString(v)) return v.valueOf();

  // Handle the specific GHL API issue where strings come back as character-indexed objects
  // Example: {"0":"2","1":"0","2":"2","3":"5",...} should become "2025..."
  if (v && typeof v === 'object' && v !== null) {
    const keys = Object.keys(v);
    const isCharacterIndexed = keys.every(key => /^\d+$/.test(key));

    if (isCharacterIndexed && keys.length > 0) {
      // Sort keys numerically and reconstruct the string
      const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
      const reconstructedString = sortedKeys.map(key => v[key]).join('');
      console.warn('🔧 Reconstructed slot string from character indices:', reconstructedString);
      return reconstructedString;
    }

    // Handle array-like objects with length property
    if (typeof v.length === 'number') {
      try {
        return Array.from(v).join('');
      } catch (e) {
        // Failed to convert array-like object
        console.warn('Failed to convert array-like object:', e);
      }
    }

    // Handle slot objects that have a 'slot' property containing the actual time string
    if (v.slot && typeof v.slot === 'string') {
      return v.slot;
    }
  }

  return v;
}

function parseSlotString(s, baseDate = new Date()) {
  // Try native first (handles ISO)
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;

  // Support "h:mm am/pm"
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m) {
    let hour = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hour += 12;
    const mins = parseInt(m[2], 10);
    const d = new Date(baseDate);
    d.setHours(hour, mins, 0, 0);
    return d;
  }

  // Last resort (may be invalid)
  return new Date(s);
}

/**
 * 🔧 Generate mock time slots for fallback when API fails or calendar has no availability
 * Creates realistic time slots in the specified timezone
 *
 * @param {string|Date} date - Date to generate slots for
 * @param {string} [timezone] - Timezone to use (optional)
 * @param {number} [slotDuration] - Duration of each slot in minutes (default: 30)
 * @param {number} [startHour] - Start hour (default: 9)
 * @param {number} [endHour] - End hour (default: 17)
 * @returns {Array} - Array of mock slot objects
 */
export function generateMockSlots(date, timezone = 'America/Los_Angeles', slotDuration = 30, startHour = 9, endHour = 17) {
  const selectedDate = new Date(date);
  const slots = [];

  utils.info('Generating mock slots', {
    date: selectedDate.toISOString().split('T')[0],
    timezone,
    slotDuration,
    startHour,
    endHour,
  });

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const startTime = new Date(selectedDate);
      startTime.setHours(hour, minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + slotDuration);

      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: true,
        isMockSlot: true,
        timezone: timezone,
        displayTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        duration: slotDuration,
        source: 'mock_generator',
      });
    }
  }

  utils.success('Mock slots generated', {
    count: slots.length,
    timeRange: `${startHour}:00 - ${endHour}:00`,
    timezone,
  });

  return slots;
}

/**
 * 🔧 Convert GHL API slots to time slot format for dropdown display
 * Handles various response formats from the GHL API
 *
 * @param {Array} slots - Array of slot objects from GHL API
 * @param {string} [timezone] - Timezone for display formatting
 * @returns {Array} - Array of formatted time slot strings
 */
export function convertSlotsToTimeSlots(slots, timezone = null) {
  if (!slots || !Array.isArray(slots)) {
    utils.warn('Invalid slots array provided to converter', { slots });
    return [];
  }

  utils.info('Converting API slots to time slots format', {
    inputCount: slots.length,
    timezone,
    firstSlot: slots[0],
    slotStructure: slots[0] ? Object.keys(slots[0]) : 'N/A',
  });

  const timeSlots = slots
    .map((rawSlot, index) => {
      try {
        let startTime, endTime;

        console.warn('🔍 Processing slot:', { index, slot: rawSlot, type: typeof rawSlot });

        // Handle the new normalized slot format with ISO datetime strings
        if (typeof rawSlot === 'object' && rawSlot !== null) {
          if (rawSlot.slot && typeof rawSlot.slot === 'string') {
            // This is our normalized format: { slot: "2025-08-27T08:00:00-07:00", ... }
            startTime = new Date(rawSlot.slot);
            endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // Default 30-minute duration

            console.warn('📅 Normalized slot processed:', {
              slot: rawSlot.slot,
              startTime: isNaN(startTime) ? 'Invalid' : startTime.toISOString(),
              endTime: isNaN(endTime) ? 'Invalid' : endTime.toISOString(),
            });
          } else if (rawSlot.startTime) {
            // Standard slot object format
            startTime = new Date(rawSlot.startTime);
            if (rawSlot.endTime) {
              endTime = new Date(rawSlot.endTime);
            } else {
              endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
            }
          } else if (rawSlot.start) {
            startTime = new Date(rawSlot.start);
            endTime = rawSlot.end ? new Date(rawSlot.end) : new Date(startTime.getTime() + 30 * 60 * 1000);
          } else if (rawSlot.time) {
            startTime = parseSlotString(rawSlot.time);
            endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
          } else {
            utils.warn('Slot object missing time field', { slot: rawSlot, index, keys: Object.keys(rawSlot) });
            return null;
          }
        } else if (typeof rawSlot === 'string') {
          // Direct ISO datetime string
          startTime = parseSlotString(rawSlot);
          endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

          console.warn('📅 String slot processed:', {
            slot: rawSlot,
            startTime: isNaN(startTime) ? 'Invalid' : startTime.toISOString(),
            endTime: isNaN(endTime) ? 'Invalid' : endTime.toISOString(),
          });
        } else {
          // Try the old normalization approach for legacy formats
          const normalized = toPrimitiveString(rawSlot);
          startTime = parseSlotString(normalized);
          endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

          console.warn('📅 Legacy normalization used:', {
            original: rawSlot,
            normalized,
            startTime: isNaN(startTime) ? 'Invalid' : startTime.toISOString(),
          });
        }

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          utils.warn('Invalid date in slot', { slot: rawSlot, index, startTime, endTime });
          return null;
        }

        const formatOptions = {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };
        if (timezone) formatOptions.timeZone = timezone;

        const startLower = startTime.toLocaleTimeString('en-US', formatOptions).toLowerCase();
        const endLower = endTime.toLocaleTimeString('en-US', formatOptions).toLowerCase();

        return `${startLower} - ${endLower}`;
      } catch (error) {
        utils.warn('Error formatting slot', { slot: rawSlot, error: error.message, index });
        return null;
      }
    })
    .filter(Boolean);

  utils.success('Slots converted successfully', {
    inputCount: slots.length,
    outputCount: timeSlots.length,
    sampleOutput: timeSlots.slice(0, 3),
  });

  return timeSlots;
}

/**
 * 🔧 Validate calendar ID format
 * Ensures calendar ID meets basic GHL format requirements
 *
 * @param {string} calendarId - Calendar ID to validate
 * @returns {Object} - Validation result with isValid flag and message
 */
export function validateCalendarId(calendarId) {
  if (!calendarId) {
    return {
      isValid: false,
      message: 'Calendar ID is required',
    };
  }

  if (typeof calendarId !== 'string') {
    return {
      isValid: false,
      message: 'Calendar ID must be a string',
    };
  }

  if (calendarId.includes(' ')) {
    return {
      isValid: false,
      message: 'Calendar ID cannot contain spaces',
    };
  }

  if (calendarId.length < 10) {
    return {
      isValid: false,
      message: 'Calendar ID is too short (minimum 10 characters)',
    };
  }

  if (calendarId.length > 50) {
    return {
      isValid: false,
      message: 'Calendar ID is too long (maximum 50 characters)',
    };
  }

  if (!/^[a-zA-Z0-9]+$/.test(calendarId)) {
    return {
      isValid: false,
      message: 'Calendar ID should only contain letters and numbers',
    };
  }

  return {
    isValid: true,
    message: 'Calendar ID is valid',
  };
}

/**
 * 🔧 Debounce function for API calls
 * Prevents excessive API calls when users rapidly change selections
 *
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 🔧 Create error message for free slots failures
 * Provides user-friendly error messages based on error types
 *
 * @param {Error} error - The error object
 * @param {string} _calendarId - Calendar ID that caused the error (unused but kept for API consistency)
 * @returns {string} - User-friendly error message
 */
export function createFreeSlotsErrorMessage(error, _calendarId) {
  const errorMessage = error.message || 'Unknown error';

  if (errorMessage.includes('Calendar not found')) {
    return 'The selected calendar could not be found. Please select a different calendar.';
  } else if (errorMessage.includes('configuration error')) {
    return 'This calendar needs to be configured in GHL. Please set up working hours and availability.';
  } else if (errorMessage.includes('Authentication error')) {
    return 'Authentication failed. Please check your GHL API configuration.';
  } else if (errorMessage.includes('Rate limit exceeded')) {
    return 'Too many requests. Please wait a moment before trying again.';
  } else if (errorMessage.includes('Permission error')) {
    return 'Access denied. Please check your GHL API permissions.';
  } else if (errorMessage.includes('Network')) {
    return 'Connection error. Please check your internet connection and try again.';
  } else {
    return `Unable to load time slots: ${errorMessage}. Using default time slots instead.`;
  }
}

/**
 * 🔧 Check if slots should be refreshed
 * Determines if slots need to be fetched based on current state
 *
 * @param {Object} params - Parameters to check
 * @param {string} params.calendarId - Current calendar ID
 * @param {string} params.date - Current date
 * @param {string} [params.userId] - Current user ID
 * @param {string} [params.timezone] - Current timezone
 * @param {string} [params.lastCalendarId] - Previous calendar ID
 * @param {string} [params.lastDate] - Previous date
 * @param {string} [params.lastUserId] - Previous user ID
 * @param {string} [params.lastTimezone] - Previous timezone
 * @returns {boolean} - Whether slots should be refreshed
 */
export function shouldRefreshSlots({
  calendarId,
  date,
  userId = null,
  timezone = null,
  lastCalendarId = null,
  lastDate = null,
  lastUserId = null,
  lastTimezone = null,
}) {
  if (calendarId !== lastCalendarId) {
    utils.info('Slots refresh needed: calendar changed', { from: lastCalendarId, to: calendarId });
    return true;
  }

  if (date !== lastDate) {
    utils.info('Slots refresh needed: date changed', { from: lastDate, to: date });
    return true;
  }

  if (userId !== lastUserId) {
    utils.info('Slots refresh needed: user changed', { from: lastUserId, to: userId });
    return true;
  }

  if (timezone !== lastTimezone) {
    utils.info('Slots refresh needed: timezone changed', { from: lastTimezone, to: timezone });
    return true;
  }

  return false;
}

export default {
  generateMockSlots,
  convertSlotsToTimeSlots,
  validateCalendarId,
  debounce,
  createFreeSlotsErrorMessage,
  shouldRefreshSlots,
};
