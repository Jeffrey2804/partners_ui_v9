// ========================================
// KANBAN PIPELINE SECTION (Refined, JS Only) — NEW LEAD/COLUMN MODAL
// ========================================

import { useState, useEffect, useMemo, useCallback, useDeferredValue, useId } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, closestCenter } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { usePipeline } from '@context/PipelineContext';
import KanbanColumn from './KanbanColumn';
import ContactsSection from './ContactsSection';
import { useNotification } from '@hooks';
import { FiRefreshCw, FiFilter, FiTrendingUp, FiPlus, FiSearch, FiAlertCircle, FiUpload, FiTrash2, FiMinimize2, FiUsers, FiColumns, FiMenu, FiX } from 'react-icons/fi';
import { upsertContact } from '@api/contactApi';
import ProcessStageIcon from '../ProcessStageIcon';
import { PROCESS_STAGES } from '../../utils/processStageUtils';

const formatCurrency = (n) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n || 0));
  } catch {
    return `$${Number(n || 0).toLocaleString()}`;
  }
};

const Metric = ({ label, value, accent = 'text-gray-900', size = 'lg' }) => {
  const valueCls = size === 'sm' ? 'text-xl' : 'text-3xl';
  const labelCls = size === 'sm' ? 'text-[11px]' : 'text-sm';
  const mb = size === 'sm' ? 'mb-0' : 'mb-1';
  return (
    <div className="text-center select-none">
      <div className={`${valueCls} font-bold ${accent} ${mb}`}>{value}</div>
      <div className={`${labelCls} text-gray-600 font-medium`}>{label}</div>
    </div>
  );
};

