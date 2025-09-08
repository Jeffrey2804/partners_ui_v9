// ========================================
// 🔔 NOTIFICATION API DEMO COMPONENT
// ========================================
// This component demonstrates how to use the notification API service
// for managing calendar notifications in your dashboard.
//
// Features:
// - ✅ Fetch calendar notifications
// - ✅ Create new notifications
// - ✅ Update existing notifications
// - ✅ Delete notifications
// - ✅ Bulk operations
// - ✅ Notification templates
// ========================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@hooks/useNotification';
import notificationApi from '@shared/services/api/notificationApi';

const NotificationApiDemo = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState('sV3BiXrjzbfo1tSUdyHO');
  const [statistics, setStatistics] = useState(null);
  const notification = useNotification();

  // Available calendar IDs for testing
  const availableCalendars = [
    { id: 'sV3BiXrjzbfo1tSUdyHO', name: 'Default Calendar' },
    { id: 'cF0lnbb4A2vCVdKQLrJp', name: 'Working Calendar' },
    { id: 'U9qdnx6IVYmZTS1ccbiY', name: 'Example Calendar' },
  ];

  // ============================================================================
  // 📥 FETCH OPERATIONS
  // ============================================================================

  const handleFetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.fetchCalendarNotifications(selectedCalendarId, {
        isActive: true,
        deleted: false,
      });

      if (response.success) {
        setNotifications(response.data);
        setStatistics(notificationApi.getNotificationStatistics(response.data));
        notification.success(`✅ Fetched ${response.data.length} notifications`);
      } else {
        notification.error(`❌ Failed to fetch notifications: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.fetchCalendarNotifications(selectedCalendarId);

      if (response.success) {
        setNotifications(response.data);
        setStatistics(notificationApi.getNotificationStatistics(response.data));
        notification.success(`✅ Fetched all ${response.data.length} notifications (including deleted)`);
      } else {
        notification.error(`❌ Failed to fetch all notifications: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // ➕ CREATE OPERATIONS
  // ============================================================================

  const handleCreateSampleNotification = async () => {
    setLoading(true);
    try {
      const templates = notificationApi.getNotificationTemplates();
      const sampleNotification = {
        ...templates.appointmentBooked,
        subject: `Test Notification - ${new Date().toLocaleTimeString()}`,
        body: `This is a test notification created at ${new Date().toLocaleString()}`,
      };

      const response = await notificationApi.createSingleNotification(
        selectedCalendarId,
        sampleNotification,
      );

      if (response.success) {
        notification.success('✅ Sample notification created successfully!');
        handleFetchNotifications(); // Refresh the list
      } else {
        notification.error(`❌ Failed to create notification: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBulkNotifications = async () => {
    setLoading(true);
    try {
      const templates = notificationApi.getNotificationTemplates();
      const bulkNotifications = [
        {
          ...templates.appointmentBooked,
          subject: `Bulk Notification 1 - ${new Date().toLocaleTimeString()}`,
        },
        {
          ...templates.appointmentReminder,
          subject: `Bulk Notification 2 - ${new Date().toLocaleTimeString()}`,
        },
        {
          ...templates.staffNotification,
          subject: `Bulk Notification 3 - ${new Date().toLocaleTimeString()}`,
        },
      ];

      const response = await notificationApi.createCalendarNotifications(
        selectedCalendarId,
        bulkNotifications,
      );

      if (response.success) {
        notification.success(`✅ Created ${response.data.length} bulk notifications!`);
        handleFetchNotifications(); // Refresh the list
      } else {
        notification.error(`❌ Failed to create bulk notifications: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 📝 UPDATE OPERATIONS
  // ============================================================================

  const handleToggleNotificationStatus = async (notificationId, currentStatus) => {
    setLoading(true);
    try {
      const response = await notificationApi.toggleNotificationStatus(
        selectedCalendarId,
        [notificationId],
        !currentStatus,
      );

      if (response.success) {
        notification.success(`✅ Notification ${!currentStatus ? 'activated' : 'deactivated'}`);
        handleFetchNotifications(); // Refresh the list
      } else {
        notification.error(`❌ Failed to toggle notification: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 🗑️ DELETE OPERATIONS
  // ============================================================================

  const handleDeleteNotification = async (notificationId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this notification?')) return;

    setLoading(true);
    try {
      const response = await notificationApi.deleteNotification(selectedCalendarId, notificationId);

      if (response.success) {
        notification.success('✅ Notification deleted successfully!');
        handleFetchNotifications(); // Refresh the list
      } else {
        notification.error(`❌ Failed to delete notification: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 🧪 TEST OPERATIONS
  // ============================================================================

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.testNotificationApiConnection(selectedCalendarId);

      if (response.success) {
        notification.success('✅ Notification API connection successful!');
      } else {
        notification.error(`❌ Connection test failed: ${response.error}`);
      }
    } catch (error) {
      notification.error(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  // Load notifications on component mount
  useEffect(() => {
    handleFetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalendarId]);s();
  }, [selectedCalendarId]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔔 Notification API Service Demo
          </CardTitle>
          <CardDescription>
            Comprehensive demonstration of the notification API service with all CRUD operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calendar Selection */}
          <div className="flex items-center gap-4">
            <label className="font-medium">Select Calendar:</label>
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {availableCalendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name} ({calendar.id})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={loading}
              variant="outline"
            >
              🧪 Test Connection
            </Button>
            <Button
              onClick={handleFetchNotifications}
              disabled={loading}
            >
              📥 Fetch Active Notifications
            </Button>
            <Button
              onClick={handleFetchAllNotifications}
              disabled={loading}
              variant="outline"
            >
              📋 Fetch All Notifications
            </Button>
            <Button
              onClick={handleCreateSampleNotification}
              disabled={loading}
              variant="default"
            >
              ➕ Create Sample
            </Button>
            <Button
              onClick={handleCreateBulkNotifications}
              disabled={loading}
              variant="default"
            >
              🔄 Create Bulk (3)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Notification Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{statistics.inactive}</div>
                <div className="text-sm text-gray-500">Inactive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(statistics.channels).length}
                </div>
                <div className="text-sm text-gray-500">Channels</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Calendar Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No notifications found for this calendar.</p>
              <p className="text-sm mt-2">Try creating a sample notification first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div
                  key={notif.id || index}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={notif.isActive ? 'default' : 'secondary'}>
                          {notif.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{notif.notificationType}</Badge>
                        <Badge variant="outline">{notif.channel}</Badge>
                        <Badge variant="outline">{notif.receiverType}</Badge>
                      </div>
                      <h4 className="font-medium">{notif.subject || 'No Subject'}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notif.body || 'No body content'}
                      </p>
                      {notif.id && (
                        <p className="text-xs text-gray-400 mt-2">
                          ID: {notif.id}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleNotificationStatus(notif.id, notif.isActive)}
                        disabled={loading || !notif.id}
                      >
                        {notif.isActive ? '⏸️' : '▶️'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteNotification(notif.id)}
                        disabled={loading || !notif.id}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Import the service:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{'import notificationApi from \'@shared/services/api/notificationApi\';'}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Fetch notifications:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{`const response = await notificationApi.fetchCalendarNotifications('calendarId', {
  isActive: true,
  deleted: false
});`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Create notification:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{`const templates = notificationApi.getNotificationTemplates();
const response = await notificationApi.createSingleNotification(
  'calendarId',
  templates.appointmentBooked
);`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationApiDemo;
