import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiRepeat,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';

const CalendarQuickActions = ({ onActionSelect, selectedDate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      id: 'meeting',
      title: 'Schedule Meeting',
      description: 'Book a meeting with clients or team',
      icon: FiUser,
      color: 'blue',
      duration: '60min',
    },
    {
      id: 'call',
      title: 'Phone Call',
      description: 'Schedule a phone call',
      icon: FiClock,
      color: 'green',
      duration: '30min',
    },
    {
      id: 'consultation',
      title: 'Consultation',
      description: 'Client consultation session',
      icon: FiCalendar,
      color: 'purple',
      duration: '90min',
    },
    {
      id: 'followup',
      title: 'Follow-up',
      description: 'Follow-up appointment',
      icon: FiRepeat,
      color: 'orange',
      duration: '30min',
    },
    {
      id: 'block',
      title: 'Block Time',
      description: 'Block off time (vacation, busy)',
      icon: FiXCircle,
      color: 'red',
      duration: 'custom',
    },
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
      orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
      red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    };
    return colorMap[color] || colorMap.blue;
  };

  const handleActionClick = (action) => {
    onActionSelect(action);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm"
      >
        <FiCalendar className="w-4 h-4" />
        Quick Actions
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[300px]"
        >
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-600">
              {selectedDate ? `For ${new Date(selectedDate).toLocaleDateString()}` : 'Select a date first'}
            </p>
          </div>

          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={!selectedDate}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                  selectedDate
                    ? getColorClasses(action.color)
                    : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedDate ? 'bg-white/50' : 'bg-gray-100'
                }`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
                <div className="text-xs font-medium bg-white/50 px-2 py-1 rounded">
                  {action.duration}
                </div>
              </button>
            ))}
          </div>

          {!selectedDate && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <FiAlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Please select a date first</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default CalendarQuickActions;
