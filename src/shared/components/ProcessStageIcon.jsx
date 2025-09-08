// ========================================
// Process Stage Icon Component (Shared)
// ========================================

import PropTypes from 'prop-types';
import { getProcessStageConfig, getProcessStageFromLead } from '../utils/processStageUtils';

const ProcessStageIcon = ({ processStage, lead, className = 'h-4 w-4' }) => {
  // Use provided processStage or extract from lead object
  const stage = processStage || getProcessStageFromLead(lead);
  const config = getProcessStageConfig(stage);

  if (!config) return null;

  const IconComponent = config.icon;
  return (
    <IconComponent
      className={`${className} ${config.color}`}
      title={`${config.label} lead - ${config.description}`}
    />
  );
};

ProcessStageIcon.propTypes = {
  processStage: PropTypes.string,
  lead: PropTypes.object,
  className: PropTypes.string,
};

export default ProcessStageIcon;
