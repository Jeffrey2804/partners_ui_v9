import { createContext, useEffect, useState } from 'react';
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  completeTask as apiCompleteTask,
} from '@api/taskApi';
import { parseGHLTaskDate } from '@utils/ghlDateParser';
import { enhanceTasksWithGHLFields } from '@utils/ghlTaskEnhancer';

export const TaskContext = createContext(null);

const CATEGORY_CONFIG = {
  "Today's Tasks": { color: 'teal', items: [] },
  'Overdue Tasks': { color: 'orange', items: [] },
  'Upcoming in 48 Hours': { color: 'blue', items: [] },
  'My Sales Tasks': { color: 'purple', items: [] },
  'Client Communication': { color: 'indigo', items: [] },
  'All Tasks': { color: 'gray', items: [] },
};

const HOURS_48_MS = 48 * 60 * 60 * 1000;

/* ----------------------------- Categorization ----------------------------- */

const isSalesRelatedTask = (task) => {
  const salesKeywords = [
    'sales', 'lead', 'prospect', 'quote', 'proposal', 'deal', 'opportunity',
    'follow up', 'follow-up', 'cold call', 'pitch', 'demo', 'presentation',
    'negotiation', 'closing', 'commission', 'revenue', 'target', 'goal',
  ];
  const text = `${task.title || ''} ${task.body || ''} ${task.actions || ''}`.toLowerCase();
  const tags = Array.isArray(task.tags) ? task.tags.map((t) => String(t).toLowerCase()) : [];
  return salesKeywords.some((k) => text.includes(k) || tags.some((t) => t.includes(k)));
};

const isClientCommunicationTask = (task) => {
  const communicationKeywords = [
    'client', 'customer', 'communication', 'email', 'call', 'meeting',
    'consultation', 'support', 'service', 'feedback', 'review', 'update',
    'check-in', 'check in', 'touch base', 'touchbase', 'status update',
    'phone', 'video', 'zoom', 'teams', 'skype', 'conference',
  ];
  const text = `${task.title || ''} ${task.body || ''} ${task.actions || ''}`.toLowerCase();
  const tags = Array.isArray(task.tags) ? task.tags.map((t) => String(t).toLowerCase()) : [];
  return communicationKeywords.some((k) => text.includes(k) || tags.some((t) => t.includes(k)));
};

const toTaskItem = (task, parsed) => {
  const { date: dueDate, formattedDate, originalDate } = parsed || {};
  return {
    id: task._id || task.id || `task-${Date.now()}-${Math.random()}`,
    _id: task._id || task.id,
    title: task.title || 'Untitled Task',
    date: formattedDate,
    originalDate,
    dueDate,
    tags: Array.isArray(task.tags) ? task.tags : [],
    actions: task.body || task.actions || '',
    assignedTo: task.assignedTo || task.assigned_to || task.userId || null,
    priority: task.priority || 'medium',
    category: task.category || 'general',
    isSalesRelated: isSalesRelatedTask(task),
    isClientCommunication: isClientCommunicationTask(task),

    // Enhanced GHL fields (kept if present)
    status: task.status || 'pending',
    statusCategory: task.statusCategory || 'info',
    statusColor: task.statusColor || 'blue',
    description: task.description || task.body || task.actions || '',
    descriptionType: task.descriptionType || 'body',

    // Assignee information
    assignee: task.assignee,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    assigneeEmail: task.assigneeEmail,

    // Associated contact information
    associatedContact: task.associatedContact,
    contactId: task.contactId,
    contactName: task.contactName,
    contactEmail: task.contactEmail,
    contactPhone: task.contactPhone,

    // Additional metadata
    hasContact: task.hasContact || false,
    hasAssignee: task.hasAssignee || false,
    enhancedAt: task.enhancedAt,
    completed: task.completed === true, // normalize
  };
};

