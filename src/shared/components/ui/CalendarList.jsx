import { useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCalendar, FiX } from 'react-icons/fi';

const CalendarList = ({
  isOpen,
  onClose,
  availableCalendars = [],
  selectedCalendars = new Set(),
  onCalendarSelection = () => {},
  isLoading = false,
}) => {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Initial focus + simple focus trap within the modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusable = modalRef.current.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // move initial focus
    (closeBtnRef.current || first)?.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    modalRef.current.addEventListener('keydown', onKeyDown);
    return () => modalRef.current?.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleCalendarSelect = useCallback(
    (calendar) => {
      const isSelected = selectedCalendars.has(calendar.id);
      onCalendarSelection(calendar.id, calendar.name, !isSelected);
    },
    [onCalendarSelection, selectedCalendars],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="calendar-list-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            key="calendar-list-modal"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-list-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <FiCalendar className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="calendar-list-title" className="text-2xl font-bold text-gray-900">
                    Calendar List
                  </h2>
                  <p className="text-sm text-gray-600">Select calendars to view their scheduled items</p>
                </div>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading && availableCalendars.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-lg font-semibold text-gray-900">Loading calendars...</p>
                    <p className="text-sm text-gray-600">Fetching from GoHighLevel</p>
                  </div>
                </div>
              ) : availableCalendars.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FiCalendar className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden="true" />
                    <p className="text-lg font-semibold text-gray-900">No calendars found</p>
                    <p className="text-sm text-gray-600">Check your GHL configuration</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4" role="list" aria-label="Available calendars">
                  {availableCalendars.map((calendar) => {
                    const isSelected = selectedCalendars.has(calendar.id);

                    return (
                      <motion.div
                        role="listitem"
                        key={calendar.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-200 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Calendar Row */}
                        <div
                          className="flex items-center gap-4 cursor-pointer"
                          onClick={() => handleCalendarSelect(calendar)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            (e.key === 'Enter' || e.key === ' ') && handleCalendarSelect(calendar)
                          }
                        >
                          <label htmlFor={`cal-${calendar.id}`} className="flex cursor-pointer items-center">
                            <input
                              id={`cal-${calendar.id}`}
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleCalendarSelect(calendar)}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              aria-label={`Select ${calendar.name || 'calendar'}`}
                            />
                          </label>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {calendar.name || 'Unnamed Calendar'}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  calendar.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {calendar.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-gray-600">ID: {calendar.id}</span>
                              {Array.isArray(calendar.teamMembers) && (
                                <span className="text-gray-600">
                                  {calendar.teamMembers.length} team member
                                  {calendar.teamMembers.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600" aria-live="polite">
                  {selectedCalendars.size} of {availableCalendars.length} calendars selected
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalendarList;
