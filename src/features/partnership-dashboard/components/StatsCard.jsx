import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

const StatsCard = ({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  progress,
  color = 'blue',
  index = 0,
}) => {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      progressColor: 'bg-blue-500',
      iconColor: 'text-blue-600',
    },
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      progressColor: 'bg-emerald-500',
      iconColor: 'text-emerald-600',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      progressColor: 'bg-purple-500',
      iconColor: 'text-purple-600',
    },
    orange: {
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-orange-50',
      progressColor: 'bg-orange-500',
      iconColor: 'text-amber-600',
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      progressColor: 'bg-red-500',
      iconColor: 'text-red-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.25, 0, 1],
      }}
      className="group relative bg-white rounded-xl p-4 border border-slate-200/60 hover:border-slate-300/60 hover:shadow-sm transition-all duration-200"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bgColor} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        {change && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
            <FiTrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">{change}</span>
          </div>
        )}
      </div>

      {/* Compact Content */}
      <div className="space-y-2">
        <h3 className="text-slate-600 text-xs font-medium uppercase tracking-wide">
          {title}
        </h3>
        <div className="text-2xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
          {value}
        </div>
        {subtitle && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-slate-500 text-xs font-medium">
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Compact Progress Bar */}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${colors.progressColor} transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Subtle Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </motion.div>
  );
};

export default StatsCard;
