import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiX,
  FiPlus,
  FiSearch,
  FiCheck,
  FiChevronDown,
  FiAlertTriangle,
} from 'react-icons/fi';

import ContactDropdown from './ContactDropdown';
import { fetchUsers } from '@api/userApi';
import { useGHLIntegration } from '@shared/hooks';
import { createBlockSlot } from '@shared/services/api/ghlCalendarService';
import { fetchFreeSlotsForDate } from '@shared/services/api/freeSlotsApi';
import {
  getCalendarTimezone,
  updateCalendarTimezoneCache,
  clearCalendarTimezoneCache,
} from '@shared/services/calendarTimezoneService';
import EnhancedTimezoneDropdown from './EnhancedTimezoneDropdown';
import {
  convertSlotsToTimeSlots,
  validateCalendarId,
  createFreeSlotsErrorMessage,
  shouldRefreshSlots,
} from '@shared/utils/freeSlotsUtils';
import { getGhlCalendarList } from '@api/calendarApi';

const AppointmentModal = ({ isOpen, onClose, selectedDate = null, mode = 'create' }) => {
  const { appointments } = useGHLIntegration();

  // Calendars / Timezones
  const [calendarOptions, setCalendarOptions] = useState([]);
  const [rawCalendarData, setRawCalendarData] = useState([]);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);

  // Tabs & Form
  const [activeTab, setActiveTab] = useState('appointment');
  const [form, setForm] = useState({
    calendar: '',
    title: '',
    description: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    timeSlot: '8:00 am - 8:30 am',
    timezone: 'America/Los_Angeles',
    slotType: 'default',
    meetingLocation: 'calendar-default',
    status: 'confirmed',
    contactId: '',
    internalNotes: [],
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    customDuration: 30,
    userCalendar: 'Joel Morgan',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
    locationType: 'custom',
    location: '',
  });

  const [showDescription, setShowDescription] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Slots state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [slotsVersion, setSlotsVersion] = useState(0);
  const [lastFetchParams, setLastFetchParams] = useState({
    calendarId: null,
    date: null,
    userId: null,
    timezone: null,
  });

  // Timezone state
  const [ghlTimezone, setGhlTimezone] = useState(null);
  const [isLoadingTimezone, setIsLoadingTimezone] = useState(false);
  const [timezoneCache, setTimezoneCache] = useState(new Map());

  // Users state
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Refs
  const titleInputRef = useRef(null);
  const dateInputRef = useRef(null);

  // Static slot presets (wrapped in useMemo for dependency optimization)
  const timeSlots = useMemo(() => ({
    '15min': [
      '8:00 am - 8:15 am',
      '8:15 am - 8:30 am',
      '8:30 am - 8:45 am',
      '8:45 am - 9:00 am',
      '9:00 am - 9:15 am',
      '9:15 am - 9:30 am',
      '9:30 am - 9:45 am',
      '9:45 am - 10:00 am',
      '10:00 am - 10:15 am',
      '10:15 am - 10:30 am',
      '10:30 am - 10:45 am',
      '10:45 am - 11:00 am',
      '11:00 am - 11:15 am',
      '11:15 am - 11:30 am',
      '11:30 am - 11:45 am',
      '11:45 am - 12:00 pm',
      '1:00 pm - 1:15 pm',
      '1:15 pm - 1:30 pm',
      '1:30 pm - 1:45 pm',
      '1:45 pm - 2:00 pm',
      '2:00 pm - 2:15 pm',
      '2:15 pm - 2:30 pm',
      '2:30 pm - 2:45 pm',
      '2:45 pm - 3:00 pm',
      '3:00 pm - 3:15 pm',
      '3:15 pm - 3:30 pm',
      '3:30 pm - 3:45 pm',
      '3:45 pm - 4:00 pm',
      '4:00 pm - 4:15 pm',
      '4:15 pm - 4:30 pm',
      '4:30 pm - 4:45 pm',
      '4:45 pm - 5:00 pm',
    ],
    '30min': [
      '8:00 am - 8:30 am',
      '8:30 am - 9:00 am',
      '9:00 am - 9:30 am',
      '9:30 am - 10:00 am',
      '10:00 am - 10:30 am',
      '10:30 am - 11:00 am',
      '11:00 am - 11:30 am',
      '11:30 am - 12:00 pm',
      '1:00 pm - 1:30 pm',
      '1:30 pm - 2:00 pm',
      '2:00 pm - 2:30 pm',
      '2:30 pm - 3:00 pm',
      '3:00 pm - 3:30 pm',
      '3:30 pm - 4:00 pm',
      '4:00 pm - 4:30 pm',
      '4:30 pm - 5:00 pm',
    ],
    '60min': [
      '8:00 am - 9:00 am',
      '9:00 am - 10:00 am',
      '10:00 am - 11:00 am',
      '11:00 am - 12:00 pm',
      '1:00 pm - 2:00 pm',
      '2:00 pm - 3:00 pm',
      '3:00 pm - 4:00 pm',
      '4:00 pm - 5:00 pm',
    ],
    '90min': [
      '8:00 am - 9:30 am',
      '9:30 am - 11:00 am',
      '11:00 am - 12:30 pm',
      '1:00 pm - 2:30 pm',
      '2:30 pm - 4:00 pm',
      '4:00 pm - 5:30 pm',
    ],
    '120min': ['8:00 am - 10:00 am', '10:00 am - 12:00 pm', '1:00 pm - 3:00 pm', '3:00 pm - 5:00 pm'],
  }), []);

  // Utilities
  const convertToISOString = (date, time) => {
    if (!date || !time) return new Date().toISOString();
    const [timePart, period] = time.toLowerCase().split(' ');
    const [hours, minutes] = timePart.split(':');
    let hour24 = parseInt(hours, 10);
    if (period === 'pm' && hour24 !== 12) hour24 += 12;
    if (period === 'am' && hour24 === 12) hour24 = 0;
    const dateTime = new Date(date);
    dateTime.setHours(hour24, parseInt(minutes || 0, 10), 0, 0);
    return dateTime.toISOString();
  };

  // >>> Recurrence helpers (no useMemo)
  const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const ordinal = (n) => {
    const s = ['th','st','nd','rd'], v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  };

  const nthOfMonth = (dateObj) => {
    const d = new Date(dateObj);
    const day = d.getDate();
    return Math.ceil(day / 7);
  };

  // Compute recurrence options each render (cheap)
  const baseForRecurrence =
    form.slotType === 'custom'
      ? (form.startTime ? new Date(form.startTime) : new Date())
      : (form.date ? new Date(`${form.date}T00:00:00`) : new Date());
  const wd = weekdayNames[baseForRecurrence.getDay()];
  const nth = ordinal(nthOfMonth(baseForRecurrence));
  const mon = monthNames[baseForRecurrence.getMonth()];
  const mday = ordinal(baseForRecurrence.getDate());
  const recurrenceOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly_on_weekday', label: `Weekly on ${wd}` },
    { value: 'monthly_on_nth_weekday', label: `Monthly on ${nth} ${wd}` },
    { value: 'annually_on_date', label: `Annually on ${mon} ${mday}` },
    { value: 'every_weekday_mon_fri', label: 'Every Weekday (Mon to Fri)' },
    { value: 'custom', label: 'Custom' },
  ];

  const resetForm = () => {
    const defaultCalendar = calendarOptions.find((c) => c.isActive)?.value || '';
    setForm({
      calendar: defaultCalendar,
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '8:00 am - 8:30 am',
      timezone: 'America/Los_Angeles',
      slotType: 'default',
      meetingLocation: 'calendar-default',
      status: 'confirmed',
      contactId: '',
      internalNotes: [],
      isRecurring: false,
      recurrencePattern: 'weekly',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
      customDuration: 30,
      userCalendar: 'Joel Morgan',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),

      // NEW — needed for the Custom location UI
      locationType: 'custom',
      location: '',
    });
    setShowDescription(false);
    setNewNote('');

    // Clear slots cache when form is reset
    setAvailableSlots([]);
    setSlotsError(null);
    setLastFetchParams({
      calendarId: null,
      date: null,
      userId: null,
      timezone: null,
    });
  };

  const getFilteredCalendarOptions = useCallback(() => {
    if (!calendarSearch.trim()) return calendarOptions;
    const q = calendarSearch.toLowerCase();
    return calendarOptions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q),
    );
  }, [calendarOptions, calendarSearch]);

  const fetchTimezoneForCalendar = useCallback(
    async (calendarId, userId = null) => {
      if (!calendarId) return null;
      const cacheKey = `${calendarId}_${userId || 'default'}`;
      if (timezoneCache.has(cacheKey)) return timezoneCache.get(cacheKey);

      setIsLoadingTimezone(true);
      try {
        const calendarTimezoneInfo = await getCalendarTimezone(calendarId);
        const timezone = calendarTimezoneInfo.timezone;

        // Update cache
        setTimezoneCache((prev) => new Map(prev).set(cacheKey, timezone));

        // Update the calendar timezone cache as well
        updateCalendarTimezoneCache(calendarId, timezone);

        return timezone;
      } catch (_error) {
        // Error handling will be managed by global notification system
        const fallback = 'America/Los_Angeles';
        setTimezoneCache((prev) => new Map(prev).set(cacheKey, fallback));
        return fallback;
      } finally {
        setIsLoadingTimezone(false);
      }
    },
    [timezoneCache],
  );

  const fetchEnhancedCalendarList = useCallback(async () => {
    try {
      clearCalendarTimezoneCache();
      setTimezoneCache(new Map());

      const response = await getGhlCalendarList();
      if (!response?.success || !response?.data) throw new Error('Failed to fetch calendars');
      const calendarsRaw = response.data.calendars || response.data || [];
      const processed = calendarsRaw.map((cal) => {
        const id = cal.id || cal.calendarId;
        const name = cal.name || cal.title || (id ? `Calendar ${String(id).slice(-8)}` : 'Unnamed Calendar');
        const statusStr =
          cal.isActive === true || (cal.status && String(cal.status).toLowerCase() === 'active') || cal.enabled === true
            ? 'Active'
            : 'Inactive';
        const isActive = statusStr === 'Active';
        const isValidId = id && /^[a-zA-Z0-9]+$/.test(id) && !String(id).includes(' ') && String(id).length >= 10;
        return {
          id,
          value: id,
          name,
          status: statusStr,
          isActive,
          isValidId,
          description: cal.description || '',
          teamMembers: cal.teamMembers || [],
          rawData: cal,
        };
      });

      // De-dupe by id
      const dedup = [];
      const seen = new Set();
      for (const c of processed) {
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id);
          dedup.push(c);
        }
      }

      setRawCalendarData(dedup);
      setCalendarOptions(dedup.filter((c) => c.isActive && c.isValidId));
      return { success: true };
    } catch (_e) {
      setCalendarOptions([]);
      setRawCalendarData([]);
      // Error handling will be managed by global notification system
      return { success: false };
    }
  }, []);

  const fetchGHLUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const result = await fetchUsers();
      if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
        setUsers(result.data);
        if (!form.userCalendar) {
          const first = result.data[0];
          const nm = first.name || `${first.firstName || ''} ${first.lastName || ''}`.trim();
          setForm((p) => ({ ...p, userCalendar: nm }));
        }
      } else {
        const fallback = [
          { id: 'joel-morgan', name: 'Joel Morgan' },
          { id: 'sarah-wilson', name: 'Sarah Wilson' },
          { id: 'mike-johnson', name: 'Mike Johnson' },
          { id: 'general', name: 'General Calendar' },
        ];
        setUsers(fallback);
        if (!form.userCalendar) setForm((p) => ({ ...p, userCalendar: fallback[0].name }));
      }
    } catch (_e) {
      const fallback = [
        { id: 'joel-morgan', name: 'Joel Morgan' },
        { id: 'sarah-wilson', name: 'Sarah Wilson' },
        { id: 'mike-johnson', name: 'Mike Johnson' },
        { id: 'general', name: 'General Calendar' },
      ];
      setUsers(fallback);
      if (!form.userCalendar) setForm((p) => ({ ...p, userCalendar: fallback[0].name }));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [form.userCalendar]);

  const fetchAvailableSlots = useCallback(
    async (calendarId, date, userId = null) => {
      if (
        !shouldRefreshSlots({
          calendarId,
          date,
          userId,
          timezone: ghlTimezone,
          lastCalendarId: lastFetchParams.calendarId,
          lastDate: lastFetchParams.date,
          lastUserId: lastFetchParams.userId,
          lastTimezone: lastFetchParams.timezone,
        })
      ) {
        return;
      }

      if (!calendarId || !date) {
        const errorMsg = 'Calendar and date are required to fetch available slots';
        // Error handling will be managed by global notification system
        setSlotsError(errorMsg);
        setAvailableSlots([]);
        return;
      }

      const validation = validateCalendarId(calendarId);
      if (!validation.isValid) {
        const errorMsg = `Invalid calendar: ${validation.message}`;
        // Error handling will be managed by global notification system
        setSlotsError(errorMsg);
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setSlotsError(null);

      // Clear existing slots before fetching new ones
      setAvailableSlots([]);

      try {
        const response = await fetchFreeSlotsForDate(calendarId, date, ghlTimezone, userId);

        if (response?.success && Array.isArray(response.slots)) {
          if (response.slots.length > 0) {
            setAvailableSlots(response.slots);
            setSlotsVersion(v => v + 1); // Force re-render
            setSlotsError(null);

            // Reset timeSlot selection when new slots are loaded
            setForm((p) => ({ ...p, timeSlot: '' }));
          } else {
            setAvailableSlots([]);
            setSlotsVersion(v => v + 1); // Force re-render
            setSlotsError('Calendar has no availability configured.');
          }
        } else {
          const errMsg = createFreeSlotsErrorMessage(
            new Error(response?.error || 'Unknown error'),
            calendarId,
          );
          setAvailableSlots([]);
          setSlotsVersion(v => v + 1); // Force re-render
          setSlotsError(errMsg);
        }
        setLastFetchParams({ calendarId, date, userId, timezone: ghlTimezone });
      } catch (e) {
        const errorMsg = createFreeSlotsErrorMessage(e, calendarId);
        setSlotsError(errorMsg);
        setAvailableSlots([]);
        setSlotsVersion(v => v + 1); // Force re-render
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [ghlTimezone, lastFetchParams],
  );

  const getAvailableTimeSlots = useCallback(() => {
    if (availableSlots.length > 0) return convertSlotsToTimeSlots(availableSlots, ghlTimezone);
    return timeSlots[`${form.customDuration}min`] || timeSlots['30min'];
  }, [availableSlots, ghlTimezone, form.customDuration, timeSlots]);

  // Effects
  useEffect(() => {
    if (isOpen && titleInputRef.current) titleInputRef.current.focus();

    // Clear slots cache when modal opens to ensure fresh fetches
    if (isOpen) {
      setLastFetchParams({
        calendarId: null,
        date: null,
        userId: null,
        timezone: null,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) setForm((p) => ({ ...p, date: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    const load = async () => {
      await fetchEnhancedCalendarList();
    };
    if (isOpen) load();
  }, [isOpen, fetchEnhancedCalendarList, form.timezone]);

  useEffect(() => {
    if (calendarOptions.length > 0) {
      if (!form.calendar) {
        const first = calendarOptions.find((c) => c.isActive) || calendarOptions[0];
        if (first) setForm((p) => ({ ...p, calendar: first.value }));
      } else if (!calendarOptions.some((c) => c.value === form.calendar)) {
        const first = calendarOptions.find((c) => c.isActive) || calendarOptions[0];
        if (first) setForm((p) => ({ ...p, calendar: first.value }));
      }
    }
  }, [calendarOptions, form.calendar]);

  useEffect(() => {
    if (isOpen) fetchGHLUsers();
  }, [isOpen, fetchGHLUsers]);

  useEffect(() => {
    if (availableSlots.length > 0 && !form.timeSlot && !isLoadingSlots) {
      const slots = getAvailableTimeSlots();
      if (slots.length > 0) setForm((p) => ({ ...p, timeSlot: slots[0] }));
    }
  }, [availableSlots.length, form.timeSlot, isLoadingSlots, getAvailableTimeSlots]);

  // Handle timezone changes - refresh slots when timezone changes
  useEffect(() => {
    const handleTimezoneChange = async () => {
      if (form.calendar && form.date && form.timezone && isOpen) {
        setGhlTimezone(form.timezone);

        // Refresh available slots with new timezone
        if (!isLoadingSlots) {
          setAvailableSlots([]);
          setSlotsVersion(v => v + 1); // Force re-render
          setSlotsError(null);

          const selectedUser = users.find((u) => {
            const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
            return nm === form.userCalendar;
          });

          await fetchAvailableSlots(form.calendar, form.date, selectedUser?.id || null);
        }
      }
    };

    if (isOpen && form.timezone) {
      handleTimezoneChange();
    }
  }, [form.timezone, isOpen, fetchAvailableSlots, form.calendar, form.date, form.userCalendar, users, isLoadingSlots]);

  // Single effect to handle calendar, date, and user changes
  useEffect(() => {
    const initialize = async () => {
      if (
        isOpen &&
        form.calendar &&
        form.date &&
        users.length >= 0 &&
        !isLoadingSlots &&
        ghlTimezone
      ) {
        const selectedUser = users.find((u) => {
          const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return nm === form.userCalendar;
        });
        const userId = selectedUser?.id || null;

        // Clear previous slots before fetching new ones
        setAvailableSlots([]);
        setSlotsVersion(v => v + 1); // Force re-render
        setSlotsError(null);

        await fetchAvailableSlots(form.calendar, form.date, userId);
      }
    };
    initialize();
  }, [isOpen, form.calendar, form.date, form.userCalendar, users, ghlTimezone, isLoadingSlots, fetchAvailableSlots]);

  // Handlers
  const validateForm = () => {
    const next = {};

    if (!form.title.trim()) {
      next.title = activeTab === 'appointment' ? 'Appointment title is required' : 'Title is required';
    }

    if (activeTab === 'appointment') {
      if (!form.contactId) next.contact = 'Please select a contact';

      if (form.slotType === 'custom') {
        if (!form.startTime) next.startTime = 'Start time is required';
        if (!form.endTime) next.endTime = 'End time is required';
        if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
          next.endTime = 'End time must be after start time';
        }
      } else {
        if (!form.date) next.date = 'Date is required';
        if (!form.timeSlot) next.timeSlot = 'Please select a slot';
      }
    } else if (activeTab === 'blocked') {
      if (!form.startTime) next.startTime = 'Start time is required';
      if (!form.endTime) next.endTime = 'End time is required';
      if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
        next.endTime = 'End time must be after start time';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCalendarChange = useCallback(
    async (newCalendarId) => {
      setForm((p) => ({ ...p, calendar: newCalendarId, timeSlot: '' }));

      // Clear previous slots immediately
      setAvailableSlots([]);
      setSlotsVersion(v => v + 1); // Force re-render
      setSlotsError(null);

      if (!newCalendarId || !form.date) return;

      setIsLoadingSlots(true);

      const selectedUser = users.find((u) => {
        const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
        return nm === form.userCalendar;
      });

      try {
        await fetchAvailableSlots(newCalendarId, form.date, selectedUser?.id || null);
      } catch (_error) {
        // Error handling will be managed by global notification system
      }
    },
    [form.date, form.userCalendar, users, fetchAvailableSlots],
  );

  const handleUserChange = useCallback(
    async (newUserName) => {
      setForm((p) => ({ ...p, userCalendar: newUserName }));
      if (!form.calendar) return;
      setAvailableSlots([]);
      setSlotsError(null);
      const user = users.find((u) => {
        const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
        return nm === newUserName;
      });
      const userId = user?.id || null;
      const tz = await fetchTimezoneForCalendar(form.calendar, userId);
      if (tz) setGhlTimezone(tz);
      if (form.date) await fetchAvailableSlots(form.calendar, form.date, userId);
    },
    [form.calendar, form.date, users, fetchTimezoneForCalendar, fetchAvailableSlots],
  );

  const handleDateChange = useCallback(
    async (newDate) => {
      setForm((p) => ({ ...p, date: newDate, timeSlot: '' }));

      if (form.calendar && newDate) {
        // Clear previous slots immediately
        setAvailableSlots([]);
        setSlotsVersion(v => v + 1); // Force re-render
        setSlotsError(null);
        setIsLoadingSlots(true);

        const user = users.find((u) => {
          const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return nm === form.userCalendar;
        });

        try {
          await fetchAvailableSlots(form.calendar, newDate, user?.id || null);
        } catch (_error) {
          // Error handling will be managed by global notification system
        }
      }
    },
    [form.calendar, form.userCalendar, users, fetchAvailableSlots],
  );

  const addInternalNote = () => {
    if (!newNote.trim()) return;
    setForm((p) => ({
      ...p,
      internalNotes: [...p.internalNotes, { id: Date.now(), text: newNote.trim(), createdAt: new Date().toISOString() }],
    }));
    setNewNote('');
  };

  const removeInternalNote = (noteId) => {
    setForm((p) => ({ ...p, internalNotes: p.internalNotes.filter((n) => n.id !== noteId) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      // Error handling will be managed by global notification system
      return;
    }
    setIsSubmitting(true);
    try {
      if (activeTab === 'appointment') {
        const selectedUser = users.find((u) => {
          const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return nm === form.userCalendar;
        });

        // Use Start/End for custom, Date+Slot for default
        const startISO =
          form.slotType === 'custom'
            ? new Date(form.startTime).toISOString()
            : convertToISOString(form.date, form.timeSlot.split(' - ')[0]);

        const endISO =
          form.slotType === 'custom'
            ? new Date(form.endTime).toISOString()
            : convertToISOString(form.date, form.timeSlot.split(' - ')[1]);

        const appointmentData = {
          title: form.title,
          contactId: form.contactId,
          calendarId: form.calendar || undefined,
          assignedUserId: selectedUser?.id || undefined,
          startTime: startISO,
          endTime: endISO,
          address: form.meetingLocation === 'custom' ? form.location || 'Custom Location' : 'Calendar Default',
          notes: form.description,
          locationId: 'b7vHWUGVUNQGoIlAXabY',
          appointmentStatus: form.status === 'confirmed' ? 'confirmed' : 'new',
          meetingLocationType: 'custom',
          meetingLocationId: 'default',
          overrideLocationConfig: true,
          ignoreDateRange: false,
          toNotify: false,
          ignoreFreeSlotValidation: true,
        };

        const result = await appointments.create(appointmentData);
        if (!result) throw new Error('Failed to create appointment');
        onClose();
        resetForm();
      } else {
        // BLOCKED TIME should always use Start/End timestamps
        const selectedUser = users.find((u) => {
          const nm = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return nm === form.userCalendar;
        });
        if (!selectedUser) throw new Error(`Selected user "${form.userCalendar}" not found`);
        if (!form.calendar) throw new Error('Please select a calendar for the blocked time');

        const validCalendar = calendarOptions.find((c) => c.value === form.calendar);
        if (!validCalendar) throw new Error(`Selected calendar "${form.calendar}" not found`);

        const { GHL_CONFIG } = await import('../../../config/ghlConfig.js');
        const blockData = {
          title: form.title,
          calendarId: form.calendar,
          assignedUserId: selectedUser.id,
          locationId: GHL_CONFIG.locationId,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
        };

        const result = await createBlockSlot(blockData);
        if (!result) throw new Error('Failed to create block slot');
        onClose();
        resetForm();
      }
    } catch (_err) {
      // Error handling will be managed by global notification system
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const availableTeamMembers = Array.isArray(users)
    ? users.filter((u) => {
        const n = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
        return n && n.length > 0;
      })
    : [];

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmed', icon: <FiCheck className="w-4 h-4" /> },
    { value: 'pending', label: 'Pending', icon: <FiClock className="w-4 h-4" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <FiX className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <Motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <FiCalendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {activeTab === 'appointment'
                      ? mode === 'edit'
                        ? 'Edit Appointment'
                        : 'Book Appointment'
                      : mode === 'edit'
                      ? 'Edit Blocked Time'
                      : 'Add Blocked Off Time'}
                  </h2>
                  <p className="mt-1 text-sm text-blue-100">
                    {activeTab === 'appointment'
                      ? mode === 'edit'
                        ? 'Update your appointment details'
                        : 'Schedule a new appointment'
                      : mode === 'edit'
                      ? 'Update your blocked time'
                      : 'Block off time to prevent bookings'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20 backdrop-blur-sm"
                aria-label="Close"
              >
                <FiX className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('appointment')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'appointment' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Appointment
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'blocked' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Blocked off time
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex h-[600px]">
              {/* Left */}
              <div className="max-h-[calc(90vh-200px)] flex-1 overflow-y-auto px-8 py-8">
                {activeTab === 'appointment' ? (
                  <div className="space-y-8">
                    {/* Calendar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">Calendar</label>
                      </div>

                      {/* Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCalendarDropdownOpen((s) => !s)}
                          className="w-full cursor-pointer rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 text-left"
                        >
                          <div className="flex items-center justify-between">
                            {form.calendar && calendarOptions.find((o) => o.value === form.calendar) ? (
                              <div className="flex min-w-0 flex-1 items-center gap-3 pointer-events-none">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium text-gray-900">
                                    {calendarOptions.find((o) => o.value === form.calendar)?.name}
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium flex-shrink-0 ${
                                    calendarOptions.find((o) => o.value === form.calendar)?.isActive
                                      ? 'border-green-200 bg-green-100 text-green-700'
                                      : 'border-red-200 bg-red-100 text-red-700'
                                  }`}
                                >
                                  {calendarOptions.find((o) => o.value === form.calendar)?.status}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium text-gray-500 pointer-events-none">Select a calendar...</span>
                            )}
                            <FiChevronDown
                              className={`ml-3 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform pointer-events-none ${
                                isCalendarDropdownOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {isCalendarDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-xl">
                            <div className="border-b border-gray-100 bg-gray-50 p-3">
                              <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search calendars..."
                                  value={calendarSearch}
                                  onChange={(e) => setCalendarSearch(e.target.value)}
                                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto">
                              {getFilteredCalendarOptions().length > 0 ? (
                                getFilteredCalendarOptions().map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      handleCalendarChange(opt.value);
                                      setIsCalendarDropdownOpen(false);
                                      setCalendarSearch('');
                                    }}
                                    className={`w-full border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                                      form.calendar === opt.value ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="truncate text-sm font-medium text-gray-900">{opt.name}</span>
                                          {form.calendar === opt.value && <FiCheck className="h-4 w-4 flex-shrink-0 text-blue-600" />}
                                        </div>
                                      </div>
                                      <span
                                        className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-1 text-xs font-medium ${
                                          opt.isActive
                                            ? 'border-green-200 bg-green-100 text-green-700'
                                            : 'border-red-200 bg-red-100 text-red-700'
                                        }`}
                                      >
                                        {opt.status}
                                      </span>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                  <FiSearch className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                                  <p className="text-sm font-medium">
                                    {rawCalendarData.length === 0 ? 'No calendars available' : 'No calendars found'}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-gray-100 bg-gray-50 p-3 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">
                                  {getFilteredCalendarOptions().length} of {rawCalendarData.length} calendars
                                </span>
                                <div className="flex items-center gap-2">
                                  {rawCalendarData.length !== calendarOptions.length && (
                                    <button
                                      type="button"
                                      onClick={() => setCalendarOptions(rawCalendarData.filter((c) => c.isValidId))}
                                      className="font-medium text-blue-600 underline hover:text-blue-700"
                                    >
                                      Show all
                                    </button>
                                  )}
                                  {rawCalendarData.length === calendarOptions.length && rawCalendarData.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCalendarOptions(rawCalendarData.filter((c) => c.isValidId && c.isActive))
                                      }
                                      className="font-medium text-orange-600 underline hover:text-orange-700"
                                    >
                                      Active only
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {isCalendarDropdownOpen && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setIsCalendarDropdownOpen(false);
                              setCalendarSearch('');
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Appointment Title <span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="(eg) Appointment with Bob"
                        className={`w-full rounded-xl border-2 px-4 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                          errors.title
                            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                            : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white'
                        }`}
                      />
                      {errors.title && (
                        <p className="flex items-center text-sm font-medium text-red-600">
                          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      {showDescription ? (
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                              Description
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowDescription(false)}
                              className="flex items-center space-x-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                            >
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                                <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </div>
                              <span>Remove description</span>
                            </button>
                          </div>
                          <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full resize-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-base transition-all duration-200 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                            rows={4}
                            placeholder="Provide details about this appointment..."
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowDescription(true)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <FiPlus className="h-4 w-4" />
                          <span>Add description</span>
                        </button>
                      )}
                    </div>

                    {/* Date & Time (APPOINTMENT ONLY) */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Date & Time
                      </label>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                        {/* helper text */}
                        <p className="mb-4 text-sm text-gray-600">
                          Showing slots in timezone:
                          {isLoadingTimezone
                            ? ' (Loading timezone...)'
                            : form.timezone
                            ? ` ${form.timezone}`
                            : ghlTimezone
                            ? ` (${ghlTimezone})`
                            : ' (Default Timezone)'}
                        </p>

                        {/* timezone */}
                        <div className="mb-4">
                          <EnhancedTimezoneDropdown
                            value={form.timezone}
                            onChange={(timezone) => setForm({ ...form, timezone })}
                            locationId={null} // Will use default from config
                            placeholder="Select timezone..."
                            onRefresh={() => {
                            }}
                          />
                        </div>

                        {/* segmented buttons */}
                        <div className="mb-4">
                          <div role="tablist" className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              aria-pressed={form.slotType === 'default'}
                              onClick={() => setForm((p) => ({ ...p, slotType: 'default' }))}
                              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors
                                focus:outline-none focus:ring-2 focus:ring-blue-300
                                ${
                                  form.slotType === 'default'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-inner'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Default
                            </button>
                            <button
                              type="button"
                              aria-pressed={form.slotType === 'custom'}
                              onClick={() => setForm((p) => ({ ...p, slotType: 'custom' }))}
                              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors
                                focus:outline-none focus:ring-2 focus:ring-blue-300
                                ${
                                  form.slotType === 'custom'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-inner'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Custom
                            </button>
                          </div>
                        </div>

                        {/* DEFAULT VIEW — ONLY Date + Slot */}
                        {form.slotType === 'default' && (
                          <div className="grid grid-cols-2 gap-4">
                            {/* Date */}
                            <div className="relative space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Date</label>
                              <div className="relative">
                                <input
                                  ref={dateInputRef}
                                  type="date"
                                  value={form.date}
                                  onChange={(e) => handleDateChange(e.target.value)}
                                  className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                                    errors.date
                                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                      : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-400'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  aria-label="Open date picker"
                                  title="Open date picker"
                                >
                                  <FiCalendar className="h-5 w-5" />
                                </button>
                              </div>
                              {errors.date && (
                                <p className="flex items-center text-sm font-medium text-red-600">
                                  <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {errors.date}
                                </p>
                              )}
                            </div>

                            {/* Slot */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-gray-700">
                                  Slot
                                  {isLoadingSlots && <span className="ml-2 text-xs text-blue-600">Loading…</span>}
                                  {slotsError && <span className="ml-2 text-xs text-red-600">Using fallback</span>}
                                </label>
                              </div>

                              <select
                                value={form.timeSlot}
                                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                                onFocus={() => {
                                }}
                                disabled={isLoadingSlots}
                                key={`slot-dropdown-${slotsVersion}-${availableSlots.length}-${form.timezone}-${form.date}-${form.calendar}`}
                                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {(() => {
                                  const convertedSlots = getAvailableTimeSlots();

                                  if (isLoadingSlots) {
                                    return <option value="">Loading available slots…</option>;
                                  }

                                  if (slotsError) {
                                    return (
                                      <>
                                        <option value="">Using default times</option>
                                        {(timeSlots[`${form.customDuration}min`] || timeSlots['30min']).map((slot) => (
                                          <option key={slot} value={slot}>
                                            {slot}
                                          </option>
                                        ))}
                                      </>
                                    );
                                  }

                                  // Check if we have converted slots (this includes both API slots and fallback slots)
                                  if (convertedSlots.length > 0) {
                                    return (
                                      <>
                                        <option value="">
                                          Select an available time slot ({convertedSlots.length} available)
                                        </option>
                                        {convertedSlots.map((slot, i) => (
                                          <option key={`ghl-slot-${i}`} value={slot}>
                                            {slot}
                                          </option>
                                        ))}
                                      </>
                                    );
                                  }

                                  // No slots at all - fallback to default times
                                  return (
                                    <>
                                      <option value="">No slots available for this date</option>
                                      <option disabled>────────── Default Times ──────────</option>
                                      {(timeSlots[`${form.customDuration}min`] || timeSlots['30min']).map((slot) => (
                                        <option key={slot} value={slot}>
                                          {slot} (default)
                                        </option>
                                      ))}
                                    </>
                                  );
                                })()}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* CUSTOM VIEW — Start/End + inline Recurring (APPOINTMENT) */}
                        {form.slotType === 'custom' && (
                          <div className="space-y-4">
                            {/* Start Time */}
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Start Time</label>
                              <div className="relative">
                                <input
                                  type="datetime-local"
                                  value={form.startTime}
                                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                  className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                                    errors.startTime
                                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                      : 'border-gray-200 bg-white focus:border-blue-400'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling;
                                    input?.showPicker?.() || input?.focus();
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  aria-label="Open date/time picker"
                                  title="Open date/time picker"
                                >
                                  <FiCalendar className="h-5 w-5" />
                                </button>
                              </div>
                              {errors.startTime && (
                                <p className="flex items-center text-sm font-medium text-red-600">
                                  <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {errors.startTime}
                                </p>
                              )}
                            </div>

                            {/* End Time */}
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">End Time</label>
                              <div className="relative">
                                <input
                                  type="datetime-local"
                                  value={form.endTime}
                                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                  className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                                    errors.endTime
                                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                      : 'border-gray-200 bg-white focus:border-blue-400'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling;
                                    input?.showPicker?.() || input?.focus();
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  aria-label="Open date/time picker"
                                  title="Open date/time picker"
                                >
                                  <FiCalendar className="h-5 w-5" />
                                </button>
                              </div>
                              {errors.endTime && (
                                <p className="flex items-center text-sm font-medium text-red-600">
                                  <svg className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {errors.endTime}
                                </p>
                              )}
                            </div>

                            {/* Recurring inline */}
                            <div className="space-y-3 pt-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={form.isRecurring}
                                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                                  className="rounded"
                                  title="Check this box to create a custom recurring appointment. The recurrence settings you choose will apply only to this specific appointment and its recurrences. Note: Recurrences will be booked directly without checking availability."
                                />
                                <span
                                  className="inline-flex items-center gap-1"
                                  title="Check this box to create a custom recurring appointment. The recurrence settings you choose will apply only to this specific appointment and its recurrences. Note: Recurrences will be booked directly without checking availability."
                                >
                                  Recurring Event
                                  <FiAlertTriangle className="h-4 w-4 text-gray-400" />
                                </span>
                              </label>

                              {form.isRecurring && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="sm:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Occurrences</label>
                                    <select
                                      value={form.recurrencePattern}
                                      onChange={(e) => setForm({ ...form, recurrencePattern: e.target.value })}
                                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                                    >
                                      {recurrenceOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meeting Location */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Meeting Location
                      </label>

                      {/* Radios */}
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            value="calendar-default"
                            checked={form.meetingLocation === 'calendar-default'}
                            onChange={(e) => setForm({ ...form, meetingLocation: e.target.value })}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Calendar Default</div>
                            <div className="text-sm text-gray-600">As configured in the calendar</div>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            value="custom"
                            checked={form.meetingLocation === 'custom'}
                            onChange={(e) => setForm({ ...form, meetingLocation: e.target.value })}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Custom</div>
                            <div className="text-sm text-gray-600">Set specific to this appointment</div>
                          </div>
                        </label>
                      </div>

                      {/* Inputs that only show for Custom */}
                      {form.meetingLocation === 'custom' && (
                        <div className="space-y-3 pt-2">
                          <select
                            value={form.locationType}
                            onChange={(e) => setForm({ ...form, locationType: e.target.value })}
                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          >
                            <option value="custom">Custom</option>
                          </select>

                          <input
                            type="text"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="Enter Meeting Location"
                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  // Blocked time
                  <div className="space-y-8">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm text-blue-800">
                        Going on vacation? Taking some time off? Block off time on your calendar to prevent clients from
                        booking appointments. Existing appointments will still remain on your calendar.
                      </p>
                    </div>

                    {/* Team Member */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Team Member
                      </label>
                      <div className="flex items-center space-x-2">
                        <select
                          value={form.userCalendar}
                          onChange={(e) => handleUserChange(e.target.value)}
                          disabled={isLoadingUsers}
                          className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-medium transition-all duration-200 hover:border-gray-300 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          {isLoadingUsers ? (
                            <option value="">Loading team members...</option>
                          ) : users.length === 0 ? (
                            <>
                              <option value="" disabled>
                                Select a team member...
                              </option>
                              <option value="Joel Morgan">Joel Morgan</option>
                              <option value="Sarah Wilson">Sarah Wilson</option>
                              <option value="Mike Johnson">Mike Johnson</option>
                              <option value="General Calendar">General Calendar</option>
                            </>
                          ) : (
                            <>
                              <option value="" disabled>
                                Select a team member...
                              </option>
                              {availableTeamMembers.map((u) => {
                                const userName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
                                const title = u.title || u.role || '';
                                const display = title ? `${userName} - ${title}` : userName;
                                return (
                                  <option key={u.id} value={userName}>
                                    {display}
                                  </option>
                                );
                              })}
                            </>
                          )}
                        </select>
                        {isLoadingUsers && (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        )}
                      </div>
                      {users.length > 0 && (
                        <p className="text-sm text-gray-500">
                          ✅ {users.length} team member{users.length !== 1 ? 's' : ''} loaded
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Appointment Title <span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="(eg) Vacation, Time Off, etc."
                        className={`w-full rounded-xl border-2 px-4 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                          errors.title
                            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                            : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white'
                        }`}
                      />
                      {errors.title && (
                        <p className="flex items-center text-sm font-medium text-red-600">
                          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Date & Time
                      </label>
                      <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
                        <p className="text-sm text-gray-600">
                          Showing slots in timezone: {form.timezone || '(Default Timezone)'}
                        </p>

                        <div>
                          <EnhancedTimezoneDropdown
                            value={form.timezone}
                            onChange={(timezone) => setForm({ ...form, timezone })}
                            locationId={null} // Will use default from config
                            placeholder="Select timezone..."
                            onRefresh={() => {
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Start Time</label>
                          <div className="relative">
                            <input
                              type="datetime-local"
                              value={form.startTime}
                              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                              className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                                errors.startTime
                                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                  : 'border-gray-200 bg-white focus:border-blue-400'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling;
                                input?.showPicker?.() || input?.focus();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                              aria-label="Open date/time picker"
                              title="Open date/time picker"
                            >
                              <FiCalendar className="h-5 w-5" />
                            </button>
                          </div>
                          {errors.startTime && (
                            <p className="flex items-center text-sm font-medium text-red-600">
                              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {errors.startTime}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">End Time</label>
                          <div className="relative">
                            <input
                              type="datetime-local"
                              value={form.endTime}
                              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                              className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                                errors.endTime
                                  ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                                  : 'border-gray-200 bg-white focus:border-blue-400'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling;
                                input?.showPicker?.() || input?.focus();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                              aria-label="Open date/time picker"
                              title="Open date/time picker"
                            >
                              <FiCalendar className="h-5 w-5" />
                            </button>
                          </div>
                          {errors.endTime && (
                            <p className="flex items-center text-sm font-medium text-red-600">
                              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {errors.endTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right (Contact & Notes) */}
              {activeTab === 'appointment' && (
                <div className="w-80 max-h-[calc(90vh-200px)] overflow-y-auto bg-gray-50 px-8 py-8">
                  <div className="space-y-8">
                    {/* Contact */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Select Contact <span className="ml-1 text-red-500">*</span>
                      </label>
                      <ContactDropdown
                        value={form.contactId}
                        onChange={(contactId) => setForm({ ...form, contactId })}
                        placeholder="Search by name, email or phone"
                      />
                      {errors.contact && (
                        <p className="flex items-center text-sm font-medium text-red-600">
                          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.contact}
                        </p>
                      )}
                    </div>

                    {/* Internal Notes */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Internal Notes
                      </label>
                      <div className="mb-3 relative">
                        {/* left, inside the field */}
                        <button
                          type="button"
                          onClick={addInternalNote}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          aria-label="Add note"
                          title="Add note"
                        >
                          <FiPlus className="h-4 w-4" />
                        </button>

                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add Internal Note"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white pl-8 pr-3 py-2 text-sm font-medium transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          onKeyDown={(e) => e.key === 'Enter' && addInternalNote()}
                        />
                      </div>

                      <div className="space-y-2">
                        {form.internalNotes.map((note) => (
                          <div key={note.id} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3">
                            <div className="flex-1 text-sm text-gray-700">{note.text}</div>
                            <button
                              type="button"
                              onClick={() => removeInternalNote(note.id)}
                              className="text-red-500 transition-colors hover:text-red-700"
                              aria-label="Remove note"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                {/* Left: Status (footer) + optional Delete */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center">

                  {/* Status : [select] */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">Status :</span>
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-56 rounded-lg border-2 border-gray-300 bg-white px-3 py-2 pr-9 text-sm font-medium text-gray-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {mode === 'edit' && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        onClose();
                      }}
                      className={`rounded-xl px-6 py-3 font-semibold transition-all duration-200 md:ml-6 ${
                        isSubmitting
                          ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      Delete {activeTab === 'appointment' ? 'Appointment' : 'Blocked Time'}
                    </button>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`rounded-xl px-8 py-3 font-semibold text-white transition-all duration-200 ${
                      isSubmitting ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg
                          className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {activeTab === 'appointment' ? 'Booking...' : 'Blocking...'}
                      </span>
                    ) : activeTab === 'appointment' ? (
                      'Save/Create Appointment'
                    ) : (
                      'Block time'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default AppointmentModal;
