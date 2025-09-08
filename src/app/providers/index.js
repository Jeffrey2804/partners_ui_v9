// ========================================
// 🎯 APP PROVIDERS EXPORTS
// ========================================

// Legacy providers (to be refactored)
export { default as UserContext, UserProvider } from './UserContext';
export { default as TaskContext, TaskProvider } from './TaskContext';
export { default as PipelineContext, PipelineProvider } from './PipelineContext';
export { default as RoleContext, RoleProvider } from './RoleContext';
export { default as CalendarContext, CalendarProvider } from './CalendarContext';

// Notification provider
export { NotificationProvider } from '../../context/NotificationContext';
