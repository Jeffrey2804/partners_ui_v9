import React, { useState, useEffect } from 'react';
import { ghlIntegration } from '@services/api';

// 🎯 Example Component: Unified GHL Integration Usage
const GHLIntegrationExample = () => {
  const [contacts, setContacts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  // ========================================================================
  // 🔧 INITIALIZATION & HEALTH CHECK
  // ========================================================================

  useEffect(() => {
    checkHealth();
    loadInitialData();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await ghlIntegration.healthCheck();
      setHealthStatus(health.data);
      console.log('🏥 GHL Health Status:', health.data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load data from all services simultaneously
      const [contactsResult, tasksResult, leadsResult] = await Promise.all([
        ghlIntegration.contacts.getAll({ limit: 10 }),
        ghlIntegration.tasks.getAll({ completed: false, limit: 10 }),
        ghlIntegration.pipeline.getLeads(),
      ]);

      if (contactsResult.success) {
        setContacts(contactsResult.data);
      }

      if (tasksResult.success) {
        setTasks(tasksResult.data);
      }

      if (leadsResult.success) {
        // Get leads from New Lead stage
        const newLeads = leadsResult.data.leads['New Lead'] || [];
        setLeads(newLeads.slice(0, 10));
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // 📞 CONTACT OPERATIONS
  // ========================================================================

  const createContact = async () => {
    const newContactData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      phone: '+1234567890',
    };

    try {
      const result = await ghlIntegration.contacts.create(newContactData);

      if (result.success) {
        console.log('✅ Contact created:', result.data);
        // Refresh contacts list
        const updatedContacts = await ghlIntegration.contacts.getAll({ limit: 10 });
        if (updatedContacts.success) {
          setContacts(updatedContacts.data);
        }
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  const updateContact = async (contactId) => {
    const updates = {
      firstName: 'Updated',
      lastName: 'Contact',
      phone: '+1987654321',
    };

    try {
      const result = await ghlIntegration.contacts.update(contactId, updates);

      if (result.success) {
        console.log('✅ Contact updated:', result.data);
        // Refresh contacts list
        const updatedContacts = await ghlIntegration.contacts.getAll({ limit: 10 });
        if (updatedContacts.success) {
          setContacts(updatedContacts.data);
        }
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const result = await ghlIntegration.contacts.delete(contactId);

      if (result.success) {
        console.log('✅ Contact deleted');
        // Refresh contacts list
        const updatedContacts = await ghlIntegration.contacts.getAll({ limit: 10 });
        if (updatedContacts.success) {
          setContacts(updatedContacts.data);
        }
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  // ========================================================================
  // 🎯 TASK OPERATIONS
  // ========================================================================

  const createTask = async () => {
    // Get first contact to create task for
    if (contacts.length === 0) {
      alert('Please create a contact first!');
      return;
    }

    const contactId = contacts[0]._id || contacts[0].id;
    const newTaskData = {
      title: 'Example Task',
      body: 'This is a test task created via GHL Integration Service',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      contactId: contactId,
      completed: false,
    };

    try {
      const result = await ghlIntegration.tasks.create(newTaskData);

      if (result.success) {
        console.log('✅ Task created:', result.data);
        // Refresh tasks list
        const updatedTasks = await ghlIntegration.tasks.getAll({ completed: false, limit: 10 });
        if (updatedTasks.success) {
          setTasks(updatedTasks.data);
        }
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const completeTask = async (taskId) => {
    try {
      const result = await ghlIntegration.tasks.complete(taskId);

      if (result.success) {
        console.log('✅ Task completed:', result.data);
        // Refresh tasks list
        const updatedTasks = await ghlIntegration.tasks.getAll({ completed: false, limit: 10 });
        if (updatedTasks.success) {
          setTasks(updatedTasks.data);
        }
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const result = await ghlIntegration.tasks.delete(taskId);

      if (result.success) {
        console.log('✅ Task deleted');
        // Refresh tasks list
        const updatedTasks = await ghlIntegration.tasks.getAll({ completed: false, limit: 10 });
        if (updatedTasks.success) {
          setTasks(updatedTasks.data);
        }
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // ========================================================================
  // 🚀 PIPELINE OPERATIONS
  // ========================================================================

  const createLead = async () => {
    const newLeadData = {
      name: `Lead ${Date.now()}`,
      email: `lead.${Date.now()}@example.com`,
      phone: '+1555000000',
      loanType: 'Conventional',
      loanAmount: Math.floor(Math.random() * 500000) + 100000,
      stage: 'New Lead',
    };

    try {
      const result = await ghlIntegration.pipeline.createLead(newLeadData);

      if (result.success) {
        console.log('✅ Lead created:', result.data);
        // Refresh leads
        const updatedLeads = await ghlIntegration.pipeline.getLeads();
        if (updatedLeads.success) {
          const newLeads = updatedLeads.data.leads['New Lead'] || [];
          setLeads(newLeads.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const moveLead = async (leadId, currentStage) => {
    const stages = ['New Lead', 'Contacted', 'Application Started', 'Pre-Approved', 'In Underwriting', 'Closed'];
    const currentIndex = stages.indexOf(currentStage);
    const nextIndex = (currentIndex + 1) % stages.length;
    const nextStage = stages[nextIndex];

    try {
      const result = await ghlIntegration.pipeline.moveLead(leadId, nextStage, currentStage);

      if (result.success) {
        console.log(`✅ Lead moved from ${currentStage} to ${nextStage}`);
        // Refresh leads
        const updatedLeads = await ghlIntegration.pipeline.getLeads();
        if (updatedLeads.success) {
          const newLeads = updatedLeads.data.leads['New Lead'] || [];
          setLeads(newLeads.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Failed to move lead:', error);
    }
  };

  // ========================================================================
  // 🧪 TESTING OPERATIONS
  // ========================================================================

  const runAllTests = async () => {
    setLoading(true);
    try {
      console.log('🧪 Running all API tests...');
      const results = await ghlIntegration.testAllConnections();

      console.log('📊 Test Results:', results);
      alert(`Tests completed: ${results.summary.passed}/${results.summary.total} passed`);

    } catch (error) {
      console.error('Tests failed:', error);
      alert('Tests failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // 🔄 BULK OPERATIONS EXAMPLE
  // ========================================================================

  const runBulkOperations = async () => {
    try {
      console.log('🔄 Running bulk operations example...');

      // 1. Bulk create contacts
      const contactsData = [
        { firstName: 'Bulk1', lastName: 'Contact', email: 'bulk1@example.com' },
        { firstName: 'Bulk2', lastName: 'Contact', email: 'bulk2@example.com' },
        { firstName: 'Bulk3', lastName: 'Contact', email: 'bulk3@example.com' },
      ];

      const bulkCreateResult = await ghlIntegration.bulkCreate('contacts', contactsData);
      console.log('✅ Bulk create result:', bulkCreateResult);

      // 2. If we have tasks, do bulk update
      if (tasks.length > 0) {
        const taskUpdates = tasks.slice(0, 3).map(task => ({
          id: task._id || task.id,
          data: { priority: 'high' },
        }));

        const bulkUpdateResult = await ghlIntegration.tasks.bulkUpdate(taskUpdates);
        console.log('✅ Bulk update result:', bulkUpdateResult);
      }

      alert('Bulk operations completed! Check console for details.');

    } catch (error) {
      console.error('Bulk operations failed:', error);
      alert('Bulk operations failed: ' + error.message);
    }
  };

  // ========================================================================
  // 🎨 RENDER COMPONENT
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg">Loading GHL Integration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        🎯 GHL Integration Service Example
      </h1>

      {/* Health Status */}
      {healthStatus && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🏥 Health Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className={`p-3 rounded ${healthStatus.config.hasToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Token</div>
              <div>{healthStatus.config.hasToken ? 'Present' : 'Missing'}</div>
            </div>
            <div className={`p-3 rounded ${healthStatus.config.hasLocationId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Location ID</div>
              <div>{healthStatus.config.hasLocationId ? 'Present' : 'Missing'}</div>
            </div>
            <div className={`p-3 rounded ${healthStatus.services?.summary?.passed > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">API Tests</div>
              <div>{healthStatus.services?.summary?.passed || 0}/{healthStatus.services?.summary?.total || 0}</div>
            </div>
            <div className="p-3 rounded bg-blue-100 text-blue-800">
              <div className="font-medium">Last Check</div>
              <div>{new Date(healthStatus.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🎮 Control Panel</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runAllTests}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🧪 Run All Tests
          </button>
          <button
            onClick={runBulkOperations}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            🔄 Bulk Operations
          </button>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            🔄 Refresh All
          </button>
          <button
            onClick={checkHealth}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            🏥 Check Health
          </button>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📞 Contacts ({contacts.length})</h2>
          <button
            onClick={createContact}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ➕ Create Contact
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {contacts.map(contact => (
            <div key={contact._id || contact.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">
                  {contact.firstName} {contact.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {contact.email} • {contact.phone}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateContact(contact._id || contact.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  📝 Update
                </button>
                <button
                  onClick={() => deleteContact(contact._id || contact.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No contacts found. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🎯 Tasks ({tasks.length})</h2>
          <button
            onClick={createTask}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={contacts.length === 0}
          >
            ➕ Create Task
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.map(task => (
            <div key={task._id || task.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-gray-600">
                  {task.body} • Due: {task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()) : 'No due date'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => completeTask(task._id || task.id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✅ Complete
                </button>
                <button
                  onClick={() => deleteTask(task._id || task.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No pending tasks found. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Leads Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🚀 Pipeline Leads ({leads.length})</h2>
          <button
            onClick={createLead}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ➕ Create Lead
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leads.map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="font-medium">{lead.name}</div>
                <div className="text-sm text-gray-600">
                  {lead.email} • {lead.loanType}: ${lead.loanAmount?.toLocaleString()} • Stage: {lead.stage}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => moveLead(lead.id, lead.stage)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ➡️ Next Stage
                </button>
              </div>
            </div>
          ))}
          {leads.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No leads found in New Lead stage. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📚 How to Use This Example
        </h3>
        <div className="text-blue-800 text-sm space-y-2">
          <p>1. Check the health status to ensure your GHL API connection is working</p>
          <p>2. Run all tests to verify each service is functioning properly</p>
          <p>3. Create contacts, tasks, and leads using the buttons above</p>
          <p>4. Use the update/delete buttons to modify existing records</p>
          <p>5. Try bulk operations to see how multiple items can be processed at once</p>
          <p>6. Open your browser console to see detailed logs of all API operations</p>
        </div>
      </div>
    </div>
  );
};

export default GHLIntegrationExample;
