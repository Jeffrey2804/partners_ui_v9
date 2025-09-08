// ========================================
// 🎯 APPOINTMENTS API SERVICE
// ========================================
// Handles all appointment-related API operations with GoHighLevel

import { toast } from 'react-hot-toast';
import { createLogger } from '@utils/logger';
import { GHL_CONFIG, getGHLHeaders } from '@config/ghlConfig';

const appointmentsLogger = createLogger('AppointmentsAPI');

class AppointmentsApiService {
  constructor() {
    this.config = GHL_CONFIG;
    this.logger = appointmentsLogger;
    // Use the base URL for appointments (not location-based for this endpoint)
    this.baseUrl = 'https://services.leadconnectorhq.com/calendars/events';
    this.locationId = 'b7vHWUGVUNQGoIlAXabY'; // Your location ID
  }

  // ========================================================================
  // 🔧 HELPER METHODS
  // ========================================================================

  /**
   * Handle API responses consistently
   */
  async handleResponse(response, operation) {
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`${operation} failed`, null, {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  /**
   * Clean appointment data for API requests
   */
  cleanAppointmentData(data) {
    const cleanData = { ...data };

    // Set default location ID if not provided
    if (!cleanData.locationId) {
      cleanData.locationId = this.locationId;
    }

    // Remove system fields
    const fieldsToRemove = ['id', '_id', 'createdAt', 'updatedAt', 'dateAdded'];
    fieldsToRemove.forEach(field => {
      if (cleanData.hasOwnProperty(field)) {
        delete cleanData[field];
      }
    });

    // Set required defaults if not provided
    if (!cleanData.appointmentStatus) {
      cleanData.appointmentStatus = 'new';
    }
    if (!cleanData.meetingLocationType) {
      cleanData.meetingLocationType = 'custom';
    }
    if (!cleanData.meetingLocationId) {
      cleanData.meetingLocationId = 'default';
    }
    if (cleanData.overrideLocationConfig === undefined) {
      cleanData.overrideLocationConfig = true;
    }
    if (cleanData.ignoreDateRange === undefined) {
      cleanData.ignoreDateRange = false;
    }
    if (cleanData.toNotify === undefined) {
      cleanData.toNotify = false;
    }
    if (cleanData.ignoreFreeSlotValidation === undefined) {
      cleanData.ignoreFreeSlotValidation = true;
    }

    // Ensure proper date format
    if (cleanData.startTime && !cleanData.startTime.includes('T')) {
      cleanData.startTime = new Date(cleanData.startTime).toISOString();
    }
    if (cleanData.endTime && !cleanData.endTime.includes('T')) {
      cleanData.endTime = new Date(cleanData.endTime).toISOString();
    }

    return cleanData;
  }

  /**
   * Format appointment data for display
   */
  formatAppointmentData(appointment) {
    return {
      ...appointment,
      startTime: new Date(appointment.startTime),
      endTime: new Date(appointment.endTime),
      duration: appointment.endTime && appointment.startTime ?
        (new Date(appointment.endTime) - new Date(appointment.startTime)) / (1000 * 60) : null,
    };
  }

  // ========================================================================
  // 📥 READ OPERATIONS
  // ========================================================================

  /**
   * Fetch all appointments
   */
  async fetchAppointments(filters = {}) {
    try {
      let url = `${this.baseUrl}/appointments`;

      // Add query parameters
      const params = new URLSearchParams();
      if (filters.locationId) params.append('locationId', filters.locationId);
      if (filters.calendarId) params.append('calendarId', filters.calendarId);
      if (filters.contactId) params.append('contactId', filters.contactId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      this.logger.info('Fetching appointments', { filters, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getGHLHeaders(),
          'Version': '2021-04-15', // Use the specific version for appointments
        },
      });

      const data = await this.handleResponse(response, 'FETCH_APPOINTMENTS');

      // Handle different response structures
      const appointments = Array.isArray(data) ? data : (data.appointments || data.data || data.events || []);

      // Format appointments for display
      const formattedAppointments = appointments.map(apt => this.formatAppointmentData(apt));

      this.logger.success('Appointments fetched successfully', { count: appointments.length });

      return {
        success: true,
        data: formattedAppointments,
        meta: data.meta || data.pagination || null,
        resource: 'appointments',
        operation: 'FETCH_ALL',
      };

    } catch (error) {
      this.logger.error('Fetch appointments failed', error);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'FETCH_ALL',
        data: [],
      };
    }
  }

  /**
   * Fetch single appointment by ID
   */
  async fetchAppointmentById(appointmentId) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const url = `${this.baseUrl}/appointments/${appointmentId}`;
      this.logger.info('Fetching appointment by ID', { appointmentId, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getGHLHeaders(),
          'Version': '2021-04-15',
        },
      });