// -------------------------------------------------------
// Small helpers for the New Lead modal
// -------------------------------------------------------
const bytesMB = (b) => +(b / (1024 * 1024)).toFixed(2);
const emptyContact = {
  personalLogoFile: null,
  personalLogoPreview: '',
  firstName: '',
  lastName: '',
  emails: [''],
  phones: [{ type: '', number: '' }],
  timeZone: '',
  processStage: 'cold', // Default to cold
};
const emptyTransaction = {
  category: 'loan', // 'loan' | 'meeting' | 'opportunity' (future-friendly)
  type: 'Conventional', // specific type within the category (loanType today)
  amount: '',
};
const NewLeadModal = ({
  open,
  onClose,
  onSubmit,
  existingTags = [],
}) => {
  const [contact, setContact] = useState(emptyContact);
  const [tx, setTx] = useState(emptyTransaction);
  const [primaryTag, setPrimaryTag] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [useCustomTag, setUseCustomTag] = useState(false); // ← for "+ Create new column…"

  useEffect(() => {
    if (open) {
      setContact(emptyContact);
      setTx(emptyTransaction);
      setPrimaryTag('');
      setUseCustomTag(false);
      setError('');
      setSaving(false);
    }
  }, [open]);

  // Revoke preview URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (contact.personalLogoPreview) {
        URL.revokeObjectURL(contact.personalLogoPreview);
      }
    };
  }, [contact.personalLogoPreview]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const setField = (objSetter) => (key, val) => objSetter((prev) => ({ ...prev, [key]: val }));
  const setContactField = setField(setContact);
  const setTxField = setField(setTx);

  const addEmail = () => setContact((c) => ({ ...c, emails: [...c.emails, ''] }));
  const removeEmail = (i) => setContact((c) => ({ ...c, emails: c.emails.filter((_, idx) => idx !== i) }));
  const updateEmail = (i, v) => setContact((c) => ({ ...c, emails: c.emails.map((e, idx) => (idx === i ? v : e)) }));
  const addPhone = () => setContact((c) => ({ ...c, phones: [...c.phones, { type: '', number: '' }] }));
  const removePhone = (i) => setContact((c) => ({ ...c, phones: c.phones.filter((_, idx) => idx !== i) }));
  const updatePhone = (i, key, v) => setContact((c) => ({ ...c, phones: c.phones.map((p, idx) => (idx === i ? { ...p, [key]: v } : p)) }));

  const handleLogo = (file) => {
    if (!file) return;
    const maxMB = 2.5;
    if (bytesMB(file.size) > maxMB) {
      setError(`Image is ${bytesMB(file.size)} MB. Please choose ≤ ${maxMB} MB.`);
      return;
    }
    const preview = URL.createObjectURL(file);
    setContact((c) => {
      // Revoke previous object URL if any to avoid memory leaks
      if (c.personalLogoPreview) URL.revokeObjectURL(c.personalLogoPreview);
      return { ...c, personalLogoFile: file, personalLogoPreview: preview };
    });
    setError('');
  };

  const submit = async () => {
    const firstName = (contact.firstName || '').trim();
    const lastName = (contact.lastName || '').trim();
    const email = (Array.isArray(contact.emails) ? contact.emails.find((e) => !!e?.trim()) : '')?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    if (!fullName || !email) { setError('Name and email are required.'); return; }
    const tag = (primaryTag || '').trim();
    if (!tag) { setError('Please choose or enter a Primary Tag/Column.'); return; }
    setSaving(true);
    try {
      await onSubmit({
        contact,
        transaction: tx,
        primaryTag: tag,
      });
      onClose?.();
    } catch (e) {
      setError(String(e?.message || 'Failed to create lead'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="new-lead-title">
      <div className="absolute inset-0 bg-black/50" onClick={(e) => { e.stopPropagation(); onClose?.(); }} />
      <div className="absolute inset-0 p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 id="new-lead-title" className="text-lg font-semibold">Add New</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">✕</button>
          </div>

          <div className="p-5 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* New Lead */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Lead</label>

              <div className="space-y-2">
                {/* Dropdown of existing columns */}
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  value={useCustomTag ? '__custom__' : (primaryTag || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setError('');
                    if (val === '__custom__') {
                      setUseCustomTag(true);
                      setPrimaryTag('');
                    } else {
                      setUseCustomTag(false);
                      setPrimaryTag(val);
                    }
                  }}
                >
                  <option value="">Choose a column…</option>
                  {existingTags.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__custom__">+ Create new column…</option>
                </select>

                {/* Custom tag input appears only when creating new */}
                {useCustomTag && (
                  <div className="space-y-1">
                    <input
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                      placeholder="Enter new column name (e.g., Warm, Pre-Approved)"
                      value={primaryTag}
                      onChange={(e) => { setPrimaryTag(e.target.value); setError(''); }}
                    />
                    <button
                      type="button"
                      onClick={() => { setUseCustomTag(false); setPrimaryTag(''); }}
                      className="text-xs text-[#01818E] hover:underline"
                    >
                      ← Back to list
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <div className="text-sm font-medium text-gray-900">Contact</div>

              <div className="grid grid-cols-1 sm:grid-cols-[128px_1fr] gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 aspect-square overflow-hidden">
                  {contact.personalLogoPreview ? (
                    <img src={contact.personalLogoPreview} alt="Personal logo preview" className="object-cover w-full h-full" />
                  ) : <div className="text-gray-400 text-3xl">+</div>}
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500">Suggested size 512×512px — ≤ 2.5 MB.</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer">
                      <FiUpload className="w-4 h-4" /><span>Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0] || null)} />
                    </label>
                    {!!contact.personalLogoPreview && (
                      <button onClick={() => setContact((c) => ({ ...c, personalLogoFile: null, personalLogoPreview: '' }))}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
                        <FiTrash2 className="w-4 h-4" />Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                         placeholder="First Name" value={contact.firstName} onChange={(e) => setContactField('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                         placeholder="Last Name" value={contact.lastName} onChange={(e) => setContactField('lastName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <div className="space-y-2">
                  {contact.emails.map((email, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                             placeholder={`Email ${idx + 1}`} value={email} onChange={(e) => updateEmail(idx, e.target.value)} />
                      {contact.emails.length > 1 && (
                        <button type="button" onClick={() => removeEmail(idx)} className="px-3 rounded-md border border-gray-300 hover:bg-gray-50" aria-label="Remove email">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addEmail} className="mt-2 text-sm text-[#01818E] hover:underline">+ Add email</button>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Phone</label>
                <div className="space-y-2">
                  {contact.phones.map((ph, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2">
                      <select className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                              value={ph.type} onChange={(e) => updatePhone(idx, 'type', e.target.value)}>
                        <option value="">Select</option><option value="Mobile">Mobile</option><option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
                      </select>
                      <input className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                             placeholder={`Phone ${idx + 1}`} value={ph.number} onChange={(e) => updatePhone(idx, 'number', e.target.value)} />
                      {contact.phones.length > 1 && (
                        <button type="button" onClick={() => removePhone(idx)} className="px-3 rounded-md border border-gray-300 hover:bg-gray-50" aria-label="Remove phone">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addPhone} className="mt-2 text-sm text-[#01818E] hover:underline">+ Add Phone Numbers</button>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Time Zone</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                        value={contact.timeZone} onChange={(e) => setContactField('timeZone', e.target.value)}>
                  <option value="">Choose one...</option><option value="Pacific">Pacific</option><option value="Mountain">Mountain</option><option value="Central">Central</option><option value="Eastern">Eastern</option><option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Process Stage</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                  value={contact.processStage}
                  onChange={(e) => setContactField('processStage', e.target.value)}
                >
                  {Object.values(PROCESS_STAGES).map((stage) => {
                    const IconComponent = stage.icon;
                    return (
                      <option key={stage.id} value={stage.id}>
                        {stage.label} - {stage.description}
                      </option>
                    );
                  })}
                </select>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  {Object.values(PROCESS_STAGES).map((stage) => {
                    const IconComponent = stage.icon;
                    return (
                      <div key={stage.id} className="flex items-center gap-1">
                        <IconComponent className={`h-3 w-3 ${stage.color}`} />
                        <span>{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Transaction */}
            <section className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Transaction</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                          value={tx.category} onChange={(e) => setTxField('category', e.target.value)}>
                    <option value="loan">Loan</option>
                    <option value="meeting">Meeting</option>
                    <option value="opportunity">Opportunity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                          value={tx.type} onChange={(e) => setTxField('type', e.target.value)}>
                    {/* For now: loan types — extend as needed for other categories */}
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="USDA">USDA</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                  placeholder="Transaction amount (optional)"
                  value={tx.amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') return setTxField('amount', '');
                    if (Number(v) < 0) return;
                    setTxField('amount', v);
                  }}
                />
              </div>
            </section>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50">Close</button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              aria-busy={saving}
              className="px-4 py-2 rounded-md bg-[#01818E] text-white hover:bg-[#01818E]/90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------

const PipelineSection = ({ isAdmin = false }) => {
  const notification = useNotification();
  const {
    leadsByStage, metrics, loading, error, stages, loadingProgress,
    manualRefresh, addLead, updateLead, moveLead, addTag, removeLead,
  } = usePipeline();

  const [filterStage, setFilterStage] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [compactMetrics, setCompactMetrics] = useState(true); // default compact to save vertical space
  const [activeView, setActiveView] = useState('pipeline'); // view state
  const [showViewDropdown, setShowViewDropdown] = useState(false); // view dropdown toggle
  useEffect(() => {
    const apply = () => {
      // auto-compact if viewport height is tight
      setCompactMetrics(window.innerHeight < 900 ? true : compactMetrics);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(null);

  // New: unified “New Lead / Column” modal
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  const searchDeferred = useDeferredValue(searchQuery);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }), useSensor(KeyboardSensor));

  useEffect(() => { setLastUpdated(new Date().toLocaleTimeString()); }, [leadsByStage]);

  const totalLeads = useMemo(() => Object.values(leadsByStage || {}).reduce((t, arr) => t + (arr?.length || 0), 0), [leadsByStage]);

  const filteredStages = useMemo(
    () => (!stages ? [] : filterStage === 'All' ? stages : stages.filter((s) => s.title === filterStage)),
    [filterStage, stages],
  );

  const getFilteredLeadsForStage = useCallback((stageTitle) => {
    const stageLeads = (leadsByStage && leadsByStage[stageTitle]) || [];
    if (!searchDeferred) return stageLeads;
    const q = searchDeferred.toLowerCase();
    return stageLeads.filter((lead) => {
      const name = lead.name?.toLowerCase() || '';
      const type = lead.loanType?.toLowerCase() || '';
      const tagMatch = Array.isArray(lead.tags) && lead.tags.some((t) => (t || '').toLowerCase().includes(q));
      return name.includes(q) || type.includes(q) || tagMatch;
    });
  }, [leadsByStage, searchDeferred]);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await manualRefresh();
    } catch (_error) {
      // Error notification is handled in the context
    } finally {
      setRefreshing(false);
    }
  }, [manualRefresh]);

  // 🔗 Upsert contact in GHL, ensure column, then create pipeline lead
  const submitNewLead = useCallback(async ({ contact, transaction, primaryTag }) => {
    const firstName = (contact.firstName || '').trim();
    const lastName  = (contact.lastName  || '').trim();
    const email     = (Array.isArray(contact.emails) ? contact.emails.find((e) => !!e?.trim()) : '')?.trim().toLowerCase();
    const phone     = (Array.isArray(contact.phones) ? contact.phones.find((p) => !!p?.number?.trim())?.number : '')?.trim();
    const fullName  = [firstName, lastName].filter(Boolean).join(' ');
    if (!fullName || !email) throw new Error('Name and email are required');
    const normalizedTag = (primaryTag || '').trim();


    // 1) Upsert the contact
    const up = await upsertContact({
      firstName, lastName, email, phone,
      timeZone: contact.timeZone || undefined,
      // add tag to contact as well
      tags: [normalizedTag].filter(Boolean),
    });
    if (!up.success) throw new Error(up.error || 'Upsert failed');
    const contactId = up.data?.id || up.data?._id || up.data?.contactId;

    // 2) Ensure the column exists (persist locally; provider keeps it)
    const existing = (stages || []).some((s) => s.title.toLowerCase() === normalizedTag.toLowerCase());
    if (!existing) {
      try { await addTag(normalizedTag); } catch { /* non-fatal */ }
    }

    // 3) Create the Lead (transactional entity)
    const leadForPipeline = {
      name: fullName,
      email,
      contactId,
      // present lead schema but keep transaction semantics:
      loanType: transaction.type,
      loanAmount: Number(transaction.amount || 0) || 0,
      tags: [normalizedTag],
      stage: normalizedTag,
      processStage: contact.processStage || 'cold', // Add process stage
      // room to extend: category: transaction.category
    };

    try {
      await addLead(normalizedTag, leadForPipeline);
      // Success notification is handled in the context
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes('403') || msg.toLowerCase().includes('does not have access to this location')) {
        // Lead was created successfully despite the error message
        notification.success('Lead created successfully');
      } else {
        // Show specific error for pipeline failure
        notification.error('Contact saved, but adding lead to pipeline failed.');
      }
      throw e; // surface so modal can show error if desired
    }
  }, [addLead, addTag, stages, notification]);

  const handleUpdateLead = useCallback(async (leadId, updates) => {
    // provided by context - notifications are handled there
    try {
      await updateLead(leadId, updates);
      // Success notification handled in context
    }
    catch (_error) {
      // Error notification handled in context
    }
  }, [updateLead]);

  const handleMoveLead = useCallback(async (leadId, fromStage, toStage) => {
    try {
      await moveLead(leadId, fromStage, toStage);
      // Success notification handled in context
    }
    catch {
      // Error notification handled in context
    }
  }, [moveLead]);

  const handleDragStart = useCallback((event) => setActiveId(event.active.id), []);
  const handleDragCancel = useCallback(() => setActiveId(null), []);
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event || {};
    setActiveId(null);
    if (!active || !over) return;
    if (active.id === over.id) return;

    const leadId = active.id;
    const fromStage = active.data.current?.stage;
    const toStage = over.data?.current?.stage
      || (over.data?.current?.type === 'column' ? over.data.current.stage : null)
      || ((stages || []).some((s) => s.title === over.id) ? over.id : null);

    if (fromStage && toStage && fromStage !== toStage) {
      await handleMoveLead(leadId, fromStage, toStage);
    }
  }, [handleMoveLead, stages]);

  const activeLead = useMemo(() => !activeId || !leadsByStage ? null
    : (Object.values(leadsByStage).flat().find((l) => l.id === activeId) || null), [activeId, leadsByStage]);

  const searchId = useId();
  const stageFilterId = useId();

  // If we already have stages, show the board with a small inline alert instead of blocking the whole page.
  const hasAnyStage = Array.isArray(stages) && stages.length > 0;
  const errorMessage = typeof error === 'string' ? error : (error?.message || '');


  // --- UI ---
  if (loading) {
    const pct = (loadingProgress?.total > 0) ? Math.round(((loadingProgress.current || 0) / loadingProgress.total) * 100) : null;
    return (
      <section className="w-full p-8" aria-busy="true" aria-live="polite">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01818E]" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">{loadingProgress?.message || 'Loading pipeline data...'}</p>
          {pct !== null && (
            <>
              <div className="w-64 bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="bg-[#01818E] h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-500">{(loadingProgress.current || 0)} of {(loadingProgress.total || 0)} steps completed</p>
            </>
          )}
        </div>
      </section>
    );
  }

  if (error && !hasAnyStage) {
    return (
      <section className="w-full p-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-red-600 mb-2"><FiAlertCircle className="h-5 w-5" /><p className="text-lg font-semibold">Pipeline Error</p></div>
          <p className="text-sm text-gray-600 mb-6">{errorMessage || 'Unknown error'}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={handleManualRefresh} disabled={refreshing} className="px-4 py-2 bg-[#01818E] text-white rounded-lg hover:bg-[#01818E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              {refreshing ? 'Retrying…' : 'Retry'}
            </button>
            <button onClick={handleManualRefresh} disabled={refreshing} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {refreshing ? 'Refreshing…' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const existingTagTitles = (stages || []).map((s) => s.title);

  return (
    <Motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative w-full">
      {/* Header (compact & minimal) */}
      <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 sticky top-0 z-10 border-b border-gray-200">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="flex flex-col gap-2 py-3">
          {error && hasAnyStage && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center justify-between"
            >
              <span>{errorMessage || 'Something went wrong while refreshing.'}</span>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="ml-3 inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-red-100 disabled:opacity-50"
              >
                {refreshing ? 'Retrying…' : 'Retry'}
              </button>
            </div>
          )}

            {/* Title row */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  Pipeline Overview
                </h2>
                {lastUpdated && (
                  <div className="mt-0.5 text-xs text-gray-500">Last updated {lastUpdated}</div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowMetrics((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium border transition-colors
                    ${showMetrics ? 'border-transparent bg-[#01818E] text-white hover:bg-[#01818E]/90' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                  aria-pressed={showMetrics}
                  title={showMetrics ? 'Hide metrics' : 'Show metrics'}
                >
                  <FiTrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">{showMetrics ? 'Hide' : 'Show'} Metrics</span>
                </button>

                <button
                  onClick={() => setCompactMetrics((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  title={compactMetrics ? 'Expand metrics' : 'Compact metrics'}
                  disabled={!showMetrics}
                >
                  <FiMinimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{compactMetrics ? 'Expand' : 'Compact'}</span>
                </button>

                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing || loading}
                  className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh pipeline data"
                  aria-label="Refresh pipeline data"
                >
                  <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* View Selector Dropdown */}
                <div className="relative" data-dropdown="view-selector">
                  <button
                    onClick={() => setShowViewDropdown(!showViewDropdown)}
                    className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    title="Switch view"
                  >
                    {activeView === 'pipeline' ? <FiColumns className="h-4 w-4" /> : <FiUsers className="h-4 w-4" />}
                    <span className="hidden sm:inline">
                      {activeView === 'pipeline' ? 'Pipeline' : 'Contacts'}
                    </span>
                    <Motion.div
                      animate={{ rotate: showViewDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Motion.div>
                  </button>

                  <AnimatePresence>
                    {showViewDropdown && (
                      <Motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-20"
                      >
                        <button
                          onClick={() => {
                            setActiveView('pipeline');
                            setShowViewDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                            activeView === 'pipeline'
                              ? 'bg-[#01818E]/10 text-[#01818E] font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <FiColumns className="h-4 w-4" />
                          Pipeline
                          {activeView === 'pipeline' && (
                            <div className="w-2 h-2 bg-[#01818E] rounded-full ml-auto" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveView('contacts');
                            setShowViewDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                            activeView === 'contacts'
                              ? 'bg-[#01818E]/10 text-[#01818E] font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <FiUsers className="h-4 w-4" />
                          Contacts
                          {activeView === 'contacts' && (
                            <div className="w-2 h-2 bg-[#01818E] rounded-full ml-auto" />
                          )}
                        </button>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setShowNewLeadModal(true)}
                    className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium bg-[#01818E] text-white hover:bg-[#01818E]/90"
                    title="Add new lead"
                  >
                    <FiPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Lead</span>
                  </button>
                )}
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xl">
                <label htmlFor={searchId} className="sr-only">Search leads</label>
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                <input
                  id={searchId}
                  type="text"
                  inputMode="search"
                  placeholder="Search by name, type, tag, email, or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                />
              </div>

              <div className="relative">
                <label htmlFor={stageFilterId} className="sr-only">Filter by column</label>
                <select
                  id={stageFilterId}
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="appearance-none pl-3 pr-9 py-2 rounded-md border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#01818E]"
                >
                  <option value="All">All Columns</option>
                  {(stages || []).map((stage) => (
                    <option key={stage.title} value={stage.title}>{stage.title}</option>
                  ))}
                </select>
                <FiFilter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <AnimatePresence initial={false}>
        {showMetrics && (
          <Motion.div
            key="metrics"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${compactMetrics ? 'bg-white' : 'bg-gradient-to-r from-gray-50 to-gray-100'} border-b border-gray-200`}
          >
            <div className={`${compactMetrics ? 'px-4 md:px-6 py-2' : 'px-6 md:px-8 py-5'}`}>
              <div className={'grid grid-cols-4 gap-3 md:gap-5'}>
                <Metric size={compactMetrics ? 'sm' : 'lg'} label="Total Leads" value={totalLeads} accent="text-[#01818E]" />
                <Metric size={compactMetrics ? 'sm' : 'lg'} label="Conversion Rate" value={`${metrics?.conversionRate || 0}%`} accent="text-green-600" />
                <Metric size={compactMetrics ? 'sm' : 'lg'} label="Avg Time" value={metrics?.avgTimeInPipeline || '0:00'} accent="text-blue-600" />
                <Metric size={compactMetrics ? 'sm' : 'lg'} label="Total Value" value={formatCurrency(metrics?.totalValue || 0)} accent="text-purple-600" />
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Content */}
      {activeView === 'pipeline' && (
        <div className="p-4 md:p-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} modifiers={[restrictToHorizontalAxis]}>
            <div className="flex gap-6 overflow-x-auto pb-6 kanban-scrollbar">
              {filteredStages.map((stage) => (
                <KanbanColumn
                  key={stage.title}
                  stage={stage}
                  leads={getFilteredLeadsForStage(stage.title)}
                  metrics={metrics?.stages?.[stage.title] || {}}
                  onAddLead={isAdmin ? (newLead) => submitNewLead({ contact: {
                      firstName: newLead.firstName, lastName: newLead.lastName,
                      emails: Array.isArray(newLead.emails) ? newLead.emails : [newLead.email || ''],
                      phones: Array.isArray(newLead.phones) ? newLead.phones : [{ type: '', number: newLead.phone || '' }],
                      timeZone: newLead.timeZone || '',
                      processStage: newLead.processStage || 'cold',
                    },
                    transaction: { category: 'loan', type: newLead.loanType, amount: newLead.loanAmount },
                    primaryTag: stage.title,
                  }) : undefined}
                  onUpdateLead={isAdmin ? handleUpdateLead : undefined}
                  onDeleteLead={isAdmin ? (id) => removeLead(id) : undefined}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {/* Overlay while dragging */}
            <DragOverlay>
              {activeLead ? (
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72 opacity-90 select-none">
                  <div className="font-semibold text-gray-900 truncate mb-1 flex items-center gap-2">
                    <ProcessStageIcon lead={activeLead} className="h-4 w-4" />
                    {activeLead.name || 'Lead'}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{(activeLead.loanType || '—')} • {formatCurrency(activeLead.loanAmount)}</div>
                  {Array.isArray(activeLead.tags) && activeLead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activeLead.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-[#01818E]/10 text-[#01818E] border border-[#01818E]/20">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {filteredStages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-xl mb-2 font-medium">No columns found</div>
              <div className="text-gray-500 text-sm">Create a tag column to get started.</div>
            </div>
          )}
        </div>
      )}

      {/* Contacts Content */}
      {activeView === 'contacts' && (
        <div className="p-4 md:p-5">
          <ContactsSection searchQuery={searchQuery} />
        </div>
      )}

      {/* New Lead / Column Modal */}
      <AnimatePresence>
        {showNewLeadModal && (
          <Motion.div key="newLeadModal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NewLeadModal
              open={showNewLeadModal}
              onClose={() => setShowNewLeadModal(false)}
              onSubmit={submitNewLead}
              existingTags={existingTagTitles}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.section>
  );
};

export default PipelineSection;
