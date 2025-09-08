import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFilter, FiTrendingUp, FiUsers, FiPieChart } from 'react-icons/fi';

const CampaignSection = () => {
  const [activePoint, setActivePoint] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const lineData = [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 60 },
    { name: 'Apr', value: 75 },
    { name: 'May', value: 90 },
    { name: 'Jun', value: 110 },
    { name: 'Jul', value: 130 },
    { name: 'Aug', value: 150 },
    { name: 'Sep', value: 170 },
    { name: 'Oct', value: 190 },
    { name: 'Nov', value: 210 },
    { name: 'Dec', value: 230 },
  ];

  const pieData = [
    { name: 'Facebook ads', value: 158, color: '#f87171' },
    { name: 'Health and Careness', value: 222, color: '#a78bfa' },
    { name: 'Lorem ipsum', value: 291, color: '#facc15' },
  ];

  const totalLeads = pieData.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    const timer = setTimeout(() => setActivePoint(null), 3000);
    return () => clearTimeout(timer);
  }, [activePoint]);

  const axisColor = '#64748b';
  const tooltipBg = '#ffffff';
  const tooltipText = '#0f172a';

  return (
    <section className="w-full">
      {/* Bottom Row: Two Charts Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Enhanced Line Chart - Left Side (1/2 width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300"
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Campaign Performance
                </h3>
                <p className="text-gray-500 text-sm">Monthly lead generation trends</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open('/api/export-campaigns/csv', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all shadow-sm text-sm font-medium"
              >
                <FiDownload className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                <FiFilter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Enhanced Chart Container */}
          <div className="w-full h-80 bg-gradient-to-br from-gray-50/30 to-transparent rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                onMouseMove={(e) => setActivePoint(e?.activePayload?.[0]?.payload?.name)}
              >
                <XAxis dataKey="name" stroke={axisColor} />
                <YAxis stroke={axisColor} />
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    color: tooltipText,
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#01818E"
                  strokeWidth={4}
                  dot={({ cx, cy }) => (
                    <circle
                      key={`${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="white"
                      stroke="#01818E"
                      strokeWidth={3}
                      className="drop-shadow-lg"
                    />
                  )}
                  activeDot={{ r: 10, stroke: '#01818E', strokeWidth: 3 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Active Point Display */}
          {activePoint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-[#01818E]/5 to-cyan-500/5 rounded-xl border border-[#01818E]/10"
            >
              <span className="text-sm text-gray-600 font-medium">Active Point:</span>
              <span className="text-sm font-bold text-[#01818E] bg-white px-3 py-1 rounded-full shadow-sm">{activePoint}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Donut Chart - Right Side (1/2 width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300"
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <FiPieChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Lead Source Breakdown
                </h3>
                <p className="text-gray-500 text-sm">Distribution across channels</p>
              </div>
            </div>
          </div>

          {/* Enhanced Chart Layout */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="relative w-full max-w-[280px] h-[280px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {pieData.map((entry, index) => (
                      <linearGradient id={`grad-${index}`} key={`grad-${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    onMouseEnter={(_, i) => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#grad-${index})`}
                        stroke="#fff"
                        strokeWidth={hoveredIndex === index ? 4 : 2}
                        style={{
                          transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                          filter: hoveredIndex === index ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' : 'none',
                          transformOrigin: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Enhanced Legend */}
            <div className="flex-1 space-y-4">
              {pieData.map((entry, index) => (
                <motion.div
                  key={`legend-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    hoveredIndex === index ? 'bg-gray-50 shadow-md' : 'bg-gray-25'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="w-5 h-5 rounded-full shadow-lg"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${entry.color}, ${entry.color}99)`,
                      }}
                    />
                    <span className="font-semibold text-gray-900">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">{entry.value.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 font-medium">
                      {((entry.value / totalLeads) * 100).toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
            <span className="text-sm text-gray-600 font-medium">Last updated: just now</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live data</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CampaignSection;
