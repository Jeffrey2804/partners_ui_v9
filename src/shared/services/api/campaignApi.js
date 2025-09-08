// ========================================
// 🎯 CAMPAIGN API SERVICE
// ========================================
// Handles all campaign-related API operations with GoHighLevel

import { toast } from 'react-hot-toast';
import { createLogger } from '@utils/logger';
import { GHL_CONFIG, getGHLHeaders } from '@config/ghlConfig';

const campaignLogger = createLogger('CampaignAPI');

class CampaignApiService {
  constructor() {
    this.config = GHL_CONFIG;
    this.logger = campaignLogger;
    this.baseUrl = `${this.config.locationUrl}/campaigns`;
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
   * Clean campaign data for API requests
   */
  cleanCampaignData(data) {
    const cleanData = { ...data };

    // Remove system fields
    const fieldsToRemove = ['id', '_id', 'createdAt', 'updatedAt', 'stats', 'locationId'];
    fieldsToRemove.forEach(field => {
      if (cleanData.hasOwnProperty(field)) {
        delete cleanData[field];
      }
    });

    // Ensure required fields
    if (!cleanData.name) {
      throw new Error('Campaign name is required');
    }
    if (!cleanData.type) {
      cleanData.type = 'email'; // Default to email
    }
    if (!cleanData.status) {
      cleanData.status = 'draft'; // Default to draft
    }

    return cleanData;
  }

  // ========================================================================
  // 📥 READ OPERATIONS
  // ========================================================================

  /**
   * Fetch all campaigns
   */
  async fetchCampaigns(filters = {}) {
    try {
      let url = this.baseUrl;

      // Add query parameters
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      this.logger.info('Fetching campaigns', { filters, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: getGHLHeaders(),
      });

      const data = await this.handleResponse(response, 'FETCH_CAMPAIGNS');

      // Handle different response structures
      const campaigns = Array.isArray(data) ? data : (data.campaigns || data.data || []);

      this.logger.success('Campaigns fetched successfully', { count: campaigns.length });

      return {
        success: true,
        data: campaigns,
        meta: data.meta || data.pagination || null,
        resource: 'campaigns',
        operation: 'FETCH_ALL',
      };

    } catch (error) {
      this.logger.error('Fetch campaigns failed', error);
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'FETCH_ALL',
        data: [],
      };
    }
  }

