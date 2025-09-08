// ========================================
// 🎯 CALENDAR API SERVICE
// ========================================
// This service provides comprehensive CRUD operations for GoHighLevel calendar
// and appointment management with enhanced error handling and logging.
//
// Features:
// - ✅ Complete CRUD operations for appointments
// - ✅ Calendar event fetching and management
// - ✅ Error handling and validation
// - ✅ Comprehensive logging
// - ✅ Data transformation utilities
// - ✅ Real-time data synchronization
// ========================================

import { toast } from 'react-hot-toast';
import { createLogger } from '../../utils/logger.js';
import { GHL_CONFIG, getGHLHeaders, validateGHLConfig } from '@config/ghlConfig.js';

const calendarLogger = createLogger('CalendarAPI');

// Validate configuration on import
const configValidation = validateGHLConfig();
if (!configValidation.isValid) {
  calendarLogger.warn('GHL Configuration Issues:', configValidation.issues);
}

// ============================================================================
// 📥 GET REQUESTS
// ============================================================================

/**
 * 🎯 Format GHL calendar events for display
 * Converts GHL API response format to calendar display format
 */
export const formatCalendarEvents = (ghlEvents = []) => {
  return ghlEvents.map(event => {
    // Determine color based on appointment status
    let backgroundColor, borderColor;

    switch (event.appointmentStatus) {
      case 'confirmed':
        backgroundColor = '#059669'; // Green
        borderColor = '#047857';
        break;
      case 'cancelled':
        backgroundColor = '#DC2626'; // Red
        borderColor = '#B91C1C';
        break;
      case 'no-show':
        backgroundColor = '#6B7280'; // Gray
        borderColor = '#4B5563';
        break;
      default:
        backgroundColor = '#4F46E5'; // Blue
        borderColor = '#3730A3';
    }

    return {
      id: `ghl-event-${event.id}`,
      title: event.title || 'GHL Event',
      start: event.startTime,
      end: event.endTime,
      category: 'GHL Event',
      description: event.notes || '',
      location: event.address || '',
      attendees: event.users?.join(', ') || '',
      backgroundColor,
      borderColor,
      textColor: '#ffffff',
      extendedProps: {
        ghlEventId: event.id,
        calendarId: event.calendarId,
        locationId: event.locationId,
        contactId: event.contactId,
        groupId: event.groupId,
        appointmentStatus: event.appointmentStatus,
        assignedUserId: event.assignedUserId,
        users: event.users || [],
        isRecurring: event.isRecurring === 'true',
        rrule: event.rrule,
        assignedResources: event.assignedResources || [],
        createdBy: event.createdBy,
        masterEventId: event.masterEventId,
        dateAdded: event.dateAdded,
        dateUpdated: event.dateUpdated,
        isGHLEvent: true,
      },
    };
  });
};

/**
 * 🎯 ENHANCED - Fetch calendar appointments from an API with robust date handling
 * Accepts startTime and endTime as Date objects, converts them to ISO string format,
 * and sends them as strings in the API request payload. Handles API response and errors,
 * and fallbacks to mock data if the API call fails.
 *
 * @param {Date|string} startTime - Start time as Date object or ISO string
 * @param {Date|string} endTime - End time as Date object or ISO string
 * @param {Object} additionalFilters - Additional filters for the API call
 * @returns {Promise<Object>} API response with success flag and data
 */
