// ========================================
// 🔔 CRUD NOTIFICATION UTILITIES
// ========================================
// Utility functions for integrating notifications with CRUD operations

import { useNotification } from '../hooks/useNotification';

export const useCrudNotifications = () => {
  const notification = useNotification();

  return {
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
    },

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

      complete: async (completeFn, taskId, taskTitle) => {
        try {
          const result = await completeFn(taskId);
          notification.crud.statusChanged(
            `Task "${taskTitle || taskId}"`,
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
  };
};

export default useCrudNotifications;
