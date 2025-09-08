// ========================================
// 🎯 LOADashboard KANBAN CARD COMPONENT
// ========================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiUser, FiDollarSign, FiTag, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';

const LOAKanbanCard = ({ lead, stage, onUpdate, isDragging = false }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: lead.name || '',
    loanAmount: lead.loanAmount || '',
    loanType: lead.loanType || 'Conventional',
  });

  const menuRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lead.id,
    data: {
      lead,
      stage,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLoanTypeColor = (type) => {
    const colorMap = {
      'Conventional': 'bg-blue-100 text-blue-800',
      'FHA': 'bg-green-100 text-green-800',
      'VA': 'bg-purple-100 text-purple-800',
      'USDA': 'bg-orange-100 text-orange-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const handleSave = () => {
    onUpdate?.(lead.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: lead.name || '',
      loanAmount: lead.loanAmount || '',
      loanType: lead.loanType || 'Conventional',
    });
    setIsEditing(false);
  };

  if (isDragging) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72 opacity-90">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiUser className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">{lead.name || 'Unknown Lead'}</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          {lead.loanType} • {formatCurrency(lead.loanAmount)}
        </div>
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-[#01818E]/10 text-[#01818E] border border-[#01818E]/20"
              >
                {tag}
              </span>
            ))}
            {lead.tags.length > 2 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                +{lead.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiUser className="w-4 h-4 text-gray-500" />
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#01818E]"
            />
          ) : (
            <span className="font-semibold text-gray-900">{lead.name || 'Unknown Lead'}</span>
          )}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiMoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FiEdit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => {
                  // Handle delete
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiTrash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <select
              value={editData.loanType}
              onChange={(e) => setEditData({ ...editData, loanType: e.target.value })}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
            >
              <option value="Conventional">Conventional</option>
              <option value="FHA">FHA</option>
              <option value="VA">VA</option>
              <option value="USDA">USDA</option>
            </select>
            <input
              type="number"
              placeholder="Loan amount"
              value={editData.loanAmount}
              onChange={(e) => setEditData({ ...editData, loanAmount: e.target.value })}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 bg-[#01818E] text-white text-sm rounded-md hover:bg-[#01818E]/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Loan Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiDollarSign className="w-3 h-3" />
              <span>{formatCurrency(lead.loanAmount)}</span>
            </div>

            {/* Loan Type Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLoanTypeColor(lead.loanType)}`}>
                {lead.loanType}
              </span>
              {lead.priority && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(lead.priority)}`}>
                  {lead.priority}
                </span>
              )}
            </div>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <FiTag className="w-3 h-3 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {lead.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs bg-[#01818E]/10 text-[#01818E] border border-[#01818E]/20"
                    >
                      {tag}
                    </span>
                  ))}
                  {lead.tags.length > 2 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      +{lead.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {lead.matchingStages && lead.matchingStages.length > 1 && (
              <div className="text-xs text-blue-600 px-2 py-1 rounded border border-blue-200 bg-blue-50">
                <span className="font-medium">Also in:</span> {lead.matchingStages.filter(s => s !== stage).join(', ')}
              </div>
            )}

            {/* Timestamp */}
            {lead.updatedAt && (
              <div className="text-xs text-gray-400 mt-2">
                Updated {new Date(lead.updatedAt).toLocaleDateString()}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default LOAKanbanCard;
