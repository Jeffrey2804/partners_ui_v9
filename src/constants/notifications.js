// ========================================
// 🔔 NOTIFICATION CONSTANTS
// ========================================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
};

export const NOTIFICATION_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
};

export const DEFAULT_DURATION = {
  [NOTIFICATION_TYPES.SUCCESS]: 4000,
  [NOTIFICATION_TYPES.ERROR]: 6000,
  [NOTIFICATION_TYPES.WARNING]: 5000,
  [NOTIFICATION_TYPES.INFO]: 4000,
  [NOTIFICATION_TYPES.LOADING]: 0, // Manual dismiss
};
