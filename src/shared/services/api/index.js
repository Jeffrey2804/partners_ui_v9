// ========================================
// 🎯 API SERVICES EXPORTS
// ========================================

// Core API services
export { default as apiService } from './apiService';
export { default as appointmentsApi } from './appointmentsApi';
export { default as calendarApi } from './calendarApi';
export { default as campaignApi } from './campaignApi';
export { default as contactApi } from './contactApi';
export { default as notificationApi } from './notificationApi';
export { default as pipelineApi } from './pipelineApi';
export { default as taskApi } from './taskApi';
export { default as userApi } from './userApi';

// GHL Specific Services
export { getCalendarEvents, getCalendarDetails } from './ghlCalendarService';

// Unified GHL Integration Service (MAIN SERVICE - Use this for all CRUD operations)
export { default as ghlIntegration, GHLIntegrationService } from './ghlIntegrationService';