const categorizeTasks = (tasks, currentUser = null) => {
  const result = JSON.parse(JSON.stringify(CATEGORY_CONFIG)); // deep copy for shape
  if (!Array.isArray(tasks)) return result;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const twoDaysLater = new Date(now.getTime() + HOURS_48_MS);

  tasks.forEach((task) => {
    if (!task || typeof task !== 'object') return;

    try {
      const parsed = parseGHLTaskDate(task);
      const item = toTaskItem(task, parsed);
      const isAssignedToUser = currentUser && item.assignedTo === currentUser.id;

      // Always include in All Tasks so completed items show up
      result['All Tasks'].items.push(item);

      // Only bucket time-based categories for **incomplete** items
      if (!item.completed && item.dueDate) {
        const due = item.dueDate;
        if (item.date === today) {
          result["Today's Tasks"].items.push(item);
        } else if (due < now) {
          result['Overdue Tasks'].items.push(item);
        } else if (due <= twoDaysLater) {
          result['Upcoming in 48 Hours'].items.push(item);
        }
      }

      if (isAssignedToUser && item.isSalesRelated) {
        result['My Sales Tasks'].items.push(item);
      }
      if (isAssignedToUser && item.isClientCommunication) {
        result['Client Communication'].items.push(item);
      }
    } catch {
      // Silently skip malformed tasks
    }
  });

  return result;
};

/* ------------------------------- Utilities -------------------------------- */

const dedupeById = (list = []) => {
  const m = new Map();
  for (const t of list) {
    const key = t?._id || t?.id;
    if (!key) continue;
    if (!m.has(key)) m.set(key, t);
  }
  return Array.from(m.values());
};

/* --------------------------------- Fetching -------------------------------- */

// Fetch BOTH incomplete and completed, then enhance + categorize
const fetchAndTransformTasks = async (currentUser = null) => {
  try {
    const [activeRes, completedRes] = await Promise.all([
      fetchTasks({ completed: false }),
      fetchTasks({ completed: true }),
    ]);

    if (!activeRes?.success && !completedRes?.success) {
      throw new Error(activeRes?.error || completedRes?.error || 'Failed to fetch tasks');
    }

    const raw = dedupeById([...(activeRes?.data || []), ...(completedRes?.data || [])]);

    try {
      const enhanced = await enhanceTasksWithGHLFields(raw);
      return categorizeTasks(enhanced, currentUser);
    } catch {
      // If enhancement fails, fall back to raw payload
      return categorizeTasks(raw, currentUser);
    }
  } catch {
    // Fallback to empty categories if API fails
    return JSON.parse(JSON.stringify(CATEGORY_CONFIG));
  }
};

/* ------------------------------- State & API ------------------------------- */

const sanitizeForCreateOrUpdate = (payload, { allow = [] } = {}) => {
  const disallowed = new Set([
    'relations', 'locationId', 'isLocation', 'companyId',
    'dateAdded', 'dateUpdated', 'deleted', 'permissions',
    'roles', 'status', 'type', 'enhancedAt', 'hasContact',
    'hasAssignee', 'statusCategory', 'statusColor',
    'descriptionType', 'assigneeName', 'assigneeEmail',
    'contactName', 'contactEmail', 'contactPhone',
    '_id', 'id',
  ]);

  const result = {};
  Object.keys(payload || {}).forEach((key) => {
    if (allow.length) {
      if (allow.includes(key)) result[key] = payload[key];
    } else if (!disallowed.has(key)) {
      result[key] = payload[key];
    }
  });
  return result;
};

