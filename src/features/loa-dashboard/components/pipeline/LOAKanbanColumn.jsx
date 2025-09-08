// ========================================
// 🎯 LOADashboard KANBAN COLUMN COMPONENT
// ========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LOAKanbanCard from './LOAKanbanCard';
import { FiPlus, FiMoreVertical, FiUsers, FiClock, FiTrendingUp } from 'react-icons/fi';

const LOAKanbanColumn = ({ stage, leads = [], metrics = {}, onAddLead, onUpdateLead, isAdmin }) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', loanAmount: '', loanType: 'Conventional' });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const {
    leads: totalLeads = leads.length,
    uniqueLeads = leads.filter(lead => !lead.isDuplicate || lead.stage === stage.title).length,
    avgTime = '0:00',
    conversion = 0,
  } = metrics;

  const getStageIcon = (stageTitle) => {
    const iconMap = {
      'New Lead': '👤',
      'Contacted': '📞',
      'Application Started': '📝',
      'Pre-Approved': '✅',
      'In Underwriting': '🔍',
      'Closed': '🎯',
    };
    return iconMap[stageTitle] || '📊';
  };

  const getStageColor = (stageTitle) => {
    const colorMap = {
      'New Lead': 'bg-blue-500',
      'Contacted': 'bg-yellow-500',
      'Application Started': 'bg-purple-500',
      'Pre-Approved': 'bg-green-500',
      'In Underwriting': 'bg-orange-500',
      'Closed': 'bg-gray-500',
    };
    return colorMap[stageTitle] || 'bg-[#01818E]';
  };

  const handleAddLead = () => {
    if (newLeadData.name && newLeadData.loanAmount) {
      onAddLead?.({
        ...newLeadData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        stage: stage.title,
      });
      setNewLeadData({ name: '', loanAmount: '', loanType: 'Conventional' });
      setShowAddCard(false);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-80 ${isDragging ? 'opacity-50' : ''}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Column Header */}
        <div className={`px-4 py-3 ${getStageColor(stage.title)} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getStageIcon(stage.title)}</span>
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                {stage.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 rounded-full px-2 py-1 text-xs font-semibold">
                {uniqueLeads}
              </span>
              <button className="p-1 hover:bg-white/20 rounded transition-colors">
                <FiMoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Column Metrics */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <FiUsers className="w-3 h-3 text-gray-500" />
              </div>
              <div className="font-semibold text-gray-700">{uniqueLeads}</div>
              <div className="text-gray-500">Leads</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <FiClock className="w-3 h-3 text-gray-500" />
              </div>
              <div className="font-semibold text-gray-700">{avgTime}</div>
              <div className="text-gray-500">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <FiTrendingUp className="w-3 h-3 text-gray-500" />
              </div>
              <div className="font-semibold text-gray-700">{conversion}%</div>
              <div className="text-gray-500">Conversion</div>
            </div>
          </div>
        </div>

        {/* Cards Container */}
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <LOAKanbanCard
                  lead={lead}
                  stage={stage.title}
                  onUpdate={onUpdateLead}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Card Button */}
          {isAdmin && (
            <AnimatePresence>
              {showAddCard ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <input
                    type="text"
                    placeholder="Lead name"
                    value={newLeadData.name}
                    onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                    className="w-full mb-2 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Loan amount"
                    value={newLeadData.loanAmount}
                    onChange={(e) => setNewLeadData({ ...newLeadData, loanAmount: e.target.value })}
                    className="w-full mb-2 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  />
                  <select
                    value={newLeadData.loanType}
                    onChange={(e) => setNewLeadData({ ...newLeadData, loanType: e.target.value })}
                    className="w-full mb-3 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  >
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="USDA">USDA</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddLead}
                      className="flex-1 px-3 py-1.5 bg-[#01818E] text-white text-sm rounded-md hover:bg-[#01818E]/90 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddCard(false)}
                      className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddCard(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#01818E] hover:text-[#01818E] transition-colors flex items-center justify-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Lead</span>
                </motion.button>
              )}
            </AnimatePresence>
          )}

          {/* Empty State */}
          {leads.length === 0 && !showAddCard && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm">No leads yet</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LOAKanbanColumn;
