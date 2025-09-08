// ========================================
// PARTNER KANBAN CARD (Floating Confirm, Polished)
// ========================================

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import {
  FiUser,
  FiDollarSign,
  FiTag,
  FiMoreVertical,
  FiTrash2,
  FiUserPlus,
  FiMove,
  FiAlertTriangle,
} from 'react-icons/fi';
import PropTypes from 'prop-types';

const LOAN_TYPE_CLASS = {
  Conventional: 'bg-blue-100 text-blue-800',
  FHA: 'bg-green-100 text-green-800',
  VA: 'bg-purple-100 text-purple-800',
  USDA: 'bg-orange-100 text-orange-800',
};
const PRIORITY_CLASS = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};
const cx = (...classes) => classes.filter(Boolean).join(' ');
const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n || 0));
const loanTypeClass = (t) => LOAN_TYPE_CLASS[t] || 'bg-gray-100 text-gray-800';
const priorityClass = (p) => PRIORITY_CLASS[p] || 'bg-gray-100 text-gray-800 border-gray-200';

const TagList = memo(function TagList({ tags = [] }) {
  if (!tags?.length) return null;
  const shown = tags.slice(0, 2), more = tags.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      <FiTag className="w-3 h-3 text-gray-400" />
      <div className="flex flex-wrap gap-1">
        {shown.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[#01818E]/10 text-[#01818E] border border-[#01818E]/20">{tag}</span>
        ))}
        {more > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">+{more}</span>}
      </div>
    </div>
  );
});
TagList.propTypes = { tags: PropTypes.arrayOf(PropTypes.string) };

