// ========================================
// 🎯 GHL TASK ENHANCER UTILITY
// ========================================

import { createLogger } from '@utils/logger';
import { fetchContactById } from '@api/contactApi';

const taskLogger = createLogger('GHLTaskEnhancer');

/**
 * 🎯 Enhance task with additional GHL fields
 * Extracts and processes status, description, associated contact, and assignee
 */
export const enhanceTaskWithGHLFields = async (task) => {
  try {
    if (!task || typeof task !== 'object') {
      taskLogger.warn('Invalid task object for enhancement:', task);
      return task;
    }

    // Extract status from various possible GHL fields
    const status = extractTaskStatus(task);

    // Extract description from various possible GHL fields
    const description = extractTaskDescription(task);

    // Extract assignee information
    const assignee = extractTaskAssignee(task);

    // Extract associated contact information
    const associatedContact = await extractAssociatedContact(task);

    // Create enhanced task object
    const enhancedTask = {
      ...task,
      // Status information
      status: status.value,
      statusCategory: status.category,
      statusColor: status.color,

      // Description information
      description: description.value,
      descriptionType: description.type,

      // Assignee information
      assignee: assignee.value,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,

      // Associated contact information
      associatedContact: associatedContact.value,
      contactId: associatedContact.id,
      contactName: associatedContact.name,
      contactEmail: associatedContact.email,
      contactPhone: associatedContact.phone,

      // Additional metadata
      enhancedAt: new Date().toISOString(),
      hasContact: !!associatedContact.value,
      hasAssignee: !!assignee.value,
    };

    taskLogger.debug('Task enhanced successfully', {
      taskId: task._id || task.id,
      status: enhancedTask.status,
      hasContact: enhancedTask.hasContact,
      hasAssignee: enhancedTask.hasAssignee,
    });

    return enhancedTask;

  } catch (error) {
    taskLogger.error('Error enhancing task with GHL fields:', error, task);
    return task; // Return original task if enhancement fails
  }
};

/**
 * 📊 Extract task status from GHL task object
 */
const extractTaskStatus = (task) => {
  // Common GHL status field names
  const statusFields = [
    'status', 'taskStatus', 'state', 'taskState', 'completionStatus',
    'progress', 'stage', 'phase', 'condition',
  ];

  let statusValue = null;
  let statusField = null;

  // Find status value from various possible fields
  for (const field of statusFields) {
    if (task[field]) {
      statusValue = task[field];
      statusField = field;
      break;
    }
  }

  // Default status if not found
  if (!statusValue) {
    statusValue = task.completed ? 'completed' : 'pending';
    statusField = 'computed';
  }

  // Normalize status values
  const normalizedStatus = normalizeStatus(statusValue);

  return {
    value: normalizedStatus.value,
    category: normalizedStatus.category,
    color: normalizedStatus.color,
    originalValue: statusValue,
    field: statusField,
  };
};

/**
 * 📝 Extract task description from GHL task object
 */
const extractTaskDescription = (task) => {
  // Common GHL description field names
  const descriptionFields = [
    'description', 'body', 'content', 'details', 'notes', 'instructions',
    'taskDescription', 'taskBody', 'taskContent', 'taskDetails',
  ];

  let descriptionValue = null;
  let descriptionField = null;

  // Find description from various possible fields
  for (const field of descriptionFields) {
    if (task[field]) {
      descriptionValue = task[field];
      descriptionField = field;
      break;
    }
  }

  // Fallback to title if no description found
  if (!descriptionValue && task.title) {
    descriptionValue = task.title;
    descriptionField = 'title';
  }

  return {
    value: descriptionValue || '',
    type: descriptionField || 'none',
    hasDescription: !!descriptionValue,
  };
};

/**
 * 👤 Extract task assignee from GHL task object
 */
const extractTaskAssignee = (task) => {
  // Common GHL assignee field names
  const assigneeFields = [
    'assignedTo', 'assigned_to', 'assignee', 'assignedUser', 'userId',
    'user', 'owner', 'responsible', 'taskOwner',
  ];

  let assigneeId = null;
  let assigneeField = null;

  // Find assignee ID from various possible fields
  for (const field of assigneeFields) {
    if (task[field]) {
      assigneeId = task[field];
      assigneeField = field;
      break;
    }
  }

  // Extract assignee name if available
  const assigneeName = task.assigneeName || task.assignedToName || task.userName || null;
  const assigneeEmail = task.assigneeEmail || task.assignedToEmail || task.userEmail || null;

  return {
    id: assigneeId,
    name: assigneeName,
    email: assigneeEmail,
    field: assigneeField,
    value: assigneeId ? { id: assigneeId, name: assigneeName, email: assigneeEmail } : null,
  };
};

/**
 * 📞 Extract associated contact from GHL task object
 */
