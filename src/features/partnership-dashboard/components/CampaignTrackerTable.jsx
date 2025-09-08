import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Target,
  Eye,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// --- Accent Color ---
const ACCENT = '#01818E';

// Tiny chart per row
const TinyChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={20}>
    <BarChart data={data}>
      <Bar dataKey="value" fill={ACCENT} radius={[2, 2, 0, 0]} />
      <XAxis dataKey="label" hide />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1e293b',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          fontSize: '10px',
          padding: '4px 8px',
        }}
        cursor={false}
      />
    </BarChart>
  </ResponsiveContainer>
);

const CampaignTrackerTable = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [sortKey, setSortKey] = useState('conversion');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCampaigns([
        {
          name: 'ABC Title Co.',
          partner: 67,
          variant: 41,
          ctr: '6.1',
          leads: 53,
          conversion: '14.7',
          performance: 'high',
          chart: [{ label: 'A', value: 10 }, { label: 'B', value: 25 }],
        },
        {
          name: 'HomeShield Warranty',
          partner: 82,
          variant: 52,
          ctr: '3.3',
          leads: 21,
          conversion: '9.4',
          performance: 'medium',
          chart: [{ label: 'A', value: 5 }, { label: 'B', value: 15 }],
        },
        {
          name: 'Premier Home Protection',
          partner: 45,
          variant: 38,
          ctr: '4.8',
          leads: 34,
          conversion: '12.3',
          performance: 'high',
          chart: [{ label: 'A', value: 8 }, { label: 'B', value: 20 }],
        },
      ]);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSort = (key) => {
    setSortKey(key);
    setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const getPerformanceIcon = (perf) => {
    switch (perf) {
      case 'high':
        return { icon: Award, color: 'text-green-600' };
      case 'medium':
        return { icon: AlertCircle, color: 'text-yellow-600' };
      default:
        return { icon: AlertCircle, color: 'text-red-600' };
    }
  };

  const getTag = (perf) => {
    const tagStyles = {
      high: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-red-100 text-red-700 border-red-200',
    };
    return tagStyles[perf];
  };

  const sorted = [...campaigns].sort((a, b) => {
    const aVal = parseFloat(a[sortKey]);
    const bVal = parseFloat(b[sortKey]);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Campaign Performance</h1>
              <p className="text-xs text-slate-500">Real-time campaign tracking and analytics</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  {campaigns.length} active campaigns
                </div>
                <div className="text-xs text-slate-400">
                  Sync: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option>All Campaigns</option>
              <option>High Performance</option>
              <option>Needs Review</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
            >
              <TrendingUp className="h-4 w-4" />
              Analyze
            </motion.button>
          </div>
        </div>
      </div>

      {/* Table Header Info */}
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campaign Overview</h3>
            <p className="text-xs text-slate-600 flex items-center gap-2">
              Performance metrics and conversion analytics
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                Live data
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
            title="Filter options"
          >
            <Filter className="h-3.5 w-3.5" />
          </motion.button>
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

      {/* Table - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="overflow-x-auto">
          <table className="w-full bg-white">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Partner Score
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:text-teal-600 transition-colors"
                  onClick={() => handleSort('ctr')}
                >
                  <div className="flex items-center justify-center gap-1">
                    CTR
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:text-teal-600 transition-colors"
                  onClick={() => handleSort('leads')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Leads
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:text-teal-600 transition-colors"
                  onClick={() => handleSort('conversion')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Conversion
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-100/50">
                        <td className="px-4 py-3">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-12 bg-slate-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-12 bg-slate-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-12 bg-slate-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-8 bg-slate-200 rounded ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  : sorted.map((campaign, idx) => {
                      const { icon: PerformanceIcon, color } = getPerformanceIcon(campaign.performance);
                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02, duration: 0.2 }}
                          className="hover:bg-slate-50 transition-all duration-200 group cursor-pointer"
                        >
                          {/* Campaign Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-bold text-xs">
                                  <Target className="h-4 w-4" />
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                                  {campaign.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Variant: {campaign.variant}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Partner Score */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-sm font-bold text-slate-900">
                                {campaign.partner}
                              </div>
                              <PerformanceIcon className={`h-3 w-3 ${color}`} />
                            </div>
                          </td>

                          {/* CTR */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-sm font-bold text-slate-900">
                                {campaign.ctr}%
                              </div>
                              <div className="w-12 mt-1">
                                <TinyChart data={campaign.chart} />
                              </div>
                            </div>
                          </td>

                          {/* Leads */}
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm font-bold text-slate-900">
                              {campaign.leads}
                            </div>
                            <div className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mt-0.5 border border-green-200">
                              <TrendingUp className="h-2 w-2 inline mr-0.5" />
                              Active
                            </div>
                          </td>

                          {/* Conversion Rate */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getTag(campaign.performance)}`}>
                                {campaign.conversion}%
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                title="Optimize"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-200/60 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-900">
              {campaigns.length}
            </div>
            <div className="text-xs text-slate-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-green-600">
              {campaigns.filter(c => c.performance === 'high').length}
            </div>
            <div className="text-xs text-slate-600">High Performers</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-teal-600">
              {campaigns.reduce((acc, c) => acc + parseInt(c.leads), 0)}
            </div>
            <div className="text-xs text-slate-600">Total Leads</div>
          </div>
        </div>

        <div className="mt-3 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-3 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md"
          >
            View Full Report
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CampaignTrackerTable;