/** Small helper to clamp a value between min/max */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const PartnerKanbanCard = memo(function PartnerKanbanCard({ lead, stage, onUpdate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [contactOpen, setContactOpen] = useState(false);
  const [editData, setEditData] = useState(() => ({
    name: lead?.name || '',
    loanAmount: lead?.loanAmount ?? '',
    loanType: lead?.loanType || 'Conventional',
  }));

  const menuRef = useRef(null);
  const confirmRef = useRef(null);
  const triggerRef = useRef(null); // three-dot button
  const nameInputRef = useRef(null);
  const cancelBtnRef = useRef(null);

  // floating popover position
  const [popPos, setPopPos] = useState({ top: 0, left: 0, arrowLeft: 0, placement: 'bottom' });
  const POPOVER_WIDTH = 320; // w-80
  const MARGIN = 10;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead?.id,
    data: { lead, stage },
  });
  const dragStyle = useMemo(
    () => (transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined),
    [transform],
  );

  // click-away & ESC
  useEffect(() => {
    const onDocClick = (e) => {
      const t = e.target;
      const insideMenu = menuRef.current?.contains(t);
      const insideConfirm = confirmRef.current?.contains(t);
      const onTrigger = triggerRef.current?.contains(t);
      if (!insideMenu && !insideConfirm && !onTrigger) {
        setMenuOpen(false);
        setConfirmOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setConfirmOpen(false);
        if (editing) setEditing(false);
      }
      if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        setMenuOpen(false);
        setConfirmOpen(true);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [editing]);

  useEffect(() => { if (editing) nameInputRef.current?.focus(); }, [editing]);
  useEffect(() => { if (confirmOpen) cancelBtnRef.current?.focus(); }, [confirmOpen]);

  // compute & update floating popover position
  const updatePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;

    // Prefer bottom placement; flip to top if not enough room.
    const spaceBelow = vh - r.bottom;
    const placement = spaceBelow < 160 ? 'top' : 'bottom';

    const top =
      placement === 'bottom'
        ? r.bottom + 8
        : r.top - 8 - 140; // approx popover height; will still be clamped

    // Right-align the popover with the button, but keep within viewport
    let left = r.right - POPOVER_WIDTH;
    left = clamp(left, MARGIN, vw - POPOVER_WIDTH - MARGIN);

    // Arrow should align with button center but stay inside card width
    const btnCenter = r.left + r.width / 2;
    const arrowLeft = clamp(btnCenter - left, 18, POPOVER_WIDTH - 18);

    setPopPos({
      top: clamp(top, MARGIN, vh - 150), // keep on-screen generally
      left,
      arrowLeft,
      placement,
    });
  }, []);

  useEffect(() => {
    if (!confirmOpen) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true); // true captures scrolling containers too
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [confirmOpen, updatePosition]);

  const resetEdit = useCallback(() => {
    setEditData({
      name: lead?.name || '',
      loanAmount: lead?.loanAmount ?? '',
      loanType: lead?.loanType || 'Conventional',
    });
  }, [lead]);

  const handleSave = useCallback(() => {
    onUpdate?.(lead?.id, {
      ...editData,
      loanAmount: editData.loanAmount === '' ? '' : Number(editData.loanAmount),
    });
    setEditing(false);
  }, [editData, lead, onUpdate]);

  const handleCancel = useCallback(() => { resetEdit(); setEditing(false); }, [resetEdit]);
  const onNameKeyDown = useCallback((e) => { if (e.key === 'Enter') handleSave(); }, [handleSave]);

  const safeId = lead?.id ?? lead?._id ?? lead?.contactId;
  const confirmDelete = useCallback(() => { setMenuOpen(false); setConfirmOpen(true); }, []);

  const doDelete = useCallback(async () => {
    if (!onDelete || !safeId) return;
    try {
      setDeleting(true);
      await onDelete(safeId);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }, [onDelete, safeId]);

  if (isDragging) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72 opacity-60 select-none">
        <div className="flex items-center gap-2 mb-2">
          <FiUser className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-900 truncate">{lead?.name || 'Unknown Lead'}</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">{(lead?.loanType || '—')} • {formatCurrency(lead?.loanAmount)}</div>
        <TagList tags={lead?.tags} />
      </div>
    );
  }

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={cx(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200',
        'hover:shadow-md focus-within:shadow-md outline-none',
        'cursor-default',
      )}
      role="article"
      aria-label={`Lead card: ${lead?.name || 'Unknown Lead'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="shrink-0 p-1 rounded hover:bg-gray-100 active:bg-gray-200 cursor-grab active:cursor-grabbing"
            aria-label="Drag card"
            {...listeners}
            {...attributes}
          >
            <FiMove className="w-4 h-4 text-gray-500" />
          </button>

          {editing ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editData.name}
              onChange={(e) => setEditData((s) => ({ ...s, name: e.target.value }))}
              onKeyDown={onNameKeyDown}
              className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#01818E]"
              placeholder="Lead name"
              aria-label="Lead name"
            />
          ) : (
            <h3 className="font-semibold text-gray-900 truncate">{lead?.name || 'Unknown Lead'}</h3>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => { setConfirmOpen(false); setMenuOpen((v) => !v); }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Card actions"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
              <button
                type="button"
                onClick={() => { setContactOpen(true); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <FiUserPlus className="w-3 h-3" />
                Edit Contact
              </button>
              <button
                type="button"
                onClick={() => { confirmDelete(); setTimeout(updatePosition, 0); }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiTrash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        {editing ? (
          <div className="space-y-2">
            <select
              value={editData.loanType}
              onChange={(e) => setEditData((s) => ({ ...s, loanType: e.target.value }))}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
              aria-label="Loan type"
            >
              <option value="Conventional">Conventional</option>
              <option value="FHA">FHA</option>
              <option value="VA">VA</option>
              <option value="USDA">USDA</option>
            </select>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Loan amount"
              value={editData.loanAmount}
              onChange={(e) => setEditData((s) => ({ ...s, loanAmount: e.target.value }))}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
              aria-label="Loan amount"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} className="flex-1 px-3 py-1.5 bg-[#01818E] text-white text-sm rounded-md hover:bg-[#01818E]/90 transition-colors">Save</button>
              <button type="button" onClick={handleCancel} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FiDollarSign className="w-3 h-3" />
              <span>{formatCurrency(lead?.loanAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cx('px-2 py-1 rounded-full text-xs font-medium', loanTypeClass(lead?.loanType))}>{lead?.loanType || '—'}</span>
              {lead?.priority && (
                <span className={cx('px-2 py-1 rounded-full text-xs font-medium border', priorityClass(lead.priority))}>
                  {lead.priority}
                </span>
              )}
            </div>
            <TagList tags={lead?.tags} />
            {lead?.updatedAt && <div className="text-xs text-gray-400 mt-2">Updated {new Date(lead.updatedAt).toLocaleDateString()}</div>}
          </>
        )}
      </div>

      {/* Floating Confirmation (Portal) */}
      {confirmOpen &&
        createPortal(
          <div
            ref={confirmRef}
            style={{ position: 'fixed', top: popPos.top, left: popPos.left, width: POPOVER_WIDTH, zIndex: 10000 }}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            className="bg-white rounded-xl shadow-2xl border border-gray-200"
          >
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-full bg-red-50 p-2">
                  <FiAlertTriangle className="w-4 h-4 text-red-600" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 leading-5">Delete this lead?</div>
                  <div className="text-sm text-gray-600 mt-1">
                    This action can't be undone. The lead will be removed from the pipeline.
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-4 py-3 flex items-center justify-end gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md border text-sm border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>

            {/* arrow */}
            <div
              className="absolute w-2 h-2 bg-white rotate-45 border-t border-l border-gray-200"
              style={{
                top: popPos.placement === 'bottom' ? -4 : undefined,
                bottom: popPos.placement === 'top' ? -4 : undefined,
                left: popPos.arrowLeft - 4,
              }}
              aria-hidden
            />
          </div>,
          document.body,
        )}
    </article>
  );
});

PartnerKanbanCard.propTypes = {
  lead: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    loanAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    loanType: PropTypes.string,
    priority: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    contactId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }),
  stage: PropTypes.string,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

export default PartnerKanbanCard;
