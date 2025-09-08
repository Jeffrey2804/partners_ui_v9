import React, { useState, useContext, useEffect, useRef, useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskContext } from '@context/TaskContext';
import ContactDropdown from './ContactDropdown';
import AssigneeDropdown from './AssigneeDropdown';

// --------------------------------------
// Modal: Create / Edit Task (JS, accessible, polished)
// --------------------------------------

const DEFAULT_TIME = '08:00';
const MODES = { CREATE: 'create', EDIT: 'edit' };

const isValidId = (id) =>
  !!id &&
  id !== 'null' &&
  id !== 'undefined' &&
  id !== 'contact-1' &&
  id.length > 5 &&
  !String(id).includes('demo') &&
  !String(id).includes('test');

const buildISOIfPossible = (date, time) => {
  if (!date) return '';
  const safeTime = time || DEFAULT_TIME; // HH:mm
  // Keep local tz; do not coerce to Z to match GHL expectations
  return `${date}T${safeTime}`;
};

const Modal = ({ isOpen, onClose, task = null, mode = MODES.EDIT }) => {
  const { addTask, updateTask, deleteTask } = useContext(TaskContext);

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(DEFAULT_TIME);
  const [isRecurring, setIsRecurring] = useState(false);
  const [contactId, setContactId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [errors, setErrors] = useState({ title: false, date: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const dateId = useId();
  const timeId = useId();

  // Hydrate state from incoming task or clear for create
  useEffect(() => {
    if (!isOpen) return; // don't thrash state when closed

    if (task) {
      setTitle(task.title || '');
      const desc = task.body || task.actions || '';
      setDescription(desc);
      setShowDescription(!!desc);
      setDate(task.date || task.dueDate || '');
      setTime(DEFAULT_TIME);
      setIsRecurring(false);
      setContactId(task.contactId || '');
      setAssigneeId(task.assigneeId || task.assignedTo || '');
    } else {
      // new task default
      setTitle('');
      setDescription('');
      setShowDescription(false);
      setDate('');
      setTime(DEFAULT_TIME);
      setIsRecurring(false);
      setContactId('');
      setAssigneeId('');
    }
    setErrors({ title: false, date: false });
  }, [isOpen, task]);

  // autofocus title when opened
  useEffect(() => {
    if (isOpen && titleInputRef.current) titleInputRef.current.focus();
  }, [isOpen]);

  // escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const validate = useCallback(() => {
    const next = { title: !title.trim(), date: !date };
    setErrors(next);
    return !next.title && !next.date;
  }, [title, date]);

  const buildTaskPayload = useCallback(() => {
    const dueDate = buildISOIfPossible(date, time);
    const payload = {
      title: title.trim(),
      body: showDescription ? description : '',
      dueDate,
      completed: false,
      isRecurring: !!isRecurring,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isValidId(contactId)) payload.contactId = contactId;
    if (isValidId(assigneeId)) payload.assignedTo = assigneeId;

    // drop empty
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
    });

    return payload;
  }, [title, description, showDescription, date, time, contactId, assigneeId, isRecurring]);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setShowDescription(false);
    setDate('');
    setTime(DEFAULT_TIME);
    setIsRecurring(false);
    setContactId('');
    setAssigneeId('');
    setErrors({ title: false, date: false });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      if (!validate()) return;

      setIsSubmitting(true);
      const payload = buildTaskPayload();

      try {
        if (mode === MODES.EDIT && task) {
          const taskId = task._id || task.id;
          if (!taskId) {
            // Error handling will be managed by global notification system
          } else {
            const result = await updateTask(taskId, { ...payload });
            if (!result || !result.success) {
              // Error handling will be managed by global notification system
            } else {
              // Success handling will be managed by global notification system
            }
          }
        } else if (mode === MODES.CREATE) {
          const result = await addTask('My Sales Tasks', payload);
          if (!result || !result.success) {
            // Error handling will be managed by global notification system
          } else {
            // Success handling will be managed by global notification system
          }
        }

        resetForm();
        onClose();
      } catch (_error) {
        // Error handling will be managed by global notification system
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, validate, buildTaskPayload, mode, task, updateTask, addTask, resetForm, onClose],
  );

  const handleDelete = useCallback(async () => {
    if (!task || (!task.id && !task._id)) {
      // Error handling will be managed by global notification system
      return;
    }
    try {
      setIsSubmitting(true);
      const taskId = task._id || task.id;
      const result = await deleteTask(taskId);
      if (!result || !result.success) {
        // Error handling will be managed by global notification system
        return;
      }
      // Success handling will be managed by global notification system
      onClose();
    } catch (_error) {
      // Error handling will be managed by global notification system
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTask, onClose, task]);

  return (
    <AnimatePresence>{isOpen && (
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 id={titleId} className="text-2xl font-bold tracking-tight">
                    {mode === MODES.EDIT ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <p id={descId} className="text-blue-100 text-sm mt-1">
                    {mode === MODES.EDIT ? 'Update your task details' : 'Add a new task to your workflow'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <div className="space-y-3">
                <label htmlFor={titleId} className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Task Title <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id={titleId}
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    errors.title
                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white'
                  }`}
                  placeholder="Enter a descriptive task title..."
                />
                {errors.title && (
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Task title is required
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                {showDescription ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label htmlFor={descId} className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Description
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDescription(false)}
                        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                        aria-controls={descId}
                        aria-expanded={showDescription}
                      >
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </div>
                        <span>Remove description</span>
                      </button>
                    </div>
                    <textarea
                      id={descId}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white resize-none"
                      rows={4}
                      placeholder="Provide detailed information about this task..."
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    className="w-full text-left p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                    aria-controls={descId}
                    aria-expanded={showDescription}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="font-medium text-blue-700">Add description</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Due Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Due Date & Time <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      id={dateId}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        errors.date
                          ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white'
                      }`}
                    />
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="relative">
                    <input
                      id={timeId}
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white"
                    />
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {errors.date && (
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Due date is required
                  </p>
                )}
              </div>

              {/* Recurring Toggle */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Recurring Task</label>
                    <p className="text-sm text-gray-600">Set this task to repeat automatically</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecurring((v) => !v)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                      isRecurring ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-pressed={isRecurring}
                    aria-label="Toggle recurring task"
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        isRecurring ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Contact & Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Associated Contact</label>
                  <ContactDropdown value={contactId} onChange={setContactId} placeholder="Select a contact..." />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Assign To</label>
                  <AssigneeDropdown value={assigneeId} onChange={setAssigneeId} placeholder="Select an assignee..." />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4">
                  {mode === MODES.EDIT && task && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDelete}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      Delete Task
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                      isSubmitting ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {mode === MODES.EDIT ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      mode === MODES.EDIT ? 'Update Task' : 'Create Task'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.object,
  mode: PropTypes.oneOf([MODES.CREATE, MODES.EDIT]),
};

export default Modal;