  /**
   * Fetch single campaign by ID
   */
  async fetchCampaignById(campaignId) {
    try {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const url = `${this.baseUrl}/${campaignId}`;
      this.logger.info('Fetching campaign by ID', { campaignId, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: getGHLHeaders(),
      });

      const data = await this.handleResponse(response, 'FETCH_CAMPAIGN');

      this.logger.success('Campaign fetched successfully', { campaignId });

      return {
        success: true,
        data,
        resource: 'campaigns',
        operation: 'FETCH_ONE',
      };

    } catch (error) {
      this.logger.error('Fetch campaign failed', error, { campaignId });
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'FETCH_ONE',
        data: null,
      };
    }
  }

  /**
   * Get campaign statistics
   */
  async fetchCampaignStats(campaignId) {
    try {
      const url = `${this.baseUrl}/${campaignId}/stats`;
      this.logger.info('Fetching campaign stats', { campaignId });

      const response = await fetch(url, {
        method: 'GET',
        headers: getGHLHeaders(),
      });

      const data = await this.handleResponse(response, 'FETCH_CAMPAIGN_STATS');

      return {
        success: true,
        data,
        resource: 'campaigns',
        operation: 'FETCH_STATS',
      };

    } catch (error) {
      this.logger.error('Fetch campaign stats failed', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  // ========================================================================
  // 📤 CREATE OPERATIONS
  // ========================================================================

  /**
   * Create new campaign
   */
  async createCampaign(campaignData) {
    try {
      const cleanData = this.cleanCampaignData(campaignData);

      this.logger.info('Creating campaign', { data: cleanData });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getGHLHeaders(),
        body: JSON.stringify(cleanData),
      });

      const result = await this.handleResponse(response, 'CREATE_CAMPAIGN');

      this.logger.success('Campaign created successfully', { id: result._id || result.id });
      toast.success('✅ Campaign created successfully!');

      return {
        success: true,
        data: result,
        resource: 'campaigns',
        operation: 'CREATE',
      };

    } catch (error) {
      this.logger.error('Create campaign failed', error);
      toast.error(`❌ Failed to create campaign: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'CREATE',
        data: null,
      };
    }
  }

  // ========================================================================
  // 📝 UPDATE OPERATIONS
  // ========================================================================

  /**
   * Update campaign
   */
  async updateCampaign(campaignId, updates) {
    try {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const cleanData = this.cleanCampaignData(updates);
      const url = `${this.baseUrl}/${campaignId}`;

      this.logger.info('Updating campaign', { campaignId, updates: cleanData });

      const response = await fetch(url, {
        method: 'PUT',
        headers: getGHLHeaders(),
        body: JSON.stringify(cleanData),
      });

      const result = await this.handleResponse(response, 'UPDATE_CAMPAIGN');

      this.logger.success('Campaign updated successfully', { campaignId });
      toast.success('✅ Campaign updated successfully!');

      return {
        success: true,
        data: result,
        resource: 'campaigns',
        operation: 'UPDATE',
      };

    } catch (error) {
      this.logger.error('Update campaign failed', error);
      toast.error(`❌ Failed to update campaign: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'UPDATE',
        data: null,
      };
    }
  }

  /**
   * Update campaign status (start, pause, stop)
   */
  async updateCampaignStatus(campaignId, status) {
    try {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const validStatuses = ['active', 'paused', 'stopped', 'draft'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const url = `${this.baseUrl}/${campaignId}/status`;

      this.logger.info('Updating campaign status', { campaignId, status });

      const response = await fetch(url, {
        method: 'PATCH',
        headers: getGHLHeaders(),
        body: JSON.stringify({ status }),
      });

      const result = await this.handleResponse(response, 'UPDATE_CAMPAIGN_STATUS');

      this.logger.success('Campaign status updated successfully', { campaignId, status });
      toast.success(`✅ Campaign ${status === 'active' ? 'started' : status}!`);

      return {
        success: true,
        data: result,
        resource: 'campaigns',
        operation: 'UPDATE_STATUS',
      };

    } catch (error) {
      this.logger.error('Update campaign status failed', error);
      toast.error(`❌ Failed to update campaign status: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'UPDATE_STATUS',
        data: null,
      };
    }
  }

  // ========================================================================
  // 🗑️ DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId) {
    try {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const url = `${this.baseUrl}/${campaignId}`;

      this.logger.info('Deleting campaign', { campaignId });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getGHLHeaders(),
      });

      await this.handleResponse(response, 'DELETE_CAMPAIGN');

      this.logger.success('Campaign deleted successfully', { campaignId });
      toast.success('✅ Campaign deleted successfully!');

      return {
        success: true,
        data: { id: campaignId },
        resource: 'campaigns',
        operation: 'DELETE',
      };

    } catch (error) {
      this.logger.error('Delete campaign failed', error);
      toast.error(`❌ Failed to delete campaign: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'DELETE',
        data: null,
      };
    }
  }

  // ========================================================================
  // 🔄 BULK OPERATIONS
  // ========================================================================

  /**
   * Bulk update campaign statuses
   */
  async bulkUpdateCampaignStatus(campaignIds, status) {
    try {
      this.logger.info('Bulk updating campaign statuses', {
        campaignIds,
        status,
        count: campaignIds.length,
      });

      const promises = campaignIds.map(id => this.updateCampaignStatus(id, status));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

      this.logger.success('Bulk campaign status update completed', {
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
        resource: 'campaigns',
        operation: 'BULK_UPDATE_STATUS',
      };

    } catch (error) {
      this.logger.error('Bulk campaign status update failed', error);
      return {
        success: false,
        error: error.message,
        resource: 'campaigns',
        operation: 'BULK_UPDATE_STATUS',
      };
    }
  }

  // ========================================================================
  // 🧪 TESTING
  // ========================================================================

  /**
   * Test campaign API connection
   */
  async testCampaignApiConnection() {
    try {
      this.logger.info('Testing campaign API connection...');

      const result = await this.fetchCampaigns({ limit: 1 });

      if (result.success) {
        this.logger.success('Campaign API connection test passed');
        return {
          success: true,
          message: 'Campaign API connection successful',
          endpoint: this.baseUrl,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.logger.error('Campaign API connection test failed', error);
      return {
        success: false,
        message: 'Campaign API connection failed',
        error: error.message,
        endpoint: this.baseUrl,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Create and export singleton instance
const campaignApi = new CampaignApiService();
export default campaignApi;
