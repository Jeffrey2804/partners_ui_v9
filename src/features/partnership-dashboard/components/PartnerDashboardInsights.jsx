import React from 'react';
import { motion } from 'framer-motion';
import CampaignTrackerTable from './CampaignTrackerTable';
import PartnerRecommendations from './PartnerRecommendations';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
};

const PartnerDashboardInsights = () => {
  return (
    <motion.div
      className="grid grid-cols-1 xl:grid-cols-2 gap-8"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {/* Campaign Performance */}
      <motion.div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50" variants={fadeIn}>
        <CampaignTrackerTable />
      </motion.div>

      {/* Recommendations */}
      <motion.div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50" variants={fadeIn}>
        <PartnerRecommendations />
      </motion.div>
    </motion.div>
  );
};

export default PartnerDashboardInsights;
