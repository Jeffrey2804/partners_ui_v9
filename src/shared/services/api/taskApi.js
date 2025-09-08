// ========================================
// 🎯 TASK API SERVICE (CLEAN JS VERSION - NO LOGGER)
// ========================================

import { toast } from 'react-hot-toast';
import { GHL_CONFIG, getGHLHeaders, getGHLUserHeaders, validateGHLConfig } from '@config/ghlConfig';

// Validate configuration on import
const configValidation = validateGHLConfig();
if (!configValidation.isValid) {
  console.warn('GHL Configuration Issues:', configValidation.issues);
}

// ----------------------------------------
// Helpers
// ----------------------------------------

const ok = (data) => ({ success: true, data });
const fail = (error, data = null) => ({ success: false, error: error?.message || String(error), data });

const isEmpty = (v) => v === '' || v === null || v === undefined;
const stripEmpty = (obj = {}) => Object.entries(obj).reduce((acc, [k, v]) => {
  if (!isEmpty(v)) acc[k] = v; return acc;
}, {});

const removeFields = (obj, fields = []) => {
  const clone = { ...obj };
  fields.forEach((f) => { if (Object.prototype.hasOwnProperty.call(clone, f)) delete clone[f]; });
  return clone;
};

const looksInvalidId = (val) => (
  val === 'null' || val === 'undefined' || (typeof val === 'string' && (
    val.length < 5 || val.includes('demo') || val.includes('test')
  ))
);

const sanitizeIds = (obj, keys = ['contactId', 'assignedTo']) => {
  const next = { ...obj };
  keys.forEach((k) => {
    if (next[k] && looksInvalidId(next[k])) {
      delete next[k];
    }
  });
  return next;
};

const sanitizePayload = (payload, { disallow = [], allowOnly = null } = {}) => {
  let clean = stripEmpty({ ...payload });
  clean = sanitizeIds(clean);
  clean = removeFields(clean, disallow);

  if (Array.isArray(allowOnly)) {
    const whitelisted = {};
    allowOnly.forEach((k) => { if (Object.prototype.hasOwnProperty.call(clean, k)) whitelisted[k] = clean[k]; });
    clean = whitelisted;
  }
  return clean;
};

const parseJsonSafe = async (res) => {
  try { return await res.json(); } catch { return null; }
};

const errorFromResponse = async (response) => {
  const text = await response.text();
  const msg = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}${text ? ` - ${text}` : ''}`;
  const err = new Error(msg);
  err.status = response.status;
  err.body = text;
  return err;
};

const withJson = (headers) => ({
  ...headers,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Version: GHL_CONFIG.version,
});

const request = async (url, { method = 'GET', headers = {}, body, useUserHeaders = false } = {}) => {
  const base = useUserHeaders ? getGHLUserHeaders() : getGHLHeaders();
  const res = await fetch(url, {
    method,
    headers: withJson({ ...base, ...headers }),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await errorFromResponse(res);
  return parseJsonSafe(res);
};

const searchTasks = async (filters = {}, { useUserHeaders = true } = {}) => {
  const url = `${GHL_CONFIG.locationUrl}/tasks/search`;
  const data = await request(url, {
    method: 'POST',
    body: { completed: false, ...filters },
    useUserHeaders,
  });
  return Array.isArray(data?.tasks) ? data.tasks : (Array.isArray(data) ? data : []);
};

const findTaskInLists = (lists, id) => lists.flat().find((t) => t?.id === id || t?._id === id) || null;

// ----------------------------------------
// GET
// ----------------------------------------

export const fetchTasks = async (filters = {}) => {
  try {
    const tasks = await searchTasks(filters, { useUserHeaders: true });
    return ok(tasks);
  } catch (error) {
    return fail(error, []);
  }
};

export const fetchTasksByUser = async (userId) => {
  try {
    const tasks = await searchTasks({ assignedTo: userId }, { useUserHeaders: false });
    return ok(tasks);
  } catch (error) {
    return fail(error, []);
  }
};

export const fetchTaskById = async (taskId) => {
  try {
    const [active] = await Promise.all([
      searchTasks({}, { useUserHeaders: false }),
    ]);

    let task = findTaskInLists([active], taskId);

    if (!task) {
      const completed = await request(`${GHL_CONFIG.locationUrl}/tasks/search`, {
        method: 'POST',
        body: { completed: true },
        useUserHeaders: false,
      });
      const completedTasks = Array.isArray(completed?.tasks) ? completed.tasks : (Array.isArray(completed) ? completed : []);
      task = findTaskInLists([completedTasks], taskId);
    }

    if (!task) throw new Error(`Task with ID ${taskId} not found`);

    return ok(task);
  } catch (error) {
    return fail(error, null);
  }
};

// ----------------------------------------
// POST
// ----------------------------------------

export const createTask = async (taskData = {}) => {
  try {
    if (!taskData?.contactId) throw new Error('contactId is required to create a task');

    const allowed = ['title', 'body', 'dueDate', 'completed'];
    const payload = sanitizePayload(taskData, {
      disallow: [
        'locationId', 'isLocation', 'companyId', 'dateAdded', 'dateUpdated', 'deleted', 'permissions',
        'roles', 'status', 'type', 'id', '_id', 'relations', 'priority', 'tags', 'actions',
      ],
      allowOnly: ['contactId', ...allowed],
    });

    const url = `https://services.leadconnectorhq.com/contacts/${payload.contactId}/tasks`;
    const body = allowed.reduce((acc, k) => { if (k in payload) acc[k] = payload[k]; return acc; }, {});

    const data = await request(url, {
      method: 'POST',
      body,
      useUserHeaders: false,
    });

    toast.success('✅ Task created successfully!');
    return ok(data);
  } catch (error) {
    toast.error(`❌ Failed to create task: ${error.message}`);
    return fail(error);
  }
};

