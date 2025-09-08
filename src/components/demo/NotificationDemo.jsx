// ========================================
// 🔔 NOTIFICATION DEMO COMPONENT
// ========================================
// Demonstrates all notification types and CRUD operations
// Use this component to test and showcase the notification system

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiCheck, FiX, FiAlertTriangle, FiInfo, FiLoader, FiTrash2, FiEdit, FiPlus } from 'react-icons/fi';
import { useNotification } from '@hooks';
import { useCrudNotifications } from '../../utils/crudNotificationsClean';

const NotificationDemo = () => {
  const notification = useNotification();
  const crudNotifications = useCrudNotifications();
  const [isLoading, setIsLoading] = useState(false);

  // Demo API functions (simulate real API calls)
  const mockApiCall = (delay = 1000) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), delay);
    });
  };

  const mockApiError = () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Simulated API error')), 1000);
    });
  };

  // Basic notification demos
  const showSuccess = () => {
    notification.success('This is a success notification!', {
      title: 'Success',
      duration: 4000,
    });
  };

  const showError = () => {
    notification.error('This is an error notification!', {
      title: 'Error Occurred',
      duration: 6000,
    });
  };

  const showWarning = () => {
    notification.warning('This is a warning notification!', {
      title: 'Warning',
      duration: 5000,
    });
  };

  const showInfo = () => {
    notification.info('This is an info notification!', {
      title: 'Information',
      duration: 4000,
    });
  };

  const showLoading = () => {
    const loadingId = notification.loading('Processing your request...', {
      title: 'Please Wait',
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove(loadingId);
      notification.success('Process completed successfully!');
    }, 3000);
  };

  // CRUD operation demos
  const demoCreateTask = async () => {
    await crudNotifications.tasks.create(
      mockApiCall,
      { title: 'Demo Task', description: 'This is a demo task' },
      'Task "Demo Task"',
    );
  };

  const demoUpdateTask = async () => {
    await crudNotifications.tasks.update(
      mockApiCall,
      'task-123',
      { title: 'Updated Demo Task' },
      'Task "Updated Demo Task"',
    );
  };

  const demoCompleteTask = async () => {
    await crudNotifications.tasks.complete(
      mockApiCall,
      'task-123',
      'Demo Task',
    );
  };

  const demoDeleteTask = async () => {
    await crudNotifications.tasks.delete(
      mockApiCall,
      'task-123',
      'Demo Task',
    );
  };

  // Promise wrapper demo
  const demoPromiseWrapper = async () => {
    setIsLoading(true);
    try {
      await notification.promise(
        () => mockApiCall(2000),
        {
          loading: 'Syncing data with server...',
          success: 'Data synchronized successfully!',
          error: 'Failed to sync data. Please try again.',
        },
      );
    } finally {
      setIsLoading(false);
    }
  };

  const demoPromiseError = async () => {
    await notification.promise(
      mockApiError,
      {
        loading: 'Attempting operation...',
        success: 'Operation completed!',
        error: 'Operation failed!',
      },
    );
  };

  // Advanced notification with actions
  const showAdvancedNotification = () => {
    notification.success('File uploaded successfully!', {
      title: 'Upload Complete',
      duration: 0, // Manual dismiss
      actions: [
        {
          label: 'View File',
          onClick: () => notification.info('Viewing file...'),
          variant: 'primary',
        },
        {
          label: 'Share',
          onClick: () => notification.info('Opening share dialog...'),
        },
      ],
    });
  };

  // Multiple notifications
  const showMultiple = () => {
    notification.info('First notification');
    setTimeout(() => notification.success('Second notification'), 500);
    setTimeout(() => notification.warning('Third notification'), 1000);
    setTimeout(() => notification.error('Fourth notification'), 1500);
  };

  const clearAll = () => {
    notification.clear();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔔 Notification System Demo
        </h1>
        <p className="text-gray-600">
          Test all notification types and CRUD operations with professional styling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiPlay className="mr-2" />
            Basic Notifications
          </h2>
          <div className="space-y-3">
            <motion.button
              onClick={showSuccess}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiCheck className="mr-2" />
              Show Success
            </motion.button>

            <motion.button
              onClick={showError}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiX className="mr-2" />
              Show Error
            </motion.button>

            <motion.button
              onClick={showWarning}
              className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiAlertTriangle className="mr-2" />
              Show Warning
            </motion.button>

            <motion.button
              onClick={showInfo}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiInfo className="mr-2" />
              Show Info
            </motion.button>

            <motion.button
              onClick={showLoading}
              className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLoader className="mr-2" />
              Show Loading
            </motion.button>
          </div>
        </div>

        {/* CRUD Operations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiEdit className="mr-2" />
            CRUD Operations
          </h2>
          <div className="space-y-3">
            <motion.button
              onClick={demoCreateTask}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus className="mr-2" />
              Create Task
            </motion.button>

            <motion.button
              onClick={demoUpdateTask}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiEdit className="mr-2" />
              Update Task
            </motion.button>

            <motion.button
              onClick={demoCompleteTask}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiCheck className="mr-2" />
              Complete Task
            </motion.button>

            <motion.button
              onClick={demoDeleteTask}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiTrash2 className="mr-2" />
              Delete Task
            </motion.button>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🚀 Advanced Features
          </h2>
          <div className="space-y-3">
            <motion.button
              onClick={demoPromiseWrapper}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Promise Wrapper (Success)
            </motion.button>

            <motion.button
              onClick={demoPromiseError}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Promise Wrapper (Error)
            </motion.button>

            <motion.button
              onClick={showAdvancedNotification}
              className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Notification with Actions
            </motion.button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎮 Control Panel
          </h2>
          <div className="space-y-3">
            <motion.button
              onClick={showMultiple}
              className="w-full px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Show Multiple Notifications
            </motion.button>

            <motion.button
              onClick={clearAll}
              className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear All Notifications
            </motion.button>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💡 Quick Usage Examples
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Basic Usage:</h4>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`const notification = useNotification();

notification.success('Success!');
notification.error('Error occurred');
notification.warning('Be careful');
notification.info('FYI message');`}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">CRUD Usage:</h4>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`const crud = useCrudNotifications();

await crud.tasks.create(apiCreate, data);
await crud.tasks.update(apiUpdate, id, data);
await crud.tasks.delete(apiDelete, id, name);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
