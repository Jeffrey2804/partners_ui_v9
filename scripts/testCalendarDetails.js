/**
 * Test script to get calendar details from GHL
 * Uses your specific calendar ID: sV3BiXrjzbfo1tSUdyHO
 */

const { getCalendarDetails } = require('../src/shared/services/api/ghlCalendarService');

/**
 * Test getting calendar details with your specific calendar ID
 */
async function testYourCalendar() {
  const calendarId = 'sV3BiXrjzbfo1tSUdyHO';

  try {
    const result = await getCalendarDetails(calendarId);

    // Return structured result for better handling
    return {
      success: true,
      calendar: {
        id: result.id || calendarId,
        name: result.name || 'Unknown',
        description: result.description || '',
        timezone: result.timezone || '',
        isActive: result.isActive || false,
        eventColor: result.eventColor || '',
        slotDuration: result.slotDuration || 0,
        slotInterval: result.slotInterval || 0,
        openHours: result.openHours || [],
        availability: result.availability || [],
      },
      rawData: result,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      calendarId,
    };
  }
}

/**
 * Validate that the environment is set up correctly
 */
function checkEnvironment() {
  const token = process.env.GHL_API_TOKEN;
  const version = process.env.GHL_API_VERSION || '2021-04-15';

  return {
    hasToken: !!token,
    tokenPrefix: token ? `${token.substring(0, 10)}...` : 'Not set',
    apiVersion: version,
    isReady: !!token,
  };
}

module.exports = {
  testYourCalendar,
  checkEnvironment,
};
