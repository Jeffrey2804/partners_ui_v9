/**
 * Enhanced Timezone Options Service
 *
 * This service creates timezone dropdown options similar to GHL's backend,
 * with recommended timezones and organized sections.
 */

import { getAvailableTimezones } from './calendarTimezoneService.js';

// Cache for timezone data to enable auto-refresh
const timezoneCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for auto-refresh

// Auto-refresh settings
let autoRefreshInterval = null;
const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes

/**
 * Start automatic timezone refresh
 * This will periodically check for new timezones from GHL backend
 */
export function startTimezoneAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  autoRefreshInterval = setInterval(async () => {
    try {
      console.warn('🔄 Auto-refreshing timezones from GHL backend...');
      await refreshTimezoneCache();
    } catch (error) {
      console.warn('⚠️ Auto-refresh failed:', error.message);
    }
  }, AUTO_REFRESH_INTERVAL);

  console.warn('✅ Timezone auto-refresh started (every 15 minutes)');
}

/**
 * Stop automatic timezone refresh
 */
export function stopTimezoneAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.warn('🛑 Timezone auto-refresh stopped');
  }
}

/**
 * Manually refresh timezone cache
 */
export async function refreshTimezoneCache() {
  timezoneCache.clear();
  console.warn('🗑️ Timezone cache cleared for refresh');
}

// Common US/North American timezones (recommended)
const RECOMMENDED_TIMEZONES = [
  'America/Los_Angeles', // PDT/PST
  'America/Chicago',     // CDT/CST
  'America/New_York',    // EDT/EST
  'America/Denver',      // MDT/MST
];

// Additional common timezones
const COMMON_TIMEZONES = [
  'Europe/London',       // GMT/BST
  'Europe/Paris',        // CET/CEST
  'Asia/Tokyo',          // JST
  'Asia/Shanghai',       // CST
  'Asia/Kolkata',        // IST
  'Australia/Sydney',    // AEST/AEDT
  'Pacific/Honolulu',    // HST
  'Pacific/Midway',      // SST
];

/**
 * Format timezone for display like GHL backend
 * @param {string} timezone - Timezone identifier
 * @returns {string} Formatted display string
 */
function formatTimezoneForDropdown(timezone) {
  try {
    // Clean and validate timezone string first
    let cleanTimezone = timezone.trim();

    // Check if timezone is already formatted or has weird formatting
    if (cleanTimezone.includes('GMT') && cleanTimezone.includes('.')) {
      // Extract clean timezone from malformed string like "GMT+01:59.996316666666665 America/Cayenne"
      const match = cleanTimezone.match(/([A-Za-z]+\/[A-Za-z_]+)/);
      if (match) {
        cleanTimezone = match[1];
      } else {
        // If no clean timezone found, try to extract from the string
        const fallbackMatch = cleanTimezone.match(/([A-Za-z_]+\/[A-Za-z_]+)/);
        cleanTimezone = fallbackMatch ? fallbackMatch[1] : 'America/Los_Angeles';
      }
    }

    // Validate timezone before processing
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: cleanTimezone });
    } catch (_error) {
      console.warn('⚠️ Invalid timezone detected:', cleanTimezone, 'using fallback');
      cleanTimezone = 'America/Los_Angeles';
    }

    const now = new Date();

    // Use Intl.DateTimeFormat to get the offset directly
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: cleanTimezone,
      timeZoneName: 'longOffset',
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    let offsetStr = 'GMT+00:00';

    if (offsetPart && offsetPart.value.includes('GMT')) {
      offsetStr = offsetPart.value;
    }

    // Get timezone abbreviation
    const abbreviationFormatter = new Intl.DateTimeFormat('en', {
      timeZone: cleanTimezone,
      timeZoneName: 'short',
    });

    const abbrevParts = abbreviationFormatter.formatToParts(now);
    const abbreviation = abbrevParts.find(part => part.type === 'timeZoneName')?.value || '';

    // Format like GHL: "GMT-08:00 America/Los_Angeles (PDT)"
    return `${offsetStr} ${cleanTimezone}${abbreviation ? ` (${abbreviation})` : ''}`;
  } catch (_error) {
    return timezone;
  }
}

/**
 * Get timezone display name without full path
 * @param {string} timezone - Timezone identifier
 * @returns {string} Short display name
 */
function getTimezoneDisplayName(timezone) {
  const parts = timezone.split('/');
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(/_/g, ' ');
  }
  return timezone;
}

/**
 * Get all available timezones (comprehensive list)
 * This includes both GHL API timezones and all standard IANA timezones
 * @param {string} [locationId] - Location ID for GHL API call
 * @returns {Promise<string[]>} Complete list of timezone identifiers
 */
