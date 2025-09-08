import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Filter,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Phone,
  FileText,
  Mail,
  User,
  Upload,
  Eye,
  Search,
  Calendar,
  TrendingUp,
  Download,
  Star,
  MoreHorizontal,
  Archive,
  Send,
} from 'lucide-react';

import Modal from '@shared/components/ui/Modal';

// ------------------------------------------------------------
// 🎯 LOA Unified Task Manager (Professional • Modern • Beautiful)
// - Premium design with glassmorphism effects
// - Advanced statistics and data visualization
// - Interactive elements with smooth animations
// - Professional color palette and typography
// - Enhanced user experience with micro-interactions
// ------------------------------------------------------------

const badgeVariations = {
  gray: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200/50 shadow-sm',
  red: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200/50 shadow-sm',
  blue: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200/50 shadow-sm',
  green: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200/50 shadow-sm',
  yellow: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200/50 shadow-sm',
  purple: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200/50 shadow-sm',
  teal: 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border border-teal-200/50 shadow-sm',
};

function Badge({ tone = 'gray', children, size = 'sm' }) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`${sizeClasses} font-medium rounded-full backdrop-blur-sm ${badgeVariations[tone] || badgeVariations.gray}`}
    >
      {children}
    </motion.span>
  );
}

function PrimaryButton({ icon: Icon, children, onClick, variant = 'primary' }) {
  const variants = {
    primary: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm hover:shadow-md',
    ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${variants[variant]}`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </motion.button>
  );
}

function StatCard({ label, value, icon: Icon, color = 'teal' }) {
  const colorVariants = {
    teal: 'from-teal-500 to-cyan-500',
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-pink-500',
    yellow: 'from-amber-500 to-orange-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-xl bg-white p-4 shadow-sm border border-gray-100/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorVariants[color]} shadow-sm`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SearchBar({ placeholder, value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm pl-10 pr-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2.5 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
    >
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

// ----------------------- TASKS -----------------------
function TaskManagement({ tasks = [], onCreate, onOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'All', priority: 'All', type: 'All' });

  const counts = useMemo(() => ({
    overdue: tasks.filter(t => t.status === 'overdue').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length,
  }), [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.loanNumber.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filters.status !== 'All' && t.status !== filters.status.toLowerCase()) return false;
      if (filters.priority !== 'All' && t.priority !== filters.priority.toLowerCase()) return false;
      if (filters.type !== 'All' && t.type !== filters.type.toLowerCase()) return false;
      return true;
    });
  }, [tasks, filters, searchQuery]);

  const taskIcon = (type) => {
    const iconProps = 'h-5 w-5';
    switch (type) {
      case 'call': return <Phone className={`${iconProps} text-blue-600`} />;
      case 'document': return <FileText className={`${iconProps} text-purple-600`} />;
      case 'email': return <Mail className={`${iconProps} text-green-600`} />;
      case 'meeting': return <User className={`${iconProps} text-orange-600`} />;
      default: return <FileText className={`${iconProps} text-gray-600`} />;
    }
  };

  const priorityTone = (p) => {
    switch (p) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const statusTone = (s) => {
    switch (s) {
      case 'overdue': return 'red';
      case 'pending': return 'blue';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Overdue"
          value={counts.overdue}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          color="blue"
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Total"
          value={counts.total}
          icon={Users}
          color="teal"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 max-w-md">
            <SearchBar
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <FilterSelect
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                options={['All', 'Pending', 'Completed', 'Overdue']}
              />
              <FilterSelect
                value={filters.priority}
                onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                options={['All', 'High', 'Medium', 'Low']}
              />
              <FilterSelect
                value={filters.type}
                onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                options={['All', 'Call', 'Document', 'Email', 'Meeting']}
              />
            </div>
            <PrimaryButton icon={Plus} onClick={onCreate}>
              New Task
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden max-h-[400px] flex flex-col">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {filtered.length} {filtered.length === 1 ? 'Task' : 'Tasks'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Updated 2 min ago</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            <div className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    className="group p-3 cursor-pointer transition-all duration-200"
                    onClick={() => onOpen(task)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        readOnly
                        className="h-4 w-4 rounded border-2 border-gray-300 text-teal-600 focus:ring-teal-500"
                      />

                      {/* Task Icon */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-teal-50 group-hover:to-cyan-50 transition-all duration-200">
                        {taskIcon(task.type)}
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                              {task.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {task.client} • {task.loanNumber}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge tone={priorityTone(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge tone={statusTone(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Due Date & Actions */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{task.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              >
                                <Star className="h-3 w-3" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-xs text-gray-500 mb-3 max-w-sm">
                    {searchQuery || filters.status !== 'All' || filters.priority !== 'All' || filters.type !== 'All'
                      ? 'Try adjusting your search or filters.'
                      : 'Get started by creating your first task.'
                    }
                  </p>
                  <PrimaryButton icon={Plus} onClick={onCreate}>
                    Create Task
                  </PrimaryButton>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ----------------------- DOCUMENTS -----------------------
function DocumentManagement({ documents = [], onUpload }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'All', type: 'All', sort: 'Due Date' });

  const counts = useMemo(() => ({
    pending: documents.filter(d => d.status === 'pending').length,
    received: documents.filter(d => d.status === 'received').length,
    reviewed: documents.filter(d => d.status === 'reviewed').length,
    expired: documents.filter(d => d.status === 'expired').length,
  }), [documents]);

  const filtered = useMemo(() => {
    let list = documents.filter(d => {
      const matchesSearch = d.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           d.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           d.loanNumber.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filters.status !== 'All' && d.status !== filters.status.toLowerCase()) return false;
      if (filters.type !== 'All' && d.type !== filters.type) return false;
      return true;
    });

    if (filters.sort === 'Due Date') {
      list = [...list].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    if (filters.sort === 'Upload Date' && documents.some(d => d.uploadInfo)) {
      const getUpload = (s = '') => {
        const m = s.match(/Uploaded:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        return m ? new Date(m[1]) : new Date(0);
      };
      list = [...list].sort((a, b) => getUpload(a.uploadInfo) - getUpload(b.uploadInfo));
    }
    return list;
  }, [documents, filters, searchQuery]);

  const statusTone = (s) => {
    switch (s) {
      case 'expired': return 'red';
      case 'reviewed': return 'green';
      case 'received': return 'blue';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const statusIcon = (s) => {
    const iconProps = 'h-5 w-5';
    switch (s) {
      case 'expired': return <AlertTriangle className={`${iconProps} text-red-500`} />;
      case 'reviewed': return <CheckCircle className={`${iconProps} text-green-500`} />;
      case 'received': return <Upload className={`${iconProps} text-blue-500`} />;
      case 'pending': return <Clock className={`${iconProps} text-amber-500`} />;
      default: return <FileText className={`${iconProps} text-gray-400`} />;
    }
  };

  const getDocumentIcon = (type) => {
    const iconProps = 'h-5 w-5';
    switch (type.toLowerCase()) {
      case 'employment letter': return <User className={`${iconProps} text-blue-600`} />;
      case 'property appraisal': return <FileText className={`${iconProps} text-green-600`} />;
      case 'bank statements': return <Download className={`${iconProps} text-purple-600`} />;
      case 'tax returns': return <Archive className={`${iconProps} text-orange-600`} />;
      case 'income verification': return <TrendingUp className={`${iconProps} text-teal-600`} />;
      default: return <FileText className={`${iconProps} text-gray-600`} />;
    }
  };

  const getActionButton = (doc) => {
    const variants = {
      'resubmit': { text: 'Resubmit', variant: 'secondary', icon: Send },
      'view': { text: 'View', variant: 'ghost', icon: Eye },
      'review': { text: 'Review', variant: 'primary', icon: CheckCircle },
      'request': { text: 'Request', variant: 'secondary', icon: Mail },
    };

    const config = variants[doc.action] || { text: 'Open', variant: 'ghost', icon: Eye };

    return (
      <PrimaryButton
        icon={config.icon}
        variant={config.variant}
        onClick={() => { /* implement action */ }}
      >
        {config.text}
      </PrimaryButton>
    );
  };

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          label="Received"
          value={counts.received}
          icon={Upload}
          color="blue"
        />
        <StatCard
          label="Reviewed"
          value={counts.reviewed}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Expired"
          value={counts.expired}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <PrimaryButton icon={Upload} onClick={onUpload}>
              Upload
            </PrimaryButton>
            <div className="flex-1 max-w-md">
              <SearchBar
                placeholder="Search documents..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <FilterSelect
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              options={['All', 'Pending', 'Received', 'Reviewed', 'Expired']}
            />
            <FilterSelect
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              options={['All', 'Employment Letter', 'Property Appraisal', 'Bank Statements', 'Tax Returns', 'Income Verification']}
            />
            <FilterSelect
              value={filters.sort}
              onChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}
              options={['Due Date', 'Upload Date']}
            />
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden max-h-[400px] flex flex-col">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {filtered.length} {filtered.length === 1 ? 'Document' : 'Documents'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Updated 5 min ago</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            <div className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    className="group p-3 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Status Icon */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-teal-50 group-hover:to-cyan-50 transition-all duration-200">
                        {statusIcon(doc.status)}
                      </div>

                      {/* Document Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getDocumentIcon(doc.type)}
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                                {doc.type}
                              </h4>
                            </div>

                            <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                              {doc.client} • {doc.loanNumber}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{doc.dueDate}</span>
                              </div>
                              {doc.fileSize && (
                                <div className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  <span>{doc.fileSize}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge tone={statusTone(doc.status)}>
                                {doc.status}
                              </Badge>
                              {doc.overdue && (
                                <Badge tone="red">Overdue</Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-2">
                            {getActionButton(doc)}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              >
                                <Star className="h-3 w-3" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-xs text-gray-500 mb-3 max-w-sm">
                    {searchQuery || filters.status !== 'All' || filters.type !== 'All'
                      ? 'Try adjusting your search or filters.'
                      : 'Get started by uploading your first document.'
                    }
                  </p>
                  <PrimaryButton icon={Upload} onClick={onUpload}>
                    Upload Document
                  </PrimaryButton>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ----------------------- WRAPPER -----------------------
export default function LOAUnifiedTaskManager() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'documents'
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Sample data (replace with real data wiring)
  const tasks = [
    { id: 1, title: 'Follow up with Sarah Johnson', client: 'Sarah Johnson', loanNumber: 'LN-2024-001', type: 'call', priority: 'high', status: 'overdue', dueDate: '1/14/2024', completed: false },
    { id: 2, title: 'Review Mike Chen application', client: 'Mike Chen', loanNumber: 'LN-2024-002', type: 'document', priority: 'medium', status: 'pending', dueDate: '1/15/2024', completed: false },
    { id: 3, title: 'Send welcome email to Lisa Wong', client: 'Lisa Wong', loanNumber: 'LN-2024-003', type: 'email', priority: 'low', status: 'pending', dueDate: '1/16/2024', completed: false },
    { id: 4, title: 'Schedule David Smith closing', client: 'David Smith', loanNumber: 'LN-2024-004', type: 'meeting', priority: 'high', status: 'pending', dueDate: '1/17/2024', completed: false },
    { id: 5, title: 'Update Jennifer Davis file', client: 'Jennifer Davis', loanNumber: 'LN-2024-005', type: 'document', priority: 'medium', status: 'completed', dueDate: '1/18/2024', completed: true },
  ];

  const documents = [
    { id: 1, type: 'Employment Letter', client: 'David Smith', loanNumber: 'LN-2024-004', status: 'expired', dueDate: '1/9/2024', action: 'resubmit' },
    { id: 2, type: 'Property Appraisal', client: 'Lisa Wong', loanNumber: 'LN-2024-003', status: 'reviewed', dueDate: '1/14/2024', fileSize: '1.8 MB', uploadInfo: 'Uploaded: 1/11/2024 • Reviewed by: Sarah Wilson', action: 'view' },
    { id: 3, type: 'Bank Statements', client: 'Mike Chen', loanNumber: 'LN-2024-002', status: 'received', dueDate: '1/17/2024', fileSize: '2.4 MB', uploadInfo: 'Uploaded: 1/13/2024 • Reviewed by: John Smith', action: 'review' },
    { id: 4, type: 'Tax Returns', client: 'Jennifer Davis', loanNumber: 'LN-2024-005', status: 'received', dueDate: '1/18/2024', fileSize: '3.1 MB', uploadInfo: 'Uploaded: 1/12/2024', action: 'review' },
    { id: 5, type: 'Income Verification', client: 'Sarah Johnson', loanNumber: 'LN-2024-001', status: 'pending', dueDate: '1/19/2024', overdue: true, action: 'request' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Main Header with Tab Navigation */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-white">
            <h1 className="text-lg font-bold">LOA Management Center</h1>
            <p className="text-xs text-teal-100">Unified tasks and documents for loan processing</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg p-1">
            {[
              { key: 'tasks', label: 'Task Management', icon: CheckCircle },
              { key: 'documents', label: 'Document Management', icon: FileText },
            ].map(tab => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.key === 'tasks' ? 'Tasks' : 'Documents'}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {activeTab === 'tasks' ? (
              <TaskManagement
                tasks={tasks}
                onCreate={() => { setSelectedTask(null); setModalOpen(true); }}
                onOpen={(task) => { setSelectedTask(task); setModalOpen(true); }}
              />
            ) : (
              <DocumentManagement
                documents={documents}
                onUpload={() => { /* wire up uploader */ }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal (Create/Edit Task) */}
      <Modal
        isOpen={modalOpen}
        task={selectedTask}
        onClose={() => { setModalOpen(false); setSelectedTask(null); }}
        mode={selectedTask ? 'edit' : 'create'}
      />
    </div>
  );
}
