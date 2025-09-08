// ========================================
// 🎯 SHARED HOOKS EXPORTS
// ========================================

export { default as useLocalStorage } from './useLocalStorage';
export { default as useDebounce } from './useDebounce';
export { useAppInitialization, useTimezone } from './useAppInitialization';
export { useNotification } from '../../hooks/useNotification';

// GHL Integration Hook
export { default as useGHLIntegration } from '../../hooks/useGHLIntegration';

// Legacy hooks (to be refactored)
export { default as useAsync } from './useAsync';
export { default as useClickOutside } from './useClickOutside';
export { default as usePipelineCache } from './usePipelineCache';
export { default as usePrevious } from './usePrevious';
