// ========================================
// Process Stage Utilities (Shared)
// ========================================

import { FiThermometer, FiZap, FiCloud } from 'react-icons/fi';

// Process Stage Configuration
export const PROCESS_STAGES = {
  COLD: {
    id: 'cold',
    label: 'Cold',
    icon: FiCloud,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Initial contact, no engagement yet',
  },
  WARM: {
    id: 'warm',
    label: 'Warm',
    icon: FiThermometer,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Showing interest, some engagement',
  },
  HOT: {
    id: 'hot',
    label: 'Hot',
    icon: FiZap,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Highly engaged, ready to move forward',
  },
};

export const getProcessStageConfig = (processStage) => {
  if (!processStage) return null;
  const stage = processStage.toLowerCase();
  return PROCESS_STAGES[stage.toUpperCase()] || null;
};

// Helper function to extract process stage from tags or processStage property
export const getProcessStageFromLead = (lead) => {
  // First check if processStage property exists
  if (lead?.processStage) {
    return lead.processStage;
  }

  // Otherwise, check tags array for process stage tags
  if (Array.isArray(lead?.tags)) {
    const processStageTag = lead.tags.find(tag => {
      const tagLower = (tag || '').toLowerCase();
      return tagLower === 'cold' || tagLower === 'warm' || tagLower === 'hot';
    });
    if (processStageTag) {
      return processStageTag;
    }
  }

  return null;
};

// Filter out process stage tags from regular tags display
export const filterProcessStageTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.filter(tag => {
    const tagLower = (tag || '').toLowerCase();
    return tagLower !== 'cold' && tagLower !== 'warm' && tagLower !== 'hot';
  });
};
