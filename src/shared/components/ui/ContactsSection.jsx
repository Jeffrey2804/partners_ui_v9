// ========================================
// 📞 CONTACTS LIST (Professional w/ Pagination)
// ========================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertCircle, FiPhone, FiMail, FiClock, FiUser, FiX, FiCalendar, FiTag,
  FiMapPin, FiEdit2, FiSave, FiChevronDown, FiRefreshCw, FiDownload,
} from 'react-icons/fi';

// NOTE: expected APIs
// searchContacts(params) -> { success: boolean, data: Contact[] | { items: Contact[] }, error?: string, nextCursor?: string, meta?: { nextCursor?: string, total?: number } }
// updateContact(id, payload) -> { success: boolean, data: Contact, error?: string }
// PIPELINE_CONFIG.STAGES: [{ title: string }]
import { searchContacts, updateContact } from '@api/contactApi';
import { PIPELINE_CONFIG } from '@config/environment';

// ----------------------------------------
// Utilities
// ----------------------------------------
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,.05); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #01818E, #0891b2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #0891b2, #0e7490); }
`;

const safe = (v, fallback = 'Not provided') => (v == null || v === '' ? fallback : v);

const formatDateLong = (dateString) => {
  if (!dateString) return 'Not available';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Not available';
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatDateShort = (dateString) => {
  if (!dateString) return 'Unknown';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString();
};

const getId = (c) => c?.id || c?._id || '';

const toDisplayContact = (contact) => {
  if (!contact) return null;
  const id = getId(contact);
  const name = `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim() || 'Unknown';
  return {
    id,
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    name,
    email: contact?.email || '',
    phone: contact?.phone || '',
    country: contact?.country || '',
    type: contact?.type || '',
    tags: Array.isArray(contact?.tags) ? contact.tags : [],
    dateAdded: contact?.dateAdded || contact?.createdAt || null,
    dateUpdated: contact?.dateUpdated || contact?.updatedAt || null,
    lastActivity: contact?.lastActivity || null,
  };
};

// Try to normalize a variety of backend shapes
const extractItems = (resp) => {
  if (!resp) return [];
  if (Array.isArray(resp.data)) return resp.data;
  if (resp.data && Array.isArray(resp.data.items)) return resp.data.items;
  return [];
};
const extractNextCursor = (resp) =>
  resp?.nextCursor || resp?.meta?.nextCursor || resp?.data?.nextCursor || resp?.data?.cursor?.next || null;
const extractTotal = (resp) =>
  resp?.meta?.total ?? resp?.total ?? resp?.data?.total ?? null;