async function getAllTimezones(locationId = null) {
  const cacheKey = `all-timezones-${locationId || 'default'}`;

  // Check cache first
  const cached = timezoneCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.warn('📦 Using cached timezone data');
    return cached.data;
  }

  const allTimezones = new Set();

  try {
    // Get timezones from GHL API (with auto-refresh)
    const ghlTimezones = await getAvailableTimezones(locationId);

    console.warn('📡 Raw GHL timezone data:', ghlTimezones.slice(0, 5)); // Show first 5 for debugging

    // Clean and validate GHL timezones
    const cleanGhlTimezones = ghlTimezones
      .filter(tz => typeof tz === 'string' && tz.trim().length > 0)
      .map(tz => {
        const original = tz;
        // Extract clean timezone from potentially malformed strings
        const match = tz.match(/([A-Za-z]+\/[A-Za-z_]+)/);
        const cleaned = match ? match[1] : tz;
        if (original !== cleaned) {
          console.warn('🧹 Cleaned timezone:', original, '->', cleaned);
        }
        return cleaned;
      })
      .filter(tz => {
        // Validate timezone
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: tz });
          return true;
        } catch (_error) {
          console.warn('❌ Invalid timezone filtered out:', tz);
          return false;
        }
      });

    cleanGhlTimezones.forEach(tz => allTimezones.add(tz));
    console.warn('📡 Added clean GHL timezones:', cleanGhlTimezones.length);
  } catch (error) {
    console.warn('⚠️ Could not fetch GHL timezones:', error.message);
  }

  // Add comprehensive list of IANA timezones
  const standardTimezones = [
    // Americas
    'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua',
    'America/Araguaina', 'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca',
    'America/Argentina/Cordoba', 'America/Argentina/Jujuy', 'America/Argentina/La_Rioja',
    'America/Argentina/Mendoza', 'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta',
    'America/Argentina/San_Juan', 'America/Argentina/San_Luis', 'America/Argentina/Tucuman',
    'America/Argentina/Ushuaia', 'America/Aruba', 'America/Asuncion', 'America/Atikokan',
    'America/Bahia', 'America/Bahia_Banderas', 'America/Barbados', 'America/Belem',
    'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista', 'America/Bogota',
    'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
    'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago',
    'America/Chihuahua', 'America/Costa_Rica', 'America/Creston', 'America/Cuiaba',
    'America/Curacao', 'America/Danmarkshavn', 'America/Dawson', 'America/Dawson_Creek',
    'America/Denver', 'America/Detroit', 'America/Dominica', 'America/Edmonton',
    'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
    'America/Glace_Bay', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada',
    'America/Guadeloupe', 'America/Guatemala', 'America/Guayaquil', 'America/Guyana',
    'America/Halifax', 'America/Havana', 'America/Hermosillo', 'America/Indiana/Indianapolis',
    'America/Indiana/Knox', 'America/Indiana/Marengo', 'America/Indiana/Petersburg',
    'America/Indiana/Tell_City', 'America/Indiana/Vevay', 'America/Indiana/Vincennes',
    'America/Indiana/Winamac', 'America/Inuvik', 'America/Iqaluit', 'America/Jamaica',
    'America/Juneau', 'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
    'America/Kralendijk', 'America/La_Paz', 'America/Lima', 'America/Los_Angeles',
    'America/Lower_Princes', 'America/Maceio', 'America/Managua', 'America/Manaus',
    'America/Marigot', 'America/Martinique', 'America/Matamoros', 'America/Mazatlan',
    'America/Menominee', 'America/Merida', 'America/Metlakatla', 'America/Mexico_City',
    'America/Miquelon', 'America/Moncton', 'America/Monterrey', 'America/Montevideo',
    'America/Montreal', 'America/Montserrat', 'America/Nassau', 'America/New_York',
    'America/Nipigon', 'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah',
    'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/Nuuk',
    'America/Ojinaga', 'America/Panama', 'America/Pangnirtung', 'America/Paramaribo',
    'America/Phoenix', 'America/Port-au-Prince', 'America/Port_of_Spain', 'America/Porto_Velho',
    'America/Puerto_Rico', 'America/Punta_Arenas', 'America/Rainy_River', 'America/Rankin_Inlet',
    'America/Recife', 'America/Regina', 'America/Resolute', 'America/Rio_Branco',
    'America/Santarem', 'America/Santiago', 'America/Santo_Domingo', 'America/Sao_Paulo',
    'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy', 'America/St_Johns',
    'America/St_Kitts', 'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent',
    'America/Swift_Current', 'America/Tegucigalpa', 'America/Thule', 'America/Thunder_Bay',
    'America/Tijuana', 'America/Toronto', 'America/Tortola', 'America/Vancouver',
    'America/Whitehorse', 'America/Winnipeg', 'America/Yakutat', 'America/Yellowknife',

    // Europe
    'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens',
    'Europe/Belgrade', 'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels',
    'Europe/Bucharest', 'Europe/Budapest', 'Europe/Busingen', 'Europe/Chisinau',
    'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar', 'Europe/Guernsey',
    'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey',
    'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon',
    'Europe/Ljubljana', 'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid',
    'Europe/Malta', 'Europe/Mariehamn', 'Europe/Minsk', 'Europe/Monaco',
    'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica',
    'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara',
    'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Saratov', 'Europe/Simferopol',
    'Europe/Skopje', 'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn',
    'Europe/Tirane', 'Europe/Ulyanovsk', 'Europe/Uzhgorod', 'Europe/Vaduz',
    'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Volgograd',
    'Europe/Warsaw', 'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich',

    // Asia
    'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau',
    'Asia/Aqtobe', 'Asia/Ashgabat', 'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain',
    'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut', 'Asia/Bishkek',
    'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus',
    'Asia/Dhaka', 'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta',
    'Asia/Gaza', 'Asia/Hebron', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Hovd',
    'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura', 'Asia/Jerusalem', 'Asia/Kabul',
    'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Khandyga', 'Asia/Kolkata',
    'Asia/Krasnoyarsk', 'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau',
    'Asia/Magadan', 'Asia/Makassar', 'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia',
    'Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh',
    'Asia/Pontianak', 'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Qostanay', 'Asia/Qyzylorda',
    'Asia/Riyadh', 'Asia/Sakhalin', 'Asia/Samarkand', 'Asia/Seoul', 'Asia/Shanghai',
    'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent', 'Asia/Tbilisi',
    'Asia/Tehran', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar',
    'Asia/Urumqi', 'Asia/Ust-Nera', 'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk',
    'Asia/Yangon', 'Asia/Yekaterinburg', 'Asia/Yerevan',

    // Africa
    'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
    'Africa/Asmara', 'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul',
    'Africa/Bissau', 'Africa/Blantyre', 'Africa/Brazzaville', 'Africa/Bujumbura',
    'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta', 'Africa/Conakry',
    'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
    'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare',
    'Africa/Johannesburg', 'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum',
    'Africa/Kigali', 'Africa/Kinshasa', 'Africa/Lagos', 'Africa/Libreville',
    'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi', 'Africa/Lusaka',
    'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
    'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena',
    'Africa/Niamey', 'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo',
    'Africa/Sao_Tome', 'Africa/Tripoli', 'Africa/Tunis', 'Africa/Windhoek',

    // Australia/Pacific
    'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Currie',
    'Australia/Darwin', 'Australia/Eucla', 'Australia/Hobart', 'Australia/Lindeman',
    'Australia/Lord_Howe', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
    'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham',
    'Pacific/Chuuk', 'Pacific/Easter', 'Pacific/Efate', 'Pacific/Enderbury',
    'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti', 'Pacific/Galapagos',
    'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu',
    'Pacific/Kiritimati', 'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro',
    'Pacific/Marquesas', 'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue',
    'Pacific/Norfolk', 'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Palau',
    'Pacific/Pitcairn', 'Pacific/Pohnpei', 'Pacific/Port_Moresby', 'Pacific/Rarotonga',
    'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa', 'Pacific/Tongatapu',
    'Pacific/Wake', 'Pacific/Wallis',

    // Other
    'UTC', 'GMT',
  ];

  // Add all standard timezones
  standardTimezones.forEach(tz => allTimezones.add(tz));

  // Convert to array and filter valid ones
  const result = Array.from(allTimezones).filter(tz => {
    try {
      // Test if timezone is valid
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  });

  // Cache the result for auto-refresh
  timezoneCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  console.warn('🌍 Total available timezones:', result.length);
  console.warn('📦 Cached timezone data for auto-refresh');
  return result;
}
/**
 * Create enhanced timezone options with sections like GHL backend
 * @param {string} [locationId] - Location ID for fetching available timezones
 * @param {string} [currentTimezone] - Currently selected timezone to highlight
 * @returns {Promise<Object>} Organized timezone options
 */
