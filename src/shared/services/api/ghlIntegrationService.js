// ========================================
// 🎯 UNIFIED GHL INTEGRATION SERVICE
// ========================================
// This service connects all CRUD operations to GoHighLevel API
// Provides a single interface for Create, Read, Update, Delete operations
// across all GHL resources (Contacts, Tasks, Pipeline, Calendar, Users)

import { toast } from 'react-hot-toast';
import { createLogger } from '@utils/logger';
import { GHL_CONFIG, getGHLHeaders, getGHLUserHeaders } from '@config/ghlConfig';

// Import existing API services
import contactApi from './contactApi';
import taskApi from './taskApi';
import pipelineApi from './pipelineApi';
import calendarApi from './calendarApi';
import userApi from './userApi';
import campaignApi from './campaignApi';
import appointmentsApi from './appointmentsApi';
import apiService from './apiService';

const ghlLogger = createLogger('GHLIntegration');

// ============================================================================
// 🏗️ UNIFIED GHL INTEGRATION CLASS
// ============================================================================

class GHLIntegrationService {
  constructor() {
    this.config = GHL_CONFIG;
    this.logger = ghlLogger;

    // Resource endpoints
    this.endpoints = {
      contacts: '/contacts',
      tasks: '/tasks',
      users: '/users',
      calendar: '/calendars',
      pipeline: '/opportunities',
      workflows: '/workflows',
      campaigns: '/campaigns',
      locations: '/locations',
      companies: '/companies',
    };
  }

  // ========================================================================
  // 🔧 CORE HELPER METHODS
  // ========================================================================

  /**
   * Get appropriate headers for different endpoints
   */
  getHeaders(endpoint) {
    // Some endpoints require different headers
    if (endpoint.includes('/users') || endpoint.includes('/tasks')) {
      return getGHLUserHeaders();
    }
    return getGHLHeaders();
  }

  /**
   * Build full URL for API requests
   */
  buildUrl(resource, id = null, isLocationBased = true) {
    const baseUrl = isLocationBased
      ? this.config.locationUrl
      : this.config.baseUrl;

    if (id) {
      return `${baseUrl}${this.endpoints[resource]}/${id}`;
    }
    return `${baseUrl}${this.endpoints[resource]}`;
  }

