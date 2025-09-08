// ========================================
// 🎯 TASK MANAGEMENT DASHBOARD — CLEAN JS VERSION
// ========================================

import React, { useMemo, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskContext } from '@context/TaskContext';
import Modal from '@shared/components/ui/Modal';
import { StatCard, SectionHeader, SearchInput } from '@shared/components/ui';
import { useCrudNotifications } from '../../../utils/crudNotificationsClean';
import {
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiUser,
  FiEdit3,
  FiTrash2,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

// ===== Constants & helpers
const STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  IN_PROGRESS: 'in progress',
  CANCELLED: 'cancelled',
};

const FILTER_OPTIONS = {
  status: ['All Status', 'Pending', 'Completed', 'Overdue', 'Cancelled'],
  priority: ['All Priority', 'High', 'Medium', 'Low'],
  type: ['All Types', 'Sales', 'Communication', 'General'],
};

const toLower = (v) => (typeof v === 'string' ? v.toLowerCase() : '');
const priorityRank = (p) => ({ high: 0, medium: 1, low: 2 }[toLower(p)] ?? 3);
const shortId = (v, n = 24) => (v ? String(v).slice(0, n) : '—');

const parseDateSafe = (t) => {
  const raw = t?.dueDate ?? t?.date;
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(+d) ? null : d;
};
const formatDate = (date) => (date ? date.toLocaleDateString() : 'No due date');

const getStatus = (t) => {
  const cat = toLower(t.statusCategory);
  const s = toLower(t.status);
  if (cat === 'success' || s === 'completed' || t?.completed) return STATUS.COMPLETED;
  if (cat === 'warning' || s === 'in progress') return STATUS.IN_PROGRESS;
  if (cat === 'error' || s === 'overdue') return STATUS.OVERDUE;
  if (cat === 'neutral' || s === 'cancelled') return STATUS.CANCELLED;
  return STATUS.PENDING;
};

// ===== Assignee extraction (robust + email fallback)
const fpEmail = (email) =>
  (typeof email === 'string' && email.includes('@')) ? email.split('@')[0] : '';

const getAssigneeEmail = (t) =>
  (t?.assigneeEmail ||
    t?.assignee?.email ||
    t?.assignedToEmail ||
    t?.owner?.email ||
    t?.user?.email ||
    '').toString().trim();

const getAssigneeName = (t) => {
  const direct =
    t?.assigneeName ||
    t?.assignedToName ||
    t?.ownerName ||
    t?.assignee?.displayName ||
    t?.assignee?.fullName ||
    (t?.assignee?.firstName || t?.assigneeFirstName
      ? `${t?.assignee?.firstName || t?.assigneeFirstName} ${t?.assignee?.lastName || t?.assigneeLastName || ''}`
      : '') ||
    t?.assignee?.name ||
    t?.user?.fullName ||
    t?.user?.name ||
    '';
  const emailPart = fpEmail(getAssigneeEmail(t));
  return (direct || emailPart).toString().trim();
};

const getAssigneeId = (t) =>
  (t?.assigneeId ||
    t?.assignee?.id ||
    t?.assignee?.userId ||
    t?.assignee?.uid ||
    t?.ownerId ||
    t?.assignedToId ||
    '').toString();

const getContactId = (t) =>
  (t?.contactId || t?.contact?.id || t?.contact?.crmId || '').toString();

const normalizeTask = (t) => {
  const dueAt = parseDateSafe(t);
  const statusNormalized = getStatus(t);
  const isCompleted = !!t?.completed || statusNormalized === STATUS.COMPLETED;

  const assigneeEmail = getAssigneeEmail(t);
  const assigneeName = getAssigneeName(t);
  const assigneeDisplay = (assigneeEmail || assigneeName || '').trim() || 'Unassigned';

  return {
    ...t,
    title: t?.title?.trim() || 'Untitled',
    description: t?.description?.trim() || '',
    contactName: t?.contactName?.trim() || '',
    contactId: getContactId(t),

    assigneeName,
    assigneeEmail,
    assigneeDisplay,
    assigneeId: getAssigneeId(t),

    id: t?.id || t?._id || String(Math.random()),
    _id: t?._id || t?.id,
    dueAt,
    statusNormalized,
    isCompleted,
  };
};

