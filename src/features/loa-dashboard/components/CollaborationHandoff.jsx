// ========================================
// 🎯 LOADashboard COLLABORATION & HANDOFF COMPONENT
// ========================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Handshake,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  User,
  Building,
} from 'lucide-react';

const CollaborationHandoff = () => {
  const [activeTab, setActiveTab] = useState('conventional');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  // Quick Stats Data
  const stats = [
    { label: 'Active Handoffs', value: '8', icon: Handshake, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Pending Reviews', value: '3', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { label: 'Completed', value: '12', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Blocked', value: '2', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
  ];

  // Tab Data
  const tabs = [
    { id: 'conventional', label: 'Conventional Loans', count: 10 },
    { id: 'fha', label: 'FHA Loans', count: 12 },
    { id: 'va', label: 'VA Loans', count: 14 },
    { id: 'usda', label: 'USDA Loans', count: 16 },
  ];

  // Collaboration Data
  const collaborations = [
    {
      id: 1,
      contact: 'Leo Martinez',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      role: 'Loan Officer',
      loanNumber: 'LN-2024-001',
      progress: 'ready',
      stage: 'Underwriting',
      updates: 'All documents submitted and verified. Credit score: 745. Income verified. Ready for underwriting review.',
      priority: 'high',
      dueDate: 'Jan 20, 2024',
    },
    {
      id: 2,
      contact: 'Susan Lawrence',
      avatar: 'https://randomuser.me/api/portraits/women/49.jpg',
      role: 'Processor',
      loanNumber: 'LN-2024-002',
      progress: 'in-progress',
      stage: 'Processing',
      updates: 'Waiting for additional bank statements. Client has been notified. Expected completion: 2 days.',
      priority: 'medium',
      dueDate: 'Jan 22, 2024',
    },
    {
      id: 3,
      contact: 'Michael Chen',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      role: 'Underwriter',
      loanNumber: 'LN-2024-003',
      progress: 'blocked',
      stage: 'Underwriting',
      updates: 'Appraisal review required. Property value discrepancy found. Need additional documentation.',
      priority: 'high',
      dueDate: 'Jan 18, 2024',
    },
    {
      id: 4,
      contact: 'Jennifer Davis',
      avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      role: 'Loan Officer',
      loanNumber: 'LN-2024-004',
      progress: 'completed',
      stage: 'Closing',
      updates: 'Loan approved and cleared to close. All conditions satisfied. Closing scheduled for Jan 25th.',
      priority: 'low',
      dueDate: 'Jan 25, 2024',
    },
    {
      id: 5,
      contact: 'Robert Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
      role: 'Processor',
      loanNumber: 'LN-2024-005',
      progress: 'ready',
      stage: 'Processing',
      updates: 'Initial review complete. All required documents received. Ready for underwriting submission.',
      priority: 'medium',
      dueDate: 'Jan 21, 2024',
    },
  ];

  const getProgressButton = (progress) => {
    switch (progress) {
      case 'ready':
        return (
          <button className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full hover:bg-green-700 transition-colors">
            <CheckCircle className="w-3 h-3" />
            READY FOR NEXT STAGE
          </button>
        );
      case 'in-progress':
        return (
          <button className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors">
            <Clock className="w-3 h-3" />
            IN PROGRESS
          </button>
        );
      case 'blocked':
        return (
          <button className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full hover:bg-red-700 transition-colors">
            <AlertTriangle className="w-3 h-3" />
            BLOCKED
          </button>
        );
      case 'completed':
        return (
          <button className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            COMPLETED
          </button>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Loan Officer': return <User className="w-4 h-4 text-blue-500" />;
      case 'Processor': return <Building className="w-4 h-4 text-green-500" />;
      case 'Underwriter': return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Handshake className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Collaboration & Handoff</h1>
              <p className="text-xs text-slate-500">Track team collaboration and loan transitions</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" />
            New Handoff
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-3 border border-slate-200/60 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 border-b border-slate-200/60">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search collaborations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
            >
              <option value="all">All Stages</option>
              <option value="processing">Processing</option>
              <option value="underwriting">Underwriting</option>
              <option value="closing">Closing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collaboration List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-2">
          {collaborations.map((collab, index) => (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex items-center gap-3 p-4 border border-slate-200/60 rounded-lg hover:bg-slate-50 hover:border-slate-300/60 transition-all duration-200 cursor-pointer bg-white"
            >
              {/* Contact Info */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="relative">
                  <img
                    src={collab.avatar}
                    alt={collab.contact}
                    className="w-10 h-10 rounded-full border-2 border-slate-200"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getRoleIcon(collab.role)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{collab.contact}</h3>
                  <p className="text-xs text-slate-500">{collab.role}</p>
                  <p className="text-xs text-slate-400">{collab.loanNumber}</p>
                </div>
              </div>

              {/* Progress Status */}
              <div className="flex-shrink-0">
                {getProgressButton(collab.progress)}
              </div>

              {/* Updates and Stage */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-slate-800 text-sm">{collab.stage}</h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{collab.dueDate}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">{collab.updates}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(collab.priority)}`}>
                    {collab.priority}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollaborationHandoff;