export async function getEnhancedTimezoneOptions(locationId = null, currentTimezone = null) {
  try {
    console.warn('🌍 Creating enhanced timezone options...');

    // Fetch ALL available timezones (comprehensive list)
    let availableTimezones = [];
    try {
      availableTimezones = await getAllTimezones(locationId);
      console.warn('✅ Fetched ALL timezones:', availableTimezones.length);
    } catch (_error) {
      console.warn('⚠️ Failed to fetch timezones, using fallback list');
      availableTimezones = [...RECOMMENDED_TIMEZONES, ...COMMON_TIMEZONES];
    }

    // Remove duplicates and filter valid timezones
    const uniqueTimezones = [...new Set(availableTimezones)].filter(tz =>
      typeof tz === 'string' && tz.includes('/'),
    );

    // Separate recommended and other timezones
    const recommendedOptions = [];
    const allOptions = [];

    // Add recommended timezones first
    RECOMMENDED_TIMEZONES.forEach(timezone => {
      if (uniqueTimezones.includes(timezone)) {
        const option = {
          value: timezone,
          label: formatTimezoneForDropdown(timezone),
          displayName: getTimezoneDisplayName(timezone),
          isRecommended: true,
          isCurrent: timezone === currentTimezone,
        };
        recommendedOptions.push(option);
      }
    });

    // Add all timezones (sorted alphabetically by display name)
    uniqueTimezones
      .sort((a, b) => {
        const aDisplay = getTimezoneDisplayName(a);
        const bDisplay = getTimezoneDisplayName(b);
        return aDisplay.localeCompare(bDisplay);
      })
      .forEach(timezone => {
        const option = {
          value: timezone,
          label: formatTimezoneForDropdown(timezone),
          displayName: getTimezoneDisplayName(timezone),
          isRecommended: RECOMMENDED_TIMEZONES.includes(timezone),
          isCurrent: timezone === currentTimezone,
        };
        allOptions.push(option);
      });

    // Create sections like GHL backend
    const sections = {
      current: currentTimezone ? {
        title: 'Showing slots in this timezone: (Account Timezone)',
        options: allOptions.filter(opt => opt.isCurrent),
      } : null,
      recommended: {
        title: 'Recommended Timezones',
        options: recommendedOptions,
      },
      all: {
        title: 'All Timezones',
        options: allOptions,
      },
    };

    // Create flat list for simple dropdown (backward compatibility)
    const flatOptions = allOptions;

    console.warn('✅ Enhanced timezone options created:', {
      total: uniqueTimezones.length,
      recommended: recommendedOptions.length,
      current: currentTimezone,
    });

    return {
      sections,
      flatOptions,
      currentTimezone,
      totalTimezones: uniqueTimezones.length,
    };

  } catch (error) {
    console.error('❌ Error creating enhanced timezone options:', error.message);

    // Fallback to basic options
    const fallbackTimezones = [...RECOMMENDED_TIMEZONES, ...COMMON_TIMEZONES];
    const fallbackOptions = fallbackTimezones.map(timezone => ({
      value: timezone,
      label: formatTimezoneForDropdown(timezone),
      displayName: getTimezoneDisplayName(timezone),
      isRecommended: RECOMMENDED_TIMEZONES.includes(timezone),
      isCurrent: timezone === currentTimezone,
    }));

    return {
      sections: {
        current: null,
        recommended: {
          title: 'Recommended Timezones',
          options: fallbackOptions.filter(opt => opt.isRecommended),
        },
        all: {
          title: 'All Timezones',
          options: fallbackOptions,
        },
      },
      flatOptions: fallbackOptions,
      currentTimezone,
      totalTimezones: fallbackTimezones.length,
      error: error.message,
    };
  }
}

