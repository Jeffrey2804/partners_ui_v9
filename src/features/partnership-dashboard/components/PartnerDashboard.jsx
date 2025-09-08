// ========================================
// 🎯 MODERNIZED PARTNER DASHBOARD WITH GLASSMORPHISM
// ========================================

import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@shared/components';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import StatsCard from './StatsCard';
import {
  PartnerOverviewTable,
  PartnerLeadsTable,
  LeadConversionFunnel,
  PartnerDashboardInsights,
  TaskManagement,
  CallActivity,
  CalendarWidget,
  CTRAnalyticsChart,
  IntegrationSummary,
  PartnerPipelineSection,
} from '@features';
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Award,
} from 'lucide-react';

const PartnerDashboard = () => {
  // Mock stats data with enhanced visuals
  const stats = [
    {
      title: 'Team Performance',
      value: '94%',
      change: '+3%',
      changeType: 'positive',
      subtitle: 'vs last month',
      icon: Users,
      progress: 94,
      color: 'blue',
    },
    {
      title: 'Monthly Volume',
      value: '$8.2M',
      change: '+15%',
      changeType: 'positive',
      subtitle: 'vs last month',
      icon: TrendingUp,
      progress: 82,
      color: 'green',
    },
    {
      title: 'Active LOs',
      value: '12',
      change: '+1',
      changeType: 'positive',
      subtitle: 'vs last month',
      icon: Target,
      progress: 75,
      color: 'purple',
    },
    {
      title: 'Avg Close Time',
      value: '28d',
      change: '-9%',
      changeType: 'positive',
      subtitle: 'vs last month',
      icon: Clock,
      progress: 68,
      color: 'orange',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <motion.main
        className="flex flex-col gap-8 px-4 sm:px-6 lg:px-8 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

                {/* Partner Pipeline Overview - Featured Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50">
            <PartnerPipelineSection isAdmin={true} />
          </div>

        {/* Stats Grid */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard key={stat.title} {...stat} index={index} />
            ))}
          </div>
        </motion.section>

        {/* Content Sections */}
        <motion.section variants={itemVariants} className="space-y-8">

          {/* Lead Generation */}
          <div className="">
            <PartnerLeadsTable />
          </div>

          {/* Partner Performance - moved below Lead Generation */}
          <div className="">
            <PartnerOverviewTable />
          </div>

          {/* Partner Insights - Image 1 (moved below Lead Generation) */}
          <div className="">
            <PartnerDashboardInsights />
          </div>

          {/* Task Management */}
          <div className="">
            <TaskManagement />
          </div>

          {/* Communication Activity */}
          <div className="">
            <CallActivity />
          </div>

          {/* Calendar Widget */}
          <div className="">
            <CalendarWidget />
          </div>

          {/* CTR Analytics Chart */}
          <div className="">
            <CTRAnalyticsChart />
          </div>

          {/* Lead Conversion Funnel and Integration Summary - Bottom Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50">
              <LeadConversionFunnel />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50">
              <IntegrationSummary />
            </div>
          </div>
        </motion.section>

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 300 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-gradient-to-r from-[#01818E] to-cyan-600 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transition-all duration-300"
          >
            <Mail className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default PartnerDashboard;
