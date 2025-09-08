/**
 * Application Constants
 * Centralized configuration for the dashboard application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://services.leadconnectorhq.com',
  VERSION: '2021-07-28',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Application Configuration
export const APP_CONFIG = {
  NAME: 'Professional Dashboard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern dashboard application for business management',
  AUTHOR: 'Development Team',
  SUPPORT_EMAIL: 'support@example.com',
};

// UI Configuration
export const UI_CONFIG = {
  THEME: {
    PRIMARY_COLOR: '#01818E',
    SECONDARY_COLOR: '#64748b',
    SUCCESS_COLOR: '#10b981',
    WARNING_COLOR: '#f59e0b',
    ERROR_COLOR: '#ef4444',
    INFO_COLOR: '#3b82f6',
  },
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    EASING: {
      EASE_IN: 'ease-in',
      EASE_OUT: 'ease-out',
      EASE_IN_OUT: 'ease-in-out',
    },
  },
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
};

// Pipeline Configuration
export const PIPELINE_CONFIG = {
  STAGES: [
    { title: 'New Lead', color: 'bg-blue-500', order: 1 },
    { title: 'Contacted', color: 'bg-yellow-500', order: 2 },
    { title: 'Application Started', color: 'bg-purple-500', order: 3 },
    { title: 'Pre-Approved', color: 'bg-green-500', order: 4 },
    { title: 'In Underwriting', color: 'bg-orange-500', order: 5 },
    { title: 'Closed', color: 'bg-gray-500', order: 6 },
  ],
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_LEADS_PER_STAGE: 100,
  DEFAULT_TAGS: ['High Priority', 'Follow Up', 'Meeting Scheduled'],
};

// Task Configuration
export const TASK_CONFIG = {
  PRIORITIES: ['Low', 'Medium', 'High', 'Urgent'],
  CATEGORIES: ["Today's Tasks", 'Overdue Tasks', 'Upcoming in 48 Hours'],
  STATUSES: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
  DUE_DATE_FORMAT: 'YYYY-MM-DD',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'dashboard_user_preferences',
  THEME: 'dashboard_theme',
  SIDEBAR_COLLAPSED: 'dashboard_sidebar_collapsed',
  RECENT_ACTIVITIES: 'dashboard_recent_activities',
  PIPELINE_FILTERS: 'dashboard_pipeline_filters',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  API_ERROR: 'An error occurred while fetching data. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LEAD_CREATED: 'Lead created successfully!',
  LEAD_UPDATED: 'Lead updated successfully!',
  LEAD_DELETED: 'Lead deleted successfully!',
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  TASK_DELETED: 'Task deleted successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]{10,}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-ddTHH:mm:ss.SSSZ',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// Feature Flags
export const FEATURES = {
  DARK_MODE: true,
  REAL_TIME_UPDATES: true,
  EXPORT_DATA: true,
  BULK_ACTIONS: true,
  ADVANCED_FILTERS: true,
  ANALYTICS: true,
  NOTIFICATIONS: true,
};