/**
 * Get simple timezone options (backward compatibility)
 * @param {string} [locationId] - Location ID
 * @returns {Promise<Array>} Simple array of timezone options
 */
export async function getTimezoneOptionsCompat(locationId = null) {
  const enhanced = await getEnhancedTimezoneOptions(locationId);
  return enhanced.flatOptions;
}

/**
 * Search timezones by query
 * @param {string} query - Search query
 * @param {string} [locationId] - Location ID
 * @returns {Promise<Array>} Filtered timezone options
 */
export async function searchTimezones(query, locationId = null) {
  const enhanced = await getEnhancedTimezoneOptions(locationId);
  const lowerQuery = query.toLowerCase();

  return enhanced.flatOptions.filter(option =>
    option.label.toLowerCase().includes(lowerQuery) ||
    option.displayName.toLowerCase().includes(lowerQuery) ||
    option.value.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Get timezone info for a specific timezone
 * @param {string} timezone - Timezone identifier
 * @returns {Object} Timezone information
 */
export function getTimezoneInfo(timezone) {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const localTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (localTime.getTime() - utc.getTime()) / (1000 * 60 * 60);

    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset);
    const minutes = (absOffset - hours) * 60;
    const offsetStr = `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const abbreviation = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || '';

    return {
      timezone,
      offset,
      offsetString: offsetStr,
      abbreviation,
      displayName: getTimezoneDisplayName(timezone),
      fullDisplay: formatTimezoneForDropdown(timezone),
      isRecommended: RECOMMENDED_TIMEZONES.includes(timezone),
    };
  } catch (error) {
    return {
      timezone,
      offset: 0,
      offsetString: 'GMT+00:00',
      abbreviation: '',
      displayName: timezone,
      fullDisplay: timezone,
      isRecommended: false,
      error: error.message,
    };
  }
}