      const data = await this.handleResponse(response, 'FETCH_APPOINTMENT');
      const formattedAppointment = this.formatAppointmentData(data);

      this.logger.success('Appointment fetched successfully', { appointmentId });

      return {
        success: true,
        data: formattedAppointment,
        resource: 'appointments',
        operation: 'FETCH_ONE',
      };

    } catch (error) {
      this.logger.error('Fetch appointment failed', error, { appointmentId });
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'FETCH_ONE',
        data: null,
      };
    }
  }

  // ========================================================================
  // 📤 CREATE OPERATIONS
  // ========================================================================

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData) {
    try {
      const cleanData = this.cleanAppointmentData(appointmentData);

      this.logger.info('Creating appointment', { data: cleanData });

      const response = await fetch(`${this.baseUrl}/appointments`, {
        method: 'POST',
        headers: {
          ...getGHLHeaders(),
          'Version': '2021-04-15',
        },
        body: JSON.stringify(cleanData),
      });

      const result = await this.handleResponse(response, 'CREATE_APPOINTMENT');
      const formattedResult = this.formatAppointmentData(result);

      this.logger.success('Appointment created successfully', { id: result.id });
      toast.success('✅ Appointment created successfully!');

      return {
        success: true,
        data: formattedResult,
        resource: 'appointments',
        operation: 'CREATE',
      };

    } catch (error) {
      this.logger.error('Create appointment failed', error);
      toast.error(`❌ Failed to create appointment: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'CREATE',
        data: null,
      };
    }
  }

  /**
   * Create appointment with smart defaults
   */
  async createQuickAppointment({
    title,
    contactId,
    calendarId,
    startTime,
    endTime,
    address = 'Online Meeting',
    assignedUserId,
    notes = '',
  }) {
    const appointmentData = {
      title: title || 'New Appointment',
      contactId: contactId,
      calendarId: calendarId,
      startTime: startTime,
      endTime: endTime,
      address: address,
      assignedUserId: assignedUserId,
      notes: notes,
      locationId: this.locationId,
      appointmentStatus: 'new',
      meetingLocationType: 'custom',
      meetingLocationId: 'default',
      overrideLocationConfig: true,
      ignoreDateRange: false,
      toNotify: false,
      ignoreFreeSlotValidation: true,
    };

    return this.createAppointment(appointmentData);
  }

  // ========================================================================
  // 📝 UPDATE OPERATIONS
  // ========================================================================

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId, updates) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const cleanData = this.cleanAppointmentData(updates);
      const url = `${this.baseUrl}/appointments/${appointmentId}`;

      this.logger.info('Updating appointment', { appointmentId, updates: cleanData });

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...getGHLHeaders(),
          'Version': '2021-04-15',
        },
        body: JSON.stringify(cleanData),
      });

      const result = await this.handleResponse(response, 'UPDATE_APPOINTMENT');
      const formattedResult = this.formatAppointmentData(result);

      this.logger.success('Appointment updated successfully', { appointmentId });
      toast.success('✅ Appointment updated successfully!');

      return {
        success: true,
        data: formattedResult,
        resource: 'appointments',
        operation: 'UPDATE',
      };

    } catch (error) {
      this.logger.error('Update appointment failed', error);
      toast.error(`❌ Failed to update appointment: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'UPDATE',
        data: null,
      };
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status) {
    const validStatuses = ['new', 'confirmed', 'cancelled', 'showed', 'noshow', 'invalid'];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.updateAppointment(appointmentId, { appointmentStatus: status });
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointmentId, newStartTime, newEndTime) {
    return this.updateAppointment(appointmentId, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }

  // ========================================================================
  // 🗑️ DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId) {
    try {
      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      const url = `${this.baseUrl}/appointments/${appointmentId}`;

      this.logger.info('Deleting appointment', { appointmentId });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...getGHLHeaders(),
          'Version': '2021-04-15',
        },
      });

      await this.handleResponse(response, 'DELETE_APPOINTMENT');

      this.logger.success('Appointment deleted successfully', { appointmentId });
      toast.success('✅ Appointment deleted successfully!');

      return {
        success: true,
        data: { id: appointmentId },
        resource: 'appointments',
        operation: 'DELETE',
      };

    } catch (error) {
      this.logger.error('Delete appointment failed', error);
      toast.error(`❌ Failed to delete appointment: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'DELETE',
        data: null,
      };
    }
  }

  /**
   * Cancel appointment (update status to cancelled)
   */
  async cancelAppointment(appointmentId) {
    try {
      const result = await this.updateAppointmentStatus(appointmentId, 'cancelled');
      if (result.success) {
        toast.success('✅ Appointment cancelled successfully!');
      }
      return result;
    } catch (error) {
      toast.error(`❌ Failed to cancel appointment: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'CANCEL',
        data: null,
      };
    }
  }

  // ========================================================================
  // 🔄 BULK OPERATIONS
  // ========================================================================

  /**
   * Bulk create appointments
   */
  async bulkCreateAppointments(appointmentsData) {
    try {
      this.logger.info('Bulk creating appointments', { count: appointmentsData.length });

      const promises = appointmentsData.map(data => this.createAppointment(data));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

      this.logger.success('Bulk appointment creation completed', {
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
        resource: 'appointments',
        operation: 'BULK_CREATE',
      };

    } catch (error) {
      this.logger.error('Bulk appointment creation failed', error);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'BULK_CREATE',
      };
    }
  }

  // ========================================================================
  // 🧪 TESTING
  // ========================================================================

  /**
   * Test appointments API connection
   */
  async testAppointmentsApiConnection() {
    try {
      this.logger.info('Testing appointments API connection...');

      const result = await this.fetchAppointments({ limit: 1 });

      if (result.success) {
        this.logger.success('Appointments API connection test passed');
        return {
          success: true,
          message: 'Appointments API connection successful',
          endpoint: this.baseUrl,
          locationId: this.locationId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.logger.error('Appointments API connection test failed', error);
      return {
        success: false,
        message: 'Appointments API connection failed',
        error: error.message,
        endpoint: this.baseUrl,
        locationId: this.locationId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========================================================================
  // 📅 UTILITY METHODS
  // ========================================================================

  /**
   * Get available time slots for a calendar
   */
  async getAvailableSlots(calendarId, startDate, endDate) {
    try {
      const url = `${this.baseUrl}/free-slots?calendarId=${calendarId}&startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getGHLHeaders(),
          'Version': '2021-04-15',
        },
      });

      const data = await this.handleResponse(response, 'GET_AVAILABLE_SLOTS');

      return {
        success: true,
        data: data,
        resource: 'appointments',
        operation: 'GET_SLOTS',
      };

    } catch (error) {
      this.logger.error('Get available slots failed', error);
      return {
        success: false,
        error: error.message,
        resource: 'appointments',
        operation: 'GET_SLOTS',
        data: [],
      };
    }
  }

  /**
   * Create appointment from form data
   */
  createAppointmentFromForm(formData) {
    // Helper method to create appointment from typical form data
    const appointmentData = {
      title: formData.title || 'New Appointment',
      contactId: formData.contactId,
      calendarId: formData.calendarId,
      assignedUserId: formData.assignedUserId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      address: formData.address || 'Online Meeting',
      notes: formData.notes || '',
      appointmentStatus: 'new',
      locationId: this.locationId,
    };

    return this.createAppointment(appointmentData);
  }
}

// Create and export singleton instance
const appointmentsApi = new AppointmentsApiService();
export default appointmentsApi;
