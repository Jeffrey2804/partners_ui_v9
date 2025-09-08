import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

const CalendarDatePicker = ({
  selectedDate,
  onDateSelect,
  isOpen,
  onClose,
  minDate = null,
  maxDate = null,
  disabledDates = [],
  highlightedDates = [],
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (date < today) return true;

    // Check min/max date constraints
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;

    // Check disabled dates
    if (disabledDates.some(disabledDate =>
      date.toDateString() === new Date(disabledDate).toDateString(),
    )) return true;

    return false;
  };

  const isDateHighlighted = (date) => {
    if (!date) return false;
    return highlightedDates.some(highlightedDate =>
      date.toDateString() === new Date(highlightedDate).toDateString(),
    );
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === new Date(selectedDate).toDateString();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(date.toISOString().split('T')[0]);
      onClose();
    }
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[280px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              disabled={isDateDisabled(date)}
              className={`
                relative w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200
                ${!date ? 'invisible' : ''}
                ${isDateDisabled(date)
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-blue-50 cursor-pointer'
                }
                ${isDateSelected(date)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-700'
                }
                ${isDateHighlighted(date) && !isDateSelected(date)
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : ''
                }
                ${hoveredDate && date && hoveredDate.toDateString() === date.toDateString() && !isDateSelected(date)
                  ? 'ring-2 ring-blue-300'
                  : ''
                }
              `}
            >
              {date?.getDate()}

              {/* Today indicator */}
              {date && date.toDateString() === new Date().toDateString() && !isDateSelected(date) && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Selected</span>
              </div>
              {highlightedDates.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full"></div>
                  <span>Available</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
export default CalendarDatePicker;
