// ========================================
// 🔔 NOTIFICATION ITEM
// ========================================
// Individual notification component with professional styling
// Features:
// - Professional design with glass morphism effect
// - Type-specific colors and icons
// - Progress bar for auto-dismiss notifications
// - Action buttons for interactive notifications
// - Loading spinner for loading states
// - Responsive design
// ========================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiAlertTriangle, FiInfo, FiLoader } from 'react-icons/fi';
import { NOTIFICATION_TYPES } from '@constants/notifications';

// ========================================
// 🎯 TYPE CONFIGURATIONS
// ========================================

const getTypeConfig = (type) => {
  const configs = {
    [NOTIFICATION_TYPES.SUCCESS]: {
      bgColor: 'bg-green-50/95 border-green-200/80',
      textColor: 'text-green-800',
      titleColor: 'text-green-900',
      iconColor: 'text-green-600',
      progressColor: 'bg-green-500',
      icon: FiCheck,
    },
    [NOTIFICATION_TYPES.ERROR]: {
      bgColor: 'bg-red-50/95 border-red-200/80',
      textColor: 'text-red-800',
      titleColor: 'text-red-900',
      iconColor: 'text-red-600',
      progressColor: 'bg-red-500',
      icon: FiX,
    },
    [NOTIFICATION_TYPES.WARNING]: {
      bgColor: 'bg-yellow-50/95 border-yellow-200/80',
      textColor: 'text-yellow-800',
      titleColor: 'text-yellow-900',
      iconColor: 'text-yellow-600',
      progressColor: 'bg-yellow-500',
      icon: FiAlertTriangle,
    },
    [NOTIFICATION_TYPES.INFO]: {
      bgColor: 'bg-blue-50/95 border-blue-200/80',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900',
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500',
      icon: FiInfo,
    },
    [NOTIFICATION_TYPES.LOADING]: {
      bgColor: 'bg-gray-50/95 border-gray-200/80',
      textColor: 'text-gray-800',
      titleColor: 'text-gray-900',
      iconColor: 'text-gray-600',
      progressColor: 'bg-gray-500',
      icon: FiLoader,
    },
  };

  return configs[type] || configs[NOTIFICATION_TYPES.INFO];
};

// ========================================
// 🎯 PROGRESS BAR COMPONENT
// ========================================

const ProgressBar = ({ duration, onComplete, type, paused = false }) => {
  const [progress, setProgress] = useState(100);
  const config = getTypeConfig(type);

  useEffect(() => {
    if (duration <= 0 || paused) return;

    const interval = 50; // Update every 50ms
    const decrement = (100 * interval) / duration;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onComplete, paused]);

  if (duration <= 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 rounded-b-lg overflow-hidden">
      <motion.div
        className={`h-full ${config.progressColor} rounded-b-lg`}
        style={{ width: `${progress}%` }}
        initial={{ width: '100%' }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};

// ========================================
// 🎯 NOTIFICATION ITEM COMPONENT
// ========================================

const NotificationItem = ({ notification, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = getTypeConfig(notification.type);
  const IconComponent = config.icon;

  const handleRemove = () => {
    onRemove?.(notification.id);
  };

  const isLoading = notification.type === NOTIFICATION_TYPES.LOADING;

  return (
    <motion.div
      className={`
        relative min-w-[320px] max-w-[400px] p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${config.bgColor}
        hover:shadow-xl transition-all duration-200 ease-out
        cursor-pointer
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Main Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <IconComponent className="w-5 h-5" />
            </motion.div>
          ) : (
            <IconComponent className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {notification.title && (
            <h4 className={`font-semibold text-sm leading-tight ${config.titleColor}`}>
              {notification.title}
            </h4>
          )}

          {/* Message */}
          <p className={`text-sm leading-relaxed ${config.textColor} ${notification.title ? 'mt-1' : ''}`}>
            {notification.message}
          </p>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${action.variant === 'primary'
                      ? `${config.progressColor.replace('bg-', 'bg-')} text-white hover:opacity-90`
                      : 'bg-white/80 text-gray-700 hover:bg-white border border-gray-200'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <motion.button
          onClick={handleRemove}
          className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
            text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors
            ${isHovered ? 'opacity-100' : 'opacity-60'}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiX className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        duration={notification.duration}
        onComplete={handleRemove}
        type={notification.type}
        paused={isHovered}
      />

      {/* Custom Icon Overlay (if provided) */}
      {notification.icon && (
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm">
          {notification.icon}
        </div>
      )}
    </motion.div>
  );
};

export default NotificationItem;
