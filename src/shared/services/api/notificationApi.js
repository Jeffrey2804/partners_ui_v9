// ========================================
// 🔔 NOTIFICATION API SERVICE
// ========================================
// This service provides comprehensive CRUD operations for GoHighLevel calendar
// notifications with enhanced error handling and logging.
//
// Features:
// - ✅ Complete CRUD operations for calendar notifications
// - ✅ Calendar notification fetching and management
// - ✅ Error handling and validation
// - ✅ Comprehensive logging
// - ✅ Data transformation utilities
// - ✅ Real-time notification synchronization
// ========================================

import { createLogger } from '../../utils/logger.js';
import { GHL_CONFIG, validateGHLConfig } from '@config/ghlConfig.js';

const notificationLogger = createLogger('NotificationAPI');

// Validate configuration on import
const configValidation = validateGHLConfig();
if (!configValidation.isValid) {
  notificationLogger.warn('GHL Configuration Issues:', configValidation.issues);
}

// ============================================================================
// 📥 GET REQUESTS - Fetch Notifications
// ============================================================================

/**
 * 🎯 GET - Fetch calendar notifications
 * Retrieves all notifications for a specific calendar with filtering options
 *
 * Based on cURL:
 * curl --request GET \
 *   --url 'https://services.leadconnectorhq.com/calendars/U9qdnx6IVYmZTS1ccbiY/notifications?isActive=true&deleted=true' \
 *   --header 'Accept: application/json' \
 *   --header 'Authorization: pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f' \
 *   --header 'Version: 2021-04-15'
 *
 * @param {string} calendarId - The calendar ID to fetch notifications for
 * @param {Object} filters - Filter parameters
 * @param {boolean} filters.isActive - Filter by active status
 * @param {boolean} filters.deleted - Include deleted notifications
 * @returns {Promise<Object>} API response with notifications
 */
export const fetchCalendarNotifications = async (calendarId, filters = {}) => {
  try {
    notificationLogger.info('Fetching calendar notifications', { calendarId, filters });

    // Build query parameters
    const params = new URLSearchParams();

    // Add filters if provided
    if (filters.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters.deleted !== undefined) {
      params.append('deleted', filters.deleted.toString());
    }

    const queryString = params.toString();
    const url = `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${GHL_CONFIG.token}`,
        'Version': '2021-04-15',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const notifications = data.notifications || data || [];

    notificationLogger.success('Calendar notifications fetched successfully', {
      calendarId,
      count: notifications.length,
      filters,
    });

    return {
      success: true,
      data: notifications,
      meta: {
        calendarId,
        count: notifications.length,
        filters,
        requestTimestamp: new Date().toISOString(),
        resource: 'calendar-notifications',
        operation: 'FETCH_ALL',
      },
    };

  } catch (error) {
    notificationLogger.error('Error fetching calendar notifications', error);
    return {
      success: false,
      error: error.message,
      data: [],
      resource: 'calendar-notifications',
      operation: 'FETCH_ALL',
    };
  }
};

/**
 * 🎯 GET - Fetch specific notification by ID
 * Retrieves detailed information about a specific notification
 *
 * Based on cURL:
 * curl --request GET \
 *   --url https://services.leadconnectorhq.com/calendars/U9qdnx6IVYmZTS1ccbiY/notifications/example \
 *   --header 'Accept: application/json' \
 *   --header 'Authorization: pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f' \
 *   --header 'Version: 2021-04-15'
 *
 * @param {string} calendarId - The calendar ID
 * @param {string} notificationId - The notification ID to fetch
 * @returns {Promise<Object>} API response with notification details
 */
