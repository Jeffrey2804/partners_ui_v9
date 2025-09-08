// ========================================
// CONTACT DETAILS FORM (Clean, No Console)
// ========================================

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@hooks';
import { FiUser, FiMail, FiPhone, FiCalendar, FiTag, FiUserCheck, FiUsers } from 'react-icons/fi';
import { fetchContactById, updateContact, createContact } from '@shared/services/api/contactApi';
import { fetchUsers } from '@shared/services/api/userApi';

// ---- Constants ------------------------------------------------------------
const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  contactSource: '',
  contactType: 'Lead',
  assignedTo: '',
};

const EMAIL_RE = /\S+@\S+\.\S+/;

const baseInput =
  'w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100';

const viewInput = 'border-gray-200 bg-gray-50 text-gray-700';
const editInput = 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white';
const errInput = 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100';

// ---- Helpers --------------------------------------------------------------
const pickContactType = (contact) => {
  const tags = contact?.tags || [];
  const t = tags.find((x) => ['Lead', 'Prospect', 'Customer', 'Partner'].includes(x));
  return t || contact?.type || contact?.contactType || 'Lead';
};

const assignedUserLabel = (users, id) => {
  const u = users.find((x) => x.id === id);
  if (!u) return id || '';
  const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return u.email ? `${name} (${u.email})` : name;
};

const cleanPayload = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// ---- Component ------------------------------------------------------------
const ContactDetailsForm = memo(function ContactDetailsForm({
  isOpen,
  onClose,
  contactId,
  onSave,
  mode = 'edit', // 'edit' | 'view'
}) {
  const notification = useNotification();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isView = mode === 'view';

  // Reset form for new contact when id is cleared
  useEffect(() => {
    if (!contactId && isOpen) setFormData(INITIAL_FORM);
  }, [contactId, isOpen]);

  // Load users on open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await fetchUsers();
        if (!cancelled && res?.success) setUsers(res.data || []);
        else if (!cancelled) notification.error('Failed to load users');
      } catch {
        if (!cancelled) notification.error('Failed to load users');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load contact when opening with an id
  useEffect(() => {
    if (!isOpen || !contactId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchContactById(contactId);
        if (!res?.success) throw new Error(res?.error || 'Unable to fetch contact');
        const c = res.data || {};
        if (cancelled) return;
        setFormData({
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email: c.email || '',
          phone: c.phone || '',
          dateOfBirth: c.dateOfBirth || c.dob || '',
          contactSource: c.source || c.contactSource || '',
          contactType: pickContactType(c),
          assignedTo: c.assignedTo || c.assignedUserId || '',
        });
        notification.success('Contact loaded');
      } catch (e) {
        if (!cancelled) notification.error(`Failed to load contact${e?.message ? `: ${e.message}` : ''}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contactId]);

  // --- Handlers ------------------------------------------------------------
  const setField = useCallback((field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: null } : e));
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!formData.firstName.trim()) next.firstName = 'First name is required';
    if (!formData.lastName.trim()) next.lastName = 'Last name is required';
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(formData.email)) next.email = 'Please enter a valid email address';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = cleanPayload({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth || null,
        source: formData.contactSource || null,
        assignedTo: formData.assignedTo || null,
      });

      const res = contactId
        ? await updateContact(contactId, payload)
        : await createContact(payload);

      if (!res?.success) throw new Error(res?.error || 'Request failed');

      if (contactId) {
        notification.crud.updated(`Contact "${formData.firstName} ${formData.lastName}"`);
      } else {
        notification.crud.created(`Contact "${formData.firstName} ${formData.lastName}"`);
      }
      onSave?.(res.data);
      onClose();
    } catch (e) {
      if (contactId) {
        notification.crud.updateError('contact', e?.message || 'Unknown error');
      } else {
        notification.crud.createError('contact', e?.message || 'Unknown error');
      }
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate, formData, contactId, onSave, onClose]);

  // --- UI helpers ----------------------------------------------------------
  const emailClass = useMemo(
    () => `${baseInput} ${errors.email ? errInput : isView ? viewInput : editInput}`,
    [errors.email, isView],
  );
  const fnClass = useMemo(
    () => `${baseInput} ${errors.firstName ? errInput : isView ? viewInput : editInput}`,
    [errors.firstName, isView],
  );
  const lnClass = useMemo(
    () => `${baseInput} ${errors.lastName ? errInput : isView ? viewInput : editInput}`,
    [errors.lastName, isView],
  );
  const baseClass = useMemo(() => `${baseInput} ${isView ? viewInput : editInput}`, [isView]);

  // --- Render --------------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={contactId ? 'Edit Contact' : 'New Contact'}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {mode === 'edit' ? (contactId ? 'Edit Contact' : 'New Contact') : 'Contact Details'}
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {mode === 'edit' ? 'Update contact information' : 'View contact details'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading contact details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setField('firstName', e.target.value)}
                          readOnly={isView}
                          className={`${fnClass}`}
                          placeholder="First Name"
                        />
                      </div>
                      {errors.firstName && <p className="text-red-600 text-sm font-medium">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setField('lastName', e.target.value)}
                          readOnly={isView}
                          className={`${lnClass}`}
                          placeholder="Last Name"
                        />
                      </div>
                      {errors.lastName && <p className="text-red-600 text-sm font-medium">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setField('email', e.target.value)}
                        readOnly={isView}
                        className={`${emailClass}`}
                        placeholder="Email Address"
                      />
                    </div>
                    {errors.email && <p className="text-red-600 text-sm font-medium">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        readOnly={isView}
                        className={`${baseClass}`}
                        placeholder="Phone"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Date Of Birth</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setField('dateOfBirth', e.target.value)}
                        readOnly={isView}
                        className={`${baseClass}`}
                        placeholder="Date Of Birth"
                      />
                    </div>
                  </div>

                  {/* Contact Source */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Source</label>
                    <div className="relative">
                      <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.contactSource}
                        onChange={(e) => setField('contactSource', e.target.value)}
                        readOnly={isView}
                        className={`${baseClass}`}
                        placeholder="Contact Source"
                      />
                    </div>
                  </div>

                  {/* Contact Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Type</label>
                    <div className="relative">
                      <FiUserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.contactType}
                        onChange={(e) => setField('contactType', e.target.value)}
                        disabled={isView}
                        className={`${baseInput} ${isView ? viewInput : editInput} appearance-none`}
                      >
                        <option value="Lead">Lead</option>
                        <option value="Prospect">Prospect</option>
                        <option value="Customer">Customer</option>
                        <option value="Partner">Partner</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Assign To */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">Assign To</label>
                    {isView ? (
                      formData.assignedTo && (
                        <div className="relative">
                          <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={assignedUserLabel(users, formData.assignedTo)}
                            readOnly
                            className={`${baseInput} ${viewInput}`}
                            placeholder="Not assigned"
                          />
                        </div>
                      )
                    ) : (
                      <div className="relative">
                        <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.assignedTo}
                          onChange={(e) => setField('assignedTo', e.target.value)}
                          disabled={loadingUsers}
                          className={`${baseInput} ${loadingUsers ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : editInput} appearance-none`}
                        >
                          <option value="">{loadingUsers ? 'Loading users...' : 'Select User...'}</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {assignedUserLabel([u], u.id)}
                            </option>
                          ))}
                        </select>
                        {loadingUsers ? (
                          <div className="absolute right-8 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        ) : (
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {mode === 'edit' && (
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                      saving || loading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {contactId ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      contactId ? 'Update Contact' : 'Create Contact'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ContactDetailsForm;
