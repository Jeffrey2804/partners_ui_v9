import React, { useState } from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { BsSpeedometer2 } from 'react-icons/bs';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import StatModal from './StatModal';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6, ease: 'easeOut' },
  }),
};

const chartData = [
  [{ value: 68 }, { value: 72 }, { value: 75 }, { value: 78 }, { value: 82 }],
  [{ value: 5 }, { value: 8 }, { value: 6 }, { value: 4 }, { value: 7 }],
  [{ value: 12 }, { value: 10 }, { value: 8 }, { value: 9 }, { value: 7 }],
];

const QuickStats = () => {
  const [selectedStat, setSelectedStat] = useState(null);

  const stats = [
    {
      title: '% of loans on schedule',
      icon: <BsSpeedometer2 className="text-xl" />,
      value: <CountUp end={82} duration={2} suffix="%" />,
      valueText: '82%',
      trend: 'up',
      badge: 'Up 6% this week',
      chart: chartData[0],
      color: 'blue',
    },
    {
      title: 'Top overdue files',
      icon: <FaExclamationTriangle className="text-xl" />,
      value: '—',
      valueText: '—',
      trend: 'down',
      badge: 'Down from last week',
      chart: chartData[1],
      color: 'amber',
    },
    {
      title: 'Avg days in processing',
      icon: <FiClock className="text-xl" />,
      value: '—',
      valueText: '—',
      trend: 'up',
      badge: 'Up by 2 days',
      chart: chartData[2],
      color: 'green',
    },
  ];

  return (
    <section className="space-y-6 bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200/50 shadow-sm">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          Quick Stats
        </h2>
        <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => setSelectedStat(stat)}
            className="group relative overflow-hidden cursor-pointer p-6 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg"
          >
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${
              stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
              stat.color === 'amber' ? 'from-amber-500 to-orange-500' :
              'from-emerald-500 to-green-600'
            }`}></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {stat.icon}
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    stat.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {stat.badge}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-medium text-slate-600 mb-3 leading-tight">
                {stat.title}
              </h3>

              {/* Value */}
              <div className="mb-4">
                <p
                  className={`text-3xl font-bold leading-none ${
                    stat.value === '—'
                      ? 'text-slate-400 text-2xl'
                      : 'text-slate-800'
                  }`}
                >
                  {stat.value}
                </p>
              </div>

              {/* Chart */}
              <div className="h-12 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stat.chart}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#fff',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={
                        stat.color === 'blue' ? '#3b82f6' :
                        stat.color === 'amber' ? '#f59e0b' :
                        '#10b981'
                      }
                      strokeWidth={2.5}
                      dot={false}
                      strokeLinecap="round"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <StatModal
        open={!!selectedStat}
        onClose={() => setSelectedStat(null)}
        stat={selectedStat}
      />
    </section>
  );
};

export default QuickStats;