const getStatusLabel = (t) => t.statusNormalized.replace(/^./, (c) => c.toUpperCase());

const badgeClass = {
  priority: (p) =>
    ({
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      low: 'bg-green-50 text-green-700 border-green-200',
    }[toLower(p)] || 'bg-gray-50 text-gray-700 border-gray-200'),
  status: (t) =>
    ({
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-blue-50 text-blue-700 border-blue-200',
      overdue: 'bg-red-50 text-red-700 border-red-200',
      'in progress': 'bg-orange-50 text-orange-700 border-orange-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
    }[t.statusNormalized]),
};

const StatusIcon = ({ status }) =>
  status === STATUS.COMPLETED ? (
    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
  ) : (
    <FiClock className={`w-3.5 h-3.5 ${status === STATUS.PENDING ? 'text-blue-500' : 'text-gray-500'}`} />
  );
StatusIcon.propTypes = { status: PropTypes.string.isRequired };

// ===== Small meta block (name on top, id under)
const MetaItem = ({ icon, primary, secondary, primaryClass }) => (
  <div className="flex items-start gap-2">
    {icon}
    <div className="min-w-0">
      <div className={`text-[13px] leading-tight truncate ${primaryClass}`}>{primary || '—'}</div>
      {secondary ? (
        <div className="text-[11px] leading-none text-gray-500 font-mono truncate">
          {shortId(secondary, 28)}
        </div>
      ) : null}
    </div>
  </div>
);
MetaItem.propTypes = {
  icon: PropTypes.node,
  primary: PropTypes.any,
  secondary: PropTypes.any,
  primaryClass: PropTypes.string,
};

// ===== Reusable UI
const FilterSelect = React.memo(function FilterSelect({ value, onChange, options, label }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#01818E]/10 focus:border-[#01818E] bg-white"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
});
FilterSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  label: PropTypes.string,
};

