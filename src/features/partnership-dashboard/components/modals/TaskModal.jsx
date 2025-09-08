// ========================================
// 🎯 TASK MODAL COMPONENT FOR PARTNERSHIP DASHBOARD (CLEANED)
// - Removed unused ACCENT + modalRef
// - DRY'd initial form state
// - Preserved exit animations with conditional inside <AnimatePresence>
// - Header & button reflect Create vs Edit
// - Kept API JS (not TS) and added PropTypes
// - Preserves unknown fields from editingTask on save
// ========================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Plus } from 'lucide-react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  title: '',
  client: '',
  loan: '',
  dueDate: '',
  dueTime: '08:00',
  description: '',
  assignedTo: '',
  recurringTask: false,
  associatedContact: '',
};

const TaskModal = ({ isOpen, onClose, onSave, editingTask }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showDescription, setShowDescription] = useState(false);
  const firstInputRef = useRef(null);

  // Initialize/reset form when opening or editing
  useEffect(() => {
    if (!isOpen) return; // only hydrate when opening

    if (editingTask) {
      const next = {
        ...INITIAL_FORM,
        ...editingTask,
        // ensure primitives are strings/booleans as expected
        title: editingTask.title || '',
        client: editingTask.client || '',
        loan: editingTask.loan || '',
        dueDate: editingTask.dueDate || '',
        dueTime: editingTask.dueTime || '08:00',
        description: editingTask.description || '',
        assignedTo: editingTask.assignedTo || '',
        recurringTask: Boolean(editingTask.recurringTask),
        associatedContact: editingTask.associatedContact || '',
      };
      setFormData(next);
      setShowDescription(Boolean(next.description?.trim()));
    } else {
      setFormData(INITIAL_FORM);
      setShowDescription(false);
    }
    setErrors({});
  }, [editingTask, isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Task title is required';
    if (!formData.client.trim()) newErrors.client = 'Client name is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const taskData = {
      ...(editingTask || {}), // preserve unknown fields from existing task
      ...formData, // override with edited values
      id: editingTask?.id || Date.now(),
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(taskData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden={!isOpen}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="task-modal-title" className="text-xl font-bold">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {editingTask ? 'Update task details' : 'Add a new task to your workflow'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TASK TITLE *
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter a descriptive task title..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Add Description Button */}
                {!showDescription && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowDescription(true)}
                      className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors w-full"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="font-medium">Add description</span>
                    </button>
                  </div>
                )}

                {/* Description */}
                {showDescription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Add task description, notes, or additional details..."
                    />
                  </div>
                )}

                {/* Due Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DUE DATE & TIME *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.dueTime}
                        onChange={(e) => handleInputChange('dueTime', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>

                {/* Recurring Task Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Recurring Task
                    </label>
                    <p className="text-xs text-gray-500">Set this task to repeat automatically</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recurringTask}
                      onChange={(e) => handleInputChange('recurringTask', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Associated Contact and Assign To */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ASSOCIATED CONTACT
                    </label>
                    <select
                      value={formData.associatedContact}
                      onChange={(e) => handleInputChange('associatedContact', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select a contact...</option>
                      <option value="john-doe">John Doe</option>
                      <option value="jane-smith">Jane Smith</option>
                      <option value="mike-johnson">Mike Johnson</option>
                      <option value="sarah-wilson">Sarah Wilson</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ASSIGN TO
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select an assignee...</option>
                      <option value="john-doe">John Doe</option>
                      <option value="jane-smith">Jane Smith</option>
                      <option value="mike-johnson">Mike Johnson</option>
                      <option value="sarah-wilson">Sarah Wilson</option>
                    </select>
                  </div>
                </div>

                {/* Client Name and Loan Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={(e) => handleInputChange('client', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.client ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter client name..."
                    />
                    {errors.client && (
                      <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Number
                    </label>
                    <input
                      type="text"
                      value={formData.loan}
                      onChange={(e) => handleInputChange('loan', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="LN-2024-XXX"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

TaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editingTask: PropTypes.object,
};

TaskModal.defaultProps = {
  editingTask: null,
};

export default TaskModal;
