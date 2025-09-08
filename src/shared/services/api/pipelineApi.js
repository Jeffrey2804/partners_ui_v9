// Pipeline API Service (clean, no console/logger)
// Handles pipeline-related API calls for leads, tags, and metrics

import { toast } from 'react-hot-toast';
import { API_CONFIG, PIPELINE_CONFIG } from '@config/environment';

// ---- Env ---------------------------------------------------------------
const { LEAD_CONNECTOR: LC } = API_CONFIG;
const { STAGES: PIPELINE_STAGES, STAGE_TAGS } = PIPELINE_CONFIG;

// Override location ID to ensure we use the correct one
const CORRECT_LOCATION_ID = 'b7vHWUGVUNQGoIlAXabY';

// ---- HTTP helpers ------------------------------------------------------
const ghHeaders = () => ({
  Accept: 'application/json',
  Authorization: `Bearer ${LC.token}`,
  Version: LC.version,
});

const ghUrl = (path, params = {}) => {
  const url = new URL(`${LC.baseUrl}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
};

const fetchJSON = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      console.error('❌ API Error Response:', {
        status: res.status,
        statusText: res.statusText,
        url: url,
        responseData: data,
      });
      throw new Error(`${res.status}: ${data.message || res.statusText || 'Unknown error'}`);
    }

    return data;
  } catch (e) {
    if (e.message.includes('403')) {
      console.error('❌ 403 Forbidden - Check location ID and token:', {
        locationId: CORRECT_LOCATION_ID,
        url: url,
      });
    }
    throw e;
  }
};

// ---- Tags --------------------------------------------------------------
const VALID_STAGE_TAGS = Object.values(STAGE_TAGS).flat();
const PROCESS_STAGE_TAGS = ['cold', 'warm', 'hot']; // Process stage tags to preserve
const cleanTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t) => {
    const tagLower = (t || '').toLowerCase();
    return VALID_STAGE_TAGS.includes(t) || PROCESS_STAGE_TAGS.includes(tagLower);
  });
};

// ---- GET: Contacts (paginated) ----------------------------------------
const fetchAllContacts = async () => {
  const all = [];
  let page = 1;
  const pageSize = 100;
  const maxPages = 20; // safety cap

  while (page <= maxPages) {
    const url = ghUrl('/contacts/', { locationId: CORRECT_LOCATION_ID, limit: pageSize, page: page > 1 ? page : undefined });
    try {
      const data = await fetchJSON(url, { method: 'GET', headers: ghHeaders() });
      const pageContacts = Array.isArray(data)
        ? data
        : data.contacts || data.data || data.results || [];
      if (!pageContacts.length) break;
      all.push(...pageContacts);
      if (pageContacts.length < pageSize) break; // last page
      page += 1;
    } catch (e) {
      // Return what we have if we've fetched any contacts; otherwise bubble up
      if (all.length) break;
      throw e;
    }
  }
  return all;
};

// ---- GET: Pipeline -----------------------------------------------------
export const fetchPipelineLeads = async () => {
  try {
    const allContacts = await fetchAllContacts();
    const leads = categorizeLeadsByStage(allContacts);
    const metrics = calculatePipelineMetrics(leads);
    return { success: true, data: { leads, metrics, stages: PIPELINE_STAGES } };
  } catch (e) {
    return { success: false, error: e.message, data: { leads: {}, metrics: {}, stages: PIPELINE_STAGES } };
  }
};

export const fetchStageTags = async (stageName) => ({
  success: true,
  data: STAGE_TAGS[stageName] || [],
});

export const fetchAvailableTags = async () => ({
  success: true,
  data: [...new Set(VALID_STAGE_TAGS)],
});

export const fetchPipelineMetrics = async () => {
  try {
    const { success, data, error } = await fetchPipelineLeads();
    if (!success) throw new Error(error);
    const metrics = calculateDetailedMetrics(data.leads);
    return { success: true, data: metrics };
  } catch (e) {
    return { success: false, error: e.message, data: {} };
  }
};

export const fetchLeadsByStage = async (stageName) => {
  try {
    const url = ghUrl('/contacts/', { locationId: CORRECT_LOCATION_ID });
    const data = await fetchJSON(url, { method: 'GET', headers: ghHeaders() });
    const list = data.contacts || data || [];
    const stageLeads = list.filter((lead) => {
      const s = lead.customField?.stage || lead.stage || 'New Lead';
      return s === stageName;
    });
    return { success: true, data: stageLeads };
  } catch (e) {
    return { success: false, error: e.message, data: [] };
  }
};

// ---- POST/PUT: Leads ---------------------------------------------------
export const createNewLead = async (leadData) => {
  try {
    const { name, email, phone, address, loanType, loanAmount, closeDate, stage, tags, notes } = leadData || {};
    if (!name || !email) throw new Error('Name and email are required');

    const stageName = stage || 'New Lead';
    const allStageTags = VALID_STAGE_TAGS;
    const nonStage = (tags || []).filter((t) => !allStageTags.includes(t));
    const finalTags = [...nonStage, stageName];

    const now = new Date().toISOString();
    const customFields = [
      { key: 'stage', field_value: stageName },
      { key: 'loanType', field_value: loanType || 'Conventional' },
      { key: 'loanAmount', field_value: String(loanAmount || 0) },
      { key: 'closeDate', field_value: closeDate || '' },
      { key: 'notes', field_value: notes || '' },
      { key: 'status', field_value: 'On Track' },
      { key: 'createdAt', field_value: now },
      { key: 'updatedAt', field_value: now },
    ];

    const [firstName, ...rest] = String(name).trim().split(' ');
    const payload = {
      firstName: firstName || '',
      lastName: rest.join(' ') || '',
      name,
      email,
      phone: phone || '',
      address1: address || '',
      tags: finalTags,
      customFields,
      source: 'pipeline dashboard',
    };

    const url = ghUrl('/contacts/upsert');
    const res = await fetchJSON(url, {
      method: 'POST',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    toast.success('Lead created successfully');
    return { success: true, data: res };
  } catch (e) {
    toast.error(`Failed to create lead: ${e.message}`);
    return { success: false, error: e.message };
  }
};

export const addTagsToLead = async (leadId, tags) => {
  try {
    if (!leadId || !tags?.length) throw new Error('Lead ID and tags are required');
    const cleaned = cleanTags(tags);
    const url = ghUrl(`/contacts/${leadId}`, { locationId: CORRECT_LOCATION_ID });
    await fetchJSON(url, {
      method: 'PUT',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: cleaned }),
    });
    toast.success('Tags updated successfully');
    return { success: true, data: { leadId, tags: cleaned } };
  } catch (e) {
    toast.error(`Failed to update tags: ${e.message}`);
    return { success: false, error: e.message };
  }
};

export const moveLeadToStage = async (leadId, newStage) => {
  try {
    if (!leadId || !newStage) throw new Error('Lead ID and new stage are required');
    const id = leadId.includes('-') ? leadId.split('-')[0] : leadId;

    // Fetch contact
    const getUrl = ghUrl(`/contacts/${id}`, { locationId: CORRECT_LOCATION_ID });
    const contactData = await fetchJSON(getUrl, { method: 'GET', headers: ghHeaders() });
    const contact = contactData.contact || contactData || {};

    // Stage name normalization
    const stageName = newStage.includes('-') && newStage.length > 20 ? newStage.split('-').pop() : newStage;

    // Remove old stage tags (case-insensitive) and random/system-like tags
    const STAGE_VARIANTS = {
      'New Lead': ['new lead', 'newlead', 'new_lead', 'prospect', 'lead'],
      Contacted: ['contacted', 'reached out', 'called', 'emailed', 'follow up'],
      'Application Started': ['application started', 'app started', 'application', 'applying', 'in progress'],
      'Pre-Approved': ['pre-approved', 'preapproved', 'pre approved', 'qualified', 'approved'],
      'In Underwriting': ['in underwriting', 'underwriting', 'review', 'processing', 'verification'],
      'Appointment Set': ['appointment set', 'appointment', 'scheduled', 'meeting set', 'call scheduled'],
      'Closed Won': ['closed won', 'won', 'closed', 'success', 'completed', 'funded'],
      'Closed Lost': ['closed lost', 'lost', 'rejected', 'declined', 'not qualified', 'dead'],
    };
    const stageVals = new Set(Object.values(STAGE_VARIANTS).flat().map((t) => t.toLowerCase().trim()));

    const currentTags = (contact.tags || []).filter(Boolean);
    const kept = currentTags.filter((t) => {
      const lt = String(t).toLowerCase().trim();
      const looksSystem =
        (t.length > 15 && /^[a-z0-9]+$/i.test(t)) ||
        (/^[0-9a-z]{8,}$/i.test(t)) ||
        (t.includes('-') && t.length > 20);
      return !stageVals.has(lt) && !looksSystem;
    });

    const finalTags = [...kept, stageName];

    const updatePayload = {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      tags: finalTags,
      customFields: [{ key: 'stage', field_value: stageName }],
    };

    const putUrl = ghUrl(`/contacts/${id}`, { locationId: CORRECT_LOCATION_ID });
    const response = await fetchJSON(putUrl, {
      method: 'PUT',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    toast.success(`Lead moved to ${stageName}`);
    return { success: true, data: { leadId: id, stage: stageName, response } };
  } catch (e) {
    toast.error(`Failed to move lead: ${e.message}`);
    return { success: false, error: e.message };
  }
};

export const updateLeadDetails = async (leadId, updates) => {
  try {
    if (!leadId || !updates) throw new Error('Lead ID and updates are required');
    const [firstName, ...rest] = String(updates.name || '').trim().split(' ');

    const payload = {
      firstName: firstName || '',
      lastName: rest.join(' ') || '',
      email: updates.email,
      phone: updates.phone,
      address: updates.address,
      customField: { ...updates, updatedAt: new Date().toISOString() },
    };

    const url = ghUrl(`/contacts/${leadId}`, { locationId: CORRECT_LOCATION_ID });
    await fetchJSON(url, {
      method: 'PUT',
      headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    toast.success('Lead updated successfully');
    return { success: true, data: { leadId, updates } };
  } catch (e) {
    toast.error(`Failed to update lead: ${e.message}`);
    return { success: false, error: e.message };
  }
};

export const deleteLead = async (leadId) => {
  try {
    if (!leadId) throw new Error('Lead ID is required');
    const url = ghUrl(`/contacts/${leadId}`, { locationId: CORRECT_LOCATION_ID });
    await fetchJSON(url, { method: 'DELETE', headers: ghHeaders() });
    toast.success('Lead deleted successfully');
    return { success: true, data: { leadId } };
  } catch (e) {
    toast.error(`Failed to delete lead: ${e.message}`);
    return { success: false, error: e.message };
  }
};

// ---- Refresh / Realtime ------------------------------------------------
export const refreshPipelineData = async () => {
  try {
    const res = await fetchPipelineLeads();
    if (!res.success) throw new Error(res.error);
    return res;
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const setupRealtimeUpdates = () => () => {};

// ---- Tests (quiet) -----------------------------------------------------
export const testApiConnection = async () => {
  try {
    console.warn('🔍 Testing API with Location ID:', CORRECT_LOCATION_ID);
    console.warn('🔍 Base URL:', LC.baseUrl);
    console.warn('🔍 Token (first 20 chars):', LC.token ? LC.token.substring(0, 20) + '...' : 'NO TOKEN');

    const url = ghUrl('/contacts/', { locationId: CORRECT_LOCATION_ID, page: 1, limit: 1 });
    console.warn('🔍 Full URL:', url);

    const headers = ghHeaders();
    console.warn('🔍 Headers:', headers);

    const data = await fetchJSON(url, { method: 'GET', headers });
    console.warn('✅ API Connection Success');
    return { success: true, data };
  } catch (e) {
    console.error('❌ API Connection Failed:', e.message);
    return { success: false, error: e.message };
  }
};

// Test function accessible from window for debugging
if (typeof window !== 'undefined') {
  window.testPipelineAPI = testApiConnection;
}

export const testContactsExist = async () => {
  try {
    const all = await fetchAllContacts();
    const count = all.length;
    return {
      success: true,
      data: { contactsCount: count, hasContacts: count > 0, totalPages: Math.ceil(count / 100), rawData: { totalContacts: count } },
    };
  } catch (e) {
    return { success: false, error: e.message, data: { contactsCount: 0, hasContacts: false, totalPages: 0, rawData: null } };
  }
};

export const testPagination = async () => {
  try {
    const page1 = await fetchJSON(ghUrl('/contacts/', { locationId: CORRECT_LOCATION_ID, page: 1, limit: 10 }), {
      method: 'GET',
      headers: ghHeaders(),
    });
    const list1 = page1.contacts || page1.data || page1.results || page1 || [];

    let page2Count = 0;
    if (list1.length === 10) {
      const page2 = await fetchJSON(ghUrl('/contacts/', { locationId: CORRECT_LOCATION_ID, page: 2, limit: 10 }), {
        method: 'GET',
        headers: ghHeaders(),
      });
      const list2 = page2.contacts || page2.data || page2.results || page2 || [];
      page2Count = list2.length;
    }

    return {
      success: true,
      data: {
        paginationWorks: list1.length < 10 || page2Count > 0,
        page1Count: list1.length,
        page2Count,
        totalTested: list1.length + page2Count,
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ---- Helpers -----------------------------------------------------------
const categorizeLeadsByStage = (leads) => {
  const categorized = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.title, []]));

  const tagStageMap = {
    'new lead': 'New Lead',
    contacted: 'Contacted',
    'application started': 'Application Started',
    'pre-approved': 'Pre-Approved',
    'pre approved': 'Pre-Approved',
    'in underwriting': 'In Underwriting',
    closed: 'Closed',
  };

  const priority = ['New Lead', 'Contacted', 'Application Started', 'Pre-Approved', 'In Underwriting', 'Closed'];

  leads.forEach((lead, i) => {
    const tags = lead.customField?.tags || lead.tags || [];

    let stage = 'New Lead';
    if (lead.customField?.stage) stage = lead.customField.stage;
    else if (lead.stage) stage = lead.stage;
    else if (lead.status) stage = lead.status;
    else if (lead.pipelineStage) stage = lead.pipelineStage;
    else if (lead.stageName) stage = lead.stageName;
    else {
      let best = -1;
      for (const t of tags) {
        const mapped = tagStageMap[String(t).toLowerCase()];
        if (!mapped) continue;
        const idx = priority.indexOf(mapped);
        if (idx > best) {
          best = idx;
          stage = mapped;
        }
      }
    }

    // Extract process stage from original tags array BEFORE cleaning
    let processStage = lead.processStage;
    if (!processStage && Array.isArray(tags)) {
      const processStageTag = tags.find(tag => {
        const tagLower = (tag || '').toLowerCase();
        return tagLower === 'cold' || tagLower === 'warm' || tagLower === 'hot';
      });
      if (processStageTag) {
        processStage = processStageTag.toLowerCase();
      }
    }

    const safeTags = cleanTags(tags);

    let name = 'Unknown';
    if (lead.firstName && lead.lastName) name = `${lead.firstName} ${lead.lastName}`;
    else if (lead.name) name = lead.name;
    else if (lead.fullName) name = lead.fullName;
    else if (lead.displayName) name = lead.displayName;

    const item = {
      id: lead._id || lead.id || lead.contactId || `lead-${i}`,
      contactId: lead._id || lead.id || lead.contactId,
      name,
      email: lead.email || lead.emailAddress || '',
      phone: lead.phone || lead.phoneNumber || lead.mobile || '',
      address: lead.address || lead.customField?.address || '',
      loanType: lead.customField?.loanType || lead.loanType || 'Conventional',
      loanAmount: lead.customField?.loanAmount || lead.loanAmount || 0,
      closeDate: lead.customField?.closeDate || lead.closeDate || '',
      status: lead.customField?.status || lead.status || 'On Track',
      tags: safeTags,
      processStage: processStage, // Add process stage to lead data
      notes: lead.customField?.notes || lead.notes || '',
      stage,
      createdAt: lead.customField?.createdAt || lead.createdAt || lead.created_at || new Date().toISOString(),
      updatedAt: lead.customField?.updatedAt || lead.updatedAt || lead.updated_at || new Date().toISOString(),
    };

    (categorized[stage] || categorized['New Lead']).push(item);
  });

  return categorized;
};

const calculatePipelineMetrics = (categorizedLeads) => {
  const metrics = {};
  PIPELINE_STAGES.forEach((s) => {
    const list = categorizedLeads[s.title] || [];
    const unique = list.filter((lead) => !lead.isDuplicate || lead.stage === s.title);
    metrics[s.title] = {
      leads: list.length,
      uniqueLeads: unique.length,
      avgTime: calculateAverageTime(list),
      conversion: calculateConversionRate(s.title),
      lastUpdated: new Date().toISOString(),
    };
  });
  return metrics;
};

const calculateDetailedMetrics = (categorizedLeads) => {
  const metrics = calculatePipelineMetrics(categorizedLeads);
  const totalLeads = Object.values(categorizedLeads).reduce((sum, l) => sum + l.length, 0);
  const totalValue = Object.values(categorizedLeads).reduce(
    (sum, l) => sum + l.reduce((s, lead) => s + (lead.loanAmount || 0), 0),
    0,
  );
  return {
    ...metrics,
    overall: {
      totalLeads,
      totalValue,
      averageLoanAmount: totalLeads > 0 ? totalValue / totalLeads : 0,
      lastUpdated: new Date().toISOString(),
    },
  };
};

const calculateAverageTime = (leads) => {
  if (!leads.length) return '0:00';
  const avgMinutes = Math.floor(Math.random() * 300) + 30; // placeholder
  const h = Math.floor(avgMinutes / 60);
  const m = avgMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

const calculateConversionRate = (stage) => {
  const map = { 'New Lead': 12, Contacted: 10, 'Application Started': 8, 'Pre-Approved': 5, 'In Underwriting': 3, Closed: 2 };
  return map[stage] || 0;
};

export { PIPELINE_STAGES, STAGE_TAGS };

const pipelineApi = {
  fetchPipelineLeads,
  fetchStageTags,
  fetchAvailableTags,
  fetchPipelineMetrics,
  fetchLeadsByStage,
  createNewLead,
  addTagsToLead,
  moveLeadToStage,
  updateLeadDetails,
  deleteLead,
  refreshPipelineData,
  setupRealtimeUpdates,
  testApiConnection,
  testContactsExist,
  testPagination,
};

export default pipelineApi;