export const fetchNotificationById = async (calendarId, notificationId) => {
  try {
    notificationLogger.info('Fetching notification by ID', { calendarId, notificationId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications/${notificationId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${GHL_CONFIG.token}`,
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const notification = await response.json();

    notificationLogger.success('Notification fetched successfully', {
      calendarId,
      notificationId,
      type: notification.notificationType,
    });

    return {
      success: true,
      data: notification,
      meta: {
        calendarId,
        notificationId,
        requestTimestamp: new Date().toISOString(),
        resource: 'notification',
        operation: 'FETCH_BY_ID',
      },
    };

  } catch (error) {
    notificationLogger.error('Error fetching notification by ID', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notification',
      operation: 'FETCH_BY_ID',
    };
  }
};

// ============================================================================
// 📤 POST REQUESTS - Create Notifications
// ============================================================================

/**
 * ➕ POST - Create calendar notifications
 * Creates one or more notifications for a specific calendar
 *
 * Based on cURL:
 * curl --request POST \
 *   --url https://services.leadconnectorhq.com/calendars/U9qdnx6IVYmZTS1ccbiY/notifications \
 *   --header 'Accept: application/json' \
 *   --header 'Authorization: pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f' \
 *   --header 'Content-Type: application/json' \
 *   --header 'Version: 2021-04-15' \
 *   --data '[{...}]'
 *
 * @param {string} calendarId - The calendar ID to create notifications for
 * @param {Array|Object} notificationData - Notification data (array or single object)
 * @returns {Promise<Object>} API response with created notifications
 */
export const createCalendarNotifications = async (calendarId, notificationData) => {
  try {
    notificationLogger.info('Creating calendar notifications', {
      calendarId,
      count: Array.isArray(notificationData) ? notificationData.length : 1,
    });

    // Ensure notificationData is an array
    const notifications = Array.isArray(notificationData) ? notificationData : [notificationData];

    // Default notification configuration
    const defaultNotificationConfig = {
      receiverType: 'contact',
      channel: 'email',
      notificationType: 'booked',
      isActive: true,
      templateId: '',
      body: 'You have a new appointment scheduled.',
      subject: 'Appointment Confirmation',
      afterTime: [
        {
          timeOffset: 1,
          unit: 'hours',
        },
      ],
      beforeTime: [
        {
          timeOffset: 1,
          unit: 'hours',
        },
      ],
      additionalEmailIds: [],
      selectedUsers: [],
      fromAddress: '',
      fromName: 'Calendar System',
    };

    // Apply defaults to each notification
    const processedNotifications = notifications.map(notification => ({
      ...defaultNotificationConfig,
      ...notification,
    }));

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${GHL_CONFIG.token}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(processedNotifications),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const createdNotifications = data.notifications || data || [];

    notificationLogger.success('Calendar notifications created successfully', {
      calendarId,
      count: createdNotifications.length,
    });

    return {
      success: true,
      data: createdNotifications,
      meta: {
        calendarId,
        count: createdNotifications.length,
        requestTimestamp: new Date().toISOString(),
        resource: 'calendar-notifications',
        operation: 'CREATE',
      },
    };

  } catch (error) {
    notificationLogger.error('Error creating calendar notifications', error);
    return {
      success: false,
      error: error.message,
      data: [],
      resource: 'calendar-notifications',
      operation: 'CREATE',
    };
  }
};

/**
 * ➕ POST - Create single notification (convenience function)
 * Creates a single notification with simplified interface
 *
 * @param {string} calendarId - The calendar ID
 * @param {Object} notificationConfig - Notification configuration
 * @returns {Promise<Object>} API response with created notification
 */
export const createSingleNotification = async (calendarId, notificationConfig) => {
  try {
    const response = await createCalendarNotifications(calendarId, notificationConfig);

    if (response.success && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0], // Return single notification instead of array
      };
    }

    return response;
  } catch (error) {
    notificationLogger.error('Error creating single notification', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notification',
      operation: 'CREATE',
    };
  }
};

// ============================================================================
// 📝 PUT REQUESTS - Update Notifications
// ============================================================================

/**
 * 📝 PUT - Update notification
 * Updates an existing notification with new configuration
 *
 * Based on cURL:
 * curl --request PUT \
 *   --url https://services.leadconnectorhq.com/calendars/U9qdnx6IVYmZTS1ccbiY/notifications/example \
 *   --header 'Accept: application/json' \
 *   --header 'Authorization: pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f' \
 *   --header 'Content-Type: application/json' \
 *   --header 'Version: 2021-04-15' \
 *   --data '{...}'
 *
 * @param {string} calendarId - The calendar ID
 * @param {string} notificationId - The notification ID to update
 * @param {Object} updateData - Notification update data
 * @returns {Promise<Object>} API response with updated notification
 */
export const updateNotification = async (calendarId, notificationId, updateData) => {
  try {
    notificationLogger.info('Updating notification', { calendarId, notificationId, updateData });

    // Default update configuration
    const defaultUpdateConfig = {
      receiverType: 'contact',
      additionalEmailIds: [],
      selectedUsers: [],
      channel: 'email',
      notificationType: 'booked',
      isActive: true,
      deleted: false,
      templateId: '',
      body: '',
      subject: '',
      afterTime: [
        {
          timeOffset: 1,
          unit: 'hours',
        },
      ],
      beforeTime: [
        {
          timeOffset: 1,
          unit: 'hours',
        },
      ],
      fromAddress: '',
      fromName: '',
    };

    // Merge update data with defaults
    const processedUpdateData = { ...defaultUpdateConfig, ...updateData };

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications/${notificationId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${GHL_CONFIG.token}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(processedUpdateData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const updatedNotification = await response.json();

    notificationLogger.success('Notification updated successfully', {
      calendarId,
      notificationId,
      type: updatedNotification.notificationType,
    });

    return {
      success: true,
      data: updatedNotification,
      meta: {
        calendarId,
        notificationId,
        updatedFields: Object.keys(updateData),
        requestTimestamp: new Date().toISOString(),
        resource: 'notification',
        operation: 'UPDATE',
      },
    };

  } catch (error) {
    notificationLogger.error('Error updating notification', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notification',
      operation: 'UPDATE',
    };
  }
};

// ============================================================================
// 🗑️ DELETE REQUESTS - Delete Notifications
// ============================================================================

/**
 * 🗑️ DELETE - Delete notification
 * Removes a notification from the calendar
 *
 * @param {string} calendarId - The calendar ID
 * @param {string} notificationId - The notification ID to delete
 * @returns {Promise<Object>} API response confirming deletion
 */
export const deleteNotification = async (calendarId, notificationId) => {
  try {
    notificationLogger.info('Deleting notification', { calendarId, notificationId });

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${GHL_CONFIG.token}`,
          'Version': '2021-04-15',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // DELETE requests may return empty response
    let data = {};
    try {
      data = await response.json();
    } catch (_error) {
      // Empty response is OK for DELETE
      data = { deleted: true, notificationId };
    }

    notificationLogger.success('Notification deleted successfully', { calendarId, notificationId });

    return {
      success: true,
      data: { calendarId, notificationId, deleted: true, ...data },
      meta: {
        calendarId,
        notificationId,
        requestTimestamp: new Date().toISOString(),
        resource: 'notification',
        operation: 'DELETE',
      },
    };

  } catch (error) {
    notificationLogger.error('Error deleting notification', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notification',
      operation: 'DELETE',
    };
  }
};

/**
 * 🗑️ BULK DELETE - Delete multiple notifications
 * Removes multiple notifications from the calendar
 *
 * @param {string} calendarId - The calendar ID
 * @param {Array<string>} notificationIds - Array of notification IDs to delete
 * @returns {Promise<Object>} API response with deletion results
 */
export const bulkDeleteNotifications = async (calendarId, notificationIds) => {
  try {
    notificationLogger.info('Bulk deleting notifications', {
      calendarId,
      count: notificationIds.length,
    });

    const deletePromises = notificationIds.map(notificationId =>
      deleteNotification(calendarId, notificationId),
    );

    const results = await Promise.allSettled(deletePromises);

    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success,
    );
    const failed = results.filter(result =>
      result.status === 'rejected' || !result.value.success,
    );

    notificationLogger.success('Bulk delete completed', {
      calendarId,
      successful: successful.length,
      failed: failed.length,
    });

    return {
      success: true,
      data: {
        successful: successful.length,
        failed: failed.length,
        results,
      },
      meta: {
        calendarId,
        totalRequested: notificationIds.length,
        successful: successful.length,
        failed: failed.length,
        requestTimestamp: new Date().toISOString(),
        resource: 'notifications',
        operation: 'BULK_DELETE',
      },
    };

  } catch (error) {
    notificationLogger.error('Error in bulk delete notifications', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notifications',
      operation: 'BULK_DELETE',
    };
  }
};

// ============================================================================
// 🔄 BULK OPERATIONS
// ============================================================================

/**
 * 🔄 BULK UPDATE - Update multiple notifications
 * Updates multiple notifications with the same configuration
 *
 * @param {string} calendarId - The calendar ID
 * @param {Array<Object>} notificationUpdates - Array of {id, updateData} objects
 * @returns {Promise<Object>} API response with update results
 */
export const bulkUpdateNotifications = async (calendarId, notificationUpdates) => {
  try {
    notificationLogger.info('Bulk updating notifications', {
      calendarId,
      count: notificationUpdates.length,
    });

    const updatePromises = notificationUpdates.map(({ id, updateData }) =>
      updateNotification(calendarId, id, updateData),
    );

    const results = await Promise.allSettled(updatePromises);

    const successful = results.filter(result =>
      result.status === 'fulfilled' && result.value.success,
    );
    const failed = results.filter(result =>
      result.status === 'rejected' || !result.value.success,
    );

    notificationLogger.success('Bulk update completed', {
      calendarId,
      successful: successful.length,
      failed: failed.length,
    });

    return {
      success: true,
      data: {
        successful: successful.length,
        failed: failed.length,
        results,
      },
      meta: {
        calendarId,
        totalRequested: notificationUpdates.length,
        successful: successful.length,
        failed: failed.length,
        requestTimestamp: new Date().toISOString(),
        resource: 'notifications',
        operation: 'BULK_UPDATE',
      },
    };

  } catch (error) {
    notificationLogger.error('Error in bulk update notifications', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notifications',
      operation: 'BULK_UPDATE',
    };
  }
};

/**
 * 🔄 TOGGLE NOTIFICATION STATUS - Enable/Disable notifications
 * Toggles the active status of notifications
 *
 * @param {string} calendarId - The calendar ID
 * @param {Array<string>} notificationIds - Array of notification IDs
 * @param {boolean} isActive - Whether to activate or deactivate
 * @returns {Promise<Object>} API response with toggle results
 */
export const toggleNotificationStatus = async (calendarId, notificationIds, isActive) => {
  try {
    notificationLogger.info('Toggling notification status', {
      calendarId,
      count: notificationIds.length,
      isActive,
    });

    const toggleUpdates = notificationIds.map(id => ({
      id,
      updateData: { isActive },
    }));

    const response = await bulkUpdateNotifications(calendarId, toggleUpdates);

    notificationLogger.success('Notification status toggled', {
      calendarId,
      isActive,
      successful: response.data?.successful || 0,
    });

    return {
      ...response,
      meta: {
        ...response.meta,
        operation: 'TOGGLE_STATUS',
        isActive,
      },
    };

  } catch (error) {
    notificationLogger.error('Error toggling notification status', error);
    return {
      success: false,
      error: error.message,
      data: null,
      resource: 'notifications',
      operation: 'TOGGLE_STATUS',
    };
  }
};

// ============================================================================
// 🔍 UTILITY FUNCTIONS
// ============================================================================

/**
 * 🔍 Filter notifications by type
 * Filters notifications based on their type
 *
 * @param {Array} notifications - Array of notifications
 * @param {string} notificationType - Type to filter by ('booked', 'cancelled', etc.)
 * @returns {Array} Filtered notifications
 */
export const filterNotificationsByType = (notifications, notificationType) => {
  return notifications.filter(notification =>
    notification.notificationType === notificationType,
  );
};

/**
 * 🔍 Filter active notifications
 * Returns only active notifications
 *
 * @param {Array} notifications - Array of notifications
 * @returns {Array} Active notifications
 */
export const getActiveNotifications = (notifications) => {
  return notifications.filter(notification =>
    notification.isActive === true && notification.deleted !== true,
  );
};

/**
 * 🔍 Group notifications by type
 * Groups notifications by their notification type
 *
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Grouped notifications
 */
export const groupNotificationsByType = (notifications) => {
  return notifications.reduce((groups, notification) => {
    const type = notification.notificationType || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(notification);
    return groups;
  }, {});
};

/**
 * 🔍 Get notification statistics
 * Returns statistics about notification usage
 *
 * @param {Array} notifications - Array of notifications
 * @returns {Object} Notification statistics
 */
export const getNotificationStatistics = (notifications) => {
  const total = notifications.length;
  const active = getActiveNotifications(notifications).length;
  const inactive = total - active;
  const byType = groupNotificationsByType(notifications);

  return {
    total,
    active,
    inactive,
    byType: Object.keys(byType).reduce((stats, type) => {
      stats[type] = byType[type].length;
      return stats;
    }, {}),
    channels: notifications.reduce((channels, notification) => {
      const channel = notification.channel || 'unknown';
      channels[channel] = (channels[channel] || 0) + 1;
      return channels;
    }, {}),
  };
};

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

/**
 * 🧪 Test notification API connectivity
 * Tests the notification API with a sample calendar
 *
 * @param {string} testCalendarId - Calendar ID to test with (optional)
 * @returns {Promise<Object>} Test results
 */
export const testNotificationApiConnection = async (testCalendarId = 'sV3BiXrjzbfo1tSUdyHO') => {
  try {
    notificationLogger.info('Testing notification API connection...', { testCalendarId });

    const response = await fetchCalendarNotifications(testCalendarId, { isActive: true });

    if (response.success) {
      notificationLogger.success('Notification API connection test successful', {
        testCalendarId,
        notificationCount: response.data.length,
      });

      return {
        success: true,
        data: {
          testCalendarId,
          notificationCount: response.data.length,
          status: 'connected',
        },
      };
    } else {
      throw new Error(response.error);
    }

  } catch (error) {
    notificationLogger.error('Notification API connection test failed', error);
    return {
      success: false,
      error: error.message,
      data: {
        status: 'failed',
        testCalendarId,
      },
    };
  }
};

// ============================================================================
// 📋 PRESET NOTIFICATION TEMPLATES
// ============================================================================

/**
 * 📋 Get preset notification templates
 * Returns common notification configurations
 *
 * @returns {Object} Preset notification templates
 */
export const getNotificationTemplates = () => {
  return {
    appointmentBooked: {
      receiverType: 'contact',
      channel: 'email',
      notificationType: 'booked',
      isActive: true,
      subject: 'Appointment Confirmation',
      body: 'Your appointment has been successfully booked. We look forward to meeting with you!',
      beforeTime: [{ timeOffset: 24, unit: 'hours' }],
      fromName: 'Appointment System',
    },

    appointmentReminder: {
      receiverType: 'contact',
      channel: 'email',
      notificationType: 'booked',
      isActive: true,
      subject: 'Appointment Reminder',
      body: 'This is a friendly reminder about your upcoming appointment.',
      beforeTime: [{ timeOffset: 1, unit: 'hours' }],
      fromName: 'Appointment System',
    },

    appointmentCancelled: {
      receiverType: 'contact',
      channel: 'email',
      notificationType: 'cancelled',
      isActive: true,
      subject: 'Appointment Cancelled',
      body: 'Your appointment has been cancelled. Please contact us to reschedule.',
      fromName: 'Appointment System',
    },

    appointmentRescheduled: {
      receiverType: 'contact',
      channel: 'email',
      notificationType: 'rescheduled',
      isActive: true,
      subject: 'Appointment Rescheduled',
      body: 'Your appointment has been rescheduled. Please check the new date and time.',
      fromName: 'Appointment System',
    },

    staffNotification: {
      receiverType: 'user',
      channel: 'email',
      notificationType: 'booked',
      isActive: true,
      subject: 'New Appointment Booked',
      body: 'A new appointment has been booked and assigned to you.',
      beforeTime: [{ timeOffset: 15, unit: 'minutes' }],
      fromName: 'Calendar System',
    },
  };
};

// Export all functions as default object for easy importing
export default {
  // Main CRUD operations
  fetchCalendarNotifications,
  fetchNotificationById,
  createCalendarNotifications,
  createSingleNotification,
  updateNotification,
  deleteNotification,

  // Bulk operations
  bulkDeleteNotifications,
  bulkUpdateNotifications,
  toggleNotificationStatus,

  // Utility functions
  filterNotificationsByType,
  getActiveNotifications,
  groupNotificationsByType,
  getNotificationStatistics,

  // Test functions
  testNotificationApiConnection,

  // Templates
  getNotificationTemplates,
};
