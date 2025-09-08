// ========================================
// 🎯 REACT HOOK FOR GHL INTEGRATION
// ========================================
// Custom hook to easily use GHL Integration Service in your UI components

import { useState, useCallback } from 'react';
import ghlIntegration from '@api/ghlIntegrationService';
import { useNotification } from './useNotification';

export const useGHLIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const notification = useNotification();

  // ========================================================================
  // 🔧 UTILITY FUNCTIONS
  // ========================================================================

  const handleOperation = useCallback(async (operation, successMessage) => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();

      if (result.success) {
        // Show success notification if message provided
        if (successMessage) {
          notification.success(successMessage);
        }
        return result.data;
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (err) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      // Show error notification
      notification.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notification]);

  // ========================================================================
  // 📞 CONTACT OPERATIONS
  // ========================================================================

  const contacts = {
    // Get single contact
    get: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.contacts.get(id),
        null,
      );
    }, [handleOperation]),

    // Get all contacts
    getAll: useCallback(async (filters = {}) => {
      return handleOperation(
        () => ghlIntegration.contacts.getAll(filters),
        null,
      );
    }, [handleOperation]),

    // Create contact
    create: useCallback(async (contactData) => {
      return handleOperation(
        () => ghlIntegration.contacts.create(contactData),
        '✅ Contact created successfully!',
      );
    }, [handleOperation]),

    // Update contact
    update: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.contacts.update(id, updates),
        '✅ Contact updated successfully!',
      );
    }, [handleOperation]),

    // Delete contact
    delete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.contacts.delete(id),
        '✅ Contact deleted successfully!',
      );
    }, [handleOperation]),

    // Search contacts
    search: useCallback(async (searchTerms) => {
      return handleOperation(
        () => ghlIntegration.contacts.getAll(searchTerms),
        null,
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 🎯 TASK OPERATIONS
  // ========================================================================

  const tasks = {
    // Get single task
    get: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.tasks.get(id),
        null,
      );
    }, [handleOperation]),

    // Get all tasks
    getAll: useCallback(async (filters = {}) => {
      return handleOperation(
        () => ghlIntegration.tasks.getAll(filters),
        null,
      );
    }, [handleOperation]),

    // Get tasks by user
    getByUser: useCallback(async (userId) => {
      return handleOperation(
        () => ghlIntegration.tasks.getByUser(userId),
        null,
      );
    }, [handleOperation]),

    // Create task
    create: useCallback(async (taskData) => {
      return handleOperation(
        () => ghlIntegration.tasks.create(taskData),
        '✅ Task created successfully!',
      );
    }, [handleOperation]),

    // Update task
    update: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.tasks.update(id, updates),
        '✅ Task updated successfully!',
      );
    }, [handleOperation]),

    // Complete task
    complete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.tasks.complete(id),
        '✅ Task completed!',
      );
    }, [handleOperation]),

    // Delete task
    delete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.tasks.delete(id),
        '✅ Task deleted successfully!',
      );
    }, [handleOperation]),

    // Bulk operations
    bulkUpdate: useCallback(async (updates) => {
      return handleOperation(
        () => ghlIntegration.tasks.bulkUpdate(updates),
        '✅ Tasks updated successfully!',
      );
    }, [handleOperation]),

    bulkDelete: useCallback(async (ids) => {
      return handleOperation(
        () => ghlIntegration.tasks.bulkDelete(ids),
        '✅ Tasks deleted successfully!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 🚀 PIPELINE OPERATIONS
  // ========================================================================

  const pipeline = {
    // Get all leads
    getLeads: useCallback(async () => {
      return handleOperation(
        () => ghlIntegration.pipeline.getLeads(),
        null,
      );
    }, [handleOperation]),

    // Get leads by stage
    getByStage: useCallback(async (stage) => {
      return handleOperation(
        () => ghlIntegration.pipeline.getByStage(stage),
        null,
      );
    }, [handleOperation]),

    // Get pipeline metrics
    getMetrics: useCallback(async () => {
      return handleOperation(
        () => ghlIntegration.pipeline.getMetrics(),
        null,
      );
    }, [handleOperation]),

    // Create lead
    createLead: useCallback(async (leadData) => {
      return handleOperation(
        () => ghlIntegration.pipeline.createLead(leadData),
        '✅ Lead created successfully!',
      );
    }, [handleOperation]),

    // Update lead
    updateLead: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.pipeline.updateLead(id, updates),
        '✅ Lead updated successfully!',
      );
    }, [handleOperation]),

    // Move lead to different stage
    moveLead: useCallback(async (id, newStage, oldStage) => {
      return handleOperation(
        () => ghlIntegration.pipeline.moveLead(id, newStage, oldStage),
        `✅ Lead moved to ${newStage}!`,
      );
    }, [handleOperation]),

    // Add tags to lead
    addTags: useCallback(async (id, tags) => {
      return handleOperation(
        () => ghlIntegration.pipeline.addTags(id, tags),
        '✅ Tags added successfully!',
      );
    }, [handleOperation]),

    // Delete lead
    deleteLead: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.pipeline.deleteLead(id),
        '✅ Lead deleted successfully!',
      );
    }, [handleOperation]),

    // Refresh pipeline data
    refresh: useCallback(async () => {
      return handleOperation(
        () => ghlIntegration.pipeline.refresh(),
        '✅ Pipeline data refreshed!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 📅 CALENDAR OPERATIONS
  // ========================================================================

  const calendar = {
    // Get calendar
    get: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.calendar.get(id),
        null,
      );
    }, [handleOperation]),

    // Get all calendars
    getAll: useCallback(async (filters = {}) => {
      return handleOperation(
        () => ghlIntegration.calendar.getAll(filters),
        null,
      );
    }, [handleOperation]),

    // Get appointments
    getAppointments: useCallback(async (calendarId) => {
      return handleOperation(
        () => ghlIntegration.calendar.getAppointments(calendarId),
        null,
      );
    }, [handleOperation]),

    // Create calendar
    create: useCallback(async (calendarData) => {
      return handleOperation(
        () => ghlIntegration.calendar.create(calendarData),
        '✅ Calendar created successfully!',
      );
    }, [handleOperation]),

    // Update calendar
    update: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.calendar.update(id, updates),
        '✅ Calendar updated successfully!',
      );
    }, [handleOperation]),

    // Delete calendar
    delete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.calendar.delete(id),
        '✅ Calendar deleted successfully!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 📧 CAMPAIGN OPERATIONS
  // ========================================================================

  const campaigns = {
    // Get single campaign
    get: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.campaigns.get(id),
        null,
      );
    }, [handleOperation]),

    // Get all campaigns
    getAll: useCallback(async (filters = {}) => {
      return handleOperation(
        () => ghlIntegration.campaigns.getAll(filters),
        null,
      );
    }, [handleOperation]),

    // Get campaign statistics
    getStats: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.campaigns.getStats(id),
        null,
      );
    }, [handleOperation]),

    // Create campaign
    create: useCallback(async (campaignData) => {
      return handleOperation(
        () => ghlIntegration.campaigns.create(campaignData),
        '✅ Campaign created successfully!',
      );
    }, [handleOperation]),

    // Update campaign
    update: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.campaigns.update(id, updates),
        '✅ Campaign updated successfully!',
      );
    }, [handleOperation]),

    // Update campaign status
    updateStatus: useCallback(async (id, status) => {
      return handleOperation(
        () => ghlIntegration.campaigns.updateStatus(id, status),
        `✅ Campaign ${status}!`,
      );
    }, [handleOperation]),

    // Start campaign
    start: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.campaigns.start(id),
        '✅ Campaign started!',
      );
    }, [handleOperation]),

    // Pause campaign
    pause: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.campaigns.pause(id),
        '✅ Campaign paused!',
      );
    }, [handleOperation]),

    // Stop campaign
    stop: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.campaigns.stop(id),
        '✅ Campaign stopped!',
      );
    }, [handleOperation]),

    // Delete campaign
    delete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.campaigns.delete(id),
        '✅ Campaign deleted successfully!',
      );
    }, [handleOperation]),

    // Bulk update status
    bulkUpdateStatus: useCallback(async (ids, status) => {
      return handleOperation(
        () => ghlIntegration.campaigns.bulkUpdateStatus(ids, status),
        '✅ Campaign statuses updated!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 📅 APPOINTMENTS OPERATIONS
  // ========================================================================

  const appointments = {
    // Get single appointment
    get: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.appointments.get(id),
        null,
      );
    }, [handleOperation]),

    // Get all appointments
    getAll: useCallback(async (filters = {}) => {
      return handleOperation(
        () => ghlIntegration.appointments.getAll(filters),
        null,
      );
    }, [handleOperation]),

    // Get available time slots
    getAvailableSlots: useCallback(async (calendarId, startDate, endDate) => {
      return handleOperation(
        () => ghlIntegration.appointments.getAvailableSlots(calendarId, startDate, endDate),
        null,
      );
    }, [handleOperation]),

    // Create appointment
    create: useCallback(async (appointmentData) => {
      return handleOperation(
        () => ghlIntegration.appointments.create(appointmentData),
        '✅ Appointment created successfully!',
      );
    }, [handleOperation]),

    // Create quick appointment with defaults
    createQuick: useCallback(async (appointmentData) => {
      return handleOperation(
        () => ghlIntegration.appointments.createQuick(appointmentData),
        '✅ Appointment created successfully!',
      );
    }, [handleOperation]),

    // Create appointment from form data
    createFromForm: useCallback(async (formData) => {
      return handleOperation(
        () => ghlIntegration.appointments.createFromForm(formData),
        '✅ Appointment created successfully!',
      );
    }, [handleOperation]),

    // Update appointment
    update: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.appointments.update(id, updates),
        '✅ Appointment updated successfully!',
      );
    }, [handleOperation]),

    // Update appointment status
    updateStatus: useCallback(async (id, status) => {
      return handleOperation(
        () => ghlIntegration.appointments.updateStatus(id, status),
        '✅ Appointment status updated!',
      );
    }, [handleOperation]),

    // Reschedule appointment
    reschedule: useCallback(async (id, startTime, endTime) => {
      return handleOperation(
        () => ghlIntegration.appointments.reschedule(id, startTime, endTime),
        '✅ Appointment rescheduled!',
      );
    }, [handleOperation]),

    // Cancel appointment
    cancel: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.appointments.cancel(id),
        '✅ Appointment cancelled!',
      );
    }, [handleOperation]),

    // Delete appointment
    delete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.appointments.delete(id),
        '✅ Appointment deleted successfully!',
      );
    }, [handleOperation]),

    // Bulk create appointments
    bulkCreate: useCallback(async (appointmentsData) => {
      return handleOperation(
        () => ghlIntegration.appointments.bulkCreate(appointmentsData),
        '✅ Appointments created successfully!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 👥 USER OPERATIONS
  // ========================================================================

  const users = {
    // Get user
    get: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.users.get(id),
        null,
      );
    }, [handleOperation]),

    // Get all users
    getAll: useCallback(async (filters = {}) => {
      return handleOperation(
        () => ghlIntegration.users.getAll(filters),
        null,
      );
    }, [handleOperation]),

    // Get users by location
    getByLocation: useCallback(async (locationId) => {
      return handleOperation(
        () => ghlIntegration.users.getByLocation(locationId),
        null,
      );
    }, [handleOperation]),

    // Create user
    create: useCallback(async (userData) => {
      return handleOperation(
        () => ghlIntegration.users.create(userData),
        '✅ User created successfully!',
      );
    }, [handleOperation]),

    // Update user
    update: useCallback(async (id, updates) => {
      return handleOperation(
        () => ghlIntegration.users.update(id, updates),
        '✅ User updated successfully!',
      );
    }, [handleOperation]),

    // Delete user
    delete: useCallback(async (id) => {
      return handleOperation(
        () => ghlIntegration.users.delete(id),
        '✅ User deleted successfully!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 🔄 BULK OPERATIONS
  // ========================================================================

  const bulk = {
    create: useCallback(async (resource, dataArray) => {
      return handleOperation(
        () => ghlIntegration.bulkCreate(resource, dataArray),
        '✅ Bulk create completed!',
      );
    }, [handleOperation]),

    update: useCallback(async (resource, updates) => {
      return handleOperation(
        () => ghlIntegration.bulkUpdate(resource, updates),
        '✅ Bulk update completed!',
      );
    }, [handleOperation]),

    delete: useCallback(async (resource, ids) => {
      return handleOperation(
        () => ghlIntegration.bulkDelete(resource, ids),
        '✅ Bulk delete completed!',
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 🧪 TESTING & DIAGNOSTICS
  // ========================================================================

  const diagnostics = {
    // Test all connections
    testAll: useCallback(async () => {
      return handleOperation(
        () => ghlIntegration.testAllConnections(),
        '✅ All tests completed!',
      );
    }, [handleOperation]),

    // Health check
    healthCheck: useCallback(async () => {
      return handleOperation(
        () => ghlIntegration.healthCheck(),
        null,
      );
    }, [handleOperation]),

    // Test specific service
    test: useCallback(async (service) => {
      return handleOperation(
        () => ghlIntegration[service].test(),
        `✅ ${service} test completed!`,
      );
    }, [handleOperation]),
  };

  // ========================================================================
  // 🎯 RETURN HOOK INTERFACE
  // ========================================================================

  return {
    // State
    loading,
    error,

    // Operations by resource
    contacts,
    tasks,
    pipeline,
    calendar,
    campaigns,
    appointments,
    users,

    // Bulk operations
    bulk,

    // Diagnostics
    diagnostics,

    // Direct access to service (for advanced use)
    service: ghlIntegration,
  };
};

export default useGHLIntegration;
