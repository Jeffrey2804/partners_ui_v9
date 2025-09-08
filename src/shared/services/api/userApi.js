// ========================================
// 👤 USER API SERVICE
// ========================================

import { toast } from 'react-hot-toast';
import { createLogger } from '@utils/logger';
import { GHL_CONFIG, getGHLHeaders, getGHLUserHeaders, validateGHLConfig } from '@config/ghlConfig';

const userLogger = createLogger('UserAPI');

// Validate configuration on import
const configValidation = validateGHLConfig();
if (!configValidation.isValid) {
  userLogger.warn('GHL Configuration Issues:', configValidation.issues);
}

/**
 * Normalize user data to ensure consistent ID handling
 * GHL uses different ID formats, so we standardize them
 */
const normalizeUserData = (user) => {
  // GHL user IDs can be in different formats
  let ghlId = null;

  // Try to find the GHL user ID from various possible fields
  if (user.id) {
    ghlId = user.id;
  } else if (user._id) {
    ghlId = user._id;
  } else if (user.userId) {
    ghlId = user.userId;
  } else if (user.ghlUserId) {
    ghlId = user.ghlUserId;
  }

  // If no ID found, generate a fallback
  if (!ghlId) {
    ghlId = `ghl_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    userLogger.warn('No GHL user ID found, generated fallback ID', { user, ghlId });
  }

  // Handle GHL user name format (firstName + lastName or name field)
  let firstName = user.firstName || user.first_name || '';
  let lastName = user.lastName || user.last_name || '';

  // If we have a name field but no firstName/lastName, split it
  if (!firstName && !lastName && user.name) {
    const nameParts = user.name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  return {
    // Standardized fields
    ghlId: ghlId,           // Primary GHL user ID
    id: ghlId,              // Alias for compatibility
    _id: ghlId,             // Alias for compatibility

    // User information
    firstName: firstName,
    lastName: lastName,
    email: user.email || user.emailAddress || '',

    // Additional fields
    role: user.role || user.userRole || user.permission || 'user',
    status: user.status || user.userStatus || (user.deleted ? 'inactive' : 'active'),
    phone: user.phone || user.phoneNumber || '',

    // GHL-specific fields
    deleted: user.deleted || false,
    permissions: user.permissions || [],
    roles: user.roles || [],
    dateAdded: user.dateAdded || user.dateCreated || null,
    dateUpdated: user.dateUpdated || user.dateModified || null,

    // Original data for debugging
    _original: user,
  };
};

// ============================================================================
// 📥 GET REQUESTS
// ============================================================================

/**
 * 🎯 GET - Fetch all users
 * Returns all users from the GHL API using the specific users/search endpoint
 */
export const fetchUsers = async () => {
  try {
    userLogger.info('Fetching users from GHL API using exact curl parameters...');

    // Use the exact URL from your curl command
    const url = 'https://services.leadconnectorhq.com/users/search?companyId=qde26YsDnbKL4flivFCM&locationId=b7vHWUGVUNQGoIlAXabY';

    // Use the exact headers from your curl command
    const headers = {
      'Accept': 'application/json',
      'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
      'Version': '2021-07-28',
    };

    userLogger.debug(`Using exact curl URL: ${url}`);
    userLogger.debug('Headers:', headers);

    const requestOptions = {
      method: 'GET',
      headers: headers,
    };

    userLogger.debug(`Making request to: ${url}`);
    const response = await fetch(url, requestOptions);

    if (response.ok) {
      const data = await response.json();
      console.log('🔍 GHL Users API Response:', data);
      userLogger.info(`Success with URL: ${url}`, { data });

      // Handle different response formats
      let users = [];
      if (data.users) {
        users = data.users;
      } else if (data.teamMembers) {
        users = data.teamMembers;
      } else if (data.staff) {
        users = data.staff;
      } else if (Array.isArray(data)) {
        users = data;
      } else if (data.data && Array.isArray(data.data)) {
        users = data.data;
      }

      if (users.length > 0) {
        console.log('🔍 Extracted users from response:', users);
        // Normalize user data to ensure consistent ID handling
        const normalizedUsers = users.map(user => normalizeUserData(user));

        userLogger.success('Users fetched successfully', {
          count: normalizedUsers.length,
          url: url,
          sampleUser: normalizedUsers[0],
        });

        return {
          success: true,
          data: normalizedUsers,
          url: url,
        };
      } else {
        userLogger.warn('No users found in response', { data });
        throw new Error('No users found in API response');
      }
    } else {
      const errorText = await response.text();
      userLogger.error(`URL ${url} failed:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url,
        method: 'GET',
        headers: headers,
      });

      // Log the full error details
      console.error('🔍 GHL Users API Error Details:', {
        url: url,
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        headers: headers,
        companyId: 'qde26YsDnbKL4flivFCM',
      });

      // If it's a 401 or 403, it's likely a token issue
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed. Please check your GHL API token. Status: ${response.status} - ${errorText}`);
      }

      // If it's a 404, the endpoint might not exist
      if (response.status === 404) {
        throw new Error(`URL not found: ${url}. Status: ${response.status} - ${errorText}`);
      }

      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    userLogger.error('Error fetching users from GHL API:', error);

    // Return mock users as fallback with realistic GHL-style IDs
    const mockUsers = [
      {
        id: 'ghl_user_64f8a1b2c3d4e5f6a7b8c9d0',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        status: 'active',
      },
      {
        id: 'ghl_user_64f8a1b2c3d4e5f6a7b8c9d1',
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@example.com',
        role: 'manager',
        status: 'active',
      },
      {
        id: 'ghl_user_64f8a1b2c3d4e5f6a7b8c9d2',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@example.com',
        role: 'agent',
        status: 'active',
      },
      {
        id: 'ghl_user_64f8a1b2c3d4e5f6a7b8c9d3',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@example.com',
        role: 'agent',
        status: 'active',
      },
      {
        id: 'ghl_user_64f8a1b2c3d4e5f6a7b8c9d4',
        firstName: 'Michael',
        lastName: 'Smith',
        email: 'michael.smith@example.com',
        role: 'agent',
        status: 'active',
      },
    ];

    userLogger.warn('Using mock users as fallback');

    // Normalize mock users as well
    const normalizedMockUsers = mockUsers.map(user => normalizeUserData(user));

    return {
      success: false,
      error: error.message,
      data: normalizedMockUsers,
      isMockData: true,
    };
  }
};

/**
 * 🎯 GET - Fetch user by ID
 * Returns a specific user by their ID
 */
export const fetchUserById = async (userId) => {
  try {
    userLogger.info('Fetching user by ID:', { userId });

    const response = await fetch(
      `${GHL_CONFIG.baseUrl}/users/${userId}`,
      {
        method: 'GET',
        headers: getGHLHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      userLogger.error('Failed to fetch user by ID:', {
        userId,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const user = data.user || data;

    // Normalize the user data
    const normalizedUser = normalizeUserData(user);

    userLogger.success('User fetched successfully', { userId, user: normalizedUser });

    return {
      success: true,
      data: normalizedUser,
    };

  } catch (error) {
    userLogger.error('Error fetching user by ID:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 🎯 GET - Search users
 * Returns users based on search criteria using the users/search endpoint
 */
export const searchUsers = async (searchCriteria = {}) => {
  try {
    userLogger.info('Searching users:', { searchCriteria });

    // Use GET method with query parameters for search, including company ID
    const searchParams = { ...searchCriteria, companyId: GHL_CONFIG.companyId };
    const queryParams = new URLSearchParams(searchParams).toString();
    const url = `${GHL_CONFIG.baseUrl}/users/search?${queryParams}`;

    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: getGHLUserHeaders(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const users = data.users || data || [];

    userLogger.success('Users search completed', { count: users.length });

    return {
      success: true,
      data: users,
    };

  } catch (error) {
    userLogger.error('Error searching users:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * 🎯 Get GHL User ID from various formats
 * Helper function to extract the correct GHL user ID
 */
export const getGHLUserId = (user) => {
  if (!user) return null;

  // Try different possible ID fields
  return user.ghlId || user.id || user._id || user.userId || user.ghlUserId;
};

/**
 * 🧪 Test GHL API token validity with multiple endpoints
 * Tests various endpoints to determine which ones work
 */
export const testGHLToken = async () => {
  try {
    userLogger.info('🧪 Testing GHL API token with multiple endpoints...');

    // Test multiple endpoints to see which ones work
    const testEndpoints = [
      { name: 'Timezones', endpoint: '/timezones', method: 'GET', baseUrl: GHL_CONFIG.baseUrl },
      { name: 'Users List', endpoint: '/users', method: 'GET', baseUrl: GHL_CONFIG.baseUrl },
      { name: 'Contacts Search', endpoint: '/contacts/search', method: 'POST', body: {}, baseUrl: GHL_CONFIG.locationUrl },
      { name: 'Users Search', endpoint: `/users/search?companyId=${GHL_CONFIG.companyId}`, method: 'GET', baseUrl: GHL_CONFIG.baseUrl },
      { name: 'Tasks Search', endpoint: '/tasks/search', method: 'POST', body: { completed: false, limit: 1 }, baseUrl: GHL_CONFIG.locationUrl },
    ];

    const results = [];

    for (const test of testEndpoints) {
      try {
        userLogger.debug(`Testing ${test.name} endpoint: ${test.endpoint}`);

        const requestOptions = {
          method: test.method,
          headers: getGHLHeaders(),
        };

        if (test.body) {
          requestOptions.body = JSON.stringify(test.body);
        }

        const response = await fetch(
          `${test.baseUrl}${test.endpoint}`,
          requestOptions,
        );

        const responseText = await response.text();
        let responseData;

        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { raw: responseText };
        }

        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });

        userLogger.debug(`${test.name} result:`, {
          success: response.ok,
          status: response.status,
          data: responseData,
        });

      } catch (error) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          success: false,
          error: error.message,
        });

        userLogger.warn(`${test.name} test failed:`, error);
      }
    }

    // Analyze results
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);

    if (successfulTests.length > 0) {
      userLogger.success('✅ GHL API token is valid', {
        successful: successfulTests.length,
        failed: failedTests.length,
        results,
      });

      return {
        success: true,
        message: `GHL API token is working. ${successfulTests.length}/${results.length} endpoints successful.`,
        status: 'Multiple endpoints tested',
        results,
        successfulTests,
        failedTests,
      };
    } else {
      userLogger.error('❌ All GHL API endpoints failed', {
        results,
      });

      // Determine the most likely issue
      let errorMessage = 'All GHL API endpoints failed';

      if (failedTests.some(r => r.status === 401)) {
        errorMessage = 'Invalid API token. Please check your GHL API token.';
      } else if (failedTests.some(r => r.status === 403)) {
        errorMessage = 'API token lacks required permissions.';
      } else if (failedTests.some(r => r.status === 404)) {
        errorMessage = 'Location not found. Please check your GHL location ID.';
      }

      return {
        success: false,
        message: errorMessage,
        status: 'All endpoints failed',
        results,
        successfulTests,
        failedTests,
      };
    }

  } catch (error) {
    userLogger.error('❌ GHL API token test error:', error);

    return {
      success: false,
      message: `GHL API token test error: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * 🧪 Test individual user fetching
 * Tests fetching a specific user by ID
 */
