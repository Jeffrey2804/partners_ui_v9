/**
 * Professional API Service Layer
 * Centralized API request handling with proper error management
 */

import { apiLogger } from '@utils/logger';
import { API_CONFIG, ERROR_MESSAGES } from '@constants/app';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
  }

  /**
   * Create request headers
   * @param {Object} customHeaders - Additional headers
   * @returns {Object} Request headers
   */
  createHeaders(customHeaders = {}) {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Version': API_CONFIG.VERSION,
      ...customHeaders,
    };
  }

  /**
   * Create request configuration
   * @param {string} method - HTTP method
   * @param {Object} headers - Request headers
   * @param {Object} body - Request body
   * @returns {Object} Request configuration
   */
  createRequestConfig(method, headers = {}, body = null) {
    const config = {
      method,
      headers: this.createHeaders(headers),
      timeout: this.timeout,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    return config;
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      let errorMessage = ERROR_MESSAGES.API_ERROR;

      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }
      } catch (error) {
        apiLogger.error('Failed to parse error response', error);
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  /**
   * Retry request with exponential backoff
   * @param {Function} requestFn - Request function
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Response data
   */
  async retryRequest(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      apiLogger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryAttempts})`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    const { method = 'GET', headers = {}, body = null, retry = true } = options;

    const url = `${this.baseURL}${endpoint}`;
    const config = this.createRequestConfig(method, headers, body);

    apiLogger.debug('Making API request', { url, method, hasBody: !!body });

    const requestFn = async () => {
      const response = await fetch(url, config);
      return this.handleResponse(response);
    };

    try {
      const data = retry ? await this.retryRequest(requestFn) : await requestFn();
      apiLogger.debug('API request successful', { url, dataSize: JSON.stringify(data).length });
      return { success: true, data };
    } catch (error) {
      apiLogger.error('API request failed', error, { url, method });
      return { success: false, error: error.message };
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