// ========================================
// Component
// ========================================
const ContactsSection = ({
  searchQuery = '',
  initialPageSize = 100,
  enableInfiniteScroll = true,
  hardMaxTotal = 10000, // safety guard
}) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);

  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);           // fallback if backend supports page indexing
  const [offset, setOffset] = useState(0);       // fallback if backend supports offset
  const [cursor, setCursor] = useState(null);    // primary if backend returns a cursor
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(null);      // show if backend sends total

  // Abort controller per fetch series
  const abortRef = useRef(null);

  // For infinite scroll
  const scrollContainerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Pipeline stages (fallback to empty if config missing)
  const pipelineStages = useMemo(
    () => (PIPELINE_CONFIG?.STAGES || []).map((s) => s.title).filter(Boolean),
    [],
  );

  const resetPagination = useCallback(() => {
    setPage(0);
    setOffset(0);
    setCursor(null);
    setHasMore(true);
    setTotal(null);
  }, []);

  const clearAbort = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const buildParams = useCallback(() => {
    const q = (searchQuery || '').trim();
    const params = { limit: pageSize };
    // Pass both 'query' and 'q' for backend compatibility
    if (q) { params.query = q; params.q = q; }

    if (cursor) {
      params.cursor = cursor;
    } else {
      // Try offset then page; backend may ignore unknowns
      params.offset = offset;
      params.page = page;
    }
    return params;
  }, [cursor, offset, page, pageSize, searchQuery]);

  const fetchFirstPage = useCallback(async () => {
    clearAbort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      resetPagination();
      setContacts([]);

      const params = { ...buildParams(), // will use initial page/offset=0 and cursor=null
        limit: pageSize,
      };

      const response = await searchContacts(params, { signal: controller.signal });
      if (!response?.success) throw new Error(response?.error || 'Failed to fetch contacts');

      const items = extractItems(response);
      const next = extractNextCursor(response);
      const t = extractTotal(response);

      setContacts(items);
      setCursor(next);
      setHasMore(Boolean(next) || (items.length === pageSize && items.length < hardMaxTotal));
      if (t != null) setTotal(t);

      // If no cursor but we filled a page, prep offset/page for next fetch
      if (!next && items.length === pageSize) {
        setOffset(pageSize);
        setPage(1);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Failed to fetch contacts');
      }
    } finally {
      setLoading(false);
      clearAbort();
    }
  }, [buildParams, pageSize, hardMaxTotal, resetPagination]);

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || fetchingMore) return;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setFetchingMore(true);
      setError(null);

      const params = buildParams();
      const response = await searchContacts(params, { signal: controller.signal });
      if (!response?.success) throw new Error(response?.error || 'Failed to fetch more');

      const items = extractItems(response);
      const next = extractNextCursor(response);

      setContacts((prev) => {
        // de-dupe by id if backend overlaps
        const map = new Map(prev.map((c) => [getId(c), c]));
        for (const it of items) map.set(getId(it), it);
        return Array.from(map.values());
      });

      setCursor(next);
      const moreHeuristic = Boolean(next) || (items.length === pageSize);
      setHasMore(moreHeuristic && (contacts.length + items.length) < hardMaxTotal);

      if (!next) {
        // Advance offset/page fallbacks
        setOffset((o) => o + pageSize);
        setPage((p) => p + 1);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err?.message || 'Failed to fetch more contacts');
    } finally {
      setFetchingMore(false);
      clearAbort();
    }

  }, [buildParams, hasMore, fetchingMore, pageSize, hardMaxTotal, contacts.length]);

  // Initial + when query or pageSize changes
  useEffect(() => {
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pageSize]);

  // Optional Infinite Scroll inside the scrollable table body
  useEffect(() => {
    if (!enableInfiniteScroll) return;
    const rootEl = scrollContainerRef.current;
    const sentinel = loadMoreRef.current;
    if (!rootEl || !sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      { root: rootEl, rootMargin: '200px', threshold: 0 },
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [enableInfiniteScroll, fetchNextPage]);

  // --------------------------------------
  // Filtering (client-side, still passes query to server for better coverage)
  // --------------------------------------
  const filteredContacts = useMemo(() => {
    // When server filters, this mostly ensures quick UI filtering.
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const fullName = `${c?.firstName || ''} ${c?.lastName || ''}`.toLowerCase();
      const email = (c?.email || '').toLowerCase();
      const phone = (c?.phone || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [contacts, searchQuery]);

  // --------------------------------------
  // Handlers
  // --------------------------------------
  const handleContactClick = useCallback((raw) => {
    const dc = toDisplayContact(raw);
    setSelectedContact(dc);
    setEditedContact(dc);
    setIsEditing(false);
    setShowContactModal(true);
  }, []);

  const handleEditToggle = useCallback(() => {
    setIsEditing((prev) => !prev);
    setEditedContact((prev) => ({ ...(selectedContact || prev) }));
  }, [selectedContact]);

  const handleInputChange = useCallback((field, value) => {
    setEditedContact((prev) => ({ ...(prev || {}), [field]: value }));
  }, []);

  const handleTagsChange = useCallback((value) => {
    setEditedContact((prev) => ({ ...(prev || {}), tags: value ? [value] : [] }));
  }, []);

  const handleUpdateContact = useCallback(async () => {
    if (!editedContact) return;
    const contactId = editedContact.id;
    if (!contactId) {
      console.error('Contact ID not found');
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        firstName: editedContact.firstName || '',
        lastName: editedContact.lastName || '',
        email: editedContact.email || '',
        phone: editedContact.phone || '',
        country: editedContact.country || '',
        type: editedContact.type || '',
        tags: editedContact.tags || [],
      };

      const response = await updateContact(contactId, payload);
      if (response?.success) {
        const updated = toDisplayContact({ ...editedContact, ...(response.data || {}) });
        setContacts((prev) =>
          prev.map((c) => (getId(c) === contactId ? { ...c, ...(response.data || {}) } : c)),
        );
        setSelectedContact(updated);
        setEditedContact(updated);
        setIsEditing(false);
      } else {
        console.error('Failed to update contact:', response?.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Failed to update contact:', err?.message || err);
    } finally {
      setUpdating(false);
    }
  }, [editedContact]);

  const handleRefresh = useCallback(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const handleExportVisible = useCallback(() => {
    // simple CSV export of what's currently loaded + filtered
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Type', 'Tags', 'Created', 'Updated'];
    const rows = filteredContacts.map((c) => {
      const d = toDisplayContact(c);
      return [
        d.id, d.firstName, d.lastName, d.email, d.phone, d.country, d.type,
        (d.tags || []).join('|'),
        d.dateAdded || '', d.dateUpdated || '',
      ].map((x) => `"${String(x ?? '').replaceAll('"', '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredContacts]);

  // Display helpers
  const display = isEditing ? editedContact : selectedContact;
  const fullName = useMemo(() => {
    if (!display) return 'Unknown Contact';
    const n = `${display.firstName || ''} ${display.lastName || ''}`.trim();
    return n || 'Unknown Contact';
  }, [display]);

  const initials = useMemo(() => {
    const parts = fullName.split(' ').filter(Boolean);
    return (parts[0]?.[0] || 'U') + (parts[1]?.[0] || 'N');
  }, [fullName]);

  // --------------------------------------
  // UI
  // --------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01818E]" />
        <p className="text-gray-600 text-sm">Loading contacts...</p>
      </div>
    );
  }

  if (error && contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
          <FiAlertCircle className="h-5 w-5" />
          <p className="text-lg font-semibold">Failed to Load Contacts</p>
        </div>
        <p className="text-sm text-gray-600 mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#01818E] text-white rounded-lg hover:bg-[#01818E]/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{customScrollbarStyles}</style>

      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* Controls */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Loaded:</span>
            <span className="font-mono">
              {filteredContacts.length.toLocaleString()}
              {total != null ? ` / ${total.toLocaleString()}` : hasMore ? ' (+ more)' : ''}
            </span>
            {error && <span className="text-red-600">• {error}</span>}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Page size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#01818E] focus:border-[#01818E]"
            >
              {[25, 50, 100, 250, 500].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <button
              onClick={handleExportVisible}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              title="Export visible to CSV"
            >
              <FiDownload className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              title="Refresh"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-900">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1">Last Activity</div>
              <div className="col-span-1">Tags</div>
            </div>
          </div>

          {/* Body (Scrollable) */}
          <div ref={scrollContainerRef} className="divide-y divide-gray-200 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredContacts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg font-medium mb-2">No contacts found</p>
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start by adding some contacts to see them here'}
                </p>
              </div>
            ) : (
              <>
                {filteredContacts.map((c, index) => {
                  const d = toDisplayContact(c);
                  const tag = Array.isArray(c?.tags) && c.tags.length > 0 ? c.tags[0] : null;
                  const initialsCell = (d.name.split(' ').map((n) => n[0]).join('') || 'UN').slice(0, 2).toUpperCase();
                  return (
                    <Motion.div
                      key={getId(c) || `${index}-${d.name}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index, 20) * 0.02 }}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleContactClick(c)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* # */}
                        <div className="col-span-1 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#01818E]/10 text-[#01818E] text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>

                        {/* Name */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                              {initialsCell}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{d.name}</p>
                              <p className="text-xs text-gray-500 truncate">ID: {d.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-sm">
                            <FiPhone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate">{safe(d.phone, 'No phone')}</span>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-sm min-w-0">
                            <FiMail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate">{safe(d.email, 'No email')}</span>
                          </div>
                        </div>

                        {/* Created */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-sm">
                            <FiCalendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{formatDateShort(d.dateAdded)}</span>
                          </div>
                        </div>

                        {/* Last Activity */}
                        <div className="col-span-1 text-center">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <FiClock className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{formatDateShort(d.lastActivity)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="col-span-1 text-center">
                          {tag ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FiTag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              No tags
                            </span>
                          )}
                        </div>
                      </div>
                    </Motion.div>
                  );
                })}

                {/* Infinite-scroll sentinel */}
                {enableInfiniteScroll && hasMore && (
                  <div ref={loadMoreRef} className="px-6 py-4 text-center text-xs text-gray-500">
                    {fetchingMore ? 'Loading more…' : 'Scroll to load more'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredContacts.length.toLocaleString()}
            {total != null ? ` of ${total.toLocaleString()} contacts` : hasMore ? ' contacts (more available)' : ' contacts (all loaded)'}
          </div>

          {/* Load More (explicit control) */}
          {!enableInfiniteScroll && hasMore && (
            <button
              onClick={fetchNextPage}
              disabled={fetchingMore}
              className="px-4 py-2 bg-[#01818E] text-white rounded-lg hover:bg-[#01818E]/90 transition-colors disabled:opacity-50"
            >
              {fetchingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
          {/* Show button as well even if infinite scroll, for accessibility */}
          {enableInfiniteScroll && hasMore && (
            <button
              onClick={fetchNextPage}
              disabled={fetchingMore}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {fetchingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      </Motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showContactModal && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowContactModal(false)}
          >
            <Motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-[#01818E] via-[#0891b2] to-[#0e7490] px-8 py-6 text-white">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all duration-200 group z-10"
                >
                  <FiX className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>

                <div className="flex items-center justify-between pr-16">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                        <span className="text-2xl font-bold text-white">{initials}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-white mb-2 leading-tight truncate">{fullName}</h1>
                      <div className="flex items-center gap-3 text-white/90 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-white/60 rounded-full" />
                          {display?.type || 'Contact'}
                        </span>
                        <span className="text-sm opacity-75">•</span>
                        <span className="text-sm font-mono bg-white/10 px-2 py-1 rounded-md">
                          ID: {(display?.id || 'N/A').slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isEditing ? (
                      <button
                        onClick={handleEditToggle}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 font-medium"
                      >
                        <FiEdit2 className="h-4 w-4" />
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleEditToggle}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 font-medium"
                        >
                          <FiX className="h-4 w-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateContact}
                          disabled={updating}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <FiSave className="h-4 w-4" />
                          )}
                          {updating ? 'Updating...' : 'Save'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex max-h-[calc(90vh-180px)]">
                {/* Left: Primary */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-gray-100">
                  <div className="space-y-5">
                    {/* Personal */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="h-4 w-4 text-blue-600" />
                        Personal Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">First Name</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={display?.firstName || ''}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="First name"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{safe(display?.firstName)}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Last Name</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={display?.lastName || ''}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Last name"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{safe(display?.lastName)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="h-4 w-4 text-[#01818E]" />
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#01818E]/10 flex items-center justify-center flex-shrink-0">
                            <FiMail className="h-4 w-4 text-[#01818E]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                            {isEditing ? (
                              <input
                                type="email"
                                value={display?.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#01818E] focus:border-[#01818E] transition-colors"
                                placeholder="Email address"
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900 truncate">{safe(display?.email)}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <FiPhone className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={display?.phone || ''}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Phone number"
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900">{safe(display?.phone)}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <FiMapPin className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1">Country</p>
                            {isEditing ? (
                              <input
                                type="text"
                                value={display?.country || ''}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                                placeholder="Country"
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900">{safe(display?.country)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Meta */}
                <div className="flex-1 p-6 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                  <div className="space-y-5">
                    {/* Timeline */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiClock className="h-4 w-4 text-purple-600" />
                        Timeline
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <FiCalendar className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Date Added</p>
                            <p className="text-sm font-medium text-gray-900">{formatDateLong(display?.dateAdded)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <FiClock className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Last Updated</p>
                            <p className="text-sm font-medium text-gray-900">{formatDateLong(display?.dateUpdated)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiTag className="h-4 w-4 text-emerald-600" />
                        Tags
                      </h3>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <select
                              value={(display?.tags && display.tags[0]) || ''}
                              onChange={(e) => handleTagsChange(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none bg-white pr-8"
                            >
                              <option value="">Select a pipeline stage</option>
                              {pipelineStages.map((stage) => (
                                <option key={stage} value={stage}>{stage}</option>
                              ))}
                            </select>
                            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                          <p className="text-xs text-gray-500">Select from available pipeline stages</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {display?.tags?.length ? (
                            display.tags.map((tag, i) => (
                              <span key={`${tag}-${i}`} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">No tags assigned</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Type */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="h-4 w-4 text-indigo-600" />
                        Contact Type
                      </h3>
                      {isEditing ? (
                        <select
                          value={display?.type || ''}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select type</option>
                          <option value="lead">Lead</option>
                          <option value="contact">Contact</option>
                          <option value="customer">Customer</option>
                          <option value="prospect">Prospect</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                          {display?.type || 'Not specified'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100/80 backdrop-blur-sm px-8 py-5 border-t border-gray-200/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#01818E]/10 flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-[#01818E]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact ID</p>
                      <p className="text-sm font-mono font-medium text-gray-700">
                        {(display?.id || 'N/A').slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="group px-6 py-3 bg-gradient-to-r from-[#01818E] to-[#0891b2] text-white rounded-xl hover:from-[#0891b2] hover:to-[#01818E] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      Close
                      <FiX className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                    </span>
                  </button>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ContactsSection;
