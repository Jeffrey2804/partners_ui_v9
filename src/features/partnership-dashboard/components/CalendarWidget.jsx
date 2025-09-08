// ========================================
// 📅 CALENDAR WIDGET COMPONENT
// ========================================

import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Clock,
} from 'lucide-react';
import useGHLCalendar from '../../../hooks/useGHLCalendar';
import './CalendarWidget.css';

const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2023, 7, 1)); // August 2023
  const [selectedDate, setSelectedDate] = useState(9); // August 9th selected
  const [viewMode, setViewMode] = useState('Month');

  // GHL Calendar Integration
  const {
    availableCalendars,
    isLoadingCalendars,
    isLoadingEvents,
    error,
    toggleCalendar,
    getEventsByDate,
    fetchAvailableCalendars,
  } = useGHLCalendar();

  // Calendar data for left sidebar (kept for categories section)
  const otherCalendars = [
    { name: 'Work', color: '#01818E', checked: true },
    { name: 'Education', color: '#f59e0b', checked: true },
  ];

  // Calendar configuration
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Sample events data matching the calendar image
  const events = {
    1: [
      { time: '01:00pm', title: 'Go to...', type: 'task', color: 'orange' },
    ],
    2: [
      { time: '01:00pm', title: 'Design C...', type: 'meeting', color: 'yellow' },
    ],
    3: [
      { time: '03:30pm', title: 'Weekly...', type: 'meeting', color: 'blue' },
    ],
    4: [
      { time: '07:30am', title: 'Lunch', type: 'meal', color: 'orange' },
      { time: '10:30am', title: 'Meeti...', type: 'meeting', color: 'blue' },
    ],
    5: [
      { time: '06:45am', title: 'Prototype...', type: 'work', color: 'blue' },
      { time: '10:30am', title: 'Reunio...', type: 'meeting', color: 'orange' },
    ],
    8: [
      { time: '09:00am', title: 'Weekly...', type: 'meeting', color: 'blue' },
      { time: '09:00am', title: 'Desig...', type: 'design', color: 'yellow' },
      { time: '10:00am', title: 'Go to...', type: 'task', color: 'yellow' },
      { time: '10:00am', title: 'Group-W...', type: 'meeting', color: 'orange' },
      { time: '01:50pm', title: 'Reunio...', type: 'meeting', color: 'orange' },
    ],
    9: [
      { time: '07:45am', title: 'Standup...', type: 'meeting', color: 'blue' },
      { time: '12:00pm', title: 'Meetin...', type: 'meeting', color: 'blue' },
      { time: '01:30pm', title: 'Task Ove...', type: 'task', color: 'blue' },
    ],
    15: [
      { time: '01:00pm', title: 'P2P Zoom', type: 'meeting', color: 'yellow' },
      { time: '07:30am', title: 'Lunch', type: 'meal', color: 'orange' },
    ],
    16: [
      { time: '01:00pm', title: 'Meeti...', type: 'meeting', color: 'blue' },
      { time: '01:30pm', title: 'Reunio...', type: 'meeting', color: 'orange' },
    ],
    17: [
      { time: '07:30am', title: 'Group-...', type: 'meeting', color: 'orange' },
      { time: '02:50pm', title: 'Meeti...', type: 'meeting', color: 'blue' },
    ],
    22: [
      { time: '01:00pm', title: 'Group-W...', type: 'meeting', color: 'yellow' },
    ],
    25: [
      { time: '07:30am', title: 'Reuni...', type: 'meeting', color: 'orange' },
      { time: '10:30am', title: 'Design Cl...', type: 'design', color: 'yellow' },
      { time: '01:50pm', title: 'Weekly R...', type: 'meeting', color: 'blue' },
    ],
    30: [
      { time: '07:30am', title: 'Breakfast', type: 'meal', color: 'orange' },
    ],
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getEventColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      green: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.getDate());
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Professional Calendar</h3>
              <p className="text-xs text-slate-500">Schedule and appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200">
              <Settings className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add Event</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-slate-200/60 bg-slate-50/30 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-200/60 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Mode Buttons */}
            <div className="flex gap-1 mb-3">
              {['Day', 'Week', 'Month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={goToToday}
              className="w-full px-2 py-1.5 bg-teal-50 text-teal-700 text-xs font-medium rounded hover:bg-teal-100 transition-all duration-200 border border-teal-200"
            >
              Today
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-3 space-y-4">

              {/* Mini Calendar */}
              <div>
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <div key={`mini-day-${index}`} className="text-center text-slate-500 font-medium p-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.slice(0, 35).map((day, index) => {
                      const dayNumber = day.getDate();
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isSelected = isCurrentMonth && dayNumber === selectedDate;

                      // Create unique key for mini calendar days
                      const miniDayKey = `mini-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${index}`;

                      return (
                        <button
                          key={miniDayKey}
                          onClick={() => isCurrentMonth && setSelectedDate(dayNumber)}
                          className={`p-1 text-xs rounded transition-all duration-200 ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : isCurrentMonth
                                ? 'text-slate-900 hover:bg-teal-50'
                                : 'text-slate-400'
                          }`}
                        >
                          {dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Scheduled Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700">Scheduled Events</h4>
                  <button className="text-teal-600 hover:text-teal-700 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Selected Date Events */}
                {(() => {
                  const ghlEventsForDate = getEventsByDate(selectedDate);
                  const localEventsForDate = events[selectedDate] || [];
                  const allEventsForDate = [...ghlEventsForDate, ...localEventsForDate];

                  return allEventsForDate.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-lg p-2">
                      <h5 className="text-xs font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                        August {selectedDate}, 2023 - {allEventsForDate.length} events
                      </h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {allEventsForDate.map((event, index) => {
                          // Create unique key for scheduled events
                          const scheduledEventKey = event.id
                            ? `scheduled-${event.id}`
                            : `scheduled-${event.calendarId || 'local'}-${selectedDate}-${index}`;

                          return (
                            <motion.div
                              key={scheduledEventKey}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded transition-all duration-200 cursor-pointer group"
                            >
                              <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                event.calendarId ? 'bg-emerald-500' : // GHL events
                                event.color === 'blue' ? 'bg-blue-500' :
                                event.color === 'yellow' ? 'bg-yellow-500' :
                                event.color === 'orange' ? 'bg-orange-500' : 'bg-slate-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-slate-900 truncate group-hover:text-teal-600 transition-colors">
                                  {event.title}
                                  {event.calendarId && (
                                    <span className="ml-1 text-xs text-emerald-600 font-normal">(GHL)</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2 h-2" />
                                  {event.time}
                                </div>
                                {event.calendarName && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    📅 {event.calendarName}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                      <div className="text-slate-400 text-xs">No events scheduled</div>
                    </div>
                  );
                })()}
              </div>

              {/* My Calendars */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700">GHL Calendars</h4>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  {isLoadingCalendars ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-xs text-slate-500">Loading calendars...</span>
                    </div>
                  ) : error ? (
                    <div className="text-xs text-red-500 p-2 text-center bg-red-50 rounded border border-red-200">
                      <div className="font-medium">Error loading calendars</div>
                      <div className="mt-1">{error}</div>
                    </div>
                  ) : availableCalendars.length === 0 ? (
                    <div className="text-xs text-slate-500 p-2 text-center">
                      No calendars found
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {availableCalendars.map((calendar) => (
                          <div key={calendar.id} className="flex items-center gap-2 group hover:bg-slate-50 p-1 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={calendar.checked}
                              onChange={() => toggleCalendar(calendar.id)}
                              className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition-all ghl-calendar-checkbox"
                            />
                            <span className="text-xs">{calendar.icon}</span>
                            <span className="text-xs text-slate-700 flex-1 group-hover:text-slate-900 transition-colors font-medium">
                              {calendar.name}
                            </span>
                            {isLoadingEvents && calendar.checked && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full pulse-emerald"></div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={fetchAvailableCalendars}
                        disabled={isLoadingCalendars}
                        className="mt-3 w-full text-xs text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 transition-colors py-1 hover:bg-teal-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-2 h-2" />
                        {isLoadingCalendars ? 'Loading...' : 'Refresh calendars'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700">Categories</h4>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <div className="space-y-1">
                    {otherCalendars.map((calendar) => (
                      <div key={calendar.name} className="flex items-center gap-2 group">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        ></div>
                        <span className="text-xs text-slate-700 group-hover:text-slate-900 transition-colors">
                          {calendar.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-200/60 bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-48 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                {dayNames.map((day, index) => (
                  <div key={`header-${index}-${day}`} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                    <span className="text-xs font-semibold text-slate-700">{day}</span>
                  </div>
                ))}
              </div>

              {/* Scrollable Calendar Days */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-7 min-h-full">
                  {calendarDays.map((day, index) => {
                    const dayNumber = day.getDate();
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isSelected = isCurrentMonth && dayNumber === selectedDate;

                    // Get both local events and GHL events for this day
                    const localEvents = events[dayNumber] || [];
                    const ghlEventsForDay = getEventsByDate(dayNumber);
                    const allDayEvents = [...localEvents, ...ghlEventsForDay];

                    // Create unique key for calendar day
                    const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${index}`;

                    return (
                      <motion.div
                        key={dayKey}
                        whileHover={{ scale: 1.002 }}
                        className={`min-h-[100px] p-2 border-b border-r border-slate-200 cursor-pointer transition-all duration-200 flex flex-col group ${
                          isCurrentMonth
                            ? isSelected
                              ? 'bg-teal-50 border-teal-200'
                              : 'hover:bg-slate-50'
                            : 'text-slate-400 bg-slate-50'
                        } ${index % 7 === 6 ? 'border-r-0' : ''} last:border-b-0`}
                        onClick={() => isCurrentMonth && setSelectedDate(dayNumber)}
                      >
                        <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                          isSelected ? 'text-teal-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {dayNumber}
                        </div>

                        {/* Events */}
                        <div className="space-y-1 flex-1 overflow-hidden">
                          {allDayEvents.slice(0, 3).map((event, eventIndex) => {
                            const isGHLEvent = event.calendarId;
                            const eventColor = isGHLEvent ? 'green' : event.color;

                            // Create unique key for each event
                            const eventKey = event.id
                              ? `event-${event.id}`
                              : `${isGHLEvent ? 'ghl' : 'local'}-${dayNumber}-${eventIndex}`;

                            return (
                              <motion.div
                                key={eventKey}
                                initial={{ opacity: 0, y: 2 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: eventIndex * 0.02 }}
                                className={`px-1 py-1 rounded text-xs font-medium border hover:shadow-sm transition-all duration-200 cursor-pointer ${
                                  isGHLEvent
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : getEventColor(eventColor)
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <Clock className="w-2 h-2 flex-shrink-0" />
                                  <span className="truncate font-medium">{event.time}</span>
                                  {isGHLEvent && (
                                    <span className="text-emerald-600 text-xs">●</span>
                                  )}
                                </div>
                                <div className="truncate mt-0.5 text-xs opacity-90">{event.title}</div>
                                {isGHLEvent && event.calendarName && (
                                  <div className="truncate text-xs opacity-75">{event.calendarName}</div>
                                )}
                              </motion.div>
                            );
                          })}
                          {allDayEvents.length > 3 && (
                            <div className="text-xs text-slate-500 px-1 py-0.5 bg-slate-100 rounded">
                              +{allDayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
