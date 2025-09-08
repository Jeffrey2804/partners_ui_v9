// ========================================
// 🎯 PRACTICAL GHL CRUD EXAMPLE COMPONENT
// ========================================
// Shows how to implement all CRUD operations in your UI components
// Copy and adapt this pattern for your own components

import React, { useState, useEffect } from 'react';
import { useGHLIntegration } from '@hooks';

const GHLCRUDExample = () => {
  // ========================================================================
  // 🔧 HOOK AND STATE SETUP
  // ========================================================================

  const {
    loading,
    error,
    contacts,
    tasks,
    pipeline,
    diagnostics,
  } = useGHLIntegration();

  const [data, setData] = useState({
    contacts: [],
    tasks: [],
    leads: [],
    healthStatus: null,
  });

  const [activeTab, setActiveTab] = useState('contacts');

  // ========================================================================
  // 🔄 INITIALIZATION
  // ========================================================================

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Run health check first
      const health = await diagnostics.healthCheck();
      setData(prev => ({ ...prev, healthStatus: health }));

      // Load initial data
      await loadAllData();
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  };

  const loadAllData = async () => {
    try {
      const [contactsData, tasksData, pipelineData] = await Promise.all([
        contacts.getAll({ limit: 20 }),
        tasks.getAll({ completed: false, limit: 20 }),
        pipeline.getLeads(),
      ]);

      setData(prev => ({
        ...prev,
        contacts: contactsData || [],
        tasks: tasksData || [],
        leads: pipelineData?.leads?.['New Lead'] || [],
      }));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // ========================================================================
  // 📞 CONTACT CRUD OPERATIONS
  // ========================================================================

  const handleCreateContact = async () => {
    const contactData = {
      firstName: prompt('First Name:') || 'Test',
      lastName: prompt('Last Name:') || 'User',
      email: prompt('Email:') || `test${Date.now()}@example.com`,
      phone: prompt('Phone:') || '+1234567890',
    };

    try {
      await contacts.create(contactData);
      // Refresh data
      const updatedContacts = await contacts.getAll({ limit: 20 });
      setData(prev => ({ ...prev, contacts: updatedContacts || [] }));
    } catch (error) {
      console.error('Create contact failed:', error);
    }
  };

  const handleUpdateContact = async (contact) => {
    const updates = {
      firstName: prompt('New First Name:', contact.firstName) || contact.firstName,
      phone: prompt('New Phone:', contact.phone) || contact.phone,
    };

    try {
      await contacts.update(contact._id || contact.id, updates);
      // Refresh data
      const updatedContacts = await contacts.getAll({ limit: 20 });
      setData(prev => ({ ...prev, contacts: updatedContacts || [] }));
    } catch (error) {
      console.error('Update contact failed:', error);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Delete this contact?')) return;

    try {
      await contacts.delete(contactId);
      // Refresh data
      const updatedContacts = await contacts.getAll({ limit: 20 });
      setData(prev => ({ ...prev, contacts: updatedContacts || [] }));
    } catch (error) {
      console.error('Delete contact failed:', error);
    }
  };

  // ========================================================================
  // 🎯 TASK CRUD OPERATIONS
  // ========================================================================

  const handleCreateTask = async () => {
    if (data.contacts.length === 0) {
      alert('Create a contact first!');
      return;
    }

    const contactId = data.contacts[0]._id || data.contacts[0].id;
    const taskData = {
      title: prompt('Task Title:') || 'New Task',
      body: prompt('Task Description:') || 'Task created from dashboard',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      contactId: contactId,
      completed: false,
    };

    try {
      await tasks.create(taskData);
      // Refresh data
      const updatedTasks = await tasks.getAll({ completed: false, limit: 20 });
      setData(prev => ({ ...prev, tasks: updatedTasks || [] }));
    } catch (error) {
      console.error('Create task failed:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await tasks.complete(taskId);
      // Refresh data
      const updatedTasks = await tasks.getAll({ completed: false, limit: 20 });
      setData(prev => ({ ...prev, tasks: updatedTasks || [] }));
    } catch (error) {
      console.error('Complete task failed:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await tasks.delete(taskId);
      // Refresh data
      const updatedTasks = await tasks.getAll({ completed: false, limit: 20 });
      setData(prev => ({ ...prev, tasks: updatedTasks || [] }));
    } catch (error) {
      console.error('Delete task failed:', error);
    }
  };

  // ========================================================================
  // 🚀 PIPELINE CRUD OPERATIONS
  // ========================================================================

  const handleCreateLead = async () => {
    const leadData = {
      name: prompt('Lead Name:') || `Lead ${Date.now()}`,
      email: prompt('Email:') || `lead${Date.now()}@example.com`,
      phone: prompt('Phone:') || '+1555000000',
      loanType: prompt('Loan Type (FHA/Conventional/VA):') || 'FHA',
      loanAmount: parseInt(prompt('Loan Amount:') || '250000'),
      stage: 'New Lead',
    };

    try {
      await pipeline.createLead(leadData);
      // Refresh data
      const updatedPipeline = await pipeline.getLeads();
      setData(prev => ({
        ...prev,
        leads: updatedPipeline?.leads?.['New Lead'] || [],
      }));
    } catch (error) {
      console.error('Create lead failed:', error);
    }
  };

  const handleMoveLead = async (lead) => {
    const stages = ['New Lead', 'Contacted', 'Application Started', 'Pre-Approved', 'In Underwriting', 'Closed'];
    const currentIndex = stages.indexOf(lead.stage);
    const nextStage = stages[(currentIndex + 1) % stages.length];

    try {
      await pipeline.moveLead(lead.id, nextStage, lead.stage);
      // Refresh data
      const updatedPipeline = await pipeline.getLeads();
      setData(prev => ({
        ...prev,
        leads: updatedPipeline?.leads?.['New Lead'] || [],
      }));
    } catch (error) {
      console.error('Move lead failed:', error);
    }
  };

  // ========================================================================
  // 🎨 RENDER HELPERS
  // ========================================================================

  const HealthIndicator = ({ status }) => {
    const isHealthy = status?.config?.hasToken && status?.config?.hasLocationId;
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          isHealthy ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        {isHealthy ? 'Connected' : 'Disconnected'}
      </div>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-sm text-gray-600">Loading...</span>
    </div>
  );

  const ErrorMessage = ({ message }) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex">
        <div className="text-red-800 text-sm">{message}</div>
      </div>
    </div>
  );

  // ========================================================================
  // 🎨 RENDER COMPONENT
  // ========================================================================

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GHL Integration Dashboard</h1>
          <p className="text-gray-600">Manage your GoHighLevel data with full CRUD operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <HealthIndicator status={data.healthStatus} />
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['contacts', 'tasks', 'leads'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab} ({data[tab]?.length || 0})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Contacts</h2>
              <button
                onClick={handleCreateContact}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                ➕ Add Contact
              </button>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                {data.contacts.map((contact) => (
                  <div key={contact._id || contact.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateContact(contact)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact._id || contact.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {data.contacts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No contacts found. Create one to get started!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tasks</h2>
              <button
                onClick={handleCreateTask}
                disabled={loading || data.contacts.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                ➕ Add Task
              </button>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                {data.tasks.map((task) => (
                  <div key={task._id || task.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.body}</p>
                      <p className="text-sm text-gray-500">
                        Due: {task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()) : 'No due date'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCompleteTask(task._id || task.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id || task.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {data.tasks.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No pending tasks found. {data.contacts.length === 0 ? 'Create a contact first, then add tasks!' : 'Create one to get started!'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pipeline Leads</h2>
              <button
                onClick={handleCreateLead}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                ➕ Add Lead
              </button>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3">
                {data.leads.map((lead) => (
                  <div key={lead.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                      <p className="text-sm text-gray-500">
                        {lead.loanType}: ${lead.loanAmount?.toLocaleString()} • Stage: {lead.stage}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMoveLead(lead)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Next Stage
                      </button>
                    </div>
                  </div>
                ))}
                {data.leads.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No leads in New Lead stage. Create one to get started!</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Implementation Guide</h3>
        <div className="text-blue-800 text-sm space-y-1">
          <p>• <strong>Copy this pattern</strong> to your existing components</p>
          <p>• <strong>Use useGHLIntegration()</strong> hook for easy access to all CRUD operations</p>
          <p>• <strong>All operations</strong> include automatic loading states, error handling, and toast notifications</p>
          <p>• <strong>Data refreshes automatically</strong> after create/update/delete operations</p>
          <p>• <strong>Check console</strong> for detailed operation logs</p>
        </div>
      </div>
    </div>
  );
};

export default GHLCRUDExample;