export const TaskProvider = ({ children }) => {
  const [tasksByCategory, setTasksByCategory] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return;
    try {
      setCurrentUser(JSON.parse(stored));
    } catch {
      // ignore corrupt localStorage entry
    }
  }, []);

  const reload = async () => {
    const data = await fetchAndTransformTasks(currentUser);
    setTasksByCategory(data);
  };

  useEffect(() => {
    let mounted = true;
    fetchAndTransformTasks(currentUser).then((data) => {
      if (mounted) setTasksByCategory(data);
    });
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const addTask = async (category, task) => {
    try {
      const base = sanitizeForCreateOrUpdate(task);
      const taskData = {
        ...base,
        completed: false,
        assignedTo: base.assignedTo || currentUser?.id || null,
        category: base.category || category,
        createdAt: base.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await apiCreateTask(taskData);
      if (!res?.success) throw new Error(res?.error || 'Failed to create task');

      // Reload so All Tasks includes server result (with proper flags)
      await reload();

      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateTask = async (taskId, updated) => {
    try {
      if (!taskId) throw new Error('No task ID provided for update');

      const allowedFields = ['title', 'body', 'dueDate', 'completed', 'assignedTo', 'contactId', 'priority'];
      const taskData = sanitizeForCreateOrUpdate(updated, { allow: allowedFields });

      const res = await apiUpdateTask(taskId, taskData);
      if (!res?.success) throw new Error(res?.error || 'Failed to update task');

      // Optimistic local update
      setTasksByCategory((prev) => {
        if (!prev) return null;
        const next = {};
        for (const category in prev) {
          next[category] = {
            ...prev[category],
            items: prev[category].items.map((t) =>
              t.id === taskId || t._id === taskId ? { ...t, ...updated, id: taskId } : t,
            ),
          };
        }
        return next;
      });

      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteTask = async (taskId) => {
    try {
      if (!taskId) throw new Error('No task ID provided for deletion');

      const res = await apiDeleteTask(taskId);
      if (!res?.success) throw new Error(res?.error || 'Failed to delete task');

      setTasksByCategory((prev) => {
        if (!prev) return null;
        const next = {};
        for (const category in prev) {
          next[category] = {
            ...prev[category],
            items: prev[category].items.filter((t) => t.id !== taskId && t._id !== taskId),
          };
        }
        return next;
      });

      return { success: true, data: { taskId } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // NOTE: we allow toggling both directions; backend update is authoritative
  const completeTask = async (taskId, isCompleted = true) => {
    try {
      if (!taskId) throw new Error('No task ID provided for completion');

      const res = isCompleted
        ? await apiCompleteTask(taskId)                 // sets completed: true
        : await apiUpdateTask(taskId, { completed: false }); // un-complete

      if (!res?.success) throw new Error(res?.error || 'Failed to complete task');

      // Optimistic local toggle
      setTasksByCategory((prev) => {
        if (!prev) return null;
        const next = {};
        for (const category in prev) {
          next[category] = {
            ...prev[category],
            items: prev[category].items.map((t) =>
              t.id === taskId || t._id === taskId
                ? { ...t, completed: isCompleted, status: isCompleted ? 'Completed' : 'Pending' }
                : t,
            ),
          };
        }
        return next;
      });

      // Ensure future loads include it by status → we already fetch both
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /* ------------------------------ UI Utilities ----------------------------- */

  const reorderTasks = (category, newItemOrder) => {
    setTasksByCategory((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [category]: { ...prev[category], items: newItemOrder },
      };
    });
  };

  const moveTaskToCategory = (fromCategory, toCategory, taskId) => {
    setTasksByCategory((prev) => {
      if (!prev) return null;
      const taskToMove = prev[fromCategory]?.items.find((t) => t.id === taskId || t._id === taskId);
      if (!taskToMove) return prev;

      return {
        ...prev,
        [fromCategory]: {
          ...prev[fromCategory],
          items: prev[fromCategory].items.filter((t) => (t.id !== taskId && t._id !== taskId)),
        },
        [toCategory]: {
          ...prev[toCategory],
          items: [...prev[toCategory].items, taskToMove],
        },
      };
    });
  };

  const filterTasksByUser = (filterType) => setUserFilter(filterType);

  const getFilteredTasks = () => {
    if (!tasksByCategory) return null;
    if (userFilter === 'all') return tasksByCategory;

    const filtered = {};
    for (const category in tasksByCategory) {
      filtered[category] = {
        ...tasksByCategory[category],
        items: tasksByCategory[category].items.filter((task) => {
          if (userFilter === 'assigned') return task.assignedTo === currentUser?.id;
          if (userFilter === 'unassigned') return !task.assignedTo;
          return true;
        }),
      };
    }
    return filtered;
  };

  const getUserSpecificTasks = () => {
    if (!tasksByCategory || !currentUser) return null;

    const mine = {
      'My Sales Tasks': { color: 'purple', items: [] },
      'Client Communication': { color: 'indigo', items: [] },
      "My Today's Tasks": { color: 'teal', items: [] },
      'My Overdue Tasks': { color: 'orange', items: [] },
    };

    for (const category in tasksByCategory) {
      const userItems = tasksByCategory[category].items.filter(
        (t) => t.assignedTo === currentUser.id,
      );

      if (category === "Today's Tasks" && userItems.length) mine["My Today's Tasks"].items = userItems;
      else if (category === 'Overdue Tasks' && userItems.length) mine['My Overdue Tasks'].items = userItems;
      else if (category === 'My Sales Tasks') mine['My Sales Tasks'].items = userItems;
      else if (category === 'Client Communication') mine['Client Communication'].items = userItems;
    }

    return mine;
  };

  return (
    <TaskContext.Provider
      value={{
        tasksByCategory,
        setTasksByCategory,
        currentUser,
        userFilter,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        reorderTasks,
        moveTaskToCategory,
        filterTasksByUser,
        getFilteredTasks,
        getUserSpecificTasks,
        reload, // exposed in case you want manual refresh
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
