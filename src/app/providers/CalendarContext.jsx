import { createContext, useEffect, useState } from 'react';
import {
  fetchCalendarEvents,
  fetchAppointmentsByDateRange,
  bookGhlAppointment as apibookGhlAppointment,
  updateAppointment as apiUpdateAppointment,
  deleteAppointment as apiDeleteAppointment,
  createRecurringAppointment as apiCreateRecurringAppointment,
  completeAppointment as apiCompleteAppointment,
  cancelAppointment as apiCancelAppointment,
  fetchAvailableTimeSlots,
} from '@api/calendarApi';

export const CalendarContext = createContext();

// ---- Helpers ---------------------------------------------------------------

const emptyCategories = () => ({
  "Today's Appointments": { color: 'teal', items: [] },
  'Upcoming Appointments': { color: 'blue', items: [] },
  'Past Appointments': { color: 'gray', items: [] },
  'My Appointments': { color: 'purple', items: [] },
  'All Appointments': { color: 'indigo', items: [] },
  'Completed Appointments': { color: 'green', items: [] },
  'Cancelled Appointments': { color: 'red', items: [] },
});

const statusColor = (status) => {
  const map = {
    scheduled: '#4F46E5',   // Indigo
    confirmed: '#059669',   // Emerald
    completed: '#16A34A',   // Green
    cancelled: '#DC2626',   // Red
    pending: '#EA580C',     // Orange
    'no-show': '#6B7280',   // Gray
    rescheduled: '#7C3AED', // Violet
  };
  return map[status] || map.scheduled;
};

const toISODate = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);

const dedupeByKey = (items, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = keyFn(it);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
};

