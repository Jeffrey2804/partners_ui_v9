import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  MoreHorizontal,
  Download,
  RefreshCw,
  Target,
  Plus,
  Eye,
  Star,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// --- Accent Color ---
const ACCENT = '#01818E';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const rawMetrics = [
  { label: 'Total Clicks', value: '3,457', data: [3200, 3400, 3500, 3457] },
  { label: 'CTR (Click-Through Rate)', value: '4.8%', data: [3.2, 4.1, 4.3, 4.8] },
  { label: 'Leads Generated', value: '287', data: [240, 260, 275, 287] },
  { label: 'Qualified Leads (MQLs)', value: '134', data: [100, 110, 123, 134] },
  { label: 'Conversion Rate', value: '13.2%', data: [10, 11.5, 12.8, 13.2] },
  { label: 'Appointments Booked', value: '68', data: [50, 58, 63, 68] },
  { label: 'Top Performing Partner', value: 'XYZ Home Warranty' },
];

const PartnerOverviewTable = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const openModal = (metric) => {
    if (metric.data) {
      setSelectedMetric(metric);
    }
  };

  const closeModal = () => setSelectedMetric(null);

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
              <h1 className="text-lg font-bold text-slate-800">Partner Insights & Analytics</h1>
              <p className="text-xs text-slate-500">Real-time performance metrics and insights</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Live data
                </div>
                <div className="text-xs text-slate-400">
                  Updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
            </select>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              <option>All Sources</option>
              <option>Email</option>
              <option>Social</option>
              <option>Referral</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
            >
              <Download className="h-4 w-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Table Header Info */}
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Performance Metrics</h3>
            <p className="text-xs text-slate-600 flex items-center gap-2">
              <span className="font-semibold text-teal-600">{rawMetrics.length}</span> key metrics
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                Real-time
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900">
              Leads: 287
            </div>
            <div className="text-xs text-slate-500">
              Conv: 13.2%
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
      </div>

      {/* Table - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="overflow-x-auto">
          <table className="w-full bg-white">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {loading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-100/50">
                        <td className="px-4 py-3">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-20 bg-slate-200 rounded mx-auto"></div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-12 bg-slate-200 rounded ml-auto"></div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="h-4 w-8 bg-slate-200 rounded ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  : rawMetrics.map((metric, idx) => {
                      const isTop = metric.label === 'Top Performing Partner';
                      return (
                        <motion.tr
                          key={metric.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02, duration: 0.2 }}
                          className={cx(
                            'hover:bg-slate-50 transition-all duration-200 group border-b border-slate-100 last:border-b-0 cursor-pointer',
                            isTop && 'bg-teal-50/50 border-l-2 border-teal-500',
                          )}
                          onClick={() => openModal(metric)}
                        >
                          {/* Metric Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className={cx(
                                  'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs',
                                  isTop
                                    ? 'bg-gradient-to-br from-teal-500 to-teal-600'
                                    : 'bg-gradient-to-br from-slate-500 to-slate-600',
                                )}>
                                  {isTop ? <Award className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                                </div>
                                {!isTop && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                                )}
                              </div>
                              <div>
                                <div className={cx(
                                  'font-semibold text-sm group-hover:text-teal-700 transition-colors duration-200',
                                  isTop ? 'text-teal-700' : 'text-slate-900',
                                )}>
                                  {metric.label}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {isTop ? 'Top performer' : 'Updated now'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Trend Chart */}
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              {!isTop && metric.data ? (
                                <div className="w-16 h-6 group-hover:scale-105 transition-transform duration-200">
                                  <ResponsiveContainer>
                                    <LineChart
                                      data={metric.data.map((v, i) => ({ value: v, name: `Day ${i + 1}` }))}
                                    >
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
                                      <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={ACCENT}
                                        strokeWidth={1.5}
                                        dot={{ r: 1.5, fill: ACCENT }}
                                        activeDot={{ r: 2, fill: ACCENT }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-16 h-6">
                                  <Star className="h-4 w-4 text-teal-500" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Value */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <div className={cx(
                                'text-sm font-bold',
                                isTop ? 'text-teal-600' : 'text-slate-900',
                              )}>
                                {metric.value}
                              </div>
                              {!isTop && (
                                <div className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mt-0.5 border border-green-200">
                                  <TrendingUp className="h-2 w-2 inline mr-0.5" />
                                  Up
                                </div>
                              )}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(metric);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-all duration-200"
                                title="Add to favorites"
                              >
                                <Star className="h-3 w-3" />
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

      {/* Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-auto relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50">
                      <BarChart3 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedMetric.label}
                      </h3>
                      <p className="text-xs text-slate-600">Detailed analytics view</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4">
                <div className="w-full h-48 mb-4">
                  <ResponsiveContainer>
                    <LineChart
                      data={selectedMetric.data?.map((v, i) => ({ value: v, name: `Day ${i + 1}` })) || []}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={ACCENT}
                        strokeWidth={3}
                        dot={{ r: 4, fill: ACCENT, strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 5, fill: ACCENT, strokeWidth: 2, stroke: 'white' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Modal Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-lg font-bold text-green-700">{selectedMetric.value}</div>
                    <div className="text-xs text-green-600">Current</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-lg font-bold text-blue-700">
                      {selectedMetric.data ? `+${((selectedMetric.data[selectedMetric.data.length - 1] / selectedMetric.data[0] - 1) * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-blue-600">Growth</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-lg font-bold text-purple-700">
                      {selectedMetric.data ? Math.max(...selectedMetric.data) : 'N/A'}
                    </div>
                    <div className="text-xs text-purple-600">Peak</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerOverviewTable;
