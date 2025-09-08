// ========================================
// 📊 CALL ACTIVITY DASHBOARD (Professional Design)
// - Professional glassmorphism styling consistent with other components
// - Lucide icons for consistency
// - Screen-fitted layout with responsive design
// - TailwindCSS + Framer Motion
// ========================================

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  Voicemail,
  Clock,
  TrendingUp,
  PhoneOff,
  User,
  Filter,
} from 'lucide-react';

export default function CallActivity() {
  // =============================
  // Data (mock)
  // =============================
  const callStats = [
    {
      label: 'Total Calls',
      value: '247',
      change: '+12%',
      changeType: 'positive',
      subtitle: 'vs yesterday',
      icon: Phone,
      color: 'text-[#01818E]',
      bgColor: 'bg-teal-50',
    },
    {
      label: 'Connected',
      value: '189',
      change: '76.5%',
      changeType: 'rate',
      subtitle: 'connection rate',
      icon: PhoneCall,
      color: 'text-[#01818E]',
      bgColor: 'bg-teal-50',
    },
    {
      label: 'Voicemails',
      value: '27',
      change: '31',
      changeType: 'secondary',
      subtitle: 'missed calls',
      icon: Voicemail,
      color: 'text-[#01818E]',
      bgColor: 'bg-teal-50',
    },
    {
      label: 'Avg Duration',
      value: '4:32',
      change: '8:45',
      changeType: 'secondary',
      subtitle: 'longest call',
      icon: Clock,
      color: 'text-[#01818E]',
      bgColor: 'bg-teal-50',
    },
  ];

  const calls = [
    {
      id: 1,
      name: 'Sarah Johnson',
      phone: '555-0123',
      status: 'Connected',
      duration: '8:45',
      agent: 'John Smith',
      time: '10:30 AM',
      type: 'connected',
    },
    {
      id: 2,
      name: 'Mike Chen',
      phone: '555-0124',
      status: 'Connected',
      duration: '3:20',
      agent: 'John Smith',
      time: '10:15 AM',
      type: 'connected',
    },
    {
      id: 3,
      name: 'Lisa Wong',
      phone: '555-0125',
      status: 'Voicemail',
      duration: '0:00',
      agent: 'John Smith',
      time: '9:45 AM',
      type: 'voicemail',
    },
    {
      id: 4,
      name: 'David Smith',
      phone: '555-0126',
      status: 'Missed',
      duration: '0:00',
      agent: 'John Smith',
      time: '9:30 AM',
      type: 'missed',
    },
    {
      id: 5,
      name: 'Jennifer Davis',
      phone: '555-0127',
      status: 'Connected',
      duration: '12:15',
      agent: 'John Smith',
      time: '9:00 AM',
      type: 'connected',
    },
  ];

  // =============================
  // Helpers & derived state
  // =============================
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredCalls = useMemo(() => {
    if (activeFilter === 'All') return calls;
    if (activeFilter === 'Connected') return calls.filter((c) => c.type === 'connected');
    if (activeFilter === 'Voicemail') return calls.filter((c) => c.type === 'voicemail');
    if (activeFilter === 'Missed') return calls.filter((c) => c.type === 'missed');
    return calls;
  }, [activeFilter, calls]);

  const getStatusIcon = (type) => {
    const icons = { connected: PhoneCall, voicemail: Voicemail, missed: PhoneOff };
    return icons[type] || Phone;
  };

  const getStatusColor = (type) => {
    const colors = {
      connected: 'bg-green-100 text-green-800 border-green-200',
      voicemail: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      missed: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getIconBg = (type) => {
    const colors = { connected: 'bg-[#01818E]', voicemail: 'bg-yellow-500', missed: 'bg-red-500' };
    return colors[type] || 'bg-gray-500';
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <Phone className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Communication Activity</h3>
              <p className="text-xs text-slate-500">Call performance and communication metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Live tracking</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {callStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                {stat.changeType === 'positive' && (
                  <div className="flex items-center text-green-600 text-xs font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs font-medium text-slate-700">{stat.label}</div>
                <div className="text-xs text-slate-500">
                  {stat.changeType === 'rate' ? (
                    <span className="text-green-600 font-medium">{stat.change}</span>
                  ) : stat.changeType === 'secondary' ? (
                    <span className="font-medium">{stat.change}</span>
                  ) : null}{' '}
                  {stat.subtitle}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Calls Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Section Header with Filters */}
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <h4 className="text-sm font-bold text-slate-900">Recent Activity</h4>
              <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200">
                {filteredCalls.length} calls
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              <div className="flex gap-1">
                {['All', 'Connected', 'Voicemail', 'Missed'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeFilter === filter
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calls List - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="bg-white">
            <AnimatePresence initial={false}>
              {filteredCalls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-3 p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors duration-200"
                >
                  {/* Status Icon */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    {React.createElement(getStatusIcon(call.type), {
                      size: 14,
                      className: 'text-white',
                    })}
                  </div>

                  {/* Call Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{call.name}</p>
                        <p className="text-xs text-slate-500">{call.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="w-3 h-3" />
                          <span>{call.duration}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(call.type)}`}>
                          {call.status}
                        </span>
                        <span className="text-xs text-slate-500 min-w-0">{call.time}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredCalls.length === 0 && (
              <div className="text-center py-8">
                <PhoneOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-slate-600 text-sm font-medium mb-1">No calls found</div>
                <div className="text-slate-500 text-xs">Try adjusting your filter or check back later</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
