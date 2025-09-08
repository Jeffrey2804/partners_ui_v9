/**
 * GoHighLevel Calendar Events Service (clean JS)
 * - Removes console/loggers
 * - Deduplicates request/error logic
 * - Keeps robust validation and helpful messages
 */

//
// Internal helpers
//
let _configModule;

/** Lazy-load and cache GHL config */
async function getConfig() {
  if (!_configModule) {
    _configModule = await import('../../../config/ghlConfig.js');
  }
  const { GHL_CONFIG } = _configModule;
  if (!GHL_CONFIG || !GHL_CONFIG.token) {
    throw new Error('GHL API token is not configured.');
  }
  return GHL_CONFIG;
}

/** Build common headers */
function buildHeaders({ token, version, json = true }) {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    Version: version,
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

/** Parse an error payload safely */
async function parseError(response) {
  const base = `HTTP ${response.status}: ${response.statusText}`;
  try {
    const data = await response.clone().json();
    if (data && (data.message || data.error || data.errors)) {
      const detail = data.message || data.error || JSON.stringify(data.errors);
      return `${base} - ${detail}`;
    }
  } catch (_) {
    try {
      const text = await response.clone().text();
      if (text) return `${base} - ${text}`;
    } catch (_) {}
  }
  return base;
}

/** Fetch wrapper with unified error handling */
async function apiRequest(url, { method = 'GET', headers, body } = {}) {
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Quick query-string builder */
function qs(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

//
// Public API
//

/**
 * Get calendar details
 * @param {string} calendarId
 * @returns {Promise<Object>}
 */
async function getCalendarDetails(calendarId) {
  if (!calendarId || typeof calendarId !== 'string') {
    throw new Error('calendarId is required and must be a string');
  }
  const cfg = await getConfig();
  const url = `${cfg.baseUrl || 'https://services.leadconnectorhq.com'}/calendars/${encodeURIComponent(calendarId)}`;
  return apiRequest(url, {
    headers: buildHeaders({ token: cfg.token, version: cfg.version, json: false }),
  });
}

/**
 * Get calendar events by ISO time range
 * @param {string} calendarId
 * @param {string} startTime ISO string
 * @param {string} endTime ISO string
 * @returns {Promise<Object>}
 */
async function getCalendarEvents(calendarId, startTime, endTime) {
  if (!calendarId || typeof calendarId !== 'string') {
    throw new Error('calendarId is required and must be a string');
  }
  if (!startTime || typeof startTime !== 'string') {
    throw new Error('startTime is required and must be an ISO string');
  }
  if (!endTime || typeof endTime !== 'string') {
    throw new Error('endTime is required and must be an ISO string');
  }

  const cfg = await getConfig();
  const base = cfg.baseUrl || 'https://services.leadconnectorhq.com';
  const url = `${base}/calendars/events?${qs({ calendarId, startTime, endTime })}`;

  return apiRequest(url, {
    headers: buildHeaders({ token: cfg.token, version: cfg.version, json: false }),
  });
}

/**
 * Get calendars list with timezone information
 * @param {string} locationId
 * @param {string|null} groupId
 * @returns {Promise<Object>}
 */
async function getCalendarsList(locationId, groupId = null) {
  if (!locationId || typeof locationId !== 'string') {
    throw new Error('locationId is required and must be a string');
  }

  const cfg = await getConfig();
  const base = cfg.baseUrl || 'https://services.leadconnectorhq.com';
  const url = `${base}/calendars/?${qs({ locationId, groupId })}`;

  const response = await apiRequest(url, {
    headers: buildHeaders({ token: cfg.token, version: cfg.version, json: false }),
  });

  // Enhance calendar data with timezone information
  if (response.calendars && Array.isArray(response.calendars)) {
    // Fetch location timezone for fallback
    let locationTimezone = 'America/Los_Angeles';
    try {
      const timezoneResponse = await getLocationTimezone(locationId);
      locationTimezone = timezoneResponse.timezone || locationTimezone;
    } catch (_error) {
      console.warn('Failed to fetch location timezone, using fallback:', locationTimezone);
    }

    // Add timezone information to each calendar
    response.calendars = response.calendars.map(calendar => ({
      ...calendar,
      // Use calendar-specific timezone if available, otherwise location timezone
      timezone: calendar.timezone || calendar.timeZone || locationTimezone,
      // Add formatted timezone display
      timezoneDisplay: formatTimezone(calendar.timezone || calendar.timeZone || locationTimezone),
    }));
  }

  return response;
}

/**
 * Get location timezone information
 * @param {string} locationId
 * @returns {Promise<Object>}
 */
async function getLocationTimezone(locationId) {
  if (!locationId || typeof locationId !== 'string') {
    throw new Error('locationId is required and must be a string');
  }

  const cfg = await getConfig();
  const base = cfg.baseUrl || 'https://services.leadconnectorhq.com';
  const url = `${base}/locations/${encodeURIComponent(locationId)}/timezones`;

  try {
    const response = await apiRequest(url, {
      headers: buildHeaders({ token: cfg.token, version: cfg.version, json: false }),
    });

    // Handle various response formats from GHL timezone API
    let timezone = 'America/Los_Angeles';

    if (Array.isArray(response) && response.length > 0) {
      timezone = response[0];
    } else if (response.timezones && Array.isArray(response.timezones) && response.timezones.length > 0) {
      timezone = response.timezones[0];
    } else if (response.timezone) {
      timezone = response.timezone;
    } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      timezone = response.data[0];
    }

    return {
      timezone,
      display: formatTimezone(timezone),
    };
  } catch (error) {
    console.warn('Failed to fetch location timezone from API:', error.message);
    return {
      timezone: 'America/Los_Angeles',
      display: formatTimezone('America/Los_Angeles'),
    };
  }
}

/**
 * Format timezone for display
 * @param {string} timezone
 * @returns {string}
 */
function formatTimezone(timezone) {
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
 * Get calendar events (Unix ms timestamps)
 * @param {string} locationId
 * @param {string} calendarId
 * @param {number} startTime Unix ms
 * @param {number} endTime Unix ms
 * @returns {Promise<Object>}
 */
async function fetchGHLCalendarEvents(locationId, calendarId, startTime, endTime) {
  if (!locationId || typeof locationId !== 'string') {
    throw new Error('locationId is required and must be a string');
  }
  if (!calendarId || typeof calendarId !== 'string') {
    throw new Error('calendarId is required and must be a string');
  }
  if (typeof startTime !== 'number' || Number.isNaN(startTime)) {
    throw new Error('startTime must be a number (Unix timestamp in ms)');
  }
  if (typeof endTime !== 'number' || Number.isNaN(endTime)) {
    throw new Error('endTime must be a number (Unix timestamp in ms)');
  }

  const cfg = await getConfig();
  const base = cfg.baseUrl || 'https://services.leadconnectorhq.com';
  const url = `${base}/calendars/events?${qs({
    locationId,
    calendarId,
    startTime: String(startTime),
    endTime: String(endTime),
  })}`;

  return apiRequest(url, {
    headers: buildHeaders({ token: cfg.token, version: cfg.version, json: false }),
  });
}

/**
 * Convenience: get events by Date objects
 * @param {string} locationId
 * @param {string} calendarId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
async function fetchGHLCalendarEventsByDateRange(locationId, calendarId, startDate, endDate) {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    throw new Error('startDate must be a valid Date');
  }
  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    throw new Error('endDate must be a valid Date');
  }
  return fetchGHLCalendarEvents(locationId, calendarId, startDate.getTime(), endDate.getTime());
}

/**
 * Create a blocked time slot
 * @param {Object} blockData
 * @param {string} blockData.title
 * @param {string} blockData.calendarId
 * @param {string} blockData.assignedUserId
 * @param {string} blockData.locationId
 * @param {string} blockData.startTime ISO
 * @param {string} blockData.endTime ISO
 * @returns {Promise<Object>}
 */
async function createBlockSlot(blockData) {
  const { title, calendarId, assignedUserId, locationId, startTime, endTime } = blockData || {};
  if (!title || typeof title !== 'string') throw new Error('title is required and must be a string');
  if (!calendarId || typeof calendarId !== 'string') throw new Error('calendarId is required and must be a string');
  if (!assignedUserId || typeof assignedUserId !== 'string') throw new Error('assignedUserId is required and must be a string');
  if (!locationId || typeof locationId !== 'string') throw new Error('locationId is required and must be a string');
  if (!startTime || !endTime) throw new Error('startTime and endTime are required');

  const cfg = await getConfig();
  const base = cfg.baseUrl || 'https://services.leadconnectorhq.com';
  const url = `${base}/calendars/events/block-slots`;

  return apiRequest(url, {
    method: 'POST',
    headers: buildHeaders({ token: cfg.token, version: cfg.version, json: true }),
    body: JSON.stringify({ title, calendarId, assignedUserId, locationId, startTime, endTime }),
  });
}

export {
  getCalendarEvents,
  getCalendarDetails,
  getCalendarsList,
  getLocationTimezone,
  fetchGHLCalendarEvents,
  fetchGHLCalendarEventsByDateRange,
  createBlockSlot,
};
