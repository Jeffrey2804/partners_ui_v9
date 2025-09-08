import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pipelineLogger } from '@utils/logger';
import {
  fetchPipelineLeads,
  fetchPipelineMetrics,
  fetchStageTags,
  createNewLead,
  updateLeadDetails,
  deleteLead,
  moveLeadToStage,
  addTagsToLead,
  PIPELINE_STAGES,
  STAGE_TAGS,
} from '@api/pipelineApi';
import { useNotification } from '@hooks';
import { useCrudNotifications } from '../../utils/crudNotificationsClean';

const PipelineContext = createContext();

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (!context) throw new Error('usePipeline must be used within a PipelineProvider');
  return context;
};

export const PipelineProvider = ({ children }) => {
  const notification = useNotification();
  const crudNotifications = useCrudNotifications();

  const [leadsByStage, setLeadsByStage] = useState({});
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });

  // Treat stages as tag-based columns
  const [stages, setStages] = useState(PIPELINE_STAGES || []);

  const [dataCache, setDataCache] = useState(null);
  const CACHE_DURATION = 120000;

  const loadPipelineData = useCallback(
    async (_retry = 0, _force = false) => {
      if (dataCache && Date.now() - dataCache.timestamp < CACHE_DURATION && !_force) {
        setLeadsByStage(dataCache.leads);
        setMetrics(dataCache.metrics);
        setLastUpdated(dataCache.lastUpdated);
        setLoading(false);
        pipelineLogger.info('Using cached pipeline data');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        setLoadingProgress({ current: 0, total: 2, message: 'Fetching leads and metrics...' });

        const [leadsResponse, metricsResponse] = await Promise.all([
          fetchPipelineLeads(),
          fetchPipelineMetrics(),
        ]);

        setLoadingProgress({ current: 2, total: 2, message: 'Processing data...' });

        if (leadsResponse.success && metricsResponse.success) {
          const newData = {
            leads: leadsResponse.data.leads,
            metrics: metricsResponse.data,
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now(),
          };

          // Ensure local stages include any tag keys coming from server
          const serverKeys = Object.keys(newData.leads || {});
          if (serverKeys.length) {
            setStages((prev) => {
              const have = new Set(prev.map((s) => s.title.toLowerCase()));
              const merged = [...prev];
              serverKeys.forEach((k) => {
                if (!have.has(k.toLowerCase())) merged.push({ title: k });
              });
              return merged;
            });
          }

          setDataCache(newData);
          setLeadsByStage(newData.leads);
          setMetrics(newData.metrics);
          setLastUpdated(newData.lastUpdated);
          setLoadingProgress({ current: 0, total: 0, message: '' });
          pipelineLogger.success('Pipeline data loaded successfully');
        } else {
          throw new Error(leadsResponse.error || metricsResponse.error);
        }
      } catch (err) {
        pipelineLogger.warn('Pipeline data loading failed', null, { error: err.message });
        setError(err.message);
        setLoadingProgress({ current: 0, total: 0, message: 'Load failed. Use Refresh Data button.' });
        pipelineLogger.error('Error loading pipeline data', err);
      } finally {
        setLoading(false);
      }
    },
    [dataCache],
  );

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  const refreshPipelineData = async () => {
    await loadPipelineData();
  };

  // New: add a TAG-backed column
  const addTag = async (tag) => {
    const clean = (tag || '').trim();
    if (!clean) throw new Error('Tag required');

    setStages((prev) => {
      const exists = prev.some((s) => s.title.toLowerCase() === clean.toLowerCase());
      return exists ? prev : [...prev, { title: clean }];
    });

    setLeadsByStage((prev) => (prev[clean] ? prev : { ...prev, [clean]: [] }));

    notification.crud.created(`Column "${clean}"`);
    pipelineLogger.success(`Tag/column "${clean}" created`);
    return { title: clean };
  };

  // Existing lead APIs (unchanged)
  const addLead = async (stage, leadData) => {
    try {
      await crudNotifications.leads.create(
        () => createNewLead({ ...leadData, stage }),
        leadData,
        `Lead "${leadData.name}" added to ${stage}`,
      );

      // Update local state on success
      setLeadsByStage((prev) => {
        const next = { ...prev };
        if (!next[stage]) next[stage] = [];
        next[stage].push({ ...leadData, stage });
        return next;
      });

      pipelineLogger.success('Lead added successfully');
      return leadData;
    } catch (error) {
      pipelineLogger.error('Error adding lead', error);
      throw error;
    }
  };  const updateLead = async (leadId, updates) => {
    try {
      await crudNotifications.leads.update(
        (id, data) => updateLeadDetails(id, data),
        leadId,
        updates,
        `Lead "${updates.name || leadId}" updated`,
      );

      // Update local state on success
      setLeadsByStage((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((stage) => {
          const leads = next[stage] || [];
          const i = leads.findIndex((l) => l.id === leadId || l._id === leadId);
          if (i >= 0) {
            next[stage] = [...leads];
            next[stage][i] = { ...leads[i], ...updates, updatedAt: new Date().toISOString() };
          }
        });
        return next;
      });

      pipelineLogger.success('Lead updated successfully');
      return updates;
    } catch (error) {
      pipelineLogger.error('Error updating lead', error);
      throw error;
    }
  };

  // ✅ Updated: optimistic delete with global notifications + rollback
  const removeLead = async (leadId) => {
    const safeId = leadId?.split?.('-')?.[0] || leadId;
    let snapshot = null;
    let leadName = 'Lead';

    try {
      // Find the lead name for notification
      Object.values(leadsByStage).some(leads => {
        const found = leads.find(l =>
          l.id === safeId || l._id === safeId ||
          l.id === leadId || l._id === leadId,
        );
        if (found) {
          leadName = found.name || 'Lead';
          return true;
        }
        return false;
      });

      // optimistic local removal
      setLeadsByStage((prev) => {
        snapshot = prev; // capture pre-change
        const next = Object.keys(prev).reduce((acc, stage) => {
          const list = prev[stage] || [];
          acc[stage] = list.filter(
            (l) =>
              l.id !== safeId &&
              l._id !== safeId &&
              l.id !== leadId &&
              l._id !== leadId,
          );
          return acc;
        }, {});
        return next;
      });

      await crudNotifications.leads.delete(
        (id) => deleteLead(id),
        safeId,
        leadName,
      );

      pipelineLogger.success('Lead deleted', null, { leadId: safeId });
      setLastUpdated(new Date().toISOString());
      return { success: true };
    } catch (error) {
      // rollback on error
      if (snapshot) setLeadsByStage(snapshot);
      pipelineLogger.error('Error deleting lead', error);
      throw error;
    }
  };

  const moveLead = async (leadId, fromStage, toStage) => {
    if (!leadId || !fromStage || !toStage || fromStage === toStage) return;

    let leadName = 'Lead';
    let snapshot = null;

    try {
      const cleanLeadId = leadId.includes('-') ? leadId.split('-')[0] : leadId;

      // Find the lead name for notification and take snapshot
      setLeadsByStage((prev) => {
        snapshot = prev;
        const srcLeads = prev[fromStage] || [];
        const leadToMove = srcLeads.find(l =>
          l.id === cleanLeadId || l._id === cleanLeadId ||
          l.id === leadId || l._id === leadId,
        );
        if (leadToMove) {
          leadName = leadToMove.name || 'Lead';
        }

        const next = { ...prev };
        const src = next[fromStage] || [];
        const i = src.findIndex(
          (l) =>
            l.id === cleanLeadId ||
            l._id === cleanLeadId ||
            l.id === leadId ||
            l._id === leadId,
        );
        if (i >= 0) {
          const lead = src[i];
          next[fromStage] = src.filter((_, idx) => idx !== i);
          if (!next[toStage]) next[toStage] = [];
          next[toStage].push({
            ...lead,
            id: cleanLeadId,
            _id: cleanLeadId,
            stage: toStage,
            updatedAt: new Date().toISOString(),
          });
        }
        return next;
      });

      const response = await moveLeadToStage(cleanLeadId, toStage, fromStage);
      if (!response.success) {
        // rollback on error
        if (snapshot) setLeadsByStage(snapshot);
        throw new Error(response.error || 'Failed to move lead');
      }

      // Show success notification
      notification.crud.statusChanged(
        `"${leadName}"`,
        `moved from ${fromStage} to ${toStage}`,
      );

      return response.data;
    } catch (error) {
      // rollback on error
      if (snapshot) setLeadsByStage(snapshot);
      pipelineLogger.error('Error moving lead', error);

      // Show error notification
      notification.crud.updateError(
        'lead movement',
        `Failed to move ${leadName} from ${fromStage} to ${toStage}`,
      );

      throw error;
    }
  };

  const updateLeadTags = async (leadId, tags) => {
    try {
      const response = await addTagsToLead(leadId, tags);
      if (response.success) {
        setLeadsByStage((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((stage) => {
            const leads = next[stage] || [];
            const i = leads.findIndex(
              (l) =>
                l.id === leadId ||
                l._id === leadId ||
                l.id === (leadId?.split?.('-')?.[0] || '') ||
                l._id === (leadId?.split?.('-')?.[0] || ''),
            );
            if (i >= 0) {
              next[stage] = [...leads];
              next[stage][i] = { ...leads[i], tags, updatedAt: new Date().toISOString() };
            }
          });
          return next;
        });
        pipelineLogger.success('Lead tags updated locally');
        return response.data;
      }
      throw new Error(response.error);
    } catch (error) {
      pipelineLogger.error('Error updating lead tags', error);
      throw error;
    }
  };

  const getStageTags = async (stageName) => {
    try {
      const response = await fetchStageTags(stageName);
      if (response.success) return response.data;
      throw new Error(response.error);
    } catch (error) {
      pipelineLogger.error('Error fetching stage tags', error);
      return STAGE_TAGS[stageName] || [];
    }
  };

  const refreshData = () => loadPipelineData();

  const manualRefresh = async () => {
    try {
      pipelineLogger.info('Manual refresh requested');

      // Show loading notification
      const loadingId = notification.loading('Refreshing pipeline data...', {
        title: 'Syncing Data',
      });

      const response = await refreshPipelineData();

      // Remove loading notification
      notification.remove(loadingId);

      if (response?.success) {
        setLeadsByStage(response.data.leads);
        setMetrics(response.data.metrics);
        setLastUpdated(new Date().toISOString());

        notification.success('Pipeline data refreshed successfully!', {
          title: 'Refresh Complete',
          duration: 3000,
        });

        pipelineLogger.success('Manual refresh completed successfully');
      } else {
        throw new Error(response?.error || 'Refresh failed');
      }
    } catch (error) {
      pipelineLogger.error('Manual refresh failed', error);
      setError(error.message);

      notification.error(`Failed to refresh pipeline data: ${error.message}`, {
        title: 'Refresh Failed',
        duration: 6000,
      });
    }
  };

  const value = {
    // State
    leadsByStage,
    metrics,
    loading,
    error,
    lastUpdated,
    loadingProgress,

    // Actions
    addTag,
    addLead,
    updateLead,
    removeLead,
    moveLead,
    updateLeadTags,
    getStageTags,
    refreshData,
    manualRefresh,

    // Columns (tags)
    stages,
    stageTags: STAGE_TAGS,
  };

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
};

export default PipelineContext;
