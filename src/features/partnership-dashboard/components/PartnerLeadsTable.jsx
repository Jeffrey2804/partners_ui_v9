import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  PauseCircle,
  Clock,
  ArrowUpDown,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Filter,
  RefreshCw,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit3,
  ChevronDown,
  Download,
  Star,
} from 'lucide-react';

// --- Accent Color ---
const ACCENT = '#01818E';

const cx = (...classes) => classes.filter(Boolean).join(' ');

// --- Utility Functions ---

// --- Enhanced Data ---
const leadsData = [
  {
    id: 1,
    partner: 'ABC Title Co.',
    leads: 67,
    mqls: 41,
    cpl: 12.5,
    source: 'Co-branded email',
    status: 'Active',
    url: '#',
    performance: 85,
    lastActivity: '2 hours ago',
    revenue: 45200,
    conversion: 61.2,
  },
  {
    id: 2,
    partner: 'HomeShield Warranty',
    leads: 82,
    mqls: 52,
    cpl: 9.1,
    source: 'Paid Meta Ads',
    status: 'Pending',
    url: '#',
    performance: 92,
    lastActivity: '1 hour ago',
    revenue: 52800,
    conversion: 63.4,
  },
  {
    id: 3,
    partner: 'RateCompare Pro',
    leads: 138,
    mqls: 37,
    cpl: 15.7,
    source: 'GMB/Web',
    status: 'Paused',
    url: '#',
    performance: 78,
    lastActivity: '5 hours ago',
    revenue: 38900,
    conversion: 26.8,
  },
];

const statusIcon = {
  Active: <CheckCircle size={16} className="text-green-500" />,
  Pending: <Clock size={16} className="text-yellow-500" />,
  Paused: <PauseCircle size={16} className="text-red-500" />,
};

const prettyCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

export default function PartnerLeadsDashboard() {
  // search + filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(['All']);
  const [sourceFilter, setSourceFilter] = useState('All');

  // sorting
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    const saved = localStorage.getItem('partner-dashboard:search');
    if (saved) setSearch(saved);
  }, []);
  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem('partner-dashboard:search', search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const sources = useMemo(() => ['All', ...Array.from(new Set(leadsData.map((d) => d.source)))], []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leadsData.filter((d) => {
      const matchesText = !needle || d.partner.toLowerCase().includes(needle) || d.source.toLowerCase().includes(needle);
      const matchesStatus = statusFilter.includes('All') || statusFilter.length === 0 ? true : statusFilter.includes(d.status);
      const matchesSource = sourceFilter === 'All' ? true : d.source === sourceFilter;
      return matchesText && matchesStatus && matchesSource;
    });
  }, [search, statusFilter, sourceFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered].sort((a, b) => {
      const A = a[sortKey];
      const B = b[sortKey];
      if (typeof A === 'number' && typeof B === 'number') return A - B;
      return String(A).localeCompare(String(B));
    });
    return sortDir === 'asc' ? arr : arr.reverse();
  }, [filtered, sortKey, sortDir]);

  const columns = [
    { key: 'partner', label: 'Partner' },
    { key: 'leads', label: 'Leads' },
    { key: 'mqls', label: 'MQLs' },
    { key: 'conversion', label: 'Conversion' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'cpl', label: 'CPL' },
    { key: 'status', label: 'Status' },
  ];

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Lead Generation & Management</h1>
              <p className="text-xs text-slate-500">Track and optimize partner lead performance</p>
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add Partner
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search partners..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={statusFilter[0] || 'All'}
              onChange={(e) => setStatusFilter([e.target.value])}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {['All', 'Active', 'Pending', 'Paused'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearch('');
                setStatusFilter(['All']);
                setSourceFilter('All');
              }}
              className="p-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              title="Reset filters"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Table Header Info */}
      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Partner Performance</h3>
          <p className="text-xs text-slate-600">
            {sorted.length} of {leadsData.length} partners
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-900">
            {prettyCurrency(sorted.reduce((sum, p) => sum + p.revenue, 0))}
          </div>
          <div className="text-xs text-slate-500">
            Avg: {(sorted.reduce((sum, p) => sum + p.conversion, 0) / sorted.length || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Table - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="overflow-x-auto">
          <table className="w-full bg-white">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => onSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {sorted.map((partner, idx) => (
                  <motion.tr
                    key={partner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="hover:bg-slate-50 group transition-colors"
                  >
                    {/* Partner */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {partner.partner.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{partner.partner}</div>
                          <div className="text-xs text-slate-500">{partner.lastActivity}</div>
                        </div>
                      </div>
                    </td>

                    {/* Leads */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm">{partner.leads}</div>
                    </td>

                    {/* MQLs */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm">{partner.mqls}</div>
                    </td>

                    {/* Conversion */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-slate-900 text-sm">{partner.conversion}%</div>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(partner.conversion, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm">{prettyCurrency(partner.revenue)}</div>
                    </td>

                    {/* CPL */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm">{prettyCurrency(partner.cpl)}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        partner.status === 'Active'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : partner.status === 'Pending'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {statusIcon[partner.status]}
                        {partner.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="View"
                        >
                          <Eye className="h-3 w-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                          title="Edit"
                        >
                          <Edit3 className="h-3 w-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-all"
                          title="Favorite"
                        >
                          <Star className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="text-slate-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-sm">No partners found</p>
                      <p className="text-xs">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
