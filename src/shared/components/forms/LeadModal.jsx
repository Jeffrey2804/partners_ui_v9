import { useState, useEffect, useRef } from 'react';
import { updateLeadDetails, deleteLead } from '@api/pipelineApi';
import TagInput from '@shared/components/ui/TagInput';
import Draggable from 'react-draggable';

const LeadModal = ({ lead, onClose, onSave, stageSelector }) => {
  const [name, setName] = useState(lead?.name || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [phone, setPhone] = useState(lead?.phone || '');
  const [address, setAddress] = useState(lead?.address || '');
  const [loanType, setLoanType] = useState(lead?.loanType || 'Conventional');
  const [loanAmount, setLoanAmount] = useState(lead?.loanAmount || '');
  const [closeDate, setCloseDate] = useState(lead?.closeDate || '');
  const [status, setStatus] = useState(lead?.status || 'On Track');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [tags, setTags] = useState(
    Array.isArray(lead?.tags)
      ? lead.tags.map((tag) =>
          typeof tag === 'string' ? { label: tag, value: tag } : tag,
        )
      : [],
  );
  const [errors, setErrors] = useState({ name: false, email: false });

  // Using API service instead of context
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    const hasError = {
      name: !name.trim(),
      email: !email.trim() || !email.includes('@'),
    };

    setErrors(hasError);

    if (hasError.name || hasError.email) {
      // Error handling will be managed by global notification system
      return;
    }

    const updatedLead = {
      ...lead,
      name,
      email,
      phone,
      address,
      loanType,
      loanAmount: parseFloat(loanAmount) || 0,
      closeDate,
      status,
      notes,
      tags: tags.length ? tags.map((t) => t.value) : [],
    };

    if (onSave) {
      onSave(updatedLead);
      // Success handling will be managed by global notification system
    } else {
      // Use API service to update lead
      updateLeadDetails(lead.id, updatedLead).then(response => {
        if (response.success) {
          // Success handling will be managed by global notification system
        } else {
          // Error handling will be managed by global notification system
        }
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (lead?.id) {
      // Use API service to delete lead
      deleteLead(lead.id).then(response => {
        if (response.success) {
          // Success handling will be managed by global notification system
          onClose();
        } else {
          // Error handling will be managed by global notification system
        }
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <Draggable handle=".drag-handle">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-700 animate-fade-in text-black dark:text-white cursor-default"
          onKeyDown={handleKeyDown}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6 tracking-tight drag-handle cursor-move select-none">
            {onSave ? 'Create New Lead' : 'Edit Lead'}
          </h2>

          {stageSelector && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Stage</span>
              {stageSelector}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</span>
              <input
                ref={nameInputRef}
                className={`w-full border rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2
                  ${errors.name ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-teal-500'}`}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email *</span>
              <input
                type="email"
                className={`w-full border rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2
                  ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-teal-500'}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
              <input
                type="tel"
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Type</span>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={loanType}
                onChange={e => setLoanType(e.target.value)}
              >
                <option value="Conventional">Conventional</option>
                <option value="FHA">FHA</option>
                <option value="VA">VA</option>
                <option value="USDA">USDA</option>
                <option value="Jumbo">Jumbo</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loan Amount</span>
              <input
                type="number"
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                placeholder="0"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="On Track">On Track</option>
                <option value="Pending">Pending</option>
                <option value="Delayed">Delayed</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
          </div>

          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
            <input
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </label>

          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Close Date</span>
            <input
              type="date"
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={closeDate}
              onChange={e => setCloseDate(e.target.value)}
            />
          </label>

          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
            <TagInput value={tags} onChange={setTags} max={5} />
          </label>

          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
            <textarea
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mt-1 text-sm bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes about this lead..."
            />
          </label>

          <div className="flex justify-between items-center gap-3 mt-6">
            {!onSave && (
              <button
                className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}

            <div className="ml-auto flex gap-3">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={handleSave}
              >
                {onSave ? 'Create Lead' : 'Update Lead'}
              </button>
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default LeadModal;
