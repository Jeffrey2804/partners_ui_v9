// ========================================
// 🎯 Partnership Dashboard KANBAN PIPELINE SECTION COMPONENT
// ========================================

import { useState, useEffect, useMemo, useCallback, useDeferredValue, useId } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay, closestCenter } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { usePipeline } from '@context/PipelineContext';
import PartnerKanbanColumn from './PartnerKanbanColumn';
import { FiRefreshCw, FiFilter, FiTrendingUp, FiPlus, FiSearch, FiAlertCircle, FiMinimize2 } from 'react-icons/fi';

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

const PartnerPipelineSection = ({ isAdmin = false }) => {
  const {
    leadsByStage, metrics, loading, error, stages, loadingProgress,
    manualRefresh, updateLead, moveLead, removeLead,
  } = usePipeline();

  const [filterStage, setFilterStage] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [compactMetrics, setCompactMetrics] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(null);

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

  const handleUpdateLead = useCallback(async (leadId, updates) => {
    try {
      await updateLead(leadId, updates);
    }
    catch (_error) {
      // Error notification handled in context
    }
  }, [updateLead]);

  const handleMoveLead = useCallback(async (leadId, fromStage, toStage) => {
    try {
      await moveLead(leadId, fromStage, toStage);
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
          <p className="text-gray-600 dark:text-gray-400 text-sm">{loadingProgress?.message || 'Loading partner pipeline data...'}</p>
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
          <div className="flex items-center justify-center gap-2 text-red-600 mb-2"><FiAlertCircle className="h-5 w-5" /><p className="text-lg font-semibold">Partner Pipeline Error</p></div>
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

  return (
    <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative w-full">
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

                {isAdmin && (
                  <button
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
                  placeholder="Search by name, type, or tag"
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
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="p-4 md:p-5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} modifiers={[restrictToHorizontalAxis]}>
          <div className="flex gap-6 overflow-x-auto pb-6 kanban-scrollbar">
            {filteredStages.map((stage) => (
              <PartnerKanbanColumn
                key={stage.title}
                stage={stage}
                leads={getFilteredLeadsForStage(stage.title)}
                metrics={metrics?.stages?.[stage.title] || {}}
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
                <div className="font-semibold text-gray-900 truncate mb-1">{activeLead.name || 'Lead'}</div>
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
    </motion.section>
  );
};

export default PartnerPipelineSection;
