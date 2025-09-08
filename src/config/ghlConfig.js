// ========================================
// 🎯 GHL API CONFIGURATION
// ========================================

// GoHighLevel API Configuration
export const GHL_CONFIG = {
  // Base URL for your GHL company (for users endpoint)
  baseUrl: 'https://services.leadconnectorhq.com',

  // Location-specific URL for other endpoints
  locationUrl: 'https://services.leadconnectorhq.com/locations/b7vHWUGVUNQGoIlAXabY',

  // API Token - Update this with your valid token
  // Get this from: GoHighLevel Dashboard → Settings → API → Private App Tokens
  // ✅ VERIFIED: This token works with calendar permissions
  token: 'pit-1dd731f9-e51f-40f7-bf4e-9e8cd31ed75f', // Working token with calendar access

  // API Version
  version: '2021-04-15',

  // Company ID (from your curl command)
  companyId: 'qde26YsDnbKL4flivFCM',

  // Location ID (extracted from locationUrl)
  locationId: 'b7vHWUGVUNQGoIlAXabY',

  // ✅ WORKING CALENDAR ID - tested and confirmed to return free slots
  defaultCalendarId: 'cF0lnbb4A2vCVdKQLrJp',
};

// Environment-specific overrides
const ENV_CONFIG = {
  development: {
    // Add any development-specific settings here
    debugMode: true,
    logLevel: 'debug',
  },
  production: {
    // Add any production-specific settings here
    debugMode: false,
    logLevel: 'error',
  },
};

// Get current environment config
export const getEnvConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};

// Validate GHL configuration
export const validateGHLConfig = () => {
  const issues = [];

  if (!GHL_CONFIG.token) {
    issues.push('GHL API token is missing');
  }

  if (!GHL_CONFIG.baseUrl.includes('leadconnectorhq.com')) {
    issues.push('GHL base URL appears to be invalid');
  }

  if (!GHL_CONFIG.locationId) {
    issues.push('GHL location ID is missing');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

// Get API headers for requests
export const getGHLHeaders = () => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${GHL_CONFIG.token}`,
  'Content-Type': 'application/json',
  'Version': GHL_CONFIG.version,
});

// Get simplified headers for users endpoint (matching your curl command)
export const getGHLUserHeaders = () => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${GHL_CONFIG.token}`,
  'Version': GHL_CONFIG.version,
});

// Instructions for getting a new token
export const GHL_TOKEN_INSTRUCTIONS = `
To get a new GHL API token with FULL permissions:

1. Log into your GoHighLevel account
2. Go to Settings → API → Private App Tokens
3. Click "Create New Token"
4. Give it a name (e.g., "Dashboard Integration")
5. Select ALL necessary permissions:
   ✅ Tasks: Read, Write, Create, Delete (CRITICAL for task operations)
   ✅ Contacts: Read, Write, Create, Delete
   ✅ Users: Read
   ✅ Calendars: Read, Write, Create, Delete (CRITICAL for appointments)
   ✅ Appointments: Read, Write, Create, Delete (CRITICAL for booking)
   ✅ Campaigns: Read, Write (if using campaigns)
   ✅ Locations: Read
6. Copy the generated token
7. Update the 'token' field in src/config/ghlConfig.js
8. Restart the application

IMPORTANT: The "user id not part of calendar team" error means:
- Either your token lacks calendar/appointment permissions
- Or the assignedUserId doesn't exist in your GHL location
- Make sure to select a valid user from your team

Note: Tokens can expire, so you may need to regenerate them periodically.
`;

export default GHL_CONFIG;
