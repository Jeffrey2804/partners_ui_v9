import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  FlaskConical,
  Info,
  ChevronDown,
  CheckCircle2,
  Star,
  Target,
  TrendingUp,
  Eye,
  MoreHorizontal,
} from 'lucide-react';

// --- Accent Color ---
const ACCENT = '#01818E';

const tasks = [
  {
    icon: AlertTriangle,
    text: 'Underperforming partner flagged (CTR < 2%)',
    status: 'warning',
    priority: 'high',
    description: 'This partner has a click-through rate below 2% over the last 14 days. Review creatives or pause underperforming sources.',
  },
  {
    icon: Search,
    text: 'Campaigns with low conversion needing review',
    status: 'attention',
    priority: 'medium',
    description: 'Review your call-to-action, lead forms, and offer relevance. Conversion rates have dropped below target.',
  },
  {
    icon: FlaskConical,
    text: 'Suggested tests (CTA, landing page, offer)',
    status: 'experiment',
    priority: 'medium',
    description: 'Try A/B testing your call-to-action buttons, adjust landing copy, or experiment with limited-time bonuses.',
  },
];

const highPerformers = [
  { name: 'Premium Home Solutions', performance: '94%', trend: 'up' },
  { name: 'Elite Property Services', performance: '89%', trend: 'up' },
  { name: 'TopTier Home Warranty', performance: '87%', trend: 'stable' },
];

const PartnerRecommendations = () => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <Target className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Actionable Tasks & Recommendations</h1>
              <p className="text-xs text-slate-500">Real-time insights and optimization suggestions</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                  {tasks.length} active tasks
                </div>
                <div className="text-xs text-slate-400">
                  Updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option>All Priorities</option>
              <option>High Priority</option>
              <option>Medium Priority</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </motion.button>
          </div>
        </div>
      </div>

      {/* Table Header Info */}
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Recommendations</h3>
            <p className="text-xs text-slate-600 flex items-center gap-2">
              Priority tasks requiring your attention
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs border border-orange-200">
                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                Action needed
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
            title="More options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Tasks List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        <AnimatePresence>
          {tasks.map((task, idx) => {
            const IconComponent = task.icon;
            const statusColors = {
              warning: 'from-red-500 to-orange-600',
              attention: 'from-yellow-500 to-orange-600',
              experiment: 'from-teal-500 to-teal-600',
            };

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.02, duration: 0.2 }}
                className="group bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${statusColors[task.status]} text-white`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                        {task.text}
                      </h4>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-all duration-200"
                      title="View details"
                    >
                      <Eye className="h-3 w-3" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-200"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* High Performers Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900">High-Performing Partners</h4>
                <p className="text-xs text-slate-600">Ready for scaling opportunities</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-2">
            {highPerformers.map((partner, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-3 h-3 text-teal-600 rounded focus:ring-teal-500"
                    style={{ accentColor: ACCENT }}
                    defaultChecked={i < 2}
                  />
                  <span className="text-sm font-medium text-slate-800">{partner.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-600">{partner.performance}</span>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerRecommendations;
