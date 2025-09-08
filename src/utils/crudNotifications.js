// ========================================
// 🔔 CRUD NOTIFICATION UTILITIES
// ========================================
// Utility functions and HOCs for integrating notifications with CRUD operations
// Features:
// - Automatic notifications for all CRUD operations
// - Customizable messages and behavior
// - Error handling with detailed messages
// - Batch operation support
// ========================================

import { useNotification } from '../hooks/useNotification';

// ========================================
// 🎯 CRUD OPERATION WRAPPER
// ========================================

export const useCrudNotifications = () => {
  const notification = useNotification();

  return {
    // ========================================
    // 🎯 CONTACT OPERATIONS
    // ========================================
    contacts: {
      create: async (createFn, contactData, customMessage) => {
        try {
          const result = await createFn(contactData);
          notification.crud.created(
            customMessage || `Contact "${contactData.name || 'New Contact'}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.createError('contact', error.message);
          throw error;
        }
      },

      update: async (updateFn, contactId, updates, customMessage) => {
        try {
          const result = await updateFn(contactId, updates);
          notification.crud.updated(
            customMessage || `Contact "${updates.name || contactId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.updateError('contact', error.message);
          throw error;
        }
      },

      delete: async (deleteFn, contactId, contactName, customMessage) => {
        try {
          const result = await deleteFn(contactId);
          notification.crud.deleted(
            customMessage || `Contact "${contactName || contactId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.deleteError('contact', error.message);
          throw error;
        }
      },

      bulkCreate: async (bulkCreateFn, contacts) => {
        try {
          const result = await bulkCreateFn(contacts);
          notification.crud.bulkCreated(contacts.length, 'contacts');
          return result;
        } catch (error) {
          notification.error(`Failed to create ${contacts.length} contacts: ${error.message}`);
          throw error;
        }
      },

      bulkDelete: async (bulkDeleteFn, contactIds) => {
        try {
          const result = await bulkDeleteFn(contactIds);
          notification.crud.bulkDeleted(contactIds.length, 'contacts');
          return result;
        } catch (error) {
          notification.error(`Failed to delete ${contactIds.length} contacts: ${error.message}`);
          throw error;
        }
      },
    },

    // ========================================
    // 🎯 TASK OPERATIONS
    // ========================================
    tasks: {
      create: async (createFn, taskData, customMessage) => {
        try {
          const result = await createFn(taskData);
          notification.crud.created(
            customMessage || `Task "${taskData.title || 'New Task'}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.createError('task', error.message);
          throw error;
        }
      },

      update: async (updateFn, taskId, updates, customMessage) => {
        try {
          const result = await updateFn(taskId, updates);
          notification.crud.updated(
            customMessage || `Task "${updates.title || taskId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.updateError('task', error.message);
          throw error;
        }
      },

      complete: async (completeFn, taskId, taskTitle, customMessage) => {
        try {
          const result = await completeFn(taskId);
          notification.crud.statusChanged(
            customMessage || `Task "${taskTitle || taskId}"`,
            'completed',
            { icon: '✅', duration: 3000 },
          );
          return result;
        } catch (error) {
          notification.error(`Failed to complete task: ${error.message}`);
          throw error;
        }
      },

      delete: async (deleteFn, taskId, taskTitle, customMessage) => {
        try {
          const result = await deleteFn(taskId);
          notification.crud.deleted(
            customMessage || `Task "${taskTitle || taskId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.deleteError('task', error.message);
          throw error;
        }
      },
    },

    // ========================================
    // 🎯 PIPELINE/LEAD OPERATIONS
    // ========================================
    leads: {
      create: async (createFn, leadData, customMessage) => {
        try {
          const result = await createFn(leadData);
          notification.crud.created(
            customMessage || `Lead "${leadData.name || 'New Lead'}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.createError('lead', error.message);
          throw error;
        }
      },

      update: async (updateFn, leadId, updates, customMessage) => {
        try {
          const result = await updateFn(leadId, updates);
          notification.crud.updated(
            customMessage || `Lead "${updates.name || leadId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.updateError('lead', error.message);
          throw error;
        }
      },

      move: async (moveFn, leadId, fromStage, toStage, leadName) => {
        try {
          const result = await moveFn(leadId, fromStage, toStage);
          notification.success(
            `Lead "${leadName || leadId}" moved from ${fromStage} to ${toStage}`,
            { title: 'Lead Moved', icon: '🔄', duration: 3000 },
          );
          return result;
        } catch (error) {
          notification.error(`Failed to move lead: ${error.message}`);
          throw error;
        }
      },

      delete: async (deleteFn, leadId, leadName, customMessage) => {
        try {
          const result = await deleteFn(leadId);
          notification.crud.deleted(
            customMessage || `Lead "${leadName || leadId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.deleteError('lead', error.message);
          throw error;
        }
      },
    },

    // ========================================
    // 🎯 APPOINTMENT OPERATIONS
    // ========================================
    appointments: {
      create: async (createFn, appointmentData, customMessage) => {
        try {
          const result = await createFn(appointmentData);
          notification.crud.created(
            customMessage || `Appointment "${appointmentData.title || 'New Appointment'}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.createError('appointment', error.message);
          throw error;
        }
      },

      update: async (updateFn, appointmentId, updates, customMessage) => {
        try {
          const result = await updateFn(appointmentId, updates);
          notification.crud.updated(
            customMessage || `Appointment "${updates.title || appointmentId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.updateError('appointment', error.message);
          throw error;
        }
      },

      cancel: async (cancelFn, appointmentId, appointmentTitle) => {
        try {
          const result = await cancelFn(appointmentId);
          notification.crud.statusChanged(
            `Appointment "${appointmentTitle || appointmentId}"`,
            'cancelled',
            { icon: '❌', duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.error(`Failed to cancel appointment: ${error.message}`);
          throw error;
        }
      },

      delete: async (deleteFn, appointmentId, appointmentTitle, customMessage) => {
        try {
          const result = await deleteFn(appointmentId);
          notification.crud.deleted(
            customMessage || `Appointment "${appointmentTitle || appointmentId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.deleteError('appointment', error.message);
          throw error;
        }
      },
    },

    // ========================================
    // 🎯 CALENDAR OPERATIONS
    // ========================================
    calendars: {
      create: async (createFn, calendarData, customMessage) => {
        try {
          const result = await createFn(calendarData);
          notification.crud.created(
            customMessage || `Calendar "${calendarData.name || 'New Calendar'}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.createError('calendar', error.message);
          throw error;
        }
      },

      update: async (updateFn, calendarId, updates, customMessage) => {
        try {
          const result = await updateFn(calendarId, updates);
          notification.crud.updated(
            customMessage || `Calendar "${updates.name || calendarId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.updateError('calendar', error.message);
          throw error;
        }
      },

      delete: async (deleteFn, calendarId, calendarName, customMessage) => {
        try {
          const result = await deleteFn(calendarId);
          notification.crud.deleted(
            customMessage || `Calendar "${calendarName || calendarId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.deleteError('calendar', error.message);
          throw error;
        }
      },
    },

    // ========================================
    // 🎯 GENERIC OPERATIONS
    // ========================================
    generic: {
      create: async (createFn, resourceType, resourceData, customMessage) => {
        try {
          const result = await createFn(resourceData);
          notification.crud.created(
            customMessage || `${resourceType} "${resourceData.name || resourceData.title || 'New Item'}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.createError(resourceType, error.message);
          throw error;
        }
      },

      update: async (updateFn, resourceType, resourceId, updates, customMessage) => {
        try {
          const result = await updateFn(resourceId, updates);
          notification.crud.updated(
            customMessage || `${resourceType} "${updates.name || updates.title || resourceId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.updateError(resourceType, error.message);
          throw error;
        }
      },

      delete: async (deleteFn, resourceType, resourceId, resourceName, customMessage) => {
        try {
          const result = await deleteFn(resourceId);
          notification.crud.deleted(
            customMessage || `${resourceType} "${resourceName || resourceId}"`,
            { duration: 4000 },
          );
          return result;
        } catch (error) {
          notification.crud.deleteError(resourceType, error.message);
          throw error;
        }
      },
    },

    // ========================================
    // 🎯 CONNECTION AND SYNC OPERATIONS
    // ========================================
    connection: {
      success: (service) => {
        notification.success(`Successfully connected to ${service}`, {
          title: 'Connection Established',
          icon: '🔗',
          duration: 3000,
        });
      },

      error: (service, error) => {
        notification.crud.connectionError(service, { duration: 8000 });
      },

      sync: async (syncFn, service) => {
        const loadingId = notification.loading(`Syncing with ${service}...`, {
          title: 'Synchronizing',
        });

        try {
          const result = await syncFn();
          notification.remove(loadingId);
          notification.success(`Successfully synced with ${service}`, {
            title: 'Sync Complete',
            icon: '🔄',
            duration: 3000,
          });
          return result;
        } catch (error) {
          notification.remove(loadingId);
          notification.error(`Failed to sync with ${service}: ${error.message}`, {
            title: 'Sync Failed',
            duration: 6000,
          });
          throw error;
        }
      },
    },
  };
};

export default useCrudNotifications;
