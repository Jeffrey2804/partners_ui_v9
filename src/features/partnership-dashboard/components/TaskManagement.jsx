// ========================================
// 🎯 TASK MANAGEMENT COMPONENT (JS)
// ========================================

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  AlertTriangle,
  Clock,
  CheckSquare,
  Users,
  Phone,
  FileText,
  Mail,
  User as UserIcon,
  Check,
  Target,
  TrendingUp,
} from 'lucide-react';
import TaskModal from './modals/TaskModal';

// --- Helpers / Constants ---
const TYPE_ICONS = {
  phone: Phone,
  document: FileText,
  email: Mail,
  person: UserIcon,
};

const PRIORITY_CLASSES = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_CLASSES = {
  overdue: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

const formatDate = (d) => new Date(d).toLocaleDateString();

const TaskManagement = () => {
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Follow up with Sarah Johnson',
      client: 'Sarah Johnson',
      loan: 'LN-2024-001',
      type: 'phone',
      priority: 'high',
      status: 'overdue',
      dueDate: '2024-01-14',
      completed: false,
      assignedTo: 'john-doe',
      description: 'Follow up on loan application status',
      tags: ['urgent', 'follow-up'],
    },
    {
      id: 2,
      title: 'Review Mike Chen application',
      client: 'Mike Chen',
      loan: 'LN-2024-002',
      type: 'document',
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-01-15',
      completed: false,
      assignedTo: 'jane-smith',
      description: 'Review application documents for completeness',
      tags: ['review'],
    },
    {
      id: 3,
      title: 'Send welcome email to Lisa Wong',
      client: 'Lisa Wong',
      loan: 'LN-2024-003',
      type: 'email',
      priority: 'low',
      status: 'pending',
      dueDate: '2024-01-16',
      completed: false,
      assignedTo: 'mike-johnson',
      description: 'Send welcome email and next steps',
      tags: ['welcome', 'email'],
    },
    {
      id: 4,
      title: 'Schedule David Smith closing',
      client: 'David Smith',
      loan: 'LN-2024-004',
      type: 'person',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-01-17',
      completed: false,
      assignedTo: 'sarah-wilson',
      description: 'Schedule closing meeting and prepare documents',
      tags: ['closing', 'meeting'],
    },
    {
      id: 5,
      title: 'Update Jennifer Davis file',
      client: 'Jennifer Davis',
      loan: 'LN-2024-005',
      type: 'document',
      priority: 'medium',
      status: 'completed',
      dueDate: '2024-01-18',
      completed: true,
      assignedTo: 'john-doe',
      description: 'Update client file with new documentation',
      tags: ['update', 'documentation'],
    },
  ]);

  // Memoized stats to avoid rework on every render
  const taskStats = useMemo(() => {
    const overdue = tasks.filter((t) => t.status === 'overdue').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const completed = tasks.filter((t) => t.completed).length;
    const total = tasks.length;

    return [
      { label: 'Overdue Tasks', count: overdue, icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' },
      { label: 'Pending Tasks', count: pending, icon: Clock, color: 'text-[#01818E]', bgColor: 'bg-teal-50' },
      { label: 'Completed', count: completed, icon: CheckSquare, color: 'text-green-500', bgColor: 'bg-green-50' },
      { label: 'Total Tasks', count: total, icon: Users, color: 'text-[#01818E]', bgColor: 'bg-teal-50' },
    ];
  }, [tasks]);

  const completionPct = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    return tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  }, [tasks]);

  // Filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch = statusFilter === 'All Status' || task.status === statusFilter.toLowerCase();
      const priorityMatch = priorityFilter === 'All Priority' || task.priority === priorityFilter.toLowerCase();
      const typeMatch = typeFilter === 'All Types' || task.type === typeFilter.toLowerCase();
      return statusMatch && priorityMatch && typeMatch;
    });
  }, [tasks, statusFilter, priorityFilter, typeFilter]);

  // Handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData) => {
    setTasks((prev) => {
      if (editingTask) {
        return prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...taskData,
                id: editingTask.id,
                completed: !!taskData.completed,
                status: taskData.completed ? 'completed' : taskData.status || t.status || 'pending',
              }
            : t,
        );
      }
      const newId = Date.now();
      const completed = !!taskData.completed;
      return [
        ...prev,
        {
          ...taskData,
          id: newId,
          completed,
          status: completed ? 'completed' : taskData.status || 'pending',
        },
      ];
    });
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleToggleComplete = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              status: !task.completed ? 'completed' : 'pending',
            }
          : task,
      ),
    );
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Task Management</h1>
              <p className="text-xs text-slate-500">Monitor team task completion and productivity</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  {tasks.length} total tasks
                </div>
                <div className="text-xs text-slate-400">Updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
            aria-label="Create new task"
          >
            <Plus className="h-4 w-4" />
            New Task
          </motion.button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {taskStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon size={14} className={stat.color} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{stat.count}</div>
                  <div className="text-xs text-slate-600">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200/60">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs border border-teal-200">
            <div className="w-1 h-1 bg-teal-500 rounded-full" />
            Live updates
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            aria-label="Filter by status"
          >
            <option value="All Status">All Status</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            aria-label="Filter by priority"
          >
            <option value="All Priority">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            aria-label="Filter by type"
          >
            <option value="All Types">All Types</option>
            <option value="phone">Phone</option>
            <option value="document">Document</option>
            <option value="email">Email</option>
            <option value="person">Person</option>
          </select>
        </div>
      </div>

      {/* Task List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        <AnimatePresence>
          {filteredTasks.map((task, index) => {
            const TypeIcon = TYPE_ICONS[task.type] || FileText;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="group bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => handleEditTask(task)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleEditTask(task)}
              >
                <div className="flex items-center gap-3">
                  {/* Completion Checkbox */}
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-teal-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task.id);
                      }}
                    >
                      {task.completed && <Check size={12} className="text-white" />}
                    </button>
                  </div>

                  {/* Task Type Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                      <TypeIcon size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Client: {task.client} • Loan: {task.loan}
                    </p>
                    <div className="text-xs text-slate-500 mt-1">Due: {formatDate(task.dueDate)}</div>
                  </div>

                  {/* Priority & Status Badges */}
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                        PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.medium
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${
                        STATUS_CLASSES[task.status] || STATUS_CLASSES.pending
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-200"
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(task.id);
                      }}
                    >
                      <Target className="h-3 w-3" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-slate-400 text-sm mb-2">No tasks found</div>
            <div className="text-slate-500 text-xs">Try adjusting your filters or create a new task.</div>
          </div>
        )}
      </div>

      {/* Task Summary Footer */}
      <div className="p-3 border-t border-slate-200/60 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {completionPct}% Complete
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md"
            >
              View All Tasks
            </motion.button>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
      />
    </div>
  );
};

export default TaskManagement;