const extractAssociatedContact = async (task) => {
  // Common GHL contact field names
  const contactFields = [
    'contactId', 'contact_id', 'contact', 'relatedContact', 'customerId',
    'customer_id', 'clientId', 'client_id', 'leadId', 'lead_id',
  ];

  let contactId = null;
  let contactField = null;

  // Find contact ID from various possible fields
  for (const field of contactFields) {
    if (task[field]) {
      contactId = task[field];
      contactField = field;
      break;
    }
  }

  if (!contactId || contactId === 'null' || contactId === 'undefined' || contactId === '') {
    return {
      id: null,
      name: null,
      email: null,
      phone: null,
      field: null,
      value: null,
    };
  }

  try {
    // Skip API call for obviously invalid contact IDs
    if (contactId.length < 5 || contactId.includes('undefined') || contactId.includes('null')) {
      return {
        id: contactId,
        name: 'Invalid Contact ID',
        email: null,
        phone: null,
        field: contactField,
        value: {
          id: contactId,
          name: 'Invalid Contact ID',
          email: null,
          phone: null,
        },
      };
    }

    // Fetch contact details from GHL API
    const contactResponse = await fetchContactById(contactId);

    if (contactResponse.success && contactResponse.data) {
      const contact = contactResponse.data;

      return {
        id: contactId,
        name: contact.firstName && contact.lastName
          ? `${contact.firstName} ${contact.lastName}`.trim()
          : contact.firstName || contact.lastName || contact.name || 'Unknown Contact',
        email: contact.email || null,
        phone: contact.phone || contact.mobile || contact.phoneNumber || null,
        field: contactField,
        value: {
          id: contactId,
          name: contact.firstName && contact.lastName
            ? `${contact.firstName} ${contact.lastName}`.trim()
            : contact.firstName || contact.lastName || contact.name || 'Unknown Contact',
          email: contact.email || null,
          phone: contact.phone || contact.mobile || contact.phoneNumber || null,
        },
      };
    } else {
      // Handle 404 errors silently - just return contact not found
      if (contactResponse.notFound) {
        return {
          id: contactId,
          name: 'Contact Not Found',
          email: null,
          phone: null,
          field: contactField,
          value: {
            id: contactId,
            name: 'Contact Not Found',
            email: null,
            phone: null,
          },
        };
      }

      // Only log warnings for other errors
      taskLogger.warn('Failed to fetch contact details', { contactId, error: contactResponse.error });

      return {
        id: contactId,
        name: 'Contact Not Found',
        email: null,
        phone: null,
        field: contactField,
        value: {
          id: contactId,
          name: 'Contact Not Found',
          email: null,
          phone: null,
        },
      };
    }
  } catch (error) {
    taskLogger.error('Error fetching contact details:', error, { contactId });

    return {
      id: contactId,
      name: 'Error Loading Contact',
      email: null,
      phone: null,
      field: contactField,
      value: {
        id: contactId,
        name: 'Error Loading Contact',
        email: null,
        phone: null,
      },
    };
  }
};

/**
 * 🎨 Normalize status values to standard categories
 */
const normalizeStatus = (status) => {
  const statusStr = String(status).toLowerCase().trim();

  // Completed statuses
  if (['completed', 'done', 'finished', 'closed', 'resolved', 'successful'].includes(statusStr)) {
    return {
      value: 'completed',
      category: 'success',
      color: 'green',
    };
  }

  // In progress statuses
  if (['in progress', 'in-progress', 'progress', 'working', 'active', 'ongoing'].includes(statusStr)) {
    return {
      value: 'in_progress',
      category: 'warning',
      color: 'yellow',
    };
  }

  // Pending statuses
  if (['pending', 'waiting', 'on hold', 'on-hold', 'scheduled', 'planned'].includes(statusStr)) {
    return {
      value: 'pending',
      category: 'info',
      color: 'blue',
    };
  }

  // Overdue statuses
  if (['overdue', 'late', 'delayed', 'past due'].includes(statusStr)) {
    return {
      value: 'overdue',
      category: 'error',
      color: 'red',
    };
  }

  // Cancelled statuses
  if (['cancelled', 'canceled', 'abandoned', 'dropped'].includes(statusStr)) {
    return {
      value: 'cancelled',
      category: 'neutral',
      color: 'gray',
    };
  }

  // Default to pending for unknown statuses
  return {
    value: 'pending',
    category: 'info',
    color: 'blue',
  };
};

/**
 * 🔄 Enhance multiple tasks with GHL fields
 */
export const enhanceTasksWithGHLFields = async (tasks) => {
  if (!Array.isArray(tasks)) {
    taskLogger.warn('Tasks is not an array for enhancement:', tasks);
    return tasks;
  }

  try {
    taskLogger.info('Enhancing tasks with GHL fields', { count: tasks.length });

    const enhancedTasks = [];

    for (const task of tasks) {
      const enhancedTask = await enhanceTaskWithGHLFields(task);
      enhancedTasks.push(enhancedTask);
    }

    taskLogger.success('Tasks enhanced successfully', {
      originalCount: tasks.length,
      enhancedCount: enhancedTasks.length,
    });

    return enhancedTasks;

  } catch (error) {
    taskLogger.error('Error enhancing tasks with GHL fields:', error);
    return tasks; // Return original tasks if enhancement fails
  }
};
