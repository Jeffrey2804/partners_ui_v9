import { motion } from 'framer-motion';
import MetricCard from '@shared/components/ui/MetricCard';
import { FiTrendingUp, FiUsers, FiMail, FiMousePointer, FiTarget } from 'react-icons/fi';

const metrics = [
  {
    title: 'Email Open Rate',
    value: '58%',
    trend: '+18%',
    delta: '+3.8k this week',
    bg: 'mint',
    icon: FiMail,
    color: 'from-emerald-500 to-teal-600',
    data: [{ value: 35 }, { value: 48 }, { value: 44 }, { value: 58 }, { value: 60 }, { value: 65 }, { value: 58 }],
  },
  {
    title: 'Click-Through Rate',
    value: '24%',
    trend: '+12%',
    delta: '+1.2k this week',
    bg: 'lemon',
    icon: FiMousePointer,
    color: 'from-amber-500 to-orange-600',
    data: [{ value: 18 }, { value: 20 }, { value: 22 }, { value: 26 }, { value: 28 }, { value: 24 }, { value: 27 }],
  },
  {
    title: 'Contact Growth Tracker',
    value: '1.5k',
    trend: '+9%',
    delta: '+140 this week',
    bg: 'sky',
    icon: FiUsers,
    color: 'from-blue-500 to-indigo-600',
    data: [{ value: 900 }, { value: 1000 }, { value: 1200 }, { value: 1300 }, { value: 1350 }, { value: 1400 }, { value: 1500 }],
  },
];

const MarketingSection = () => {
  return (
    <section className="w-full">
      {/* Top Row: Metrics + Purpose Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Cards - All same size */}
        {metrics.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100/50 hover:border-gray-200"
          >
            {/* Enhanced Icon with Gradient */}
            <div className="flex items-center justify-between mb-6">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <metric.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                <FiTrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-700 text-sm font-semibold">{metric.trend}</span>
              </div>
            </div>

            {/* Enhanced Metric Content */}
            <div className="space-y-3">
              <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">
                {metric.title}
              </h3>
              <div className="text-4xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                {metric.value}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-gray-500 text-sm font-medium">
                  {metric.delta}
                </p>
              </div>
            </div>

            {/* Enhanced Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}

        {/* Enhanced Purpose Block - Same size as metric cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100/50 h-full relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#01818E]/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>

            {/* Enhanced Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#01818E] to-cyan-600 flex items-center justify-center shadow-lg">
                <FiTarget className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Marketing Purpose
              </h3>
            </div>

            {/* Enhanced Content */}
            <div className="relative z-10">
              <p className="text-gray-700 text-sm leading-relaxed font-medium">
                The purpose of this project is to have a{' '}
                <span className="text-[#01818E] font-bold">WORKDESK</span> — meaning a place to have Clear and Actionable Items. Wish to put this Statement here to help align what should be In this project.
              </p>

              <div className="mt-4 p-3 bg-white/60 rounded-xl border border-gray-100">
                <p className="text-gray-600 text-xs leading-relaxed">
                  If something is not <span className="font-semibold text-[#01818E]">actionable</span> then we may not want to have it here or we need to present it differently.
                </p>
              </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-gradient-to-br from-[#01818E]/10 to-cyan-500/10 rounded-full"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketingSection;
