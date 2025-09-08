// ========================================
// 🎯 GHL DATE PARSER UTILITY
// ========================================

import { taskLogger } from './logger';

/**
 * Parse GHL task date from various possible field names and formats
 * @param {Object} task - The GHL task object
 * @returns {Object} - { date: Date, formattedDate: string, originalDate: any }
 */
export const parseGHLTaskDate = (task) => {
  // GHL might use different field names for due date
  const possibleDateFields = [
    'dueDate',
    'due_date',
    'due',
    'date',
    'scheduledDate',
    'scheduled_date',
    'startDate',
    'start_date',
    'endDate',
    'end_date',
  ];

  let taskDateStr = null;
  let fieldName = null;

  // Find the first available date field
  for (const field of possibleDateFields) {
    if (task[field]) {
      taskDateStr = task[field];
      fieldName = field;
      break;
    }
  }

  if (!taskDateStr) {
    taskLogger.debug('No due date found for task:', {
      taskId: task._id || task.id,
      title: task.title,
      availableFields: Object.keys(task).filter(key => key.toLowerCase().includes('date')),
    });
    return { date: null, formattedDate: null, originalDate: null, fieldName: null };
  }

  try {
    // Handle different GHL date formats
    let taskDate;

    if (typeof taskDateStr === 'string') {
      // Try parsing different date formats
      if (taskDateStr.includes('T')) {
        // ISO format: "2024-01-15T10:00:00Z" or "2024-01-15T10:00:00.000Z"
        taskDate = new Date(taskDateStr);
      } else if (taskDateStr.includes('/')) {
        // US format: "01/15/2024" or "1/15/2024"
        const parts = taskDateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          taskDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          taskDate = new Date(taskDateStr);
        }
      } else if (taskDateStr.includes('-')) {
        // ISO date format: "2024-01-15"
        if (taskDateStr.length === 10) {
          taskDate = new Date(taskDateStr + 'T00:00:00');
        } else {
          taskDate = new Date(taskDateStr);
        }
      } else {
        // Try default parsing
        taskDate = new Date(taskDateStr);
      }
    } else if (taskDateStr instanceof Date) {
      taskDate = taskDateStr;
    } else if (typeof taskDateStr === 'number') {
      // Unix timestamp
      taskDate = new Date(taskDateStr);
    } else {
      taskDate = new Date(taskDateStr);
    }

    if (isNaN(taskDate.getTime())) {
      taskLogger.warn('Invalid date for task:', {
        taskId: task._id || task.id,
        title: task.title,
        dateStr: taskDateStr,
        type: typeof taskDateStr,
        fieldName,
      });
      return { date: null, formattedDate: null, originalDate: taskDateStr, fieldName };
    }

    const formattedDate = taskDate.toISOString().split('T')[0];

    taskLogger.debug('Successfully parsed GHL date:', {
      taskId: task._id || task.id,
      title: task.title,
      fieldName,
      originalDate: taskDateStr,
      parsedDate: taskDate,
      formattedDate,
    });

    return {
      date: taskDate,
      formattedDate,
      originalDate: taskDateStr,
      fieldName,
    };

  } catch (error) {
    taskLogger.error('Error parsing GHL date:', error, {
      taskId: task._id || task.id,
      title: task.title,
      dateStr: taskDateStr,
      fieldName,
    });
    return { date: null, formattedDate: null, originalDate: taskDateStr, fieldName };
  }
};

/**
 * Format date for display in the UI
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateForDisplay = (date) => {
  if (!date) return 'No due date';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch (error) {
    taskLogger.error('Error formatting date for display:', error);
    return 'Invalid date';
  }
};

/**
 * Check if a task is overdue
 * @param {Object} task - Task object with date information
 * @returns {boolean} - True if task is overdue
 */
export const isTaskOverdue = (task) => {
  if (!task) return false;

  const { date } = parseGHLTaskDate(task);
  if (!date) return false;

  const now = new Date();
  // Reset time to compare only dates
  const taskDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return taskDateOnly < nowDateOnly;
};

/**
 * Check if a task is due today
 * @param {Object} task - Task object with date information
 * @returns {boolean} - True if task is due today
 */
export const isTaskDueToday = (task) => {
  if (!task) return false;

  const { date } = parseGHLTaskDate(task);
  if (!date) return false;

  const now = new Date();
  const taskDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return taskDateOnly.getTime() === nowDateOnly.getTime();
};

/**
 * Check if a task is due within the next X days
 * @param {Object} task - Task object with date information
 * @param {number} days - Number of days to check
 * @returns {boolean} - True if task is due within specified days
 */
export const isTaskDueWithinDays = (task, days) => {
  if (!task) return false;

  const { date } = parseGHLTaskDate(task);
  if (!date) return false;

  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

  return date >= now && date <= futureDate;
};