export const fetchCalendarAppointmentsWithDateHandling = async (startTime, endTime, additionalFilters = {}) => {
  try {
    calendarLogger.info('Fetching calendar appointments with enhanced date handling', {
      startTime: typeof startTime,
      endTime: typeof endTime,
      additionalFilters,
    });

    // Convert Date objects to ISO strings if needed
    let formattedStartTime, formattedEndTime;

    if (startTime instanceof Date) {
      formattedStartTime = startTime.toISOString();
    } else if (typeof startTime === 'string') {
      // Validate and ensure it's a proper ISO string
      const parsedStart = new Date(startTime);
      if (isNaN(parsedStart.getTime())) {
        throw new Error('Invalid startTime format. Expected Date object or valid ISO string.');
      }
      formattedStartTime = parsedStart.toISOString();
    } else {
      throw new Error('startTime must be a Date object or ISO string');
    }

    if (endTime instanceof Date) {
      formattedEndTime = endTime.toISOString();
    } else if (typeof endTime === 'string') {
      // Validate and ensure it's a proper ISO string
      const parsedEnd = new Date(endTime);
      if (isNaN(parsedEnd.getTime())) {
        throw new Error('Invalid endTime format. Expected Date object or valid ISO string.');
      }
      formattedEndTime = parsedEnd.toISOString();
    } else {
      throw new Error('endTime must be a Date object or ISO string');
    }

    // Validate date range
    if (new Date(formattedStartTime) >= new Date(formattedEndTime)) {
      throw new Error('startTime must be before endTime');
    }

    calendarLogger.info('Formatted dates for API call', {
      formattedStartTime,
      formattedEndTime,
    });

    // Build filters with properly formatted dates
    const filters = {
      locationId: 'b7vHWUGVUNQGoIlAXabY',
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      ...additionalFilters,
    };

    // Use the existing fetchCalendarEvents function
    const apiResponse = await fetchCalendarEvents(filters);

    if (apiResponse.success) {
      calendarLogger.success('Calendar appointments fetched successfully with date handling', {
        count: apiResponse.data?.length || 0,
        timeRange: `${formattedStartTime} to ${formattedEndTime}`,
      });

      return {
        success: true,
        data: apiResponse.data,
        meta: {
          ...apiResponse.meta,
          timeRange: {
            startTime: formattedStartTime,
            endTime: formattedEndTime,
          },
          requestTimestamp: new Date().toISOString(),
        },
      };
    } else {
      throw new Error(apiResponse.error || 'Unknown API error');
    }

  } catch (error) {
    calendarLogger.error('Error fetching calendar appointments, falling back to mock data', error);

    // Generate mock data for the requested time range
    const mockAppointments = generateMockAppointments(startTime, endTime);

    calendarLogger.warn('API failed, returning mock appointment data', {
      mockCount: mockAppointments.length,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
      data: mockAppointments,
      isMockData: true,
      meta: {
        timeRange: {
          startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
          endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
        },
        fallbackReason: error.message,
        requestTimestamp: new Date().toISOString(),
      },
    };
  }
};

/**
 * 🎯 Generate mock appointments for testing and fallback
 * Creates realistic appointment data within the specified date range
 */
const generateMockAppointments = (startTime, endTime) => {
  const mockAppointments = [];
  const start = new Date(startTime instanceof Date ? startTime : new Date(startTime));
  const end = new Date(endTime instanceof Date ? endTime : new Date(endTime));

  // Generate 3-5 mock appointments spread across the date range
  const appointmentCount = Math.floor(Math.random() * 3) + 3; // 3-5 appointments
  const timeSpan = end.getTime() - start.getTime();

  const mockTemplates = [
    { title: 'Client Consultation', duration: 60, status: 'confirmed' },
    { title: 'Strategy Meeting', duration: 90, status: 'scheduled' },
    { title: 'Project Review', duration: 45, status: 'confirmed' },
    { title: 'Follow-up Call', duration: 30, status: 'pending' },
    { title: 'Partnership Discussion', duration: 120, status: 'scheduled' },
  ];

  for (let i = 0; i < appointmentCount; i++) {
    const template = mockTemplates[i % mockTemplates.length];
    const appointmentStart = new Date(start.getTime() + (Math.random() * timeSpan));
    const appointmentEnd = new Date(appointmentStart.getTime() + (template.duration * 60 * 1000));

    mockAppointments.push({
      id: `mock-appointment-${i + 1}-${Date.now()}`,
      title: template.title,
      startTime: appointmentStart.toISOString(),
      endTime: appointmentEnd.toISOString(),
      status: template.status,
      description: `Mock ${template.title.toLowerCase()} for testing purposes`,
      location: 'Virtual Meeting',
      attendees: [`attendee${i + 1}@example.com`],
      contactName: `Contact ${i + 1}`,
      contactEmail: `contact${i + 1}@example.com`,
      contactPhone: `+1555000${1000 + i}`,
      duration: template.duration,
      assignedTo: 'mock-user-id',
      createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random past date
      updatedAt: new Date().toISOString(),
      isMockData: true,
    });
  }

  return mockAppointments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};
/**
 * 🎯 GET - Fetch events from ALL calendars in a group
 * ⚠️  DEPRECATED: Use getMasterCalendarData() instead for single source of truth
 * Uses your original cURL command approach with proper required parameters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} API response with events from all calendars
 */
export const fetchAllCalendarsEvents = async (filters = {}) => {
  console.warn('⚠️  DEPRECATED: fetchAllCalendarsEvents() - Use getMasterCalendarData() instead');

  try {
    calendarLogger.info('Fetching events from ALL calendars in group', { filters });

    // Build query parameters based on your original cURL command
    const params = new URLSearchParams();

    // Required parameters
    params.append('locationId', 'b7vHWUGVUNQGoIlAXabY');
    params.append('groupId', 'FIt5F2PbZVrK846aJeJF');

    // REQUIRED: startTime and endTime parameters (API requires these)
    const defaultStartTime = filters.startTime || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
    const defaultEndTime = filters.endTime || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days from now

    params.append('startTime', defaultStartTime);
    params.append('endTime', defaultEndTime);

    // Add optional filters
    if (filters.contactId) params.append('contactId', filters.contactId);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const events = data.events || [];

    calendarLogger.success('Events from ALL calendars fetched successfully', {
      count: events.length,
      locationId: 'b7vHWUGVUNQGoIlAXabY',
      groupId: 'FIt5F2PbZVrK846aJeJF',
      dateRange: `${defaultStartTime} to ${defaultEndTime}`,
      traceId: data.traceId,
    });

    return {
      success: true,
      data: events,
      meta: {
        ...data.meta,
        traceId: data.traceId,
        groupId: 'FIt5F2PbZVrK846aJeJF',
        allCalendars: true,
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching events from all calendars', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch calendar events
 * ⚠️  DEPRECATED: Use getMasterCalendarData() instead for single source of truth
 */
export const fetchCalendarEvents = async (filters = {}) => {
  console.warn('⚠️  DEPRECATED: fetchCalendarEvents() - Use getMasterCalendarData() instead');

  try {
    calendarLogger.info('Fetching calendar events from GHL using all calendars endpoint', { filters });

    // Build query parameters using your specific cURL endpoint
    const params = new URLSearchParams();

    // Required parameters from your cURL command
    params.append('locationId', 'b7vHWUGVUNQGoIlAXabY');

    // API requires either calendarId, userId, or groupId - let's try multiple approaches
    if (filters.calendarId) {
      params.append('calendarId', filters.calendarId);
    } else if (filters.userId) {
      params.append('userId', filters.userId);
    } else if (filters.groupId) {
      params.append('groupId', filters.groupId);
    } else {
      // Default to the known working calendarId
      params.append('calendarId', 'sV3BiXrjzbfo1tSUdyHO');
    }

    // REMOVE TIME RESTRICTIONS - Get ALL events with maximum possible range
    const veryStartTime = filters.startTime || '2020-01-01T00:00:00.000Z'; // Start from 2020
    const veryEndTime = filters.endTime || '2030-12-31T23:59:59.999Z'; // Go to 2030

    params.append('startTime', veryStartTime);
    params.append('endTime', veryEndTime);

    // Add optional filters
    if (filters.contactId) params.append('contactId', filters.contactId);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const events = data.events || [];

    calendarLogger.success('Calendar events fetched successfully with UNLIMITED time range', {
      count: events.length,
      locationId: 'b7vHWUGVUNQGoIlAXabY',
      dateRange: `${veryStartTime} to ${veryEndTime} (10 YEAR SPAN)`,
      traceId: data.traceId,
    });

    return {
      success: true,
      data: events,
      meta: data.meta || { traceId: data.traceId },
    };

  } catch (error) {
    calendarLogger.error('Error fetching calendar events', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch all calendar appointments (FIXED ENDPOINT)
 * Returns all appointments from the GHL calendar using the correct API
 */
export const fetchAppointments = async (filters = {}) => {
  try {
    calendarLogger.info('Fetching appointments using calendar events endpoint', { filters });

    // Use the correct calendar events endpoint instead of the non-existent appointments endpoint
    const defaultFilters = {
      locationId: 'b7vHWUGVUNQGoIlAXabY',
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
      // Set default date range if not provided
      startTime: filters.startTime || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      endTime: filters.endTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      ...filters,
    };

    // Use the working fetchCalendarEvents function
    const response = await fetchCalendarEvents(defaultFilters);

    if (response.success) {
      calendarLogger.success('Appointments fetched successfully via calendar events', {
        count: response.data.length,
      });

      return {
        success: true,
        data: response.data,
        meta: response.meta,
      };
    } else {
      throw new Error(response.error);
    }

  } catch (error) {
    calendarLogger.error('Error fetching appointments', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch appointments by date range (FIXED ENDPOINT)
 * Returns appointments within a specific date range using the correct API
 */
export const fetchAppointmentsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    calendarLogger.info('Fetching appointments by date range using calendar events', { startDate, endDate, filters });

    // Convert dates to ISO format if they're not already
    const startTime = startDate instanceof Date ? startDate.toISOString() : startDate;
    const endTime = endDate instanceof Date ? endDate.toISOString() : endDate;

    // Use the correct calendar events endpoint with date range
    const calendarFilters = {
      locationId: 'b7vHWUGVUNQGoIlAXabY',
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
      startTime,
      endTime,
      ...filters,
    };

    const response = await fetchCalendarEvents(calendarFilters);

    if (response.success) {
      calendarLogger.success('Date range appointments fetched successfully', {
        startDate,
        endDate,
        count: response.data.length,
      });

      return {
        success: true,
        data: response.data,
        meta: response.meta,
      };
    } else {
      throw new Error(response.error);
    }

  } catch (error) {
    calendarLogger.error('Error fetching appointments by date range', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch appointments by user
 * Returns appointments assigned to a specific user
 */
export const fetchAppointmentsByUser = async (userId, filters = {}) => {
  try {
    calendarLogger.info('Fetching appointments for user', { userId, filters });

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments?assignedTo=${userId}`,
      {
        method: 'GET',
        headers: getGHLHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const appointments = data.appointments || data;

    calendarLogger.success('User appointments fetched successfully', { userId, count: appointments.length });

    return {
      success: true,
      data: appointments,
    };

  } catch (error) {
    calendarLogger.error('Error fetching user appointments', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch appointment by ID (GHL Direct API)
 * Returns a specific appointment by its ID using the direct GHL API
 */
export const fetchAppointmentById = async (appointmentId) => {
  try {
    calendarLogger.info('Fetching appointment by ID using direct GHL API', { appointmentId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const appointment = await response.json();

    calendarLogger.success('Appointment fetched successfully via direct GHL API', { appointmentId });

    return {
      success: true,
      data: appointment,
    };

  } catch (error) {
    calendarLogger.error('Error fetching appointment by ID', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🎯 GET - Fetch all GHL appointments
 * Returns all appointments from your GHL backend using the appointments endpoint
 */
export const fetchGHLAppointments = async (filters = {}) => {
  try {
    calendarLogger.info('Fetching all GHL appointments', { filters });

    // Build query parameters
    const params = new URLSearchParams();

    // Add location and calendar filters
    params.append('locationId', filters.locationId || 'b7vHWUGVUNQGoIlAXabY');
    params.append('calendarId', filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO');

    // Add time range - use unlimited range to get all appointments
    const veryStartTime = filters.startTime || '2020-01-01T00:00:00.000Z';
    const veryEndTime = filters.endTime || '2030-12-31T23:59:59.999Z';

    params.append('startTime', veryStartTime);
    params.append('endTime', veryEndTime);

    // Add optional filters
    if (filters.contactId) params.append('contactId', filters.contactId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.appointmentStatus) params.append('appointmentStatus', filters.appointmentStatus);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/appointments?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const appointments = data.appointments || data.events || data || [];

    calendarLogger.success('GHL appointments fetched successfully', {
      count: appointments.length,
      locationId: filters.locationId || 'b7vHWUGVUNQGoIlAXabY',
      calendarId: filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO',
      dateRange: `${veryStartTime} to ${veryEndTime}`,
    });

    return {
      success: true,
      data: appointments,
      meta: {
        count: appointments.length,
        dateRange: `${veryStartTime} to ${veryEndTime}`,
        locationId: filters.locationId || 'b7vHWUGVUNQGoIlAXabY',
        calendarId: filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO',
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching GHL appointments', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch all GHL calendar groups
 * Fetches calendar groups from your GHL backend using your specific cURL approach
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} API response with calendar groups
 */
export const fetchGHLCalendarGroups = async (filters = {}) => {
  try {
    calendarLogger.info('Fetching GHL calendar groups', { filters });

    const locationId = filters.locationId || 'b7vHWUGVUNQGoIlAXabY';

    // Build query parameters using your specific cURL approach
    const params = new URLSearchParams();
    params.append('locationId', locationId);

    // Add optional filters
    if (filters.groupId) params.append('groupId', filters.groupId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/groups?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const groups = data.groups || [];

    calendarLogger.success('GHL calendar groups fetched successfully', {
      count: groups.length,
      locationId,
      traceId: data.traceId,
    });

    return {
      success: true,
      data: groups,
      meta: {
        count: groups.length,
        locationId,
        traceId: data.traceId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching GHL calendar groups', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch events by calendar group
 * Fetches events from all calendars within a specific group
 * @param {string} groupId - The calendar group ID to fetch events from
 * @param {Object} filters - Additional filter parameters
 * @returns {Promise<Object>} API response with events from group calendars
 */
export const fetchEventsByCalendarGroup = async (groupId, filters = {}) => {
  try {
    calendarLogger.info('Fetching events by calendar group', { groupId, filters });

    const locationId = filters.locationId || 'b7vHWUGVUNQGoIlAXabY';

    // Use unlimited time range to get all events
    const veryStartTime = filters.startTime || '2020-01-01T00:00:00.000Z';
    const veryEndTime = filters.endTime || '2030-12-31T23:59:59.999Z';

    // Build query parameters
    const params = new URLSearchParams();
    params.append('locationId', locationId);
    params.append('groupId', groupId);
    params.append('startTime', veryStartTime);
    params.append('endTime', veryEndTime);

    // Add optional filters
    if (filters.contactId) params.append('contactId', filters.contactId);
    if (filters.userId) params.append('userId', filters.userId);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const events = data.events || [];

    calendarLogger.success('Events from calendar group fetched successfully', {
      groupId,
      count: events.length,
      locationId,
      dateRange: `${veryStartTime} to ${veryEndTime}`,
      traceId: data.traceId,
    });

    // Add group metadata to each event
    const eventsWithGroupData = events.map(event => ({
      ...event,
      sourceGroupId: groupId,
      sourceLocationId: locationId,
    }));

    return {
      success: true,
      data: eventsWithGroupData,
      meta: {
        count: events.length,
        groupId,
        locationId,
        dateRange: `${veryStartTime} to ${veryEndTime}`,
        traceId: data.traceId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching events by calendar group', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch events from ALL your GHL calendars
 * Fetches events from every calendar in your GHL backend using your specific cURL approach
 * @param {Object} filters - Filter parameters (time range, etc.)
 * @returns {Promise<Object>} API response with events from all calendars
 */
export const fetchAllGHLCalendarEvents = async (filters = {}) => {
  try {
    calendarLogger.info('🔄 Fetching events from ALL GHL calendars via MASTER API', { filters });

    // Use MASTER API as single source of truth
    const masterResponse = await getMasterCalendarData();

    if (!masterResponse.success || !masterResponse.data?.calendars) {
      throw new Error('Failed to fetch calendar list from master API');
    }

    // Extract calendar IDs from the master API response
    const calendars = masterResponse.data.calendars;
    const calendarIds = calendars
      .filter(cal => cal.id && cal.id.length > 10) // Only valid IDs
      .map(cal => cal.id);

    if (calendarIds.length === 0) {
      calendarLogger.warn('No valid calendar IDs found in master API');
      return {
        success: true,
        data: [],
        meta: {
          totalEvents: 0,
          calendarsChecked: 0,
          message: 'No valid calendars found in master API',
          source: 'MASTER_API',
        },
      };
    }

    calendarLogger.info('📋 Using calendars from MASTER API:', {
      count: calendarIds.length,
      calendarIds: calendarIds,
      source: 'MASTER_API_DYNAMIC',
    });    const locationId = filters.locationId || 'b7vHWUGVUNQGoIlAXabY';

    // Use unlimited time range to get all events
    const veryStartTime = filters.startTime || '2020-01-01T00:00:00.000Z';
    const veryEndTime = filters.endTime || '2030-12-31T23:59:59.999Z';

    // Fetch events from each calendar concurrently
    const fetchPromises = calendarIds.map(async (calendarId) => {
      try {
        calendarLogger.info(`Fetching events from calendar: ${calendarId}`);

        // Build query parameters using your specific cURL approach
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('calendarId', calendarId);
        params.append('startTime', veryStartTime);
        params.append('endTime', veryEndTime);

        const response = await fetch(
          `https://services.leadconnectorhq.com/calendars/events?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
              'Version': '2021-04-15',
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const events = data.events || [];

        calendarLogger.info(`Calendar ${calendarId} returned ${events.length} events`);

        // Add calendar metadata to each event
        return events.map(event => ({
          ...event,
          sourceCalendarId: calendarId,
          sourceLocationId: locationId,
        }));

      } catch (error) {
        calendarLogger.warn(`Failed to fetch events from calendar ${calendarId}:`, error);
        return []; // Return empty array for failed calendar
      }
    });

    // Wait for all calendar fetches to complete
    const calendarResults = await Promise.allSettled(fetchPromises);

    // Combine all events from all calendars
    const allEvents = calendarResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    calendarLogger.success('Events from ALL GHL calendars fetched successfully (DYNAMIC)', {
      totalEvents: allEvents.length,
      calendarsChecked: calendarIds.length,
      dynamicCalendars: true,
      locationId,
      dateRange: `${veryStartTime} to ${veryEndTime}`,
    });

    // Group events by calendar for detailed reporting
    const eventsByCalendar = {};
    allEvents.forEach(event => {
      const calendarId = event.sourceCalendarId;
      if (!eventsByCalendar[calendarId]) {
        eventsByCalendar[calendarId] = [];
      }
      eventsByCalendar[calendarId].push(event);
    });

    return {
      success: true,
      data: allEvents,
      meta: {
        totalEvents: allEvents.length,
        calendarsChecked: calendarIds.length,
        eventsByCalendar,
        locationId,
        dateRange: `${veryStartTime} to ${veryEndTime}`,
        requestTimestamp: new Date().toISOString(),
        traceId: `dynamic-multi-calendar-${Date.now()}`,
        isDynamic: true,
        message: 'Fetched from dynamically discovered calendars',
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching events from all GHL calendars', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Fetch available time slots
 * Returns available time slots for a specific date
 */
export const fetchAvailableTimeSlots = async (date, duration = 30, userId = null) => {
  try {
    calendarLogger.info('Fetching available time slots', { date, duration, userId });

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/available-slots?date=${date}&duration=${duration}${userId ? `&userId=${userId}` : ''}`,
      {
        method: 'GET',
        headers: getGHLHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const timeSlots = data.timeSlots || data;

    calendarLogger.success('Available time slots fetched successfully', {
      date,
      duration,
      count: timeSlots.length,
    });

    return {
      success: true,
      data: timeSlots,
    };

  } catch (error) {
    calendarLogger.error('Error fetching available time slots', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// ============================================================================
// 📤 POST REQUESTS
// ============================================================================

/**
 * ➕ POST - Create new appointment
 * Creates a new appointment in the GHL calendar
 */
export const bookGhlAppointment = async (appointmentData) => {
  try {
    calendarLogger.info('Booking GHL appointment', { appointmentData });

    const response = await fetch(
      'https://services.leadconnectorhq.com/calendars/events/appointments',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(appointmentData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! Status: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    calendarLogger.success('GHL appointment booked successfully', {
      appointmentId: data?.id,
      contactId: data?.contact?.id,
    });

    return {
      success: true,
      data,
    };

  } catch (error) {
    calendarLogger.error('Error booking GHL appointment', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};


/**
 * ➕ POST - Create recurring appointment
 * Creates a series of recurring appointments
 */
export const createRecurringAppointment = async (appointmentData, recurrencePattern) => {
  try {
    calendarLogger.info('Creating recurring appointment', { appointmentData, recurrencePattern });

    const ghlAppointmentData = {
      ...appointmentData,
      locationId: GHL_CONFIG.locationId,
      recurrence: recurrencePattern,
    };

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments/recurring`,
      {
        method: 'POST',
        headers: getGHLHeaders(),
        body: JSON.stringify(ghlAppointmentData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const recurringAppointments = await response.json();

    calendarLogger.success('Recurring appointments created successfully', {
      count: recurringAppointments.length,
    });
    toast.success(`✅ ${recurringAppointments.length} recurring appointments created!`);

    return {
      success: true,
      data: recurringAppointments,
    };

  } catch (error) {
    calendarLogger.error('Error creating recurring appointment', error);
    toast.error(`❌ Failed to create recurring appointment: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// 📝 PUT REQUESTS
// ============================================================================

/**
 * 📝 PUT - Update appointment
 * Updates an existing appointment
 */
export const updateAppointment = async (appointmentId, updates) => {
  try {
    calendarLogger.info('Updating appointment', { appointmentId, updates });

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments/${appointmentId}`,
      {
        method: 'PUT',
        headers: getGHLHeaders(),
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const updatedAppointment = await response.json();

    calendarLogger.success('Appointment updated successfully', { appointmentId });
    toast.success('✅ Appointment updated successfully!');

    return {
      success: true,
      data: updatedAppointment,
    };

  } catch (error) {
    calendarLogger.error('Error updating appointment', error);
    toast.error(`❌ Failed to update appointment: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ✅ PUT - Mark appointment as completed
 * Marks an appointment as completed
 */
export const completeAppointment = async (appointmentId) => {
  try {
    calendarLogger.info('Marking appointment as completed', { appointmentId });

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments/${appointmentId}`,
      {
        method: 'PUT',
        headers: getGHLHeaders(),
        body: JSON.stringify({ status: 'completed' }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const completedAppointment = await response.json();

    calendarLogger.success('Appointment marked as completed', { appointmentId });
    toast.success('✅ Appointment completed!');

    return {
      success: true,
      data: completedAppointment,
    };

  } catch (error) {
    calendarLogger.error('Error completing appointment', error);
    toast.error(`❌ Failed to complete appointment: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ❌ PUT - Cancel appointment
 * Cancels an appointment
 */
export const cancelAppointment = async (appointmentId, reason = '') => {
  try {
    calendarLogger.info('Cancelling appointment', { appointmentId, reason });

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments/${appointmentId}`,
      {
        method: 'PUT',
        headers: getGHLHeaders(),
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: reason,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const cancelledAppointment = await response.json();

    calendarLogger.success('Appointment cancelled successfully', { appointmentId });
    toast.success('✅ Appointment cancelled!');

    return {
      success: true,
      data: cancelledAppointment,
    };

  } catch (error) {
    calendarLogger.error('Error cancelling appointment', error);
    toast.error(`❌ Failed to cancel appointment: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// 🗑️ DELETE REQUESTS
// ============================================================================

/**
 * 🗑️ DELETE - Delete appointment
 * Removes an appointment from the calendar
 */
export const deleteAppointment = async (appointmentId) => {
  try {
    calendarLogger.info('Deleting appointment', { appointmentId });

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments/${appointmentId}`,
      {
        method: 'DELETE',
        headers: getGHLHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    calendarLogger.success('Appointment deleted successfully', { appointmentId });
    toast.success('✅ Appointment deleted successfully!');

    return {
      success: true,
      data: { appointmentId },
    };

  } catch (error) {
    calendarLogger.error('Error deleting appointment', error);
    toast.error(`❌ Failed to delete appointment: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// 🔄 BULK OPERATIONS
// ============================================================================

/**
 * 🔄 POST - Bulk update appointments
 * Updates multiple appointments at once
 */
export const bulkUpdateAppointments = async (appointmentUpdates) => {
  try {
    calendarLogger.info('Bulk updating appointments', { count: appointmentUpdates.length });

    const promises = appointmentUpdates.map(({ appointmentId, updates }) =>
      updateAppointment(appointmentId, updates),
    );

    const results = await Promise.allSettled(promises);

    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
    const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

    calendarLogger.success('Bulk update completed', {
      successful: successful.length,
      failed: failed.length,
    });

    if (successful.length > 0) {
      toast.success(`✅ ${successful.length} appointments updated successfully!`);
    }

    if (failed.length > 0) {
      toast.error(`❌ ${failed.length} appointments failed to update`);
    }

    return {
      success: true,
      data: {
        successful: successful.length,
        failed: failed.length,
        results,
      },
    };

  } catch (error) {
    calendarLogger.error('Error in bulk update', error);
    toast.error(`❌ Bulk update failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

/**
 * 🧪 Test calendar API connectivity
 * Simple test to check if the calendar API is working
 */
export const testCalendarApiConnection = async () => {
  try {
    calendarLogger.info('Testing calendar API connection...');

    const response = await fetch(
      `${GHL_CONFIG.locationUrl}/calendar/appointments`,
      {
        method: 'GET',
        headers: getGHLHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    calendarLogger.success('Calendar API connection test successful');

    return {
      success: true,
      data: {
        status: response.status,
        appointmentCount: data.appointments ? data.appointments.length : 0,
      },
    };

  } catch (error) {
    calendarLogger.error('Calendar API connection test failed', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 🧪 Test GHL configuration
 * Check if GHL config is properly set up
 */
export const testGHLConfig = () => {
  const validation = validateGHLConfig();
  calendarLogger.info('GHL Configuration Test:', validation);

  if (!validation.isValid) {
    calendarLogger.error('GHL Configuration Issues:', validation.issues);
    toast.error('❌ GHL Configuration has issues. Check console for details.');
  } else {
    calendarLogger.success('GHL Configuration is valid');
    toast.success('✅ GHL Configuration is valid');
  }

  return validation;
};

// Default export for the calendar API functions
// ============================================================================
// 🎯 ENHANCED CALENDAR MANAGEMENT FUNCTIONS
// ============================================================================
// Based on GHL API cURL commands - Full CRUD operations for calendars

/**
 * 🎯 GET - Fetch specific calendar details
 * Gets detailed information about a specific calendar
 * @param {string} calendarId - The calendar ID to fetch details for
 * @returns {Promise<Object>} API response with calendar details
 */
export const fetchCalendarDetails = async (calendarId) => {
  try {
    calendarLogger.info('Fetching calendar details', { calendarId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Calendar details fetched successfully', {
      calendarId,
      calendarName: data.name,
    });

    return {
      success: true,
      data: data,
      meta: {
        calendarId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching calendar details', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 📝 PUT - Update calendar configuration
 * Updates an existing calendar with new settings
 * @param {string} calendarId - The calendar ID to update
 * @param {Object} calendarData - The calendar configuration data
 * @returns {Promise<Object>} API response with updated calendar
 */
export const updateCalendarConfiguration = async (calendarId, calendarData) => {
  try {
    calendarLogger.info('Updating calendar configuration', { calendarId, calendarData });

    // Default calendar configuration based on cURL example
    const defaultConfig = {
      notifications: [
        {
          type: 'email',
          shouldSendToContact: true,
          shouldSendToGuest: true,
          shouldSendToUser: true,
          shouldSendToSelectedUsers: true,
          selectedUsers: 'user1@testemail.com,user2@testemail.com',
        },
      ],
      groupId: 'BqTwX8QFwXzpegMve9EQ',
      teamMembers: [
        {
          userId: 'ocQHyuzHvysMo5N5VsXc',
          priority: 0.5,
          isPrimary: true,
          locationConfigurations: [
            {
              kind: 'custom',
              location: '+14455550132',
            },
          ],
        },
      ],
      eventType: 'RoundRobin_OptimizeForAvailability',
      name: 'Updated Calendar',
      description: 'Updated calendar configuration',
      slug: 'updated-calendar',
      widgetSlug: 'updated-calendar',
      widgetType: 'classic',
      eventTitle: 'Appointment',
      eventColor: '#039be5',
      locationConfigurations: [
        {
          kind: 'custom',
          location: '+14455550132',
        },
      ],
      slotDuration: 30,
      slotDurationUnit: 'mins',
      preBufferUnit: 'mins',
      slotInterval: 30,
      slotIntervalUnit: 'mins',
      slotBuffer: 0,
      preBuffer: 0,
      appoinmentPerSlot: 1,
      appoinmentPerDay: 0,
      allowBookingAfter: 0,
      allowBookingAfterUnit: 'hours',
      allowBookingFor: 30,
      allowBookingForUnit: 'days',
      openHours: [
        {
          daysOfTheWeek: [1, 2, 3, 4, 5], // Monday to Friday
          hours: [
            {
              openHour: 9,
              openMinute: 0,
              closeHour: 17,
              closeMinute: 0,
            },
          ],
        },
      ],
      enableRecurring: false,
      recurring: {
        freq: 'DAILY',
        count: 24,
        bookingOption: 'skip',
        bookingOverlapDefaultStatus: 'confirmed',
      },
      stickyContact: true,
      isLivePaymentMode: false,
      autoConfirm: true,
      shouldSendAlertEmailsToAssignedMember: true,
      googleInvitationEmails: true,
      allowReschedule: true,
      allowCancellation: true,
      shouldAssignContactToTeamMember: true,
      shouldSkipAssigningContactForExisting: false,
      availabilityType: 0,
      guestType: 'count_only',
      isActive: true,
    };

    // Merge provided data with defaults
    const updateData = { ...defaultConfig, ...calendarData };

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Calendar configuration updated successfully', {
      calendarId,
      calendarName: data.name,
    });

    return {
      success: true,
      data: data,
      meta: {
        calendarId,
        updatedFields: Object.keys(calendarData),
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error updating calendar configuration', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🗑️ DELETE - Delete calendar
 * Removes a calendar from the system
 * @param {string} calendarId - The calendar ID to delete
 * @returns {Promise<Object>} API response confirming deletion
 */
export const deleteCalendar = async (calendarId) => {
  try {
    calendarLogger.info('Deleting calendar', { calendarId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // DELETE requests may return empty response
    let data = {};
    try {
      data = await response.json();
    } catch (_error) {
      // Empty response is OK for DELETE
      data = { deleted: true, calendarId };
    }

    calendarLogger.success('Calendar deleted successfully', { calendarId });

    return {
      success: true,
      data: { calendarId, deleted: true, ...data },
      meta: {
        calendarId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error deleting calendar', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * ➕ POST - Create new calendar
 * Creates a new calendar with the specified configuration
 * @param {Object} calendarData - The calendar configuration data
 * @returns {Promise<Object>} API response with created calendar
 */
export const createCalendar = async (calendarData) => {
  try {
    calendarLogger.info('Creating new calendar', { calendarData });

    // Default calendar configuration for creation
    const defaultCreateConfig = {
      isActive: true,
      notifications: [
        {
          type: 'email',
          shouldSendToContact: true,
          shouldSendToGuest: true,
          shouldSendToUser: true,
          shouldSendToSelectedUsers: true,
          selectedUsers: 'user1@testemail.com,user2@testemail.com',
        },
      ],
      locationId: 'b7vHWUGVUNQGoIlAXabY', // Use the existing location ID
      groupId: 'BqTwX8QFwXzpegMve9EQ',
      teamMembers: [
        {
          userId: 'ocQHyuzHvysMo5N5VsXc',
          priority: 0.5,
          isPrimary: true,
          locationConfigurations: [
            {
              kind: 'custom',
              location: '+14455550132',
            },
          ],
        },
      ],
      eventType: 'RoundRobin_OptimizeForAvailability',
      name: 'New Calendar',
      description: 'This is a new calendar',
      slug: `calendar-${Date.now()}`,
      widgetSlug: `widget-${Date.now()}`,
      calendarType: 'round_robin',
      widgetType: 'classic',
      eventTitle: '{{contact.name}}',
      eventColor: '#039be5',
      locationConfigurations: [
        {
          kind: 'custom',
          location: '+14455550132',
        },
      ],
      slotDuration: 30,
      slotDurationUnit: 'mins',
      slotInterval: 30,
      slotIntervalUnit: 'mins',
      slotBuffer: 0,
      slotBufferUnit: 'mins',
      preBuffer: 0,
      preBufferUnit: 'mins',
      appoinmentPerSlot: 1,
      appoinmentPerDay: 0,
      allowBookingAfter: 0,
      allowBookingAfterUnit: 'hours',
      allowBookingFor: 30,
      allowBookingForUnit: 'days',
      openHours: [
        {
          daysOfTheWeek: [1, 2, 3, 4, 5], // Monday to Friday
          hours: [
            {
              openHour: 9,
              openMinute: 0,
              closeHour: 17,
              closeMinute: 0,
            },
          ],
        },
      ],
      enableRecurring: false,
      recurring: {
        freq: 'DAILY',
        count: 24,
        bookingOption: 'skip',
        bookingOverlapDefaultStatus: 'confirmed',
      },
      stickyContact: true,
      isLivePaymentMode: false,
      autoConfirm: true,
      shouldSendAlertEmailsToAssignedMember: true,
      googleInvitationEmails: false,
      allowReschedule: true,
      allowCancellation: true,
      shouldAssignContactToTeamMember: true,
      shouldSkipAssigningContactForExisting: false,
      formSubmitType: 'ThankYouMessage',
      availabilityType: 0,
      availabilities: [
        {
          date: '2025-08-12T00:00:00.000Z',
          hours: [
            {
              openHour: 9,
              openMinute: 0,
              closeHour: 17,
              closeMinute: 0,
            },
          ],
          deleted: false,
        },
      ],
      guestType: 'count_only',
      lookBusyConfig: {
        enabled: false,
        LookBusyPercentage: 0,
      },
    };

    // Merge provided data with defaults
    const createData = { ...defaultCreateConfig, ...calendarData };

    const response = await fetch(
      'https://services.leadconnectorhq.com/calendars/',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(createData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Calendar created successfully', {
      calendarId: data.id,
      calendarName: data.name,
    });

    return {
      success: true,
      data: data,
      meta: {
        calendarId: data.id,
        createdFields: Object.keys(calendarData),
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error creating calendar', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🔄 GET - Fetch all calendars with enhanced details
 * Gets all calendars and optionally fetches detailed info for each
 * @param {Object} options - Options for fetching calendars
 * @returns {Promise<Object>} API response with calendars list
 */
export const fetchAllCalendarsWithDetails = async (options = {}) => {
  try {
    const { includeDetails = false } = options;

    calendarLogger.info('📋 Fetching all calendars via MASTER API', { includeDetails });

    // Use MASTER API as single source of truth
    const masterResponse = await getMasterCalendarData();

    if (!masterResponse.success) {
      throw new Error(masterResponse.error);
    }

    let calendars = masterResponse.data.calendars || [];

    // If detailed info requested, fetch details for each calendar
    if (includeDetails && calendars.length > 0) {
      calendarLogger.info('Fetching detailed info for each calendar');

      const detailPromises = calendars.map(async (calendar) => {
        try {
          const detailResponse = await fetchCalendarDetails(calendar.id);
          return detailResponse.success ? detailResponse.data : calendar;
        } catch (error) {
          calendarLogger.warn(`Failed to fetch details for calendar ${calendar.id}`, error);
          return calendar;
        }
      });

      calendars = await Promise.allSettled(detailPromises);
      calendars = calendars
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    }

    calendarLogger.success('All calendars fetched successfully', {
      count: calendars.length,
      includeDetails,
    });

    return {
      success: true,
      data: calendars,
      meta: {
        count: calendars.length,
        includeDetails,
        locationId: masterResponse.data.meta?.locationId || 'b7vHWUGVUNQGoIlAXabY',
        requestTimestamp: new Date().toISOString(),
        source: 'MASTER_API',
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching all calendars with details', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// ============================================================================
// 🎯 ENHANCED APPOINTMENT & EVENT MANAGEMENT FUNCTIONS
// ============================================================================
// Complete appointment lifecycle management with blocked slots and event operations

/**
 * ➕ POST - Create new appointment
 * Creates a new appointment with comprehensive configuration options
 * @param {Object} appointmentData - The appointment data
 * @returns {Promise<Object>} API response with created appointment
 */
export const createAppointment = async (appointmentData) => {
  try {
    calendarLogger.info('Creating new appointment', { appointmentData });

    // Default appointment configuration
    const defaultAppointmentConfig = {
      title: 'New Appointment',
      meetingLocationType: 'custom',
      meetingLocationId: 'default',
      overrideLocationConfig: true,
      appointmentStatus: 'confirmed',
      assignedUserId: '0007BWpSzSwfiuSl0tR2',
      address: 'Virtual Meeting',
      ignoreDateRange: false,
      toNotify: true,
      ignoreFreeSlotValidation: false,
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
      locationId: 'b7vHWUGVUNQGoIlAXabY',
      contactId: null,
    };

    // Merge provided data with defaults
    const createData = { ...defaultAppointmentConfig, ...appointmentData };

    // Validate required fields
    if (!createData.startTime || !createData.endTime) {
      throw new Error('startTime and endTime are required');
    }

    // Ensure times are properly formatted
    if (createData.startTime instanceof Date) {
      createData.startTime = createData.startTime.toISOString();
    }
    if (createData.endTime instanceof Date) {
      createData.endTime = createData.endTime.toISOString();
    }

    const response = await fetch(
      'https://services.leadconnectorhq.com/calendars/events/appointments',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(createData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Appointment created successfully', {
      appointmentId: data.id,
      title: data.title,
    });

    return {
      success: true,
      data: data,
      meta: {
        appointmentId: data.id,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error creating appointment', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 📝 PUT - Update existing appointment
 * Updates an appointment with new configuration
 * @param {string} appointmentId - The appointment ID to update
 * @param {Object} appointmentData - The updated appointment data
 * @returns {Promise<Object>} API response with updated appointment
 */
export const updateAppointmentDetails = async (appointmentId, appointmentData) => {
  try {
    calendarLogger.info('Updating appointment details', { appointmentId, appointmentData });

    // Default update configuration
    const defaultUpdateConfig = {
      title: 'Updated Appointment',
      meetingLocationType: 'custom',
      meetingLocationId: 'default',
      overrideLocationConfig: true,
      appointmentStatus: 'confirmed',
      assignedUserId: '0007BWpSzSwfiuSl0tR2',
      address: 'Virtual Meeting',
      ignoreDateRange: false,
      toNotify: true,
      ignoreFreeSlotValidation: false,
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
    };

    // Merge provided data with defaults
    const updateData = { ...defaultUpdateConfig, ...appointmentData };

    // Ensure times are properly formatted if provided
    if (updateData.startTime instanceof Date) {
      updateData.startTime = updateData.startTime.toISOString();
    }
    if (updateData.endTime instanceof Date) {
      updateData.endTime = updateData.endTime.toISOString();
    }

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Appointment updated successfully', {
      appointmentId,
      title: data.title,
    });

    return {
      success: true,
      data: data,
      meta: {
        appointmentId,
        updatedFields: Object.keys(appointmentData),
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error updating appointment details', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🔍 GET - Get appointment details
 * Retrieves detailed information about a specific appointment
 * @param {string} appointmentId - The appointment ID to fetch
 * @returns {Promise<Object>} API response with appointment details
 */
export const getAppointmentDetails = async (appointmentId) => {
  try {
    calendarLogger.info('Fetching appointment details', { appointmentId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Appointment details fetched successfully', {
      appointmentId,
      title: data.title,
      status: data.appointmentStatus,
    });

    return {
      success: true,
      data: data,
      meta: {
        appointmentId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching appointment details', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 📅 GET - Get all calendar events
 * Retrieves all events (appointments and blocks) from a calendar
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} API response with all calendar events
 */
export const getAllCalendarEvents = async (filters = {}) => {
  try {
    calendarLogger.info('Fetching all calendar events', { filters });

    // Build query parameters
    const params = new URLSearchParams();
    params.append('locationId', filters.locationId || 'b7vHWUGVUNQGoIlAXabY');
    params.append('calendarId', filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO');

    // Add optional parameters
    if (filters.startTime) params.append('startTime', filters.startTime);
    if (filters.endTime) params.append('endTime', filters.endTime);
    if (filters.contactId) params.append('contactId', filters.contactId);
    if (filters.userId) params.append('userId', filters.userId);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const events = data.events || data;

    calendarLogger.success('All calendar events fetched successfully', {
      count: events.length,
      calendarId: filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO',
    });

    return {
      success: true,
      data: events,
      meta: {
        count: events.length,
        calendarId: filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO',
        locationId: filters.locationId || 'b7vHWUGVUNQGoIlAXabY',
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching all calendar events', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🚫 GET - Get blocked slots
 * Retrieves all blocked time slots for a calendar
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} API response with blocked slots
 */
export const getBlockedSlots = async (filters = {}) => {
  try {
    calendarLogger.info('Fetching blocked slots', { filters });

    // Build query parameters
    const params = new URLSearchParams();
    params.append('locationId', filters.locationId || 'b7vHWUGVUNQGoIlAXabY');
    params.append('calendarId', filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO');

    // Add optional parameters
    if (filters.startTime) params.append('startTime', filters.startTime);
    if (filters.endTime) params.append('endTime', filters.endTime);

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/blocked-slots?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const blockedSlots = data.blockedSlots || data;

    calendarLogger.success('Blocked slots fetched successfully', {
      count: blockedSlots.length,
      calendarId: filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO',
    });

    return {
      success: true,
      data: blockedSlots,
      meta: {
        count: blockedSlots.length,
        calendarId: filters.calendarId || 'sV3BiXrjzbfo1tSUdyHO',
        locationId: filters.locationId || 'b7vHWUGVUNQGoIlAXabY',
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching blocked slots', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🚫 POST - Create blocked slot
 * Creates a new blocked time slot to prevent bookings
 * @param {Object} blockData - The block slot data
 * @returns {Promise<Object>} API response with created block
 */
export const createBlockedSlot = async (blockData) => {
  try {
    calendarLogger.info('Creating blocked slot', { blockData });

    // Default block configuration
    const defaultBlockConfig = {
      title: 'Blocked Time',
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
      assignedUserId: 'sV3BiXrjzbfo1tSUdyHO',
      locationId: 'b7vHWUGVUNQGoIlAXabY',
    };

    // Merge provided data with defaults
    const createData = { ...defaultBlockConfig, ...blockData };

    // Validate required fields
    if (!createData.startTime || !createData.endTime) {
      throw new Error('startTime and endTime are required');
    }

    // Ensure times are properly formatted
    if (createData.startTime instanceof Date) {
      createData.startTime = createData.startTime.toISOString();
    }
    if (createData.endTime instanceof Date) {
      createData.endTime = createData.endTime.toISOString();
    }

    const response = await fetch(
      'https://services.leadconnectorhq.com/calendars/events/block-slots',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(createData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Blocked slot created successfully', {
      blockId: data.id,
      title: data.title,
    });

    return {
      success: true,
      data: data,
      meta: {
        blockId: data.id,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error creating blocked slot', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🚫 PUT - Update blocked slot
 * Updates an existing blocked time slot
 * @param {string} blockId - The block slot ID to update
 * @param {Object} blockData - The updated block data
 * @returns {Promise<Object>} API response with updated block
 */
export const updateBlockedSlot = async (blockId, blockData) => {
  try {
    calendarLogger.info('Updating blocked slot', { blockId, blockData });

    // Default update configuration
    const defaultUpdateConfig = {
      title: 'Updated Blocked Time',
      calendarId: 'sV3BiXrjzbfo1tSUdyHO',
      assignedUserId: 'sV3BiXrjzbfo1tSUdyHO',
      locationId: 'b7vHWUGVUNQGoIlAXabY',
    };

    // Merge provided data with defaults
    const updateData = { ...defaultUpdateConfig, ...blockData };

    // Ensure times are properly formatted if provided
    if (updateData.startTime instanceof Date) {
      updateData.startTime = updateData.startTime.toISOString();
    }
    if (updateData.endTime instanceof Date) {
      updateData.endTime = updateData.endTime.toISOString();
    }

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/block-slots/${blockId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Blocked slot updated successfully', {
      blockId,
      title: data.title,
    });

    return {
      success: true,
      data: data,
      meta: {
        blockId,
        updatedFields: Object.keys(blockData),
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error updating blocked slot', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🗑️ DELETE - Delete any event (appointment or block)
 * Permanently removes any calendar event (appointment or blocked slot)
 * @param {string} eventId - The event ID to delete
 * @returns {Promise<Object>} API response confirming deletion
 */
export const deleteCalendarEvent = async (eventId) => {
  try {
    calendarLogger.info('Deleting calendar event', { eventId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // DELETE requests may return empty response
    let data = {};
    try {
      data = await response.json();
    } catch (_error) {
      // Empty response is OK for DELETE
      data = { deleted: true, eventId };
    }

    calendarLogger.success('Calendar event deleted successfully', { eventId });

    return {
      success: true,
      data: { eventId, deleted: true, ...data },
      meta: {
        eventId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error deleting calendar event', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// ============================================================================
// 🔄 BULK EVENT OPERATIONS
// ============================================================================

/**
 * 🔄 POST - Bulk create appointments
 * Creates multiple appointments at once
 * @param {Array} appointmentsData - Array of appointment data objects
 * @returns {Promise<Object>} API response with results
 */
export const bulkCreateAppointments = async (appointmentsData) => {
  try {
    calendarLogger.info('Bulk creating appointments', { count: appointmentsData.length });

    const promises = appointmentsData.map(appointmentData =>
      createAppointment(appointmentData),
    );

    const results = await Promise.allSettled(promises);

    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
    const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

    calendarLogger.success('Bulk appointment creation completed', {
      successful: successful.length,
      failed: failed.length,
    });

    return {
      success: true,
      data: {
        successful: successful.length,
        failed: failed.length,
        results,
      },
      meta: {
        totalRequested: appointmentsData.length,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error in bulk appointment creation', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🔄 DELETE - Bulk delete events
 * Deletes multiple calendar events at once
 * @param {Array} eventIds - Array of event IDs to delete
 * @returns {Promise<Object>} API response with results
 */
export const bulkDeleteEvents = async (eventIds) => {
  try {
    calendarLogger.info('Bulk deleting calendar events', { count: eventIds.length });

    const promises = eventIds.map(eventId =>
      deleteCalendarEvent(eventId),
    );

    const results = await Promise.allSettled(promises);

    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
    const failed = results.filter(result => result.status === 'rejected' || !result.value.success);

    calendarLogger.success('Bulk event deletion completed', {
      successful: successful.length,
      failed: failed.length,
    });

    return {
      success: true,
      data: {
        successful: successful.length,
        failed: failed.length,
        results,
      },
      meta: {
        totalRequested: eventIds.length,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error in bulk event deletion', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};
// ============================================================================
// 🎯 SINGLE SOURCE OF TRUTH - MASTER CALENDAR API
// ============================================================================
// This is the ONLY function that should be used to fetch calendar data.
// All other calendar fetch functions are deprecated to prevent conflicts.
// ============================================================================

/**
 * 🎯 MASTER CALENDAR API - Single Source of Truth
 * This is the ONLY function that fetches real GHL calendar data.
 * All other calendar functions should use this as their data source.
 *
 * @param {Object} _options - Configuration options (reserved for future use)
 * @returns {Promise<Object>} Standardized calendar response
 */
export const getMasterCalendarData = async (_options = {}) => {
  try {
    console.warn('🎯 [MASTER API] Fetching calendar data from single source...');

    const response = await fetch(
      'https://services.leadconnectorhq.com/calendars/?locationId=b7vHWUGVUNQGoIlAXabY',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const calendars = data?.calendars || [];

    console.warn('🎯 [MASTER API] Raw calendar data:', {
      totalCalendars: calendars.length,
      calendarIds: calendars.map(cal => cal.id),
      rawResponse: data,
    });

    // CRITICAL: Check for duplicates at source
    const calendarIds = calendars.map(cal => cal.id);
    const uniqueIds = [...new Set(calendarIds)];

    if (calendarIds.length !== uniqueIds.length) {
      console.error('🚨 [MASTER API] DUPLICATES IN API RESPONSE!', {
        total: calendarIds.length,
        unique: uniqueIds.length,
        duplicates: calendarIds.filter((id, index) => calendarIds.indexOf(id) !== index),
      });
    }

    // Deduplicate calendars if API returns duplicates
    const deduplicatedCalendars = calendars.reduce((acc, calendar) => {
      if (!acc.find(existing => existing.id === calendar.id)) {
        acc.push(calendar);
      } else {
        console.warn('🔧 [MASTER API] Removing duplicate calendar:', calendar.id);
      }
      return acc;
    }, []);

    console.warn('✅ [MASTER API] Clean calendar data ready:', {
      originalCount: calendars.length,
      cleanCount: deduplicatedCalendars.length,
      duplicatesRemoved: calendars.length - deduplicatedCalendars.length,
    });

    return {
      success: true,
      data: {
        calendars: deduplicatedCalendars,
        meta: {
          totalCalendars: deduplicatedCalendars.length,
          locationId: 'b7vHWUGVUNQGoIlAXabY',
          source: 'MASTER_API_SINGLE_SOURCE',
          fetchedAt: new Date().toISOString(),
          duplicatesRemoved: calendars.length - deduplicatedCalendars.length,
        },
      },
      error: null,
    };

  } catch (error) {
    console.error('❌ [MASTER API] Error fetching calendar data:', error);
    return {
      success: false,
      error: error.message,
      data: { calendars: [], meta: {} },
    };
  }
};

/**
 * 🎯 WRAPPER - Get GHL Calendar List (uses master API)
 * This maintains backward compatibility while using the single source
 */
export const getGhlCalendarList = async () => {
  console.warn('📞 [WRAPPER] getGhlCalendarList() -> calling MASTER API...');
  const result = await getMasterCalendarData();

  // Return in the format expected by existing code
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
};
const calendarApi = {
  fetchCalendarEvents,
  fetchCalendarAppointmentsWithDateHandling,
  fetchCalendarDetails,
  updateCalendarConfiguration,
  deleteCalendar,
  createCalendar,
  fetchAllCalendarsWithDetails,
  fetchAppointments,
  fetchAppointmentsByDateRange,
  fetchAppointmentsByUser,
  fetchAppointmentById,
  fetchAvailableTimeSlots,
  bookGhlAppointment,
  createRecurringAppointment,
  updateAppointment,
  completeAppointment,
  cancelAppointment,
  deleteAppointment,
  bulkUpdateAppointments,
  testCalendarApiConnection,
  testGHLConfig,
  getGhlCalendarList,
};

export default calendarApi;

// ============================================================================
// 📞 CONTACT APPOINTMENTS API
// ============================================================================

/**
 * 🎯 GET - Fetch appointments for a specific contact
 * Returns all appointments for a given contact ID
 * @param {string} contactId - The contact ID to fetch appointments for
 * @param {Object} filters - Additional filter parameters
 * @returns {Promise<Object>} API response with contact appointments
 */
export const getContactAppointments = async (contactId, filters = {}) => {
  try {
    calendarLogger.info('Fetching appointments for contact', { contactId, filters });

    // Build query parameters if needed
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/appointments${queryString}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-07-28',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const appointments = data.appointments || data || [];

    calendarLogger.success('Contact appointments fetched successfully', {
      contactId,
      count: appointments.length,
    });

    return {
      success: true,
      data: appointments,
      meta: {
        contactId,
        count: appointments.length,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching contact appointments', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 GET - Get specific appointment event details
 * Returns detailed information about a specific appointment event
 * @param {string} eventId - The event/appointment ID to fetch
 * @returns {Promise<Object>} API response with appointment event details
 */
export const getAppointmentEventDetails = async (eventId) => {
  try {
    calendarLogger.info('Fetching appointment event details', { eventId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events/appointments/${eventId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Appointment event details fetched successfully', {
      eventId,
      title: data.title,
      status: data.appointmentStatus,
    });

    return {
      success: true,
      data: data,
      meta: {
        eventId,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching appointment event details', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// ============================================================================
// 🔔 CALENDAR NOTIFICATIONS API
// ============================================================================

/**
 * 🎯 GET - Get calendar notification settings
 * Returns notification configuration for a specific calendar
 * @param {string} calendarId - The calendar ID to fetch notifications for
 * @returns {Promise<Object>} API response with notification settings
 */
export const getCalendarNotifications = async (calendarId) => {
  try {
    calendarLogger.info('Fetching calendar notifications', { calendarId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const notifications = data.notifications || data || [];

    calendarLogger.success('Calendar notifications fetched successfully', {
      calendarId,
      count: notifications.length,
    });

    return {
      success: true,
      data: notifications,
      meta: {
        calendarId,
        count: notifications.length,
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error fetching calendar notifications', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 PUT - Update calendar notification settings
 * Updates notification configuration for a specific calendar notification
 * @param {string} calendarId - The calendar ID
 * @param {string} notificationId - The notification ID to update
 * @param {Object} notificationData - The notification configuration data
 * @returns {Promise<Object>} API response with updated notification
 */
export const updateCalendarNotification = async (calendarId, notificationId, notificationData) => {
  try {
    calendarLogger.info('Updating calendar notification', { calendarId, notificationId, notificationData });

    // Default notification configuration based on your cURL example
    const defaultNotificationConfig = {
      receiverType: 'contact',
      additionalEmailIds: [],
      selectedUsers: [],
      channel: 'email',
      notificationType: 'booked',
      isActive: true,
      deleted: false,
      templateId: 'default',
      body: 'Appointment notification',
      subject: 'Appointment Notification',
      afterTime: [
        {
          timeOffset: 1,
          unit: 'hours',
        },
      ],
      beforeTime: [
        {
          timeOffset: 1,
          unit: 'hours',
        },
      ],
      fromAddress: 'noreply@yourdomain.com',
      fromName: 'Your Calendar System',
    };

    // Merge provided data with defaults
    const updateData = { ...defaultNotificationConfig, ...notificationData };

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications/${notificationId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    calendarLogger.success('Calendar notification updated successfully', {
      calendarId,
      notificationId,
      notificationType: data.notificationType,
    });

    return {
      success: true,
      data: data,
      meta: {
        calendarId,
        notificationId,
        updatedFields: Object.keys(notificationData),
        requestTimestamp: new Date().toISOString(),
      },
    };

  } catch (error) {
    calendarLogger.error('Error updating calendar notification', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// ============================================================================
// 🎯 SINGLE SOURCE OF TRUTH - API SUMMARY
// ============================================================================
//
// ✅ RECOMMENDED: getMasterCalendarData() - The ONLY source for calendar data
// ✅ COMPATIBLE: getGhlCalendarList() - Uses master API internally
// ⚠️  DEPRECATED: All other fetchCalendar*() functions show warnings
//
// This ensures NO conflicts and NO duplicates from multiple data sources.
// ============================================================================
