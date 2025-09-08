// ========================================
// 🎯 Partnership Dashboard KANBAN COLUMN COMPONENT
// ========================================

import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { FiPlus, FiUsers, FiClock, FiTrendingUp, FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import PartnerKanbanCard from './PartnerKanbanCard';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const noop = () => {};
const bytesMB = (b) => +(b / (1024 * 1024)).toFixed(2);

const STAGE_ICON_MAP = {
  'New Lead': '👤',
  Contacted: '📞',
  'Application Started': '📝',
  'Pre-Approved': '✅',
  'In Underwriting': '🔍',
  Closed: '🎯',
  'NEW LEAD': '👤',
  'CONTACTED': '📞',
  'APPLICATION STARTED': '📝',
  'PRE-APPROVED': '✅',
  'IN UNDERWRITING': '🔍',
  'CLOSED': '🎯',
};
const STAGE_COLOR_MAP = {
  'New Lead': 'bg-blue-500',
  Contacted: 'bg-yellow-500',
  'Application Started': 'bg-purple-500',
  'Pre-Approved': 'bg-green-500',
  'In Underwriting': 'bg-orange-500',
  Closed: 'bg-gray-500',
  'NEW LEAD': 'bg-blue-500',
  'CONTACTED': 'bg-yellow-500',
  'APPLICATION STARTED': 'bg-purple-500',
  'PRE-APPROVED': 'bg-green-500',
  'IN UNDERWRITING': 'bg-orange-500',
  'CLOSED': 'bg-gray-500',
};
const DEFAULT_ICON = '📊';
const DEFAULT_COLOR = 'bg-[#01818E]';

const getUniqueId = (lead) => lead?.id || lead?._id || lead?.contactId || null;

const dedupeLeads = (list = []) => {
  const seen = new Set();
  const out = [];
  for (const lead of list) {
    const uid = getUniqueId(lead);
    if (uid && seen.has(uid)) continue;
    if (uid) seen.add(uid);
    out.push(lead);
  }
  return out;
};

// eslint-disable-next-line no-unused-vars
const Metric = memo(function Metric({ icon: Icon, value, label }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-1">
        <Icon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="font-semibold text-gray-700" aria-label={label}>
        {value}
      </div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
});

const emptyContact = {
  personalLogoFile: null,
  personalLogoPreview: '',
  firstName: '',
  lastName: '',
  emails: [''],
  phones: [{ type: '', number: '' }],
  contactType: 'Lead',
  timeZone: '',
  dndAll: false,
  dnd: { emails: false, texts: false, callsVoicemails: false, inboundCallsSms: false },
};

function AddContactModal({ open, onClose, onSave }) {
  const prefersReducedMotion = useReducedMotion();
  const [form, setForm] = useState(emptyContact);
  const [error, setError] = useState('');
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(emptyContact);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const setField = (path, value) => setForm((prev) => ({ ...prev, [path]: value }));

  const handleLogo = async (file) => {
    if (!file) return;
    const maxMB = 2.5;
    if (bytesMB(file.size) > maxMB) {
      setError(`Image is ${bytesMB(file.size)} MB. Please choose ≤ ${maxMB} MB.`);
      return;
    }
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, personalLogoFile: file, personalLogoPreview: preview }));
    setError('');
  };

  const addEmail = () => setForm((f) => ({ ...f, emails: [...f.emails, ''] }));
  const removeEmail = (i) =>
    setForm((f) => ({ ...f, emails: f.emails.filter((_, idx) => idx !== i) }));
  const updateEmail = (i, v) =>
    setForm((f) => ({ ...f, emails: f.emails.map((e, idx) => (idx === i ? v : e)) }));
  const addPhone = () =>
    setForm((f) => ({ ...f, phones: [...f.phones, { type: '', number: '' }] }));
  const removePhone = (i) =>
    setForm((f) => ({ ...f, phones: f.phones.filter((_, idx) => idx !== i) }));
  const updatePhone = (i, key, v) =>
    setForm((f) => ({ ...f, phones: f.phones.map((p, idx) => (idx === i ? { ...p, [key]: v } : p)) }));

  const handleSave = () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError('Please enter at least a First or Last name.');
      return;
    }
    if (!form.emails.some((e) => e.trim())) {
      setError('Please add at least one email.');
      return;
    }
    const payload = {
      ...form,
      emails: form.emails.filter((e) => e.trim() !== ''),
      phones: form.phones.filter((p) => p.number.trim() !== ''),
    };
    onSave(payload);
  };

  if (!open) return null;

  const modal = (
    <motion.div
      ref={backdropRef}
      aria-hidden={!open}
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-contact-title"
        ref={panelRef}
        className="absolute inset-0 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.98, y: prefersReducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.98, y: prefersReducedMotion ? 0 : 8 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
      >
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 id="add-contact-title" className="text-lg font-semibold">
              Add Partner Contact
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#01818E]"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-[128px_1fr] gap-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 aspect-square overflow-hidden">
                {form.personalLogoPreview ? (
                  <img
                    src={form.personalLogoPreview}
                    alt="Personal logo preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-gray-400 text-3xl">+</div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium">Personal Logo</div>
                <p className="text-xs text-gray-500">Proposed size 512×512px — ≤ 2.5 MB.</p>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer">
                    <FiUpload className="w-4 h-4" />
                    <span>Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogo(e.target.files?.[0] || null)}
                    />
                  </label>
                  {!!form.personalLogoPreview && (
                    <button
                      onClick={() =>
                        setForm((f) => ({ ...f, personalLogoFile: null, personalLogoPreview: '' }))
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First Name</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Emails */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <div className="space-y-2">
                {form.emails.map((email, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                      placeholder={`Email ${idx + 1}`}
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                    />
                    {form.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(idx)}
                        className="px-3 rounded-md border border-gray-300 hover:bg-gray-50"
                        aria-label="Remove email"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmail}
                className="mt-2 text-sm text-[#01818E] hover:underline"
              >
                + Add email
              </button>
            </div>

            {/* Phones */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Phone</label>
              <div className="space-y-2">
                {form.phones.map((ph, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2">
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                      value={ph.type}
                      onChange={(e) => updatePhone(idx, 'type', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                      placeholder={`Phone ${idx + 1}`}
                      value={ph.number}
                      onChange={(e) => updatePhone(idx, 'number', e.target.value)}
                    />
                    {form.phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhone(idx)}
                        className="px-3 rounded-md border border-gray-300 hover:bg-gray-50"
                        aria-label="Remove phone"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPhone}
                className="mt-2 text-sm text-[#01818E] hover:underline"
              >
                + Add Phone Numbers
              </button>
            </div>

            {/* Contact Type & Time Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Contact Type</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                  value={form.contactType}
                  onChange={(e) => setField('contactType', e.target.value)}
                >
                  <option>Lead</option>
                  <option>Customer</option>
                  <option>Prospect</option>
                  <option>Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time Zone</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                  value={form.timeZone}
                  onChange={(e) => setField('timeZone', e.target.value)}
                >
                  <option value="">Choose one...</option>
                  <option value="Pacific">Pacific</option>
                  <option value="Mountain">Mountain</option>
                  <option value="Central">Central</option>
                  <option value="Eastern">Eastern</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md bg-[#01818E] text-white hover:bg-[#01818E]/90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#01818E]"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return <AnimatePresence mode="wait">{open && modal}</AnimatePresence>;
}

const columnVariants = { hidden: { opacity: 0, x: 12 }, shown: { opacity: 1, x: 0 } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

const PartnerKanbanColumn = memo(function PartnerKanbanColumn({
  stage,
  leads = [],
  metrics = {},
  onAddLead = noop,
  onUpdateLead = noop,
  onDeleteLead = noop,
  isAdmin = false,
}) {
  const prefersReducedMotion = useReducedMotion();
  const [showAddCard, setShowAddCard] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: stage.title,
    data: { stage: stage.title, type: 'column' },
  });
  const uniqueLeads = useMemo(() => dedupeLeads(leads), [leads]);

  const stageIcon = STAGE_ICON_MAP[stage.title] || DEFAULT_ICON;
  const stageColor = STAGE_COLOR_MAP[stage.title] || DEFAULT_COLOR;

  const columnMetrics = useMemo(
    () => ({
      totalLeads: leads.length,
      uniqueCount: uniqueLeads.length,
      avgTime: metrics.avgTime || '0:00',
      conversion: metrics.conversion || 0,
    }),
    [leads.length, uniqueLeads.length, metrics.avgTime, metrics.conversion],
  );

  const handleSaveContact = useCallback(
    async (contactPayload) => {
      await onAddLead({ ...contactPayload, stage: stage.title });
      setShowAddCard(false);
    },
    [onAddLead, stage.title],
  );

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-80 transition-all duration-200',
        isOver && 'bg-blue-50 ring-2 ring-blue-300',
      )}
      variants={columnVariants}
      initial="hidden"
      animate="shown"
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      role="region"
      aria-label={`${stage.title} column`}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with Add button on the left */}
        <div className={cn('px-3 py-2 sm:px-4 sm:py-3 text-white', stageColor)}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isAdmin && (
                <button
                  onClick={() => setShowAddCard(true)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-white/40"
                  aria-label={`Add contact to ${stage.title}`}
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-lg" aria-hidden>
                {stageIcon}
              </span>
              <h3 className="truncate font-semibold text-sm uppercase tracking-wide">
                {stage.title}
              </h3>
            </div>
            <span
              className="bg-white/20 rounded-full px-2 py-1 text-xs font-semibold"
              title="Unique leads"
              aria-label={`${columnMetrics.uniqueCount} unique leads`}
            >
              {columnMetrics.uniqueCount}
            </span>
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <Metric icon={FiUsers} value={columnMetrics.uniqueCount} label="Leads" />
            <Metric icon={FiClock} value={columnMetrics.avgTime} label="Avg Time" />
            <Metric icon={FiTrendingUp} value={`${columnMetrics.conversion}%`} label="Conversion" />
          </div>
        </div>

        <div className="p-3 space-y-3 max-h-96 overflow-y-auto min-h-[200px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          <AnimatePresence mode="popLayout">
            {uniqueLeads.map((lead, index) => {
              const key = getUniqueId(lead) ?? `${stage.title}-${index}`;
              return (
                <motion.div
                  key={key}
                  variants={itemVariants}
                  initial="hidden"
                  animate="shown"
                  exit="exit"
                  transition={{
                    delay: prefersReducedMotion ? 0 : index * 0.02,
                    duration: prefersReducedMotion ? 0 : 0.15,
                  }}
                  layout
                >
                  <PartnerKanbanCard
                    lead={lead}
                    stage={lead.stage || stage.title}
                    onUpdate={onUpdateLead}
                    onDelete={onDeleteLead}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="min-h-[50px] w-full" />

          {isAdmin && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCard(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#01818E] hover:text-[#01818E] transition-colors flex items-center justify-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add Contact
            </motion.button>
          )}

          {uniqueLeads.length === 0 && !showAddCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-400 select-none"
              role="status"
              aria-live="polite"
            >
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm">No leads yet</div>
            </motion.div>
          )}
        </div>
      </div>

      <AddContactModal
        open={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSave={handleSaveContact}
      />
    </motion.div>
  );
});

export default PartnerKanbanColumn;
