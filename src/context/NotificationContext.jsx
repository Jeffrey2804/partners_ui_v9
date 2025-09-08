// ========================================
// 🔔 GLOBAL NOTIFICATION CONTEXT
// ========================================
// Professional notification system for all CRUD operations
// Features:
// - Success, Error, Warning, Info notifications
// - Auto-dismiss with customizable duration
// - Professional animations and styling
// - Queue management for multiple notifications
// - Action buttons for notifications
// - Progress indicators for loading states
// ========================================

import React, { createContext, useState, useCallback, useRef } from 'react';
import NotificationContainer from '../shared/components/ui/NotificationContainer';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_POSITIONS,
  DEFAULT_DURATION,
} from '../constants/notifications';

// ========================================
// 🎯 NOTIFICATION CONTEXT
// ========================================

export const NotificationContext = createContext(undefined);

// ========================================
// 🎯 NOTIFICATION PROVIDER
// ========================================

export const NotificationProvider = ({
  children,
  position = NOTIFICATION_POSITIONS.TOP_RIGHT,
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutRefs = useRef(new Map());

  // ========================================
  // 🔧 UTILITY FUNCTIONS
  // ========================================

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }, []);

  const clearTimeout = useCallback((id) => {
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    clearTimeout(id);
  }, [clearTimeout]);

  const addNotification = useCallback((notification) => {
    const id = generateId();
    const newNotification = {
      id,
      timestamp: new Date(),
      position,
      duration: DEFAULT_DURATION[notification.type] || 4000,
      ...notification,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit notifications to maxNotifications
      if (updated.length > maxNotifications) {
        const toRemove = updated.slice(maxNotifications);
        toRemove.forEach(n => clearTimeout(n.id));
        return updated.slice(0, maxNotifications);
      }
      return updated;
    });

    // Auto-dismiss if duration is set
    if (newNotification.duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  }, [generateId, position, maxNotifications, clearTimeout, removeNotification]);

  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, ...updates } : n),
    );
  }, []);

  // ========================================
  // 🎯 NOTIFICATION METHODS
  // ========================================

  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: options.title || 'Success',
      message,
      icon: '✅',
      ...options,
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: options.title || 'Error',
      message,
      icon: '❌',
      ...options,
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title: options.title || 'Warning',
      message,
      icon: '⚠️',
      ...options,
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: options.title || 'Information',
      message,
      icon: 'ℹ️',
      ...options,
    });
  }, [addNotification]);

  const loading = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.LOADING,
      title: options.title || 'Loading',
      message,
      icon: '⏳',
      showSpinner: true,
      ...options,
    });
  }, [addNotification]);

  // ========================================
  // 🎯 SPECIALIZED CRUD METHODS
  // ========================================

  const crud = {
    // Create operations
    created: useCallback((resourceName, options = {}) => {
      return success(`${resourceName} created successfully`, {
        title: 'Created',
        icon: '🎉',
        ...options,
      });
    }, [success]),

    // Update operations
    updated: useCallback((resourceName, options = {}) => {
      return success(`${resourceName} updated successfully`, {
        title: 'Updated',
        icon: '✏️',
        ...options,
      });
    }, [success]),

    // Delete operations
    deleted: useCallback((resourceName, options = {}) => {
      return success(`${resourceName} deleted successfully`, {
        title: 'Deleted',
        icon: '🗑️',
        ...options,
      });
    }, [success]),

    // Bulk operations
    bulkCreated: useCallback((count, resourceName, options = {}) => {
      return success(`${count} ${resourceName} created successfully`, {
        title: 'Bulk Created',
        icon: '📦',
        ...options,
      });
    }, [success]),

    bulkUpdated: useCallback((count, resourceName, options = {}) => {
      return success(`${count} ${resourceName} updated successfully`, {
        title: 'Bulk Updated',
        icon: '📝',
        ...options,
      });
    }, [success]),

    bulkDeleted: useCallback((count, resourceName, options = {}) => {
      return success(`${count} ${resourceName} deleted successfully`, {
        title: 'Bulk Deleted',
        icon: '🗂️',
        ...options,
      });
    }, [success]),

    // Status operations
    statusChanged: useCallback((resourceName, newStatus, options = {}) => {
      return success(`${resourceName} status changed to ${newStatus}`, {
        title: 'Status Updated',
        icon: '🔄',
        ...options,
      });
    }, [success]),

    // Import/Export operations
    imported: useCallback((count, resourceName, options = {}) => {
      return success(`${count} ${resourceName} imported successfully`, {
        title: 'Import Complete',
        icon: '📤',
        ...options,
      });
    }, [success]),

    exported: useCallback((count, resourceName, options = {}) => {
      return success(`${count} ${resourceName} exported successfully`, {
        title: 'Export Complete',
        icon: '📥',
        ...options,
      });
    }, [success]),

    // API operation errors
    createError: useCallback((resourceName, errorMessage, options = {}) => {
      return error(`Failed to create ${resourceName}: ${errorMessage}`, {
        title: 'Create Failed',
        icon: '❌',
        ...options,
      });
    }, [error]),

    updateError: useCallback((resourceName, errorMessage, options = {}) => {
      return error(`Failed to update ${resourceName}: ${errorMessage}`, {
        title: 'Update Failed',
        icon: '❌',
        ...options,
      });
    }, [error]),

    deleteError: useCallback((resourceName, errorMessage, options = {}) => {
      return error(`Failed to delete ${resourceName}: ${errorMessage}`, {
        title: 'Delete Failed',
        icon: '❌',
        ...options,
      });
    }, [error]),

    // Connection errors
    connectionError: useCallback((service, options = {}) => {
      return error(`Connection to ${service} failed. Please check your connection and try again.`, {
        title: 'Connection Error',
        icon: '🔌',
        duration: 8000,
        ...options,
      });
    }, [error]),

    // Validation errors
    validationError: useCallback((message, options = {}) => {
      return warning(message, {
        title: 'Validation Error',
        icon: '⚠️',
        ...options,
      });
    }, [warning]),
  };

  // ========================================
  // 🎯 PROMISE-BASED OPERATIONS
  // ========================================

  const promise = useCallback(async (
    promiseFunction,
    {
      loading: loadingMessage = 'Processing...',
      success: successMessage,
      error: errorMessage,
      ...options
    } = {},
  ) => {
    // Show loading notification
    const loadingId = loading(loadingMessage, options);

    try {
      const result = await promiseFunction();

      // Remove loading notification
      removeNotification(loadingId);

      // Show success notification
      if (successMessage) {
        success(successMessage, options);
      }

      return result;
    } catch (err) {
      // Remove loading notification
      removeNotification(loadingId);

      // Show error notification
      const message = errorMessage || err.message || 'An error occurred';
      error(message, options);

      throw err;
    }
  }, [loading, removeNotification, success, error]);

  // ========================================
  // 🎯 CONTEXT VALUE
  // ========================================

  const value = {
    notifications,
    // Basic methods
    success,
    error,
    warning,
    info,
    loading,
    // Management
    remove: removeNotification,
    update: updateNotification,
    clear: () => setNotifications([]),
    // CRUD methods
    crud,
    // Promise wrapper
    promise,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        position={position}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