const Pagination = React.memo(function Pagination({ current, total, onPrev, onNext, onJump }) {
  const pages = useMemo(() => {
    const max = 5;
    const start = Math.max(1, Math.min(current - 2, total - (max - 1)));
    const end = Math.min(total, start + (max - 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [current, total]);

  if (total <= 1) return null;

  return (
    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-xl text-[13px]">
      <span className="text-gray-600">Page {current} of {total}</span>
      <div className="flex gap-1.5">
        <button onClick={onPrev} disabled={current === 1} className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50">
          <FiChevronLeft className="inline mr-1" />
          Prev
        </button>
        {pages.map((n) => (
          <button
            key={n}
            onClick={() => onJump(n)}
            className={`px-2.5 py-1.5 text-sm rounded-lg ${current === n ? 'bg-[#01818E] text-white' : 'bg-white border'}`}
          >
            {n}
          </button>
        ))}
        <button onClick={onNext} disabled={current === total} className="px-3 py-1.5 text-sm bg-white border rounded-lg disabled:opacity-50">
          Next
          <FiChevronRight className="inline ml-1" />
        </button>
      </div>
    </div>
  );
});
Pagination.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onJump: PropTypes.func.isRequired,
};

// ===== Task row (matches screenshot)
const TaskRow = React.memo(function TaskRow({ t, i, onToggle, onEdit, onDelete, isLoading }) {
  return (
    <motion.div
      key={t.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ delay: i * 0.035 }}
      className="px-4 py-3 border-b last:border-0 hover:bg-gray-50/70"
    >
      <div className="flex gap-3">
        <div className="relative flex items-center">
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-[#01818E] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <input
              type="checkbox"
              checked={t.isCompleted}
              onChange={() => onToggle(t)}
              aria-label={`Toggle ${t.title}`}
              className="h-4 w-4 text-[#01818E] rounded-md focus:ring-[#01818E]"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2">
            <div className="min-w-0">
              <h4 className={`font-semibold truncate text-[15px] ${t.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>{t.title}</h4>
              {t.description && (
                <p className={`text-[12px] truncate ${t.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>{t.description}</p>
              )}
            </div>
            <div className="flex gap-1.5 text-gray-500 shrink-0">
              <button onClick={() => onEdit(t)} title="Edit" className="p-1.5 hover:text-gray-700">
                <FiEdit3 className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(t)} title="Delete" className="p-1.5 hover:text-red-600">
                <FiTrash2 className="w-4 h-4" />
              </button>
              <button title="More" className="p-1.5 hover:text-gray-700">
                <FiMoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HORIZONTAL details: Contact | Assignee | Task ID | Due */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
            <MetaItem
              icon={<FiUser className="mt-0.5 w-4 h-4 text-blue-600" />}
              primary={t.contactName}
              secondary={t.contactId}
              primaryClass="text-blue-700"
            />
            <MetaItem
              icon={<FiUser className="mt-0.5 w-4 h-4 text-purple-600" />}
              primary={t.assigneeDisplay}
              secondary={t.assigneeId}
              primaryClass="text-purple-700"
            />
            <MetaItem
              icon={<FiCalendar className="mt-0.5 w-4 h-4 text-emerald-600" />}
              primary={shortId(t.id)}
              secondary={null}
              primaryClass="text-emerald-700"
            />
            <div className="flex items-start gap-2">
              <FiClock className="mt-0.5 w-4 h-4 text-blue-600" />
              <div className="text-[13px] leading-tight text-orange-700">{formatDate(t.dueAt)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${badgeClass.priority(t.priority)}`}>
              {t.priority || '—'}
            </span>
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${badgeClass.status(t)}`}>
              {getStatusLabel(t)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
TaskRow.propTypes = {
  t: PropTypes.shape({
    id: PropTypes.any,
    title: PropTypes.string,
    description: PropTypes.string,
    contactName: PropTypes.string,
    contactId: PropTypes.any,
    assigneeName: PropTypes.string,
    assigneeEmail: PropTypes.string,
    assigneeDisplay: PropTypes.string,
    assigneeId: PropTypes.any,
    priority: PropTypes.string,
    statusNormalized: PropTypes.string,
    isCompleted: PropTypes.bool,
    dueAt: PropTypes.instanceOf(Date),
  }).isRequired,
  i: PropTypes.number.isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

// ===== Main component
const PAGE_SIZE = 10;

const TaskManagementDashboard = () => {
  const { tasksByCategory, completeTask, deleteTask } = useContext(TaskContext);
  const crudNotifications = useCrudNotifications();

  const rawTasks = useMemo(
    () => (tasksByCategory?.['All Tasks']?.items || []).map(normalizeTask),
    [tasksByCategory],
  );

  // Dedupe by id/_id or fallback (title|contact|assignee|yyyy-mm-dd)
  const allTasks = useMemo(() => {
    const map = new Map();
    const score = (x) =>
      (x.isCompleted ? 1000 : 0) +
      (x.priority ? (10 - priorityRank(x.priority)) * 10 : 0) +
      (x.dueAt ? x.dueAt.getTime() / 1e8 : 0);

    for (const t of rawTasks) {
      const dateIso = t.dueAt ? t.dueAt.toISOString().slice(0, 10) : '';
      const fallbackKey = `${toLower(t.title)}|${toLower(t.contactName)}|${toLower(t.assigneeDisplay)}|${dateIso}`;
      const key = t._id || t.id || fallbackKey;
      const prev = map.get(key);
      if (!prev || score(t) >= score(prev)) map.set(key, t);
    }
    return Array.from(map.values());
  }, [rawTasks]);

  // Stats
  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.isCompleted).length;
    const now = new Date();
    const overdue = allTasks.filter((t) => t.dueAt && t.dueAt < now && !t.isCompleted).length;
    return { total, completed, overdue, pending: Math.max(total - completed - overdue, 0) };
  }, [allTasks]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = toLower(searchQuery);
    const typeVal = toLower(typeFilter);

    return allTasks
      .filter((t) => {
        const fields = [t.title, t.description, t.contactName, t.assigneeDisplay, t.contactId, t.assigneeId]
          .filter(Boolean)
          .map(String);
        const matchesText = !q || fields.some((f) => f.toLowerCase().includes(q));
        const matchesStatus =
          statusFilter === 'All Status' || getStatusLabel(t).toLowerCase() === toLower(statusFilter);
        const matchesPriority =
          priorityFilter === 'All Priority' || toLower(t.priority) === toLower(priorityFilter);
        const matchesType = typeFilter === 'All Types' || [toLower(t.category), toLower(t.type)].includes(typeVal);
        return matchesText && matchesStatus && matchesPriority && matchesType;
      })
      .sort((a, b) => {
        if (a.dueAt && b.dueAt) {
          const diff = a.dueAt.getTime() - b.dueAt.getTime();
          if (diff !== 0) return diff;
        } else if (a.dueAt || b.dueAt) {
          return a.dueAt ? -1 : 1;
        }
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        return a.title.localeCompare(b.title);
      });
  }, [allTasks, searchQuery, statusFilter, priorityFilter, typeFilter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentTasks = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );
  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter, priorityFilter, typeFilter]);

  // Actions
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(new Set());

  const handleEdit = useCallback((t) => {
    setSelectedTask(t);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (t) => {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(`Delete ${t.title}?`);
      if (confirmed) {
        await crudNotifications.tasks.delete(deleteTask, t.id, t.title);
      }
    },
    [deleteTask, crudNotifications],
  );

  const handleToggle = useCallback(
    async (t) => {
      if (loadingTasks.has(t.id)) return; // Prevent multiple clicks

      setLoadingTasks(prev => new Set(prev).add(t.id));
      try {
        await crudNotifications.tasks.complete(completeTask, t.id, t.title);
      } finally {
        setLoadingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(t.id);
          return newSet;
        });
      }
    },
    [completeTask, loadingTasks, crudNotifications],
  );

  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(() => setCurrentPage((p) => Math.min(pageCount, p + 1)), [pageCount]);
  const jumpTo = useCallback((n) => setCurrentPage(n), []);

  return (
    <div className="w-full bg-gray-50">
      <SectionHeader
        title="Task Management"
        description="Organize and track activities"
        buttonText="Create Task"
        onButtonClick={() => setModalOpen(true)}
      >
        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 min-w-[220px]"
          />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={FILTER_OPTIONS.status} label="Status" />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={FILTER_OPTIONS.priority} label="Priority" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={FILTER_OPTIONS.type} label="Type" />
        </div>
      </SectionHeader>

      <div className="px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {['overdue', 'pending', 'completed', 'total'].map((k, i) => (
            <StatCard key={k} type={k} title={k[0].toUpperCase() + k.slice(1)} value={stats[k]} delay={i * 0.1} />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {currentTasks.map((t, i) => (
                <TaskRow
                  key={t.id}
                  t={t}
                  i={i}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isLoading={loadingTasks.has(t.id)}
                />
              ))}
            </AnimatePresence>
            {!currentTasks.length && <div className="p-10 text-center text-gray-500">No tasks found</div>}
          </div>
          <Pagination current={currentPage} total={pageCount} onPrev={goPrev} onNext={goNext} onJump={jumpTo} />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} task={selectedTask} mode={selectedTask ? 'edit' : 'create'} />
    </div>
  );
};

export default TaskManagementDashboard;
