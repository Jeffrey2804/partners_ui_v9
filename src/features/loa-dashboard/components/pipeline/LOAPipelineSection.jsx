// ========================================
// 🎯 LOADashboard KANBAN PIPELINE SECTION COMPONENT
// ========================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { usePipeline } from '@context/PipelineContext';
import LOAKanbanColumn from './LOAKanbanColumn';
import LOAKanbanCard from './LOAKanbanCard';
import { FiRefreshCw, FiFilter, FiTrendingUp, FiPlus, FiSearch, FiGrid, FiList, FiSettings } from 'react-icons/fi';
import { uiLogger } from '@utils/logger';

const LOAPipelineSection = ({ isAdmin = false }) => {
  const {
    leadsByStage,
    metrics,
    loading,
    error,
    stages,
    loadingProgress,
    manualRefresh,
    addLead,
    updateLead,
    moveLead,
  } = usePipeline();

  const [filterStage, setFilterStage] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // kanban or list

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [leadsByStage]);

  const handleFilterChange = (stage) => {
    setFilterStage(stage);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await manualRefresh();
      // Global notification will handle success
    } catch (_error) {
      // Global notification will handle errors
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddLead = async (stageTitle, newLead) => {
    try {
      await addLead(stageTitle, newLead);
      // Global notification will handle success
    } catch (error) {
      uiLogger.error('Error adding lead', error);
      // Global notification will handle errors
    }
  };

  const handleUpdateLead = async (leadId, updates) => {
    try {
      await updateLead(leadId, updates);
      // Global notification will handle success
    } catch (error) {
      uiLogger.error('Error updating lead', error);
      // Global notification will handle errors
    }
  };

  const handleMoveLead = async (leadId, fromStage, toStage) => {
    try {
      await moveLead(leadId, fromStage, toStage);
      // Global notification will handle success
    } catch (error) {
      uiLogger.error('Error moving lead', error);
      // Global notification will handle errors
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active && over && active.id !== over.id) {
      const leadId = active.id;
      const fromStage = active.data.current?.stage;
      const toStage = over.id;

      if (fromStage && toStage && fromStage !== toStage) {
        await handleMoveLead(leadId, fromStage, toStage);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Filter stages
  const filteredStages = filterStage === 'All'
    ? (stages || [])
    : (stages || []).filter(stage => stage.title === filterStage);

  // Filter leads by search query
  const getFilteredLeadsForStage = (stageTitle) => {
    const stageLeads = (leadsByStage && leadsByStage[stageTitle]) || [];
    if (!searchQuery) return stageLeads;

    return stageLeads.filter(lead =>
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.loanType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  };

  if (loading) {
    return (
      <section className="w-full p-8">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01818E]"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {loadingProgress.message || 'Loading pipeline data...'}
          </p>
          {loadingProgress.total > 0 && (
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#01818E] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              ></div>
            </div>
          )}
          {loadingProgress.total > 0 && (
            <p className="text-xs text-gray-500">
              {loadingProgress.current} of {loadingProgress.total} steps completed
            </p>
          )}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-semibold mb-2">Pipeline Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-[#01818E] text-white rounded-lg hover:bg-[#01818E]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? 'Retrying...' : 'Retry'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </section>
    );
  }

  const activeLead = activeId ?
    Object.values(leadsByStage || {}).flat().find(lead => lead.id === activeId) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full"
    >
      {/* Pipeline Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Pipeline Overview
              </h3>
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Add Lead Button */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAddLeadModal(true);
                    setSelectedStage(filteredStages[0]?.title);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#01818E] text-white rounded-lg hover:bg-[#01818E]/90 transition-all shadow-sm font-medium"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Lead
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Refresh pipeline data"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Enhanced Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 mt-6">
            {/* Search and Filter Section */}
            <div className="flex flex-1 items-center gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search leads by name, type, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent shadow-sm transition-all"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filterStage}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-4 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent shadow-sm transition-all appearance-none pr-8"
                >
                  <option value="All">All Stages</option>
                  {(stages || []).map((stage) => (
                    <option key={stage.title} value={stage.title}>
                      {stage.title}
                    </option>
                  ))}
                </select>
                <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-3">
              {/* Metrics Toggle */}
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-sm font-medium ${
                  showMetrics
                    ? 'bg-[#01818E] text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FiTrendingUp className="w-4 h-4" />
                {showMetrics ? 'Hide' : 'Show'} Metrics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Metrics Summary */}
      {showMetrics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 border-b border-gray-200"
        >
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#01818E] mb-1">
                  {Object.values(leadsByStage || {}).reduce((total, leads) => total + (leads?.length || 0), 0)}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {metrics?.conversionRate || 0}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Conversion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {metrics?.avgTimeInPipeline || '0:00'}
                </div>
                <div className="text-xs text-gray-600 font-medium">Avg Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  ${(metrics?.totalValue || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Value</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="p-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[restrictToHorizontalAxis]}
        >
          <div className="flex gap-6 overflow-x-auto pb-6 kanban-scrollbar">
            <SortableContext items={filteredStages.map(stage => stage.title)} strategy={verticalListSortingStrategy}>
              {filteredStages.map((stage) => (
                <LOAKanbanColumn
                  key={stage.title}
                  stage={stage}
                  leads={getFilteredLeadsForStage(stage.title)}
                  metrics={metrics?.stages?.[stage.title] || {}}
                  onAddLead={isAdmin ? (newLead) => handleAddLead(stage.title, newLead) : undefined}
                  onUpdateLead={isAdmin ? handleUpdateLead : undefined}
                  isAdmin={isAdmin}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeLead ? (
              <LOAKanbanCard lead={activeLead} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty State */}
        {filteredStages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-xl mb-3 font-medium">
              No pipeline stages found
            </div>
            <div className="text-gray-500 text-sm">
              Try adjusting your filter or check your pipeline configuration.
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add Lead Modal */}
      <AnimatePresence>
        {showAddLeadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add New Lead
                </h3>
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter lead name"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipeline Stage
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  >
                    {filteredStages.map((stage) => (
                      <option key={stage.title} value={stage.title}>
                        {stage.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    placeholder="Enter loan amount"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01818E] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-300 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle add lead logic
                    setShowAddLeadModal(false);
                  }}
                  className="px-6 py-2.5 bg-[#01818E] text-white rounded-lg shadow-sm hover:bg-[#01818E]/90 transition-all font-medium"
                >
                  Add Lead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default LOAPipelineSection;