const normalizeAppointment = (appointment, currentUser = null) => {
  const when = appointment.startTime || appointment.start || appointment.date;
  const whenISO = toISODate(when);

  const id =
    appointment._id ||
    appointment.id ||
    `appointment-${when || Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const background = statusColor(appointment.status);

  return {
    id,
    title: appointment.title || appointment.subject || 'Untitled Appointment',
    date: whenISO,
    startTime: appointment.startTime || appointment.start || when,
    endTime: appointment.endTime || appointment.end || when,
    duration: appointment.duration || 30,
    status: appointment.status || 'scheduled',
    description: appointment.description || appointment.notes || '',
    location: appointment.location || appointment.meetingLocation || '',
    attendees: appointment.attendees || appointment.contacts || [],
    assignedTo: appointment.assignedTo || appointment.userId || null,
    contactId: appointment.contactId || appointment.contact?.id,
    contactName: appointment.contactName || appointment.contact?.name,
    contactEmail: appointment.contactEmail || appointment.contact?.email,
    contactPhone: appointment.contactPhone || appointment.contact?.phone,
    isRecurring: appointment.isRecurring || false,
    recurrencePattern: appointment.recurrencePattern || null,
    recurrenceEndDate: appointment.recurrenceEndDate || null,
    timezone: appointment.timezone || 'UTC',
    internalNotes: appointment.internalNotes || [],
    createdAt: appointment.createdAt || new Date().toISOString(),
    updatedAt: appointment.updatedAt || new Date().toISOString(),
    backgroundColor: background,
    borderColor: background,
    textColor: '#000000',
    extendedProps: {
      status: appointment.status || 'scheduled',
      isRecurring: appointment.isRecurring || false,
      contact: appointment.contact,
      assignee: appointment.assignee,
      isAppointment: true,
    },
  };
};

const categorizeAppointments = (appointments, currentUser = null) => {
  const buckets = emptyCategories();
  if (!Array.isArray(appointments)) return buckets;

  const now = new Date();
  const todayISO = toISODate(now);

  for (const appt of appointments) {
    if (!appt || typeof appt !== 'object') continue;

    const item = normalizeAppointment(appt, currentUser);
    const parsed = item.startTime ? new Date(item.startTime) : null;

    // All
    buckets['All Appointments'].items.push(item);

    // Date-based
    if (item.date) {
      if (item.date === todayISO) {
        buckets["Today's Appointments"].items.push(item);
      } else if (parsed && parsed > now) {
        buckets['Upcoming Appointments'].items.push(item);
      } else {
        buckets['Past Appointments'].items.push(item);
      }
    }

    // Status-based
    if (item.status === 'completed') {
      buckets['Completed Appointments'].items.push(item);
    } else if (item.status === 'cancelled') {
      buckets['Cancelled Appointments'].items.push(item);
    }

    // Assignment
    if (currentUser && item.assignedTo === currentUser.id) {
      buckets['My Appointments'].items.push(item);
    }
  }

  // De-duplicate within each category: same id + start
  const keyFn = (x) => `${x.id}::${x.startTime || ''}`;
  for (const k of Object.keys(buckets)) {
    buckets[k].items = dedupeByKey(buckets[k].items, keyFn);
  }

  return buckets;
};

const fetchAndTransformAppointments = async (currentUser = null, dateRange = null) => {
  try {
    let apiResponse;
    if (dateRange?.startDate && dateRange?.endDate) {
      apiResponse = await fetchAppointmentsByDateRange(dateRange.startDate, dateRange.endDate);
    } else {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      const end = new Date(now);
      end.setDate(now.getDate() + 30);

      apiResponse = await fetchCalendarEvents({
        locationId: 'b7vHWUGVUNQGoIlAXabY',
        calendarId: 'sV3BiXrjzbfo1tSUdyHO',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    }

    if (apiResponse?.success) {
      return categorizeAppointments(apiResponse.data || [], currentUser);
    }
  } catch (_) {
    // swallow and fallback
  }
  return emptyCategories();
};

// ---- Provider --------------------------------------------------------------

export const CalendarProvider = ({ children }) => {
  const [appointmentsByCategory, setAppointmentsByCategory] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load current user from localStorage (if present)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (_) {
        // ignore parse errors silently
      }
    }
  }, []);

  // Fetch appointments (initial + whenever filters change)
  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      const data = await fetchAndTransformAppointments(currentUser, dateRange);
      if (isActive) {
        setAppointmentsByCategory(data);
        setIsLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [currentUser, dateRange]);

  // Expose a single refresh to avoid duplication across actions
  const refreshAppointments = async () => {
    const data = await fetchAndTransformAppointments(currentUser, dateRange);
    setAppointmentsByCategory(data);
  };

  // ---- Actions (CRUD) ------------------------------------------------------

  const bookGhlAppointment = async (category, appointment) => {
    setIsLoading(true);
    try {
      const payload = {
        ...appointment,
        assignedTo: appointment.assignedTo || currentUser?.id || null,
        category: appointment.category || category,
        createdAt: appointment.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const apiResponse =
        appointment.isRecurring && appointment.recurrencePattern
          ? await apiCreateRecurringAppointment(payload, appointment.recurrencePattern)
          : await apibookGhlAppointment(payload);

      if (apiResponse?.success) {
        await refreshAppointments();
        setIsLoading(false);
        return { success: true, data: apiResponse.data };
      }
      throw new Error(apiResponse?.error || 'Failed to create appointment');
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  const updateAppointment = async (updatedAppointment) => {
    setIsLoading(true);
    try {
      const payload = { ...updatedAppointment, updatedAt: new Date().toISOString() };
      const apiResponse = await apiUpdateAppointment(updatedAppointment.id, payload);

      if (apiResponse?.success) {
        await refreshAppointments();
        setIsLoading(false);
        return { success: true, data: apiResponse.data };
      }
      throw new Error(apiResponse?.error || 'Failed to update appointment');
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  const deleteAppointment = async (appointmentId) => {
    setIsLoading(true);
    try {
      const apiResponse = await apiDeleteAppointment(appointmentId);
      if (apiResponse?.success) {
        await refreshAppointments();
        setIsLoading(false);
        return { success: true, data: { appointmentId } };
      }
      throw new Error(apiResponse?.error || 'Failed to delete appointment');
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  const completeAppointment = async (appointmentId) => {
    setIsLoading(true);
    try {
      const apiResponse = await apiCompleteAppointment(appointmentId);
      if (apiResponse?.success) {
        await refreshAppointments();
        setIsLoading(false);
        return { success: true, data: apiResponse.data };
      }
      throw new Error(apiResponse?.error || 'Failed to complete appointment');
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  const cancelAppointment = async (appointmentId, reason = '') => {
    setIsLoading(true);
    try {
      const apiResponse = await apiCancelAppointment(appointmentId, reason);
      if (apiResponse?.success) {
        await refreshAppointments();
        setIsLoading(false);
        return { success: true, data: apiResponse.data };
      }
      throw new Error(apiResponse?.error || 'Failed to cancel appointment');
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  // ---- Time slots ----------------------------------------------------------

  const fetchTimeSlots = async (date, duration = 30, userId = null) => {
    try {
      const response = await fetchAvailableTimeSlots(date, duration, userId);
      if (response?.success) {
        setAvailableTimeSlots(response.data || []);
        return response.data || [];
      }
      return [];
    } catch (_) {
      return [];
    }
  };

  // ---- Filters & Views -----------------------------------------------------

  const setDateRangeFilter = (startDate, endDate) => setDateRange({ startDate, endDate });
  const clearDateRangeFilter = () => setDateRange(null);

  const getUserSpecificAppointments = () => {
    if (!appointmentsByCategory || !currentUser) return null;

    const userAppointments = {
      "My Today's Appointments": { color: 'teal', items: [] },
      'My Upcoming Appointments': { color: 'blue', items: [] },
      'My Past Appointments': { color: 'gray', items: [] },
      'My Completed Appointments': { color: 'green', items: [] },
    };

    for (const category in appointmentsByCategory) {
      const mine = (appointmentsByCategory[category]?.items || []).filter(
        (a) => a.assignedTo === currentUser.id,
      );
      if (category === "Today's Appointments" && mine.length) {
        userAppointments["My Today's Appointments"].items = mine;
      } else if (category === 'Upcoming Appointments' && mine.length) {
        userAppointments['My Upcoming Appointments'].items = mine;
      } else if (category === 'Past Appointments' && mine.length) {
        userAppointments['My Past Appointments'].items = mine;
      } else if (category === 'Completed Appointments' && mine.length) {
        userAppointments['My Completed Appointments'].items = mine;
      }
    }

    // De-dupe in case items span multiple buckets
    const keyFn = (x) => `${x.id}::${x.startTime || ''}`;
    for (const k of Object.keys(userAppointments)) {
      userAppointments[k].items = dedupeByKey(userAppointments[k].items, keyFn);
    }

    return userAppointments;
  };

  return (
    <CalendarContext.Provider
      value={{
        appointmentsByCategory,
        setAppointmentsByCategory,
        currentUser,
        dateRange,
        availableTimeSlots,
        isLoading,
        bookGhlAppointment,
        updateAppointment,
        deleteAppointment,
        completeAppointment,
        cancelAppointment,
        fetchTimeSlots,
        setDateRangeFilter,
        clearDateRangeFilter,
        getUserSpecificAppointments,
        refreshAppointments,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarContext;
