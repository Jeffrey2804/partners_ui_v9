# 🔔 Notification API Service Documentation

The Notification API Service provides comprehensive CRUD operations for managing GoHighLevel calendar notifications. This service is built based on the actual GHL API endpoints and supports all notification types and operations.

## 📋 Table of Contents

- [Installation & Setup](#installation--setup)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [React Hooks](#react-hooks)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## 🚀 Installation & Setup

### Import the Service

```javascript
import notificationApi from '@shared/services/api/notificationApi';
```

### Configuration

The service automatically uses your GHL configuration from `@config/ghlConfig.js`. Make sure your GHL token has the necessary permissions:

- ✅ Calendars: Read, Write, Create, Delete
- ✅ Notifications: Read, Write, Create, Delete

## ⚡ Quick Start

### Basic Usage Example

```javascript
import notificationApi from '@shared/services/api/notificationApi';

// Fetch notifications for a calendar
const response = await notificationApi.fetchCalendarNotifications(
  'calendarId',
  {
    isActive: true,
    deleted: false,
  }
);

if (response.success) {
  console.log('Notifications:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Using React Hooks

```javascript
import { useNotificationApi } from '@hooks/useNotificationApi';

const MyComponent = () => {
  const { notifications, loading, createNotification, deleteNotification } =
    useNotificationApi('your-calendar-id');

  const handleCreate = async () => {
    await createNotification({
      receiverType: 'contact',
      channel: 'email',
      notificationType: 'booked',
      subject: 'Appointment Confirmation',
      body: 'Your appointment has been booked!',
    });
  };

  return (
    <div>
      {loading ? 'Loading...' : `${notifications.length} notifications`}
      <button onClick={handleCreate}>Create Notification</button>
    </div>
  );
};
```

## 📚 API Reference

### Core Methods

#### 📥 Fetch Operations

##### `fetchCalendarNotifications(calendarId, filters)`

Retrieves all notifications for a specific calendar.

```javascript
const response = await notificationApi.fetchCalendarNotifications(
  'calendarId',
  {
    isActive: true, // Filter by active status
    deleted: false, // Include/exclude deleted notifications
  }
);
```

**Response:**

```javascript
{
  success: true,
  data: [...notifications],
  meta: {
    calendarId: 'calendarId',
    count: 5,
    filters: { isActive: true, deleted: false },
    requestTimestamp: '2025-09-05T...'
  }
}
```

##### `fetchNotificationById(calendarId, notificationId)`

Retrieves detailed information about a specific notification.

```javascript
const response = await notificationApi.fetchNotificationById(
  'calendarId',
  'notificationId'
);
```

#### ➕ Create Operations

##### `createSingleNotification(calendarId, notificationData)`

Creates a single notification.

```javascript
const notificationData = {
  receiverType: 'contact',
  channel: 'email',
  notificationType: 'booked',
  isActive: true,
  subject: 'Appointment Confirmation',
  body: 'Your appointment has been scheduled.',
  beforeTime: [{ timeOffset: 1, unit: 'hours' }],
  fromName: 'Your Business',
};

const response = await notificationApi.createSingleNotification(
  'calendarId',
  notificationData
);
```

##### `createCalendarNotifications(calendarId, notificationsArray)`

Creates multiple notifications at once.

```javascript
const notifications = [
  {
    /* notification 1 */
  },
  {
    /* notification 2 */
  },
  {
    /* notification 3 */
  },
];

const response = await notificationApi.createCalendarNotifications(
  'calendarId',
  notifications
);
```

#### 📝 Update Operations

##### `updateNotification(calendarId, notificationId, updateData)`

Updates an existing notification.

```javascript
const updateData = {
  subject: 'Updated Subject',
  body: 'Updated notification body',
  isActive: false,
};

const response = await notificationApi.updateNotification(
  'calendarId',
  'notificationId',
  updateData
);
```

##### `toggleNotificationStatus(calendarId, notificationIds, isActive)`

Enables or disables notifications.

```javascript
// Toggle single notification
await notificationApi.toggleNotificationStatus(
  'calendarId',
  ['notificationId'],
  true
);

// Toggle multiple notifications
await notificationApi.toggleNotificationStatus(
  'calendarId',
  ['id1', 'id2', 'id3'],
  false
);
```

#### 🗑️ Delete Operations

##### `deleteNotification(calendarId, notificationId)`

Deletes a single notification.

```javascript
const response = await notificationApi.deleteNotification(
  'calendarId',
  'notificationId'
);
```

##### `bulkDeleteNotifications(calendarId, notificationIds)`

Deletes multiple notifications.

```javascript
const response = await notificationApi.bulkDeleteNotifications('calendarId', [
  'id1',
  'id2',
  'id3',
]);
```

### 🔧 Utility Functions

#### `getNotificationTemplates()`

Returns preset notification templates.

```javascript
const templates = notificationApi.getNotificationTemplates();

// Available templates:
// - appointmentBooked
// - appointmentReminder
// - appointmentCancelled
// - appointmentRescheduled
// - staffNotification
```

#### `getNotificationStatistics(notifications)`

Returns statistics about notification usage.

```javascript
const stats = notificationApi.getNotificationStatistics(notifications);
console.log(stats);
// Output:
// {
//   total: 10,
//   active: 8,
//   inactive: 2,
//   byType: { booked: 5, cancelled: 2, rescheduled: 3 },
//   channels: { email: 8, sms: 2 }
// }
```

#### `filterNotificationsByType(notifications, type)`

Filters notifications by their type.

```javascript
const bookedNotifications = notificationApi.filterNotificationsByType(
  notifications,
  'booked'
);
```

#### `getActiveNotifications(notifications)`

Returns only active notifications.

```javascript
const activeNotifications =
  notificationApi.getActiveNotifications(notifications);
```

## 🎣 React Hooks

### `useNotificationApi(calendarId, options)`

Main hook for managing notifications with React state.

```javascript
const {
  notifications, // Array of notifications
  statistics, // Notification statistics
  activeNotifications, // Only active notifications
  notificationsByType, // Grouped by type
  templates, // Available templates
  loading, // Loading state
  error, // Error state
  lastFetched, // Last fetch timestamp

  // Operations
  fetchNotifications, // Fetch notifications
  refetch, // Refetch data
  createNotification, // Create single notification
  createBulkNotifications, // Create multiple notifications
  createFromTemplate, // Create from template
  updateNotification, // Update notification
  toggleStatus, // Toggle active status
  deleteNotification, // Delete single notification
  deleteBulkNotifications, // Delete multiple notifications

  // Utilities
  clearError, // Clear error state
  isReady, // Ready state (not loading, no error, has data)
} = useNotificationApi('calendarId', {
  autoFetch: true, // Auto-fetch on mount
  includeDeleted: false, // Include deleted notifications
  activeOnly: false, // Only fetch active notifications
});
```

### `useNotificationTemplates()`

Hook for accessing notification templates.

```javascript
const templates = useNotificationTemplates();
```

### `useNotificationStats(notifications)`

Hook for calculating notification statistics.

```javascript
const stats = useNotificationStats(notifications);
```

### `useNotificationFilters(notifications)`

Hook for filtering notifications.

```javascript
const { filterByType, getActive, groupByType, all } =
  useNotificationFilters(notifications);
```

## 💡 Examples

### Example 1: Creating Different Notification Types

```javascript
import notificationApi from '@shared/services/api/notificationApi';

const createAppointmentNotifications = async calendarId => {
  const templates = notificationApi.getNotificationTemplates();

  // Create booking confirmation
  await notificationApi.createSingleNotification(calendarId, {
    ...templates.appointmentBooked,
    subject: 'Booking Confirmed!',
    body: 'Thank you for booking with us. Your appointment is confirmed.',
  });

  // Create reminder notification
  await notificationApi.createSingleNotification(calendarId, {
    ...templates.appointmentReminder,
    beforeTime: [{ timeOffset: 24, unit: 'hours' }],
  });

  // Create staff notification
  await notificationApi.createSingleNotification(calendarId, {
    ...templates.staffNotification,
    selectedUsers: ['staff@example.com'],
  });
};
```

### Example 2: Bulk Operations

```javascript
const manageBulkNotifications = async calendarId => {
  // Fetch all notifications
  const response = await notificationApi.fetchCalendarNotifications(calendarId);

  if (response.success) {
    const notifications = response.data;

    // Get inactive notifications
    const inactiveIds = notifications.filter(n => !n.isActive).map(n => n.id);

    // Delete inactive notifications
    if (inactiveIds.length > 0) {
      await notificationApi.bulkDeleteNotifications(calendarId, inactiveIds);
    }

    // Enable all active notifications
    const activeIds = notifications.filter(n => n.isActive).map(n => n.id);

    if (activeIds.length > 0) {
      await notificationApi.toggleNotificationStatus(
        calendarId,
        activeIds,
        true
      );
    }
  }
};
```

### Example 3: React Component with Full CRUD

```javascript
import React from 'react';
import { useNotificationApi } from '@hooks/useNotificationApi';

const NotificationManager = ({ calendarId }) => {
  const {
    notifications,
    loading,
    statistics,
    createFromTemplate,
    deleteNotification,
    toggleStatus,
  } = useNotificationApi(calendarId, { autoFetch: true });

  const handleCreateBookingNotification = async () => {
    await createFromTemplate('appointmentBooked', {
      subject: 'Custom Booking Confirmation',
      body: 'Your appointment is confirmed for tomorrow!',
    });
  };

  const handleToggle = async (notificationId, currentStatus) => {
    await toggleStatus(notificationId, !currentStatus);
  };

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div>
      <h2>Notification Manager</h2>

      {statistics && (
        <div>
          <p>Total: {statistics.total}</p>
          <p>Active: {statistics.active}</p>
          <p>Inactive: {statistics.inactive}</p>
        </div>
      )}

      <button onClick={handleCreateBookingNotification}>
        Create Booking Notification
      </button>

      <div>
        {notifications.map(notification => (
          <div key={notification.id}>
            <h4>{notification.subject}</h4>
            <p>{notification.body}</p>
            <badge>{notification.isActive ? 'Active' : 'Inactive'}</badge>

            <button
              onClick={() =>
                handleToggle(notification.id, notification.isActive)
              }
            >
              {notification.isActive ? 'Disable' : 'Enable'}
            </button>

            <button onClick={() => deleteNotification(notification.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## ⚠️ Error Handling

All API methods return a consistent response format:

```javascript
// Success response
{
  success: true,
  data: [...],
  meta: { ... }
}

// Error response
{
  success: false,
  error: 'Error message',
  data: null, // or empty array for list operations
  resource: 'notification',
  operation: 'CREATE'
}
```

### Handling Errors

```javascript
const handleNotificationOperation = async () => {
  try {
    const response = await notificationApi.createSingleNotification(
      calendarId,
      data
    );

    if (response.success) {
      console.log('Success:', response.data);
    } else {
      console.error('API Error:', response.error);
      // Handle specific error
    }
  } catch (error) {
    console.error('Network Error:', error.message);
    // Handle network or other errors
  }
};
```

## 🎯 Best Practices

### 1. Use React Hooks for Components

```javascript
// ✅ Good
const { notifications, createNotification } = useNotificationApi(calendarId);

// ❌ Avoid direct API calls in components
```

### 2. Handle Loading States

```javascript
const { loading, notifications } = useNotificationApi(calendarId);

if (loading) return <LoadingSpinner />;
```

### 3. Use Templates for Consistency

```javascript
const templates = notificationApi.getNotificationTemplates();
await createNotification({
  ...templates.appointmentBooked,
  customField: 'custom value',
});
```

### 4. Implement Error Boundaries

```javascript
const NotificationComponent = () => {
  const { error, clearError } = useNotificationApi(calendarId);

  if (error) {
    return <ErrorDisplay message={error} onRetry={clearError} />;
  }

  // ... rest of component
};
```

### 5. Optimize with Bulk Operations

```javascript
// ✅ Good - Single bulk operation
await notificationApi.bulkDeleteNotifications(calendarId, [id1, id2, id3]);

// ❌ Avoid - Multiple individual operations
// await notificationApi.deleteNotification(calendarId, id1);
// await notificationApi.deleteNotification(calendarId, id2);
// await notificationApi.deleteNotification(calendarId, id3);
```

### 6. Use Proper Calendar IDs

```javascript
// Your available calendar IDs (from GHL configuration)
const CALENDAR_IDS = {
  DEFAULT: 'sV3BiXrjzbfo1tSUdyHO',
  WORKING: 'cF0lnbb4A2vCVdKQLrJp',
  EXAMPLE: 'U9qdnx6IVYmZTS1ccbiY',
};
```

## 🧪 Testing

### Test API Connection

```javascript
const testConnection = async () => {
  const result =
    await notificationApi.testNotificationApiConnection('calendarId');
  console.log('Connection test:', result);
};
```

### Demo Component

A complete demo component is available at:
`src/components/demo/NotificationApiDemo.jsx`

## 📝 Notes

- All times are in ISO format
- The service automatically handles GHL authentication
- Calendar IDs must be valid GHL calendar IDs
- Notification IDs are generated by GHL and returned in responses
- The service includes comprehensive logging for debugging

## 🔗 Related Documentation

- [GHL API Documentation](https://highlevel.stoplight.io/)
- [Calendar API Service](./calendar-api-docs.md)
- [React Hooks Documentation](./hooks-docs.md)