export const testIndividualUserFetch = async (testUserId = 'test-user-123') => {
  try {
    userLogger.info('🧪 Testing individual user fetch...', { testUserId });

    const result = await fetchUserById(testUserId);

    if (result.success) {
      userLogger.success('✅ Individual user fetch successful', {
        userId: testUserId,
        user: result.data,
      });

      return {
        success: true,
        message: 'Individual user fetch working',
        userId: testUserId,
        user: result.data,
      };
    } else {
      userLogger.warn('⚠️ Individual user fetch failed', {
        userId: testUserId,
        error: result.error,
      });

      return {
        success: false,
        message: `Individual user fetch failed: ${result.error}`,
        userId: testUserId,
        error: result.error,
      };
    }

  } catch (error) {
    userLogger.error('❌ Individual user fetch test error:', error);

    return {
      success: false,
      message: `Individual user fetch test error: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * 🧪 Test GHL Users API connection
 */
export const testGHLUsersConnection = async () => {
  try {
    userLogger.info('🧪 Testing GHL Users API connection...');

    // Log the configuration being used
    console.log('🔍 GHL Configuration for Users API:', {
      baseUrl: GHL_CONFIG.baseUrl,
      companyId: GHL_CONFIG.companyId,
      token: GHL_CONFIG.token ? `${GHL_CONFIG.token.substring(0, 20)}...` : 'NOT SET',
      version: GHL_CONFIG.version,
    });

    const result = await fetchUsers();

    if (result.success && !result.isMockData) {
      userLogger.success('✅ GHL Users API connection successful', {
        userCount: result.data.length,
        endpoint: result.endpoint,
      });

      return {
        success: true,
        message: 'GHL Users API connection working',
        userCount: result.data.length,
        endpoint: result.endpoint,
        users: result.data.slice(0, 3), // Show first 3 users for debugging
      };
    } else {
      userLogger.warn('⚠️ GHL Users API using fallback data', {
        error: result.error,
        isMockData: result.isMockData,
      });

      return {
        success: false,
        message: 'GHL Users API not available, using mock data',
        error: result.error,
        isMockData: result.isMockData,
        userCount: result.data.length,
        mockUsers: result.data.slice(0, 3), // Show first 3 mock users
      };
    }

  } catch (error) {
    userLogger.error('❌ GHL Users API connection test error:', error);

    return {
      success: false,
      message: `GHL Users API connection test error: ${error.message}`,
      error: error.message,
      stack: error.stack,
    };
  }
};

/**
 * 🧪 Direct test using the exact curl command format
 */
export const testDirectCurlFormat = async () => {
  try {
    userLogger.info('🧪 Testing direct curl format with exact parameters...');

    // Use the exact URL from your curl command
    const url = 'https://services.leadconnectorhq.com/users/search?companyId=qde26YsDnbKL4flivFCM&locationId=b7vHWUGVUNQGoIlAXabY';

    // Use the exact headers from your curl command
    const headers = {
      'Accept': 'application/json',
      'Authorization': 'Bearer pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f',
      'Version': '2021-07-28',
    };

    console.log('🔍 Testing exact curl parameters:', {
      url: url,
      headers: headers,
      method: 'GET',
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    console.log('🔍 Direct curl response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('🔍 Direct curl data:', data);

      // Normalize the user data for consistency
      let users = [];
      if (data.users) {
        users = data.users;
      } else if (data.teamMembers) {
        users = data.teamMembers;
      } else if (data.staff) {
        users = data.staff;
      } else if (Array.isArray(data)) {
        users = data;
      } else if (data.data && Array.isArray(data.data)) {
        users = data.data;
      }

      const normalizedUsers = users.map(user => normalizeUserData(user));

      return {
        success: true,
        message: 'Direct curl format works!',
        status: response.status,
        data: normalizedUsers,
        rawData: data,
      };
    } else {
      const errorText = await response.text();
      console.error('🔍 Direct curl error:', errorText);

      return {
        success: false,
        message: `Direct curl failed: ${response.status} - ${errorText}`,
        status: response.status,
        error: errorText,
      };
    }

  } catch (error) {
    console.error('🔍 Direct curl exception:', error);

    return {
      success: false,
      message: `Direct curl exception: ${error.message}`,
      error: error.message,
    };
  }
};

export default {
  fetchUsers,
  fetchUserById,
  searchUsers,
  testGHLUsersConnection,
  testGHLToken,
  testIndividualUserFetch,
  getGHLUserId,
  testDirectCurlFormat,
};
