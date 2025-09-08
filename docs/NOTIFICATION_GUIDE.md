# 🔔 Global Notification System Integration Guide

## Overview

The global notification system provides professional notifications for all CRUD operations in your dashboard. It includes:

- ✅ Success, Error, Warning, Info, and Loading notifications
- 🎨 Professional styling with animations
- ⚡ Auto-dismiss with customizable duration
- 📱 Responsive design
- 🔄 Queue management for multiple notifications
- 🎯 Specialized CRUD operation methods

## Quick Start

### 1. Basic Usage

```jsx
import { useNotification } from '@hooks';

const MyComponent = () => {
  const notification = useNotification();

  const handleSuccess = () => {
    notification.success('Operation completed successfully!');
  };

  const handleError = () => {
    notification.error('Something went wrong!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
};
```

### 2. CRUD Operations with useCrudNotifications

```jsx
import { useCrudNotifications } from '@utils/crudNotificationsClean';

const TaskComponent = () => {
  const crudNotifications = useCrudNotifications();

  const createTask = async taskData => {
    // This will automatically show success/error notifications
    await crudNotifications.tasks.create(apiCreateTask, taskData);
  };

  const updateTask = async (taskId, updates) => {
    await crudNotifications.tasks.update(apiUpdateTask, taskId, updates);
  };

  const deleteTask = async (taskId, taskTitle) => {
    await crudNotifications.tasks.delete(apiDeleteTask, taskId, taskTitle);
  };

  const completeTask = async (taskId, taskTitle) => {
    await crudNotifications.tasks.complete(apiCompleteTask, taskId, taskTitle);
  };

  // ... component logic
};
```

## Available Notification Types

### Basic Notifications

```jsx
notification.success('Success message', {
  title: 'Custom Title',
  duration: 4000,
});

notification.error('Error message', {
  title: 'Error Title',
  duration: 6000,
});

notification.warning('Warning message');

notification.info('Information message');

notification.loading('Processing...'); // Manual dismiss only
```

### CRUD Notifications

```jsx
// Generic CRUD methods
notification.crud.created('Contact "John Doe"');
notification.crud.updated('Task "Important Meeting"');
notification.crud.deleted('Lead "Jane Smith"');
notification.crud.statusChanged('Task "Review"', 'completed');

// Error methods
notification.crud.createError('contact', 'Validation failed');
notification.crud.updateError('task', 'Network error');
notification.crud.deleteError('lead', 'Permission denied');
```

## Integration Examples

### Example 1: Task Management Integration

```jsx
// Before (with placeholder comments)
const handleDelete = async taskId => {
  try {
    await deleteTask(taskId);
    // Success handling will be managed by global notification system
  } catch (error) {
    // Error handling will be managed by global notification system
  }
};

// After (with notifications)
const handleDelete = async (taskId, taskTitle) => {
  await crudNotifications.tasks.delete(deleteTask, taskId, taskTitle);
};
```

### Example 2: Lead Pipeline Integration

```jsx
import { useCrudNotifications } from '@utils/crudNotificationsClean';

const LeadPipeline = () => {
  const crudNotifications = useCrudNotifications();

  const handleMoveLead = async (leadId, fromStage, toStage, leadName) => {
    await crudNotifications.leads.move(
      moveLead,
      leadId,
      fromStage,
      toStage,
      leadName
    );
  };

  const handleCreateLead = async leadData => {
    await crudNotifications.leads.create(createLead, leadData);
  };

  const handleUpdateLead = async (leadId, updates) => {
    await crudNotifications.leads.update(updateLead, leadId, updates);
  };

  // ... component logic
};
```

### Example 3: Appointment Management

```jsx
const AppointmentModal = () => {
  const crudNotifications = useCrudNotifications();

  const handleCreateAppointment = async appointmentData => {
    await crudNotifications.appointments.create(
      createAppointment,
      appointmentData,
      `Appointment scheduled for ${appointmentData.date}`
    );
  };

  const handleCancelAppointment = async (appointmentId, title) => {
    await crudNotifications.appointments.cancel(
      cancelAppointment,
      appointmentId,
      title
    );
  };

  // ... component logic
};
```

### Example 4: Promise-based Operations

```jsx
const DataSyncComponent = () => {
  const notification = useNotification();

  const syncData = async () => {
    await notification.promise(() => syncApiCall(), {
      loading: 'Syncing data...',
      success: 'Data synced successfully!',
      error: 'Failed to sync data',
    });
  };

  return <button onClick={syncData}>Sync Data</button>;
};
```

## Advanced Usage

### Custom Notification Options

```jsx
notification.success('Custom notification', {
  title: 'Custom Title',
  duration: 5000,
  icon: '🎉',
  actions: [
    {
      label: 'View Details',
      onClick: () => navigate('/details'),
      variant: 'primary',
    },
    {
      label: 'Dismiss',
      onClick: () => notification.remove(notificationId),
    },
  ],
});
```

### Managing Notifications

```jsx
const notification = useNotification();

// Remove specific notification
const notificationId = notification.success('Message');
notification.remove(notificationId);

// Update notification
notification.update(notificationId, {
  message: 'Updated message',
});

// Clear all notifications
notification.clear();
```

## Configuration

The notification system is configured in `App.jsx`:

```jsx
<NotificationProvider position='top-right' maxNotifications={5}>
  {/* Your app components */}
</NotificationProvider>
```

### Available Positions

- `top-right` (default)
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

## Styling

The notification system uses Tailwind CSS with professional styling:

- 🎨 Glass morphism effects
- 📱 Responsive design
- 🌟 Smooth animations
- 🎯 Type-specific colors
- ⚡ Hover effects

All styles are automatically applied and don't require additional CSS.

## Best Practices

1. **Use CRUD helpers for standard operations**

   ```jsx
   // ✅ Good
   await crudNotifications.tasks.create(createTask, taskData);

   // ❌ Avoid
   try {
     await createTask(taskData);
     notification.success('Task created');
   } catch (error) {
     notification.error(error.message);
   }
   ```

2. **Provide meaningful context**

   ```jsx
   // ✅ Good
   notification.crud.deleted('Contact "John Doe"');

   // ❌ Less helpful
   notification.success('Deleted successfully');
   ```

3. **Use loading notifications for long operations**

   ```jsx
   const loadingId = notification.loading('Uploading file...');
   // ... operation
   notification.remove(loadingId);
   notification.success('File uploaded successfully');
   ```

4. **Customize duration based on importance**
   ```jsx
   notification.error('Critical error', { duration: 8000 }); // Longer for errors
   notification.success('Saved', { duration: 2000 }); // Shorter for quick feedback
   ```

## Migration from Old System

Replace all existing toast notifications:

```jsx
// Old (react-hot-toast)
toast.success('Success message');
toast.error('Error message');

// New (Global Notification System)
notification.success('Success message');
notification.error('Error message');
```

Replace placeholder comments:

```jsx
// Old
// Success handling will be managed by global notification system
// Error handling will be managed by global notification system

// New
await crudNotifications.tasks.create(createTask, taskData);
```

The system is now fully integrated and ready to use across your entire application!
