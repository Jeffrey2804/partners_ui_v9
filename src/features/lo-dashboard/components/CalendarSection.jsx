import { useState, useEffect, useContext, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskContext } from '@app/providers/TaskContext';
import { CalendarContext } from '@app/providers/CalendarContext';
import { AnimatePresence, motion } from 'framer-motion';
import { StatCard, SectionHeader, SearchInput, CalendarList } from '@shared/components/ui';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import AppointmentModal from '@shared/components/ui/AppointmentModal';
import { fetchGHLCalendarEvents, getCalendarsList } from '@shared/services/api/ghlCalendarService';
import { GHL_CONFIG } from '@config/ghlConfig';
import '@styles/Calendar.css';

const categoryColors = {
  Activity: '#4F46E5',
  Campaign: '#7C3AED',
  Email: '#059669',
  Task: '#EA580C',
  Meeting: '#DC2626',
  Call: '#0891B2',
  FollowUp: '#16A34A',
  Review: '#CA8A04',
};

const getNextWeekISO = (start, weeks) => {
  const date = new Date(start);
  date.setDate(date.getDate() + weeks * 7);
  return toLocalYYYYMMDD(date);
};

const toLocalYYYYMMDD = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarSection = () => {
  const taskContext = useContext(TaskContext);
  const calendarContext = useContext(CalendarContext);

  const { tasksByCategory = {} } = taskContext || {};
  const { appointmentsByCategory = {} } = calendarContext || {};

  const [filter, setFilter] = useState('All Events');
  const [search, setSearch] = useState('');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [calendarListOpen, setCalendarListOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editId, setEditId] = useState(null);

  const [selectedCalendars, setSelectedCalendars] = useState(new Set());
  const [ghlEvents, setGhlEvents] = useState({});
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [isLoadingGhlEvents, setIsLoadingGhlEvents] = useState(false);

  const [moreEventsPopover, setMoreEventsPopover] = useState({
    isOpen: false,
    date: null,
    events: [],
    position: { x: 0, y: 0 },
  });

  const [form, setForm] = useState({
    title: '',
    category: 'Activity',
    repeat: false,
    description: '',
    location: '',
    attendees: '',
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: '1',
            title: 'Client Meeting',
            start: toLocalYYYYMMDD(new Date()),
            end: toLocalYYYYMMDD(new Date()),
            category: 'Activity',
            description: 'Discuss loan application progress',
            location: 'Conference Room A',
            attendees: 'John Doe, Jane Smith',
            backgroundColor: categoryColors.Activity,
            borderColor: categoryColors.Activity,
            textColor: '#000000',
            extendedProps: { category: 'Activity' },
          },
          {
            id: '2',
            title: 'Document Review',
            start: getNextWeekISO(new Date(), 1),
            end: getNextWeekISO(new Date(), 1),
            category: 'Task',
            description: 'Review client documents',
            location: 'Office',
            attendees: 'Legal Team',
            backgroundColor: categoryColors.Task,
            borderColor: categoryColors.Task,
            textColor: '#000000',
            extendedProps: { category: 'Task' },
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const fetchAvailableCalendars = async () => {
    try {
      const response = await getCalendarsList(GHL_CONFIG.locationId);
      const calendars = response?.calendars || [];
      if (!calendars.length) throw new Error('No calendars returned');

      setAvailableCalendars(calendars);

      if (selectedCalendars.size === 0) {
        const first = calendars[0];
        handleCalendarSelection(first.id, first.name, true);
      }
    } catch (_error) {
      // API error handling will be managed by global notification system
      setAvailableCalendars([]);
    }
  };

  const fetchEventsForCalendar = async (calendarId, _calendarName) => {
    setIsLoadingGhlEvents(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      const response = await fetchGHLCalendarEvents(
        GHL_CONFIG.locationId,
        calendarId,
        startDate.getTime(),
        endDate.getTime(),
      );
      const e = response?.events || [];
      setGhlEvents((prev) => ({ ...prev, [calendarId]: e }));
    } catch (_error) {
      // API error handling will be managed by global notification system
      setGhlEvents((prev) => ({ ...prev, [calendarId]: [] }));
    } finally {
      setIsLoadingGhlEvents(false);
    }
  };

  const handleCalendarSelection = (calendarId, calendarName, isSelected) => {
    const next = new Set(selectedCalendars);
    if (isSelected) {
      if (!next.has(calendarId)) {
        next.add(calendarId);
        fetchEventsForCalendar(calendarId, calendarName);
      }
    } else {
      next.delete(calendarId);
      setGhlEvents((prev) => {
        const updated = { ...prev };
        delete updated[calendarId];
        return updated;
      });
    }
    setSelectedCalendars(next);
  };

  useEffect(() => {
    fetchAvailableCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ghlCalendarEvents = useMemo(() => {
    const all = [];
    Object.entries(ghlEvents).forEach(([calendarId, evts]) => {
      const name = availableCalendars.find((c) => c.id === calendarId)?.name || 'GHL';
      evts.forEach((evt, index) => {
        const startISO =
          typeof evt.startTime === 'number' ? new Date(evt.startTime).toISOString() : evt.startTime || new Date().toISOString();
        const endISO =
          typeof evt.endTime === 'number'
            ? new Date(evt.endTime).toISOString()
            : evt.endTime ||
              (() => {
                const s = new Date(startISO);
                s.setHours(s.getHours() + 1);
                return s.toISOString();
              })();

        all.push({
          id: `ghl-${calendarId}-${evt.id || index}`,
          title: evt.title || evt.appointmentTitle || `GHL Event ${index + 1}`,
          start: startISO,
          end: endISO,
          backgroundColor: '#059669',
          borderColor: '#047857',
          textColor: '#000000',
          extendedProps: {
            isGhlEvent: true,
            calendarId,
            calendarName: name,
            status: evt.status || 'scheduled',
            contact: evt.contactName || (evt.contact && evt.contact.name),
            category: 'GHL Event',
            description: evt.description || evt.notes || `Event from ${name}`,
            location: evt.location || evt.address || '',
            attendees: evt.contactName || (evt.contact && evt.contact.name) || 'No contact',
            ghlEventId: evt.id,
            rawEvent: evt,
          },
        });
      });
    });
    return all;
  }, [ghlEvents, availableCalendars]);

  const appointmentEvents = useMemo(() => {
    const allAppointments = (appointmentsByCategory && appointmentsByCategory['All Appointments'] && appointmentsByCategory['All Appointments'].items) || [];
    return allAppointments.map((a) => ({
      id: `appointment-${a.id}`,
      title: a.title,
      start: a.startTime || a.date,
      end: a.endTime || a.date,
      backgroundColor: a.backgroundColor || '#4F46E5',
      borderColor: a.borderColor || '#3730A3',
      textColor: '#000000',
      extendedProps: {
        status: a.status || 'scheduled',
        isRecurring: a.isRecurring || false,
        contact: a.contactName,
        assignee: a.assignedTo,
        isAppointment: true,
        category: 'Appointment',
        description: a.description || '',
        location: a.location || '',
        attendees: a.contactName || 'No Contact',
      },
    }));
  }, [appointmentsByCategory]);

  const taskEvents = useMemo(() => {
    const allTasks = (tasksByCategory && tasksByCategory['All Tasks'] && tasksByCategory['All Tasks'].items) || [];

    const uniq = new Map();
    const out = [];
    for (let i = 0; i < allTasks.length; i++) {
      const t = allTasks[i];
      const start = t.dueDate || t.date || toLocalYYYYMMDD(new Date());
      const key = `${t.id}-${t.title}-${start}`;
      if (uniq.has(key)) continue;
      uniq.set(key, true);

      let backgroundColor = '#4F46E5';
      let borderColor = '#3730A3';
      if (t.status === 'completed') {
        backgroundColor = '#059669';
        borderColor = '#047857';
      } else if (t.priority === 'high') {
        backgroundColor = '#DC2626';
        borderColor = '#B91C1C';
      } else if (t.priority === 'medium') {
        backgroundColor = '#EA580C';
        borderColor = '#C2410C';
      } else if (t.priority === 'low') {
        backgroundColor = '#6B7280';
        borderColor = '#4B5563';
      }

      out.push({
        id: `task-${t.id}`,
        title: t.title || 'Untitled Task',
        start,
        end: start,
        backgroundColor,
        borderColor,
        textColor: '#000000',
        extendedProps: {
          isTask: true,
          priority: t.priority || 'medium',
          status: t.status || 'pending',
          assignee: t.assigneeName || 'Unassigned',
          category: 'Task',
          description: t.description || '',
          location: 'Office',
          attendees: t.assigneeName || 'Unassigned',
        },
      });
    }
    return out;
  }, [tasksByCategory]);

  const filteredEvents = useMemo(() => {
    const base = [...events, ...taskEvents, ...appointmentEvents, ...ghlCalendarEvents];

    const seen = new Map();
    const unique = base.filter((e) => {
      const key = `${e.id}-${e.title}-${e.start}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });

    let res = unique;
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.extendedProps && e.extendedProps.description && e.extendedProps.description.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)),
      );
    }
    return res;
  }, [events, taskEvents, appointmentEvents, ghlCalendarEvents, search]);

  const openAddModal = (dateStr) => {
    setSelectedDate(dateStr);
    setAppointmentModalOpen(true);
  };

  const openEditModal = ({ event, startStr }) => {
    setEditId(event.id);
    setSelectedDate(startStr);
    setForm({
      title: event.title,
      category: (event.extendedProps && event.extendedProps.category) || event.category || 'Activity',
      repeat: false,
      description: (event.extendedProps && event.extendedProps.description) || event.description || '',
      location: (event.extendedProps && event.extendedProps.location) || event.location || '',
      attendees: (event.extendedProps && event.extendedProps.attendees) || event.attendees || '',
    });
    setAppointmentModalOpen(true);
  };

  const handleMoreLinkClick = (arg) => {
    const date = arg.date || (arg.dayEl && arg.dayEl.dataset && arg.dayEl.dataset.date);
    const dayEl = arg.dayEl || arg.el;
    if (!date || !dayEl) return false;

    const targetDate = toLocalYYYYMMDD(date);
    const dateEvents = filteredEvents.filter((e) => {
      const d = toLocalYYYYMMDD(e.start);
      return d === targetDate;
    });

    const rect = dayEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 10;

    const popoverWidth = 400;
    if (x + popoverWidth / 2 > viewportWidth) x = viewportWidth - popoverWidth / 2 - 20;
    else if (x - popoverWidth / 2 < 0) x = popoverWidth / 2 + 20;

    const popoverHeight = Math.min(dateEvents.length * 80 + 200, 600);
    if (y + popoverHeight > viewportHeight) y = rect.top - popoverHeight - 10;

    setMoreEventsPopover({
      isOpen: true,
      date: new Date(date),
      events: dateEvents,
      position: { x, y },
    });

    return false; // prevent FullCalendar's default popover
  };

  const closeMoreEventsPopover = () =>
    setMoreEventsPopover({ isOpen: false, date: null, events: [], position: { x: 0, y: 0 } });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!moreEventsPopover.isOpen) return;
      const pop = document.querySelector('[data-popover="more-events"]');
      if (pop && !pop.contains(e.target)) closeMoreEventsPopover();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreEventsPopover.isOpen]);

  const saveEvent = () => {
    if (!form.title.trim()) {
      // Error handling will be managed by global notification system
      return;
    }
    const base = {
      title: form.title,
      category: form.category,
      description: form.description,
      location: form.location,
      attendees: form.attendees,
      backgroundColor: categoryColors[form.category] || categoryColors.Activity,
      borderColor: categoryColors[form.category] || categoryColors.Activity,
      textColor: '#000000',
      extendedProps: {
        category: form.category,
        description: form.description,
        location: form.location,
        attendees: form.attendees,
      },
    };

    if (editId) {
      setEvents((prev) => prev.map((e) => (e.id === editId ? { ...e, ...base, start: selectedDate, end: selectedDate } : e)));
    } else {
      const newEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        ...base,
        start: selectedDate,
        end: selectedDate,
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    setAppointmentModalOpen(false);
    setForm({ title: '', category: 'Activity', repeat: false, description: '', location: '', attendees: '' });
  };

  const deleteEvent = () => {
    setEvents((prev) => prev.filter((e) => e.id !== editId));
    setAppointmentModalOpen(false);
    setForm({ title: '', category: 'Activity', repeat: false, description: '', location: '', attendees: '' });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const inRange = (d, to) => {
      const s = new Date(d);
      return s >= now && s <= to;
    };

    const total = filteredEvents.length;
    const thisWeek = filteredEvents.filter((e) => inRange(e.start, inAWeek)).length;
    const thisMonth = filteredEvents.filter((e) => inRange(e.start, endOfMonth)).length;
    const upcoming = filteredEvents.filter((e) => new Date(e.start) >= now).length;

    return { total, thisWeek, thisMonth, upcoming };
  }, [filteredEvents]);

  return (
    <section className="w-full bg-gray-50">
      <SectionHeader
        title="Calendar"
        description="Schedule and manage your appointments, meetings, and important dates"
        buttonText="Book Appointment"
        onButtonClick={() => setAppointmentModalOpen(true)}
      >
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => setCalendarListOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100 hover:bg-gray-50 hover:border-gray-300 active:shadow-none"
            aria-label="Open calendar list"
          >
            <FiCalendar className="h-4 w-4 text-gray-500" />
            <span className="hidden sm:inline">Calendars</span>
          </button>

          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, meetings, or activities..."
            showFilter={false}
            className="flex-1"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#01818E]/10 focus:border-[#01818E] transition-all duration-300 shadow-sm bg-white hover:border-gray-300"
          >
            <option>All Events</option>
          </select>
        </div>
      </SectionHeader>

      <div className="px-3 py-3">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard type="events" title="Total Events" value={stats.total} description="All scheduled events" delay={0.1} className="hover:border-blue-200 hover:shadow-md transition-all duration-300" />
          <StatCard type="week" title="This Week" value={stats.thisWeek} description="Upcoming events" delay={0.2} className="hover:border-emerald-200 hover:shadow-md transition-all duration-300" />
          <StatCard type="month" title="This Month" value={stats.thisMonth} description="Monthly schedule" delay={0.3} className="hover:border-purple-200 hover:shadow-md transition-all duration-300" />
          <StatCard type="upcoming" title="Upcoming" value={stats.upcoming} description="Future events" delay={0.4} className="hover:border-orange-200 hover:shadow-md transition-all duration-300" />
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height={490}
              editable
              selectable
              dateClick={(info) => openAddModal(info.dateStr)}
              eventClick={openEditModal}
              moreLinkClick={handleMoreLinkClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek',
              }}
              dayMaxEvents={1}
              eventColor="#01818E"
              eventTextColor="#ffffff"
              eventBorderColor="#016d78"
              eventDidMount={(info) => {
                try {
                  const el = info.el;
                  const bg = window.getComputedStyle(el).backgroundColor || '';
                  const hasInline = info.event.backgroundColor && String(info.event.backgroundColor).trim() !== '';
                  const isTransparent = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
                  const isWhite = bg === 'rgb(255, 255, 255)' || bg === '#fff' || bg === 'white';
                  if (!hasInline || isWhite || isTransparent) {
                    el.style.background = 'linear-gradient(135deg, #01818E 0%, #22d3ee 100%)';
                    el.style.borderColor = '#01818E';
                    if (!info.event.textColor) {
                      el.style.color = '#ffffff';
                    }
                  }
                } catch (_e) {
                  /* no-op */
                }
              }}
              moreLinkContent={(arg) => (
                <span
                  className="
                    inline-flex items-center rounded-full
                    border border-gray-200 bg-white/70 backdrop-blur
                    px-2.5 py-0.5 text-[11px] font-medium text-gray-700
                    hover:bg-white transition-colors
                  "
                >
                  +{arg.num}
                </span>
              )}
              events={filteredEvents}
              eventContent={(arg) => (
                <div className="px-2 py-1.5">
                  <div className="text-xs font-bold truncate leading-tight mb-1" style={{ color: arg.event.textColor || '#ffffff' }}>
                    {arg.event.title}
                  </div>
                  {arg.event.extendedProps && arg.event.extendedProps.isGhlEvent ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-white rounded-full opacity-90 flex-shrink-0" />
                      <span className="text-xs font-semibold opacity-95 leading-tight" style={{ color: arg.event.textColor || '#ffffff' }}>
                        {arg.event.extendedProps.calendarName || 'GHL'}
                      </span>
                      {arg.event.extendedProps.contact && (
                        <>
                          <div className="w-1 h-1 bg-white rounded-full opacity-60" />
                          <span className="text-xs opacity-85 leading-tight" style={{ color: arg.event.textColor || '#ffffff' }}>
                            {String(arg.event.extendedProps.contact).split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>
                  ) : arg.event.extendedProps && arg.event.extendedProps.isTask ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-white rounded-full opacity-90 flex-shrink-0" />
                      <span className="text-xs font-semibold opacity-95 leading-tight" style={{ color: arg.event.textColor || '#ffffff' }}>
                        {arg.event.extendedProps.priority || 'Task'}
                      </span>
                      {arg.event.extendedProps.assignee && (
                        <>
                          <div className="w-1 h-1 bg-white rounded-full opacity-60" />
                          <span className="text-xs opacity-85 leading-tight" style={{ color: arg.event.textColor || '#ffffff' }}>
                            {String(arg.event.extendedProps.assignee).split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    arg.event.extendedProps &&
                    arg.event.extendedProps.category && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-white rounded-full opacity-90 flex-shrink-0" />
                        <span className="text-xs font-semibold opacity-95 leading-tight" style={{ color: arg.event.textColor || '#ffffff' }}>
                          {arg.event.extendedProps.category}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
              dayCellContent={(arg) => (
                <div className="text-sm font-medium text-gray-700">{arg.dayNumberText}</div>
              )}
              />
              </div>
              </div>
              </div>

              {/* More Events Popover */}
              <AnimatePresence>
                {moreEventsPopover.isOpen && (
                  <motion.div
                    className="fixed z-50 max-w-md w-full"
                    style={{
                      left: `${moreEventsPopover.position.x}px`,
                      top: `${moreEventsPopover.position.y}px`,
                      transform: 'translateX(-50%)',
                    }}
                    data-popover="more-events"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="rounded-xl border border-gray-200 bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {moreEventsPopover.date &&
                              moreEventsPopover.date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {moreEventsPopover.events.length} events
                          </p>
                        </div>
                        <button
                          onClick={closeMoreEventsPopover}
                          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <FiX className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      {/* Event List */}
                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {moreEventsPopover.events.map((event, index) => (
                          <motion.button
                            key={`${event.id}-${index}`}
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            onClick={() => {
                              openEditModal({ event, startStr: event.start });
                              closeMoreEventsPopover();
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className="mt-1.5 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                                style={{ backgroundColor: event.backgroundColor || '#01818E' }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {event.title}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                  <span className="truncate">
                                    {(event.extendedProps && event.extendedProps.category) || 'Event'}
                                  </span>
                                  {event.extendedProps?.location && (
                                    <>
                                      <span aria-hidden>•</span>
                                      <span className="truncate">{event.extendedProps.location}</span>
                                    </>
                                  )}
                                </div>
                                {(event.extendedProps?.description || event.description) && (
                                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                    {event.extendedProps?.description || event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedDate(
                              moreEventsPopover.date && toLocalYYYYMMDD(moreEventsPopover.date),
                            );
                            setAppointmentModalOpen(true);
                            closeMoreEventsPopover();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <FiPlus className="w-4 h-4" />
                          Add event
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => {
          setAppointmentModalOpen(false);
          setEditId(null);
        }}
        selectedDate={selectedDate}
        mode={editId ? 'edit' : 'create'}
        initialValues={editId ? form : undefined}
        onSave={saveEvent}
        onDelete={editId ? deleteEvent : undefined}
      />

      <CalendarList
        isOpen={calendarListOpen}
        onClose={() => setCalendarListOpen(false)}
        availableCalendars={availableCalendars}
        selectedCalendars={selectedCalendars}
        onCalendarSelection={handleCalendarSelection}
        isLoading={isLoadingGhlEvents}
        ghlEvents={ghlEvents}
      />
    </section>
  );
};

export default CalendarSection;
