// ========================================
// 🔔 USE NOTIFICATION API HOOK
// ========================================
// React hook for managing calendar notifications with the notification API service
// Provides a clean, React-friendly interface for all notification operations
//
// Features:
// - ✅ React hooks for state management
// - ✅ Loading states and error handling
// - ✅ Automatic data refetching
// - ✅ Optimistic updates
// - ✅ Caching and memoization
// ========================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '@hooks/useNotification';
import notificationApi from '@shared/services/api/notificationApi';

/**
 * 🎯 useNotificationApi - Main hook for notification API operations
 * @param {string} calendarId - The calendar ID to manage notifications for
 * @param {Object} options - Configuration options
 * @returns {Object} Notification data and operations
 */
export const useNotificationApi = (calendarId, options = {}) => {
  const {
    autoFetch = true,
    includeDeleted = false,
    activeOnly = false,
  } = options;

  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const notification = useNotification();

  // ============================================================================
  // 📥 FETCH OPERATIONS
  // ============================================================================

  const fetchNotifications = useCallback(async (filters = {}) => {
    if (!calendarId) return;

    setLoading(true);
    setError(null);

    try {
      const defaultFilters = {
        isActive: activeOnly ? true : undefined,
        deleted: includeDeleted,
        ...filters,
      };

      const response = await notificationApi.fetchCalendarNotifications(
        calendarId,
        defaultFilters,
      );

      if (response.success) {
        setNotifications(response.data);
        setLastFetched(new Date());
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to fetch notifications: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [calendarId, activeOnly, includeDeleted, notification]);

  const refetch = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  // ============================================================================
  // ➕ CREATE OPERATIONS
  // ============================================================================

  const createNotification = useCallback(async (notificationData) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationApi.createSingleNotification(
        calendarId,
        notificationData,
      );

      if (response.success) {
        // Optimistic update
        setNotifications(prev => [...prev, response.data]);
        notification.success('Notification created successfully');
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to create notification: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, notification]);

  const createBulkNotifications = useCallback(async (notificationsData) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationApi.createCalendarNotifications(
        calendarId,
        notificationsData,
      );

      if (response.success) {
        // Optimistic update
        setNotifications(prev => [...prev, ...response.data]);
        notification.success(`${response.data.length} notifications created successfully`);
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to create bulk notifications: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, notification]);

  // ============================================================================
  // 📝 UPDATE OPERATIONS
  // ============================================================================

  const updateNotification = useCallback(async (notificationId, updateData) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationApi.updateNotification(
        calendarId,
        notificationId,
        updateData,
      );

      if (response.success) {
        // Optimistic update
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, ...response.data } : notif,
          ),
        );
        notification.success('Notification updated successfully');
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to update notification: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, notification]);

  const toggleStatus = useCallback(async (notificationIds, isActive) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationApi.toggleNotificationStatus(
        calendarId,
        Array.isArray(notificationIds) ? notificationIds : [notificationIds],
        isActive,
      );

      if (response.success) {
        // Optimistic update
        const idsArray = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
        setNotifications(prev =>
          prev.map(notif =>
            idsArray.includes(notif.id) ? { ...notif, isActive } : notif,
          ),
        );
        notification.success(`Notifications ${isActive ? 'activated' : 'deactivated'}`);
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to toggle notification status: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, notification]);

  // ============================================================================
  // 🗑️ DELETE OPERATIONS
  // ============================================================================

  const deleteNotification = useCallback(async (notificationId) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationApi.deleteNotification(calendarId, notificationId);

      if (response.success) {
        // Optimistic update
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        notification.success('Notification deleted successfully');
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to delete notification: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, notification]);

  const deleteBulkNotifications = useCallback(async (notificationIds) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationApi.bulkDeleteNotifications(
        calendarId,
        notificationIds,
      );

      if (response.success) {
        // Optimistic update
        setNotifications(prev =>
          prev.filter(notif => !notificationIds.includes(notif.id)),
        );
        notification.success(`${response.data.successful} notifications deleted`);
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      notification.error(`Failed to delete notifications: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, notification]);

  // ============================================================================
  // 📊 COMPUTED VALUES
  // ============================================================================

  const statistics = useMemo(() => {
    if (notifications.length === 0) return null;
    return notificationApi.getNotificationStatistics(notifications);
  }, [notifications]);

  const activeNotifications = useMemo(() => {
    return notificationApi.getActiveNotifications(notifications);
  }, [notifications]);

  const notificationsByType = useMemo(() => {
    return notificationApi.groupNotificationsByType(notifications);
  }, [notifications]);

  // ============================================================================
  // 🎯 TEMPLATE HELPERS
  // ============================================================================

  const templates = useMemo(() => {
    return notificationApi.getNotificationTemplates();
  }, []);

  const createFromTemplate = useCallback(async (templateName, customData = {}) => {
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const notificationData = { ...template, ...customData };
    return createNotification(notificationData);
  }, [templates, createNotification]);

  // ============================================================================
  // 🔄 AUTO-FETCH EFFECT
  // ============================================================================

  useEffect(() => {
    if (autoFetch && calendarId) {
      fetchNotifications();
    }
  }, [autoFetch, calendarId, fetchNotifications]);

  // ============================================================================
  // 🎯 RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Data
    notifications,
    statistics,
    activeNotifications,
    notificationsByType,
    templates,

    // State
    loading,
    error,
    lastFetched,

    // Operations
    fetchNotifications,
    refetch,
    createNotification,
    createBulkNotifications,
    createFromTemplate,
    updateNotification,
    toggleStatus,
    deleteNotification,
    deleteBulkNotifications,

    // Utilities
    clearError: () => setError(null),
    isReady: !loading && !error && lastFetched,
  };
};

/**
 * 🎯 useNotificationTemplates - Hook for notification templates
 * @returns {Object} Available notification templates
 */
export const useNotificationTemplates = () => {
  return useMemo(() => {
    return notificationApi.getNotificationTemplates();
  }, []);
};

/**
 * 🎯 useNotificationStats - Hook for notification statistics
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Notification statistics
 */
export const useNotificationStats = (notifications) => {
  return useMemo(() => {
    if (!notifications || notifications.length === 0) return null;
    return notificationApi.getNotificationStatistics(notifications);
  }, [notifications]);
};

/**
 * 🎯 useNotificationFilters - Hook for filtering notifications
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Filtered notification utilities
 */
export const useNotificationFilters = (notifications) => {
  const filterByType = useCallback((type) => {
    return notificationApi.filterNotificationsByType(notifications, type);
  }, [notifications]);

  const getActive = useCallback(() => {
    return notificationApi.getActiveNotifications(notifications);
  }, [notifications]);

  const groupByType = useCallback(() => {
    return notificationApi.groupNotificationsByType(notifications);
  }, [notifications]);

  return {
    filterByType,
    getActive,
    groupByType,
    all: notifications,
  };
};

export default useNotificationApi;
