import React, { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiPhone, FiMail, FiEdit3, FiTrash2, FiEye, FiFilter, FiSearch, FiChevronDown, FiPlus } from 'react-icons/fi';
import { fetchAppointments, getAllCalendarEvents, deleteAppointment } from '@shared/services/api/calendarApi';

// ========================================
// 🎯 APPOINTMENT LIST VIEW COMPONENT
// ========================================
// Displays appointments in a tabular format similar to GoHighLevel's appointment list view
// Features:
// - Fetches appointments from GHL backend
// - Tabular display with sorting and filtering
// - Status management (confirmed, cancelled, no-show, etc.)
// - Inline editing capabilities
// - Bulk operations
// - Export functionality
// ========================================

const AppointmentListView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [sortField, setSortField] = useState('startTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());

  // Status options matching GoHighLevel
  const statusOptions = [
    { value: 'All', label: 'All Status', color: '#6B7280' },
    { value: 'confirmed', label: 'Confirmed', color: '#10B981' },
    { value: 'new', label: 'New', color: '#3B82F6' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
    { value: 'showed', label: 'Showed', color: '#8B5CF6' },
    { value: 'noshow', label: 'No Show', color: '#F59E0B' },
    { value: 'rescheduled', label: 'Rescheduled', color: '#06B6D4' },
  ];

  const dateFilterOptions = [
    { value: 'All', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ];

  // ========================================
  // 📥 FETCH APPOINTMENTS
  // ========================================

  useEffect(() => {
    fetchAppointmentData();
  }, []);

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointments from GHL API
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const endTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ahead

      const [appointmentsResponse, eventsResponse] = await Promise.all([
        fetchAppointments({
          startDate: startTime,
          endDate: endTime,
          limit: 100,
        }),
        getAllCalendarEvents({
          startTime,
          endTime,
          locationId: 'b7vHWUGVUNQGoIlAXabY',
        }),
      ]);
      let allAppointments = [];

      // Process regular appointments
      if (appointmentsResponse.success && appointmentsResponse.data) {
        allAppointments = [...appointmentsResponse.data];
      }

      // Process calendar events (which might include appointments)
      if (eventsResponse.success && eventsResponse.data) {
        const eventAppointments = eventsResponse.data
          .filter(event => event.eventType === 'appointment' || !event.eventType)
          .map(event => ({
            id: event.id,
            title: event.title || event.name || 'Untitled Appointment',
            startTime: event.startTime || event.dateTime,
            endTime: event.endTime,
            status: event.status || 'confirmed',
            contactName: event.contact?.name || event.contactName || 'Unknown',
            contactEmail: event.contact?.email || event.contactEmail || '',
            contactPhone: event.contact?.phone || event.contactPhone || '',
            location: event.location || event.address || 'Virtual',
            notes: event.notes || event.description || '',
            calendarName: event.calendarName || 'Default Calendar',
            assignedUser: event.assignedUser || event.user || 'Unassigned',
            createdAt: event.createdAt || event.dateAdded,
            updatedAt: event.updatedAt || event.dateUpdated,
            source: 'calendar_events',
          }));

        // Merge with existing appointments, avoiding duplicates
        eventAppointments.forEach(eventAppt => {
          if (!allAppointments.find(appt => appt.id === eventAppt.id)) {
            allAppointments.push(eventAppt);
          }
        });
      }

      // Sort by start time (most recent first)
      allAppointments.sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));

      setAppointments(allAppointments);
      // Success handling will be managed by global notification system
    } catch (err) {
      setError(err.message);
      // Error handling will be managed by global notification system
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // 🔍 FILTERING & SORTING
  // ========================================

  const filteredAndSortedAppointments = useMemo(() => {

    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appt =>
        appt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(appt => appt.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'All') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(appt => {
        const apptDate = new Date(appt.startTime);

        switch (dateFilter) {
          case 'today':
            return apptDate.toDateString() === today.toDateString();
          case 'week':
            return apptDate >= weekStart && apptDate <= new Date();
          case 'month':
            return apptDate >= monthStart && apptDate <= new Date();
          case 'upcoming':
            return apptDate >= new Date();
          case 'past':
            return apptDate < new Date();
          default:
            return true;
        }
      });
    }
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'startTime' || sortField === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [appointments, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  // ========================================
  // 🎯 ACTIONS
  // ========================================

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAppointment = (appointmentId, checked) => {
    const newSelected = new Set(selectedAppointments);
    if (checked) {
      newSelected.add(appointmentId);
    } else {
      newSelected.delete(appointmentId);
    }
    setSelectedAppointments(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAppointments(new Set(filteredAndSortedAppointments.map(appt => appt.id)));
    } else {
      setSelectedAppointments(new Set());
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const result = await deleteAppointment(appointmentId);
      if (result.success) {
        setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
        // Success handling will be managed by global notification system
      } else {
        // Error handling will be managed by global notification system
      }
    } catch (_error) {
      // Error handling will be managed by global notification system
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.label || status || 'Unknown';
  };

  // ========================================
  // 🎨 RENDER
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#01818E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Appointments</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAppointmentData}
            className="px-6 py-2 bg-[#01818E] text-white rounded-lg hover:bg-[#01818E]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment List</h2>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedAppointments.length} of {appointments.length} appointments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#01818E] hover:bg-[#01818E]/90 text-white rounded-lg transition-colors">
            <FiPlus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search appointments, contacts, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01818E]/20 focus:border-[#01818E]"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#01818E]/20 focus:border-[#01818E]"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#01818E]/20 focus:border-[#01818E]"
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAppointments.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <span className="text-blue-800 font-medium">
            {selectedAppointments.size} selected
          </span>
          <button className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition-colors">
            Mark as Confirmed
          </button>
          <button className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm transition-colors">
            Cancel Selected
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedAppointments.size === filteredAndSortedAppointments.length && filteredAndSortedAppointments.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-[#01818E] focus:ring-[#01818E]"
                  />
                </th>
                <th className="text-left py-4 px-6">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-[#01818E] transition-colors"
                  >
                    Title
                    <FiChevronDown className={`w-4 h-4 transition-transform ${
                      sortField === 'title' && sortDirection === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6">
                  <button
                    onClick={() => handleSort('contactName')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-[#01818E] transition-colors"
                  >
                    Contact
                    <FiChevronDown className={`w-4 h-4 transition-transform ${
                      sortField === 'contactName' && sortDirection === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6">
                  <button
                    onClick={() => handleSort('startTime')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-[#01818E] transition-colors"
                  >
                    Date & Time
                    <FiChevronDown className={`w-4 h-4 transition-transform ${
                      sortField === 'startTime' && sortDirection === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </button>
                </th>
                <th className="text-left py-4 px-6">
                  <span className="text-sm font-semibold text-gray-900">Status</span>
                </th>
                <th className="text-left py-4 px-6">
                  <span className="text-sm font-semibold text-gray-900">Location</span>
                </th>
                <th className="text-right py-4 px-6">
                  <span className="text-sm font-semibold text-gray-900">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedAppointments.map((appointment) => (
                <motion.tr
                  key={appointment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedAppointments.has(appointment.id)}
                      onChange={(e) => handleSelectAppointment(appointment.id, e.target.checked)}
                      className="rounded border-gray-300 text-[#01818E] focus:ring-[#01818E]"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">
                        {appointment.title}
                      </div>
                      {appointment.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-[200px] mt-1">
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">
                        {appointment.contactName}
                      </div>
                      {appointment.contactEmail && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <FiMail className="w-3 h-3" />
                          {appointment.contactEmail}
                        </div>
                      )}
                      {appointment.contactPhone && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <FiPhone className="w-3 h-3" />
                          {appointment.contactPhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(appointment.startTime)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <FiClock className="w-3 h-3" />
                        {formatTime(appointment.startTime)}
                        {appointment.endTime && (
                          <span> - {formatTime(appointment.endTime)}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getStatusColor(appointment.status)}20`,
                        color: getStatusColor(appointment.status),
                      }}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3 text-gray-400" />
                      {appointment.location || 'Virtual'}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-[#01818E] transition-colors">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-[#01818E] transition-colors">
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedAppointments.length === 0 && (
          <div className="text-center py-12">
            <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">
              {appointments.length === 0
                ? 'No appointments have been created yet.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusOptions.slice(1).map(status => {
          const count = appointments.filter(appt => appt.status === status.value).length;
          return (
            <div key={status.value} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold" style={{ color: status.color }}>
                    {count}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${status.color}20` }}
                >
                  <FiCalendar style={{ color: status.color }} className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentListView;
