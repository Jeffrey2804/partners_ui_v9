// ========================================
// 🎯 GHL CALENDAR INTEGRATION HOOK
// ========================================
// Custom hook for fetching and managing GHL calendars and events

import { useState, useEffect, useCallback } from 'react';
import { getCalendarsList, fetchGHLCalendarEvents } from '@shared/services/api/ghlCalendarService';
import { GHL_CONFIG } from '@config/ghlConfig';

export const useGHLCalendar = () => {
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState(new Set());
  const [ghlEvents, setGhlEvents] = useState({});
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available calendars from GHL
  const fetchAvailableCalendars = useCallback(async () => {
    setIsLoadingCalendars(true);
    setError(null);

    try {
      const response = await getCalendarsList(GHL_CONFIG.locationId);
      const calendars = response?.calendars || [];

      if (!calendars.length) {
        throw new Error('No calendars found in GHL');
      }

      // Transform calendars to include additional metadata
      const transformedCalendars = calendars.map(calendar => ({
        id: calendar.id,
        name: calendar.name || calendar.calendarName || 'Untitled Calendar',
        description: calendar.description || '',
        timezone: calendar.timezone || calendar.timeZone || 'America/Los_Angeles',
        isActive: calendar.isActive !== false, // Default to true if not specified
        color: getCalendarColor(calendar.name), // Assign color based on name
        icon: getCalendarIcon(calendar.name), // Assign icon based on name
        checked: false, // Initially unchecked
      }));

      setAvailableCalendars(transformedCalendars);
    } catch (err) {
      console.error('Failed to fetch GHL calendars:', err);
      setError(err.message);
      setAvailableCalendars([]);
    } finally {
      setIsLoadingCalendars(false);
    }
  }, []);

  // Fetch events for a specific calendar
  const fetchEventsForCalendar = useCallback(async (calendarId, calendarName) => {
    setIsLoadingEvents(true);

    try {
      // Fetch events for August 2023 to match the calendar widget
      const startDate = new Date(2023, 7, 1); // August 1, 2023
      const endDate = new Date(2023, 7, 31, 23, 59, 59); // August 31, 2023

      const response = await fetchGHLCalendarEvents(
        GHL_CONFIG.locationId,
        calendarId,
        startDate.getTime(),
        endDate.getTime(),
      );

      const events = response?.events || [];

      // Transform events to match calendar widget format
      const transformedEvents = events.map((event, index) => {
        const eventStartTime = typeof event.startTime === 'number'
          ? event.startTime
          : new Date(event.startTime).getTime();

        return {
          id: event.id || `${calendarId}-${index}`,
          title: event.title || event.appointmentTitle || 'GHL Event',
          time: formatEventTime(eventStartTime),
          type: determineEventType(event),
          color: getEventColor(event),
          calendarId,
          calendarName,
          startTime: eventStartTime,
          endTime: event.endTime,
          status: event.status || event.appointmentStatus || 'scheduled',
          contactId: event.contactId,
          assignedUserId: event.assignedUserId,
          originalEvent: event, // Keep original for reference
        };
      });

      setGhlEvents(prev => ({
        ...prev,
        [calendarId]: transformedEvents,
      }));
    } catch (err) {
      console.error(`Failed to fetch events for calendar ${calendarName}:`, err);
      setGhlEvents(prev => ({
        ...prev,
        [calendarId]: [],
      }));
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Toggle calendar selection
  const toggleCalendar = useCallback((calendarId) => {
    const calendar = availableCalendars.find(cal => cal.id === calendarId);
    if (!calendar) return;

    const newSelectedCalendars = new Set(selectedCalendars);
    const isSelected = newSelectedCalendars.has(calendarId);

    if (isSelected) {
      // Unselect calendar - remove from selection and clear events
      newSelectedCalendars.delete(calendarId);
      setGhlEvents(prev => {
        const updated = { ...prev };
        delete updated[calendarId];
        return updated;
      });
    } else {
      // Select calendar - add to selection and fetch events
      newSelectedCalendars.add(calendarId);
      fetchEventsForCalendar(calendarId, calendar.name);
    }

    setSelectedCalendars(newSelectedCalendars);

    // Update calendar checked status
    setAvailableCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId
          ? { ...cal, checked: !isSelected }
          : cal,
      ),
    );
  }, [availableCalendars, selectedCalendars, fetchEventsForCalendar]);

  // Get all events from selected calendars grouped by date
  const getEventsByDate = useCallback((date) => {
    const dayEvents = [];

    Object.entries(ghlEvents).forEach(([calendarId, events]) => {
      if (selectedCalendars.has(calendarId)) {
        const targetDay = typeof date === 'number' ? date : date.getDate();

        events.forEach(event => {
          const eventDate = new Date(event.startTime);
          const eventDay = eventDate.getDate();
          const eventMonth = eventDate.getMonth();
          const eventYear = eventDate.getFullYear();

          // Match events for August 2023 (month 7, year 2023)
          if (eventDay === targetDay && eventMonth === 7 && eventYear === 2023) {
            dayEvents.push(event);
          }
        });
      }
    });

    return dayEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [ghlEvents, selectedCalendars]);

  // Initialize calendars on mount
  useEffect(() => {
    fetchAvailableCalendars();
  }, [fetchAvailableCalendars]);

  return {
    // Calendar data
    availableCalendars,
    selectedCalendars,
    ghlEvents,

    // Loading states
    isLoadingCalendars,
    isLoadingEvents,

    // Error state
    error,

    // Actions
    fetchAvailableCalendars,
    fetchEventsForCalendar,
    toggleCalendar,
    getEventsByDate,
  };
};

// Helper functions
const getCalendarColor = (name) => {
  const colors = ['#01818E', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#1f2937'];
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

const getCalendarIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('meeting') || lowerName.includes('conference')) return '🔗';
  if (lowerName.includes('task') || lowerName.includes('todo')) return '🎯';
  if (lowerName.includes('birthday') || lowerName.includes('personal')) return '🎂';
  if (lowerName.includes('reminder') || lowerName.includes('alert')) return '⏰';
  if (lowerName.includes('work') || lowerName.includes('business')) return '💼';
  if (lowerName.includes('education') || lowerName.includes('training')) return '🎓';
  return '📅'; // Default calendar icon
};

const formatEventTime = (timestamp) => {
  if (!timestamp) return '12:00pm';

  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
};

const determineEventType = (event) => {
  const title = (event.title || '').toLowerCase();
  if (title.includes('meeting') || title.includes('call')) return 'meeting';
  if (title.includes('task') || title.includes('todo')) return 'task';
  if (title.includes('lunch') || title.includes('breakfast') || title.includes('dinner')) return 'meal';
  if (title.includes('design')) return 'design';
  return 'meeting'; // Default type
};

const getEventColor = (event) => {
  const status = event.status || event.appointmentStatus || '';
  const type = determineEventType(event);

  // Color based on status first
  if (status === 'confirmed') return 'blue';
  if (status === 'cancelled') return 'orange';
  if (status === 'no-show') return 'orange';

  // Color based on type
  if (type === 'meeting') return 'blue';
  if (type === 'task') return 'yellow';
  if (type === 'meal') return 'orange';
  if (type === 'design') return 'yellow';

  return 'blue'; // Default color
};

export default useGHLCalendar;