// ----------------------------------------
// PUT
// ----------------------------------------

export const updateTask = async (taskId, updates = {}) => {
  try {
    const disallow = [
      'relations', 'locationId', 'isLocation', 'companyId', 'dateAdded', 'dateUpdated', 'deleted', 'permissions',
      'roles', 'status', 'type', 'priority', 'id', '_id', 'tags', 'actions', 'category', 'isSalesRelated',
      'isClientCommunication', 'statusCategory', 'statusColor', 'description', 'descriptionType', 'assignee',
      'assigneeId', 'assigneeName', 'assigneeEmail', 'associatedContact', 'contactName', 'contactEmail',
      'contactPhone', 'enhancedAt', 'hasContact', 'hasAssignee', 'date', 'originalDate',
    ];

    const allowed = ['title', 'body', 'dueDate', 'assignedTo', 'contactId', 'completed'];

    const payload = sanitizePayload(updates, { disallow, allowOnly: allowed });

    const url = `${GHL_CONFIG.locationUrl}/tasks/${taskId}`;
    const data = await request(url, {
      method: 'PUT',
      body: payload,
      useUserHeaders: false,
    });

    toast.success('✅ Task updated successfully!');
    return ok(data);
  } catch (error) {
    toast.error(`❌ Failed to update task: ${error.message}`);
    return fail(error);
  }
};

export const completeTask = async (taskId) => updateTask(taskId, { completed: true });

// ----------------------------------------
// DELETE
// ----------------------------------------

export const deleteTask = async (taskId) => {
  try {
    await request(`${GHL_CONFIG.locationUrl}/tasks/${taskId}`, {
      method: 'DELETE',
      useUserHeaders: true,
    });
    toast.success('✅ Task deleted successfully!');
    return ok({ taskId });
  } catch (error) {
    toast.error(`❌ Failed to delete task: ${error.message}`);
    return fail(error);
  }
};

// ----------------------------------------
// BULK
// ----------------------------------------

const settle = async (promises) => {
  const results = await Promise.allSettled(promises);
  const successful = results.filter((r) => r.status === 'fulfilled' && r.value?.success);
  const failed = results.filter((r) => r.status === 'rejected' || !r.value?.success);
  return { results, successful, failed };
};

export const bulkUpdateTasks = async (taskUpdates = []) => {
  try {
    const { results, successful, failed } = await settle(
      taskUpdates.map(({ taskId, updates }) => updateTask(taskId, updates)),
    );
    if (successful.length) toast.success(`✅ ${successful.length} tasks updated successfully!`);
    if (failed.length) toast.error(`❌ ${failed.length} tasks failed to update`);
    return ok({ successful: successful.length, failed: failed.length, results });
  } catch (error) {
    toast.error(`❌ Bulk update failed: ${error.message}`);
    return fail(error);
  }
};

export const bulkDeleteTasks = async (taskIds = []) => {
  try {
    const { results, successful, failed } = await settle(taskIds.map((id) => deleteTask(id)));
    if (successful.length) toast.success(`✅ ${successful.length} tasks deleted successfully!`);
    if (failed.length) toast.error(`❌ ${failed.length} tasks failed to delete`);
    return ok({ successful: successful.length, failed: failed.length, results });
  } catch (error) {
    toast.error(`❌ Bulk delete failed: ${error.message}`);
    return fail(error);
  }
};

// ----------------------------------------
// TEST
// ----------------------------------------

export const testTaskApiConnection = async () => {
  try {
    const url = `${GHL_CONFIG.locationUrl}/tasks/search`;
    const res = await fetch(url, {
      method: 'POST',
      headers: withJson(getGHLUserHeaders()),
      body: JSON.stringify({ completed: false, limit: 1 }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 && text.includes('IAM')) {
        return { success: false, error: 'Token lacks task permissions. Please update your GHL API token with task permissions.', needsNewToken: true };
      }
      throw new Error(`HTTP ${res.status} - ${text}`);
    }

    const data = await parseJsonSafe(res);
    return ok({ status: res.status, taskCount: Array.isArray(data?.tasks) ? data.tasks.length : 0 });
  } catch (error) {
    return fail(error);
  }
};

// ----------------------------------------
// Default export
// ----------------------------------------

const taskApi = {
  fetchTasks,
  fetchTasksByUser,
  fetchTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
  testTaskApiConnection,
};

export default taskApi;