  /**
   * Handle API responses consistently
   */
  async handleResponse(response, operation, resource) {
    const operation_type = operation.toUpperCase();

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`${operation_type} ${resource} failed`, null, {
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

  // ========================================================================
  // 📥 READ OPERATIONS (GET)
  // ========================================================================

  /**
   * 📥 Generic GET - Fetch resource by ID
   */
  async get(resource, id, options = {}) {
    try {
      const { isLocationBased = true, customEndpoint = null } = options;

      let url;
      if (customEndpoint) {
        url = customEndpoint;
      } else {
        url = this.buildUrl(resource, id, isLocationBased);
      }

      this.logger.info(`GET ${resource}`, { id, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(url),
      });

      const data = await this.handleResponse(response, 'GET', resource);

      this.logger.success(`GET ${resource} successful`, { id });

      return {
        success: true,
        data,
        resource,
        operation: 'GET',
      };

    } catch (error) {
      this.logger.error(`GET ${resource} failed`, error);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'GET',
        data: null,
      };
    }
  }

  /**
   * 📥 Generic GET ALL - Fetch all resources with optional filters
   */
  async getAll(resource, filters = {}, options = {}) {
    try {
      const { isLocationBased = true, customEndpoint = null, useSearch = false } = options;

      let url;
      if (customEndpoint) {
        url = customEndpoint;
      } else {
        url = this.buildUrl(resource, null, isLocationBased);

        // Add search endpoint if needed
        if (useSearch) {
          url += '/search';
        }
      }

      // Add query parameters
      if (Object.keys(filters).length > 0 && !useSearch) {
        const params = new URLSearchParams(filters);
        url += `?${params.toString()}`;
      }

      this.logger.info(`GET ALL ${resource}`, { filters, url });

      const requestOptions = {
        method: useSearch ? 'POST' : 'GET',
        headers: this.getHeaders(url),
      };

      // Add body for search requests
      if (useSearch && Object.keys(filters).length > 0) {
        requestOptions.body = JSON.stringify(filters);
      }

      const response = await fetch(url, requestOptions);
      const data = await this.handleResponse(response, 'GET ALL', resource);

      // Handle different response structures
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data[resource]) {
        items = data[resource];
      } else if (data.data) {
        items = data.data;
      } else if (data.results) {
        items = data.results;
      }

      this.logger.success(`GET ALL ${resource} successful`, { count: items.length });

      return {
        success: true,
        data: items,
        meta: data.meta || data.pagination || null,
        resource,
        operation: 'GET_ALL',
      };

    } catch (error) {
      this.logger.error(`GET ALL ${resource} failed`, error);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'GET_ALL',
        data: [],
      };
    }
  }

  // ========================================================================
  // 📤 CREATE OPERATIONS (POST)
  // ========================================================================

  /**
   * ➕ Generic POST - Create new resource
   */
  async create(resource, data, options = {}) {
    try {
      const { isLocationBased = true, customEndpoint = null, contactId = null } = options;

      let url;
      if (customEndpoint) {
        url = customEndpoint;
      } else if (contactId && resource === 'tasks') {
        // Special case for tasks - they need to be created under a contact
        url = `${this.config.baseUrl}/contacts/${contactId}/tasks`;
      } else {
        url = this.buildUrl(resource, null, isLocationBased);
      }

      this.logger.info(`CREATE ${resource}`, { data, url });

      // Clean data before sending
      const cleanData = this.cleanDataForApi(data, resource);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(url),
        body: JSON.stringify(cleanData),
      });

      const result = await this.handleResponse(response, 'CREATE', resource);

      this.logger.success(`CREATE ${resource} successful`, { id: result._id || result.id });
      toast.success(`✅ ${resource.slice(0, -1)} created successfully!`);

      return {
        success: true,
        data: result,
        resource,
        operation: 'CREATE',
      };

    } catch (error) {
      this.logger.error(`CREATE ${resource} failed`, error);
      toast.error(`❌ Failed to create ${resource.slice(0, -1)}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'CREATE',
        data: null,
      };
    }
  }

  // ========================================================================
  // 📝 UPDATE OPERATIONS (PUT/PATCH)
  // ========================================================================

  /**
   * 📝 Generic PUT - Update resource completely
   */
  async update(resource, id, data, options = {}) {
    try {
      const { isLocationBased = true, customEndpoint = null, method = 'PUT' } = options;

      let url;
      if (customEndpoint) {
        url = customEndpoint;
      } else {
        url = this.buildUrl(resource, id, isLocationBased);
      }

      this.logger.info(`UPDATE ${resource}`, { id, data, url });

      // Clean data before sending
      const cleanData = this.cleanDataForApi(data, resource);

      const response = await fetch(url, {
        method,
        headers: this.getHeaders(url),
        body: JSON.stringify(cleanData),
      });

      const result = await this.handleResponse(response, 'UPDATE', resource);

      this.logger.success(`UPDATE ${resource} successful`, { id });
      toast.success(`✅ ${resource.slice(0, -1)} updated successfully!`);

      return {
        success: true,
        data: result,
        resource,
        operation: 'UPDATE',
      };

    } catch (error) {
      this.logger.error(`UPDATE ${resource} failed`, error);
      toast.error(`❌ Failed to update ${resource.slice(0, -1)}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'UPDATE',
        data: null,
      };
    }
  }

  /**
   * 📝 Generic PATCH - Update resource partially
   */
  async patch(resource, id, updates, options = {}) {
    return this.update(resource, id, updates, { ...options, method: 'PATCH' });
  }

  // ========================================================================
  // 🗑️ DELETE OPERATIONS
  // ========================================================================

  /**
   * 🗑️ Generic DELETE - Remove resource
   */
  async delete(resource, id, options = {}) {
    try {
      const { isLocationBased = true, customEndpoint = null } = options;

      let url;
      if (customEndpoint) {
        url = customEndpoint;
      } else {
        url = this.buildUrl(resource, id, isLocationBased);
      }

      this.logger.info(`DELETE ${resource}`, { id, url });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(url),
      });

      await this.handleResponse(response, 'DELETE', resource);

      this.logger.success(`DELETE ${resource} successful`, { id });
      toast.success(`✅ ${resource.slice(0, -1)} deleted successfully!`);

      return {
        success: true,
        data: { id },
        resource,
        operation: 'DELETE',
      };

    } catch (error) {
      this.logger.error(`DELETE ${resource} failed`, error);
      toast.error(`❌ Failed to delete ${resource.slice(0, -1)}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'DELETE',
        data: null,
      };
    }
  }

  // ========================================================================
  // 🔄 BULK OPERATIONS
  // ========================================================================

  /**
   * 🔄 Bulk Create
   */
  async bulkCreate(resource, dataArray, options = {}) {
    try {
      this.logger.info(`BULK CREATE ${resource}`, { count: dataArray.length });

      const promises = dataArray.map(data => this.create(resource, data, options));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

      this.logger.success(`BULK CREATE ${resource} completed`, {
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
        resource,
        operation: 'BULK_CREATE',
      };

    } catch (error) {
      this.logger.error(`BULK CREATE ${resource} failed`, error);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'BULK_CREATE',
      };
    }
  }

  /**
   * 🔄 Bulk Update
   */
  async bulkUpdate(resource, updates, options = {}) {
    try {
      this.logger.info(`BULK UPDATE ${resource}`, { count: updates.length });

      const promises = updates.map(({ id, data }) => this.update(resource, id, data, options));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

      this.logger.success(`BULK UPDATE ${resource} completed`, {
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
        resource,
        operation: 'BULK_UPDATE',
      };

    } catch (error) {
      this.logger.error(`BULK UPDATE ${resource} failed`, error);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'BULK_UPDATE',
      };
    }
  }

  /**
   * 🔄 Bulk Delete
   */
  async bulkDelete(resource, ids, options = {}) {
    try {
      this.logger.info(`BULK DELETE ${resource}`, { count: ids.length });

      const promises = ids.map(id => this.delete(resource, id, options));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

      this.logger.success(`BULK DELETE ${resource} completed`, {
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
        resource,
        operation: 'BULK_DELETE',
      };

    } catch (error) {
      this.logger.error(`BULK DELETE ${resource} failed`, error);
      return {
        success: false,
        error: error.message,
        resource,
        operation: 'BULK_DELETE',
      };
    }
  }

  // ========================================================================
  // 🛠️ UTILITY METHODS
  // ========================================================================

  /**
   * Clean data for API requests
   */
  cleanDataForApi(data, resource) {
    const cleanData = { ...data };

    // Remove invalid or system fields
    const fieldsToRemove = [
      'relations', 'locationId', 'isLocation', 'companyId',
      'dateAdded', 'dateUpdated', 'deleted', 'permissions',
      'roles', 'status', 'type', '_id', 'id',
    ];

    fieldsToRemove.forEach(field => {
      if (cleanData.hasOwnProperty(field)) {
        delete cleanData[field];
      }
    });

    // Resource-specific cleaning
    if (resource === 'tasks') {
      return this.cleanTaskData(cleanData);
    }

    if (resource === 'contacts') {
      return this.cleanContactData(cleanData);
    }

    // Remove empty values
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    return cleanData;
  }

  /**
   * Clean task-specific data
   */
  cleanTaskData(data) {
    // Remove invalid contact IDs for tasks
    if (data.contactId && (
      data.contactId === 'contact-1' ||
      data.contactId === 'null' ||
      data.contactId === 'undefined' ||
      data.contactId.length < 5 ||
      data.contactId.includes('demo') ||
      data.contactId.includes('test')
    )) {
      delete data.contactId;
    }

    // Only include allowed fields for tasks
    const allowedFields = ['title', 'body', 'dueDate', 'assignedTo', 'completed', 'priority'];
    const cleanData = {};

    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field) && data[field] !== undefined) {
        cleanData[field] = data[field];
      }
    });

    return cleanData;
  }

  /**
   * Clean contact-specific data
   */
  cleanContactData(data) {
    const cleanData = { ...data };

    // Ensure proper name fields
    if (cleanData.name && !cleanData.firstName && !cleanData.lastName) {
      const nameParts = cleanData.name.split(' ');
      cleanData.firstName = nameParts[0] || '';
      cleanData.lastName = nameParts.slice(1).join(' ') || '';
      delete cleanData.name;
    }

    return cleanData;
  }

  // ========================================================================
  // 🔗 RESOURCE-SPECIFIC METHODS (Delegating to existing APIs)
  // ========================================================================

  /**
   * 📞 Contact Operations
   */
  contacts = {
    get: (id) => contactApi.fetchContactById(id),
    getAll: (filters = {}) => contactApi.searchContacts(filters),
    getMultiple: (ids) => contactApi.fetchContactsByIds(ids),
    create: (data) => this.create('contacts', data),
    update: (id, data) => this.update('contacts', id, data),
    delete: (id) => this.delete('contacts', id),
    test: () => contactApi.testContactApiConnection(),
  };

  /**
   * 🎯 Task Operations
   */
  tasks = {
    get: (id) => taskApi.fetchTaskById(id),
    getAll: (filters = {}) => taskApi.fetchTasks(filters),
    getByUser: (userId) => taskApi.fetchTasksByUser(userId),
    create: (data) => taskApi.createTask(data),
    update: (id, data) => taskApi.updateTask(id, data),
    complete: (id) => taskApi.completeTask(id),
    delete: (id) => taskApi.deleteTask(id),
    bulkUpdate: (updates) => taskApi.bulkUpdateTasks(updates),
    bulkDelete: (ids) => taskApi.bulkDeleteTasks(ids),
    test: () => taskApi.testTaskApiConnection(),
  };

  /**
   * 🚀 Pipeline Operations
   */
  pipeline = {
    getLeads: () => pipelineApi.fetchPipelineLeads(),
    getByStage: (stage) => pipelineApi.fetchLeadsByStage(stage),
    getMetrics: () => pipelineApi.fetchPipelineMetrics(),
    getTags: (stage) => pipelineApi.fetchStageTags(stage),
    getAllTags: () => pipelineApi.fetchAvailableTags(),
    createLead: (data) => pipelineApi.createNewLead(data),
    updateLead: (id, data) => pipelineApi.updateLeadDetails(id, data),
    moveLead: (id, newStage, oldStage) => pipelineApi.moveLeadToStage(id, newStage, oldStage),
    addTags: (id, tags) => pipelineApi.addTagsToLead(id, tags),
    deleteLead: (id) => pipelineApi.deleteLead(id),
    refresh: () => pipelineApi.refreshPipelineData(),
    setupRealtime: (callback) => pipelineApi.setupRealtimeUpdates(callback),
    test: () => pipelineApi.testApiConnection(),
    testContacts: () => pipelineApi.testContactsExist(),
    testPagination: () => pipelineApi.testPagination(),
  };

  /**
   * 📅 Calendar Operations
   */
  calendar = {
    get: (id) => calendarApi.fetchCalendarById(id),
    getAll: (filters = {}) => calendarApi.fetchCalendars(filters),
    getAppointments: (calendarId) => calendarApi.fetchAppointments(calendarId),
    create: (data) => this.create('calendar', data),
    update: (id, data) => this.update('calendar', id, data),
    delete: (id) => this.delete('calendar', id),
    test: () => calendarApi.testCalendarApiConnection(),
  };

  /**
   * 👥 User Operations
   */
  users = {
    get: (id) => userApi.fetchUserById(id),
    getAll: (filters = {}) => userApi.fetchUsers(filters),
    getByLocation: (locationId) => userApi.fetchUsersByLocation(locationId),
    create: (data) => this.create('users', data, { isLocationBased: false }),
    update: (id, data) => this.update('users', id, data, { isLocationBased: false }),
    delete: (id) => this.delete('users', id, { isLocationBased: false }),
    test: () => userApi.testUserApiConnection(),
  };

  /**
   * 📧 Campaign Operations
   */
  campaigns = {
    get: (id) => campaignApi.fetchCampaignById(id),
    getAll: (filters = {}) => campaignApi.fetchCampaigns(filters),
    getStats: (id) => campaignApi.fetchCampaignStats(id),
    create: (data) => campaignApi.createCampaign(data),
    update: (id, data) => campaignApi.updateCampaign(id, data),
    updateStatus: (id, status) => campaignApi.updateCampaignStatus(id, status),
    start: (id) => campaignApi.updateCampaignStatus(id, 'active'),
    pause: (id) => campaignApi.updateCampaignStatus(id, 'paused'),
    stop: (id) => campaignApi.updateCampaignStatus(id, 'stopped'),
    delete: (id) => campaignApi.deleteCampaign(id),
    bulkUpdateStatus: (ids, status) => campaignApi.bulkUpdateCampaignStatus(ids, status),
    test: () => campaignApi.testCampaignApiConnection(),
  };

  /**
   * 📅 Appointments Operations
   */
  appointments = {
    get: (id) => appointmentsApi.fetchAppointmentById(id),
    getAll: (filters = {}) => appointmentsApi.fetchAppointments(filters),
    getAvailableSlots: (calendarId, startDate, endDate) => appointmentsApi.getAvailableSlots(calendarId, startDate, endDate),
    create: (data) => appointmentsApi.createAppointment(data),
    createQuick: (data) => appointmentsApi.createQuickAppointment(data),
    createFromForm: (formData) => appointmentsApi.createAppointmentFromForm(formData),
    update: (id, data) => appointmentsApi.updateAppointment(id, data),
    updateStatus: (id, status) => appointmentsApi.updateAppointmentStatus(id, status),
    reschedule: (id, startTime, endTime) => appointmentsApi.rescheduleAppointment(id, startTime, endTime),
    cancel: (id) => appointmentsApi.cancelAppointment(id),
    delete: (id) => appointmentsApi.deleteAppointment(id),
    bulkCreate: (dataArray) => appointmentsApi.bulkCreateAppointments(dataArray),
    test: () => appointmentsApi.testAppointmentsApiConnection(),
  };

  // ========================================================================
  // 🧪 TESTING & DIAGNOSTICS
  // ========================================================================

  /**
   * 🧪 Test all API connections
   */
  async testAllConnections() {
    try {
      this.logger.info('Testing all GHL API connections...');

      const tests = {
        contacts: await this.contacts.test(),
        tasks: await this.tasks.test(),
        pipeline: await this.pipeline.test(),
        users: await this.users.test(),
      };

      const results = {
        success: true,
        tests,
        summary: {
          total: Object.keys(tests).length,
          passed: Object.values(tests).filter(t => t.success).length,
          failed: Object.values(tests).filter(t => !t.success).length,
        },
      };

      this.logger.success('API connection tests completed', results.summary);

      return results;

    } catch (error) {
      this.logger.error('API connection tests failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 🧪 Health check for all services
   */
  async healthCheck() {
    try {
      const health = {
        config: {
          hasToken: !!this.config.token,
          hasLocationId: !!this.config.locationId,
          hasCompanyId: !!this.config.companyId,
          tokenValid: this.config.token && this.config.token.startsWith('pit-'),
        },
        services: await this.testAllConnections(),
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: health,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const ghlIntegration = new GHLIntegrationService();

// Export both the class and instance
export { GHLIntegrationService };
export default ghlIntegration;
