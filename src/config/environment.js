// ========================================
// 🌍 ENVIRONMENT CONFIGURATION
// ========================================

// API Configuration
export const API_CONFIG = {
  LOCAL_API: {
    baseUrl: import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5173',
  },
  LEAD_CONNECTOR: {
    baseUrl: 'https://services.leadconnectorhq.com',
    token: import.meta.env.VITE_LEAD_CONNECTOR_TOKEN || 'pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
    locationId: import.meta.env.VITE_LEAD_CONNECTOR_LOCATION_ID || 'b7vHWUGVUNQGoIlAXabY',
    version: '2021-07-28',
  },
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_CONSOLE_LOGGING: true, // Enable logging for debugging stage movement issue
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_AUTO_REFRESH: false,
  ENABLE_ERROR_BOUNDARIES: true,
};

// API endpoints
export const API_ENDPOINTS = {
  CONTACTS: '/contacts/',
  TAGS: '/tags/',
  CUSTOM_FIELDS: '/custom-fields/',
};

// Pipeline configuration
export const PIPELINE_CONFIG = {
  STAGES: [
    { title: 'New Lead', color: 'bg-teal-600', icon: '👤' },
    { title: 'Contacted', color: 'bg-gray-500', icon: '📞' },
    { title: 'Application Started', color: 'bg-blue-500', icon: '📝' },
    { title: 'Pre-Approved', color: 'bg-red-500', icon: '✅' },
    { title: 'In Underwriting', color: 'bg-orange-500', icon: '🔍' },
    { title: 'Closed', color: 'bg-green-500', icon: '🎯' },
  ],
  // Stage ID mapping for GoHighLevel API (update these with your actual stage IDs)
  STAGE_IDS: {
    'New Lead': '09uUMzJ8bTXWlLUsWJ6p-NewLead',
    'Contacted': '09uUMzJ8bTXWlLUsWJ6p-Contacted',
    'Application Started': '09uUMzJ8bTXWlLUsWJ6p-ApplicationStarted',
    'Pre-Approved': '09uUMzJ8bTXWlLUsWJ6p-PreApproved',
    'In Underwriting': '09uUMzJ8bTXWlLUsWJ6p-InUnderwriting',
    'Closed': '09uUMzJ8bTXWlLUsWJ6p-Closed',
  },
  STAGE_TAGS: {
    'New Lead': ['New Lead'],
    'Contacted': ['Contacted'],
    'Application Started': ['Application Started'],
    'Pre-Approved': ['Pre-Approved'],
    'In Underwriting': ['In Underwriting'],
    'Closed': ['Closed'],
  },
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,// 1 second
};
