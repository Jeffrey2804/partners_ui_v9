import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Filter,
  Eye,
  MousePointer,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Sample data for CTR analytics
const sampleData = [
  { name: 'Partner A', value: 12.4 },
  { name: 'Partner B', value: 8.7 },
  { name: 'Partner C', value: 15.2 },
  { name: 'Partner D', value: 20.1 },
  { name: 'Partner E', value: 9.8 },
  { name: 'Partner F', value: 14.6 },
];

const colors = ['#01818E', '#026B75', '#00A3B5', '#4ECDC4', '#45B7AA', '#3A9B8A'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-[#01818E]">
          CTR: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const CTRAnalyticsChart = () => {
  const [selectedFilter, setSelectedFilter] = useState('CTR by Product Partner');

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Clean Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#01818E] to-[#026B75] rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
              <p className="text-sm text-gray-600">Monthly lead generation trends</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-[#01818E]" />
              <span>Live data</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#01818E]" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>CTR by Product Partner</option>
                <option>CTR by Campaign</option>
                <option>CTR by Channel</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <div className="text-2xl font-bold text-gray-900">14.4%</div>
            <div className="text-sm text-gray-600">Average CTR</div>
            <div className="text-xs text-green-600 font-medium">+2.3% vs last week</div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <div className="text-2xl font-bold text-gray-900">20.1%</div>
            <div className="text-sm text-gray-600">Best Performer</div>
            <div className="text-xs text-gray-500">Partner D</div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <div className="text-2xl font-bold text-gray-900">1,247</div>
            <div className="text-sm text-gray-600">Total Clicks</div>
            <div className="text-xs text-[#01818E] font-medium">+18% growth</div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <div className="text-2xl font-bold text-gray-900">8,634</div>
            <div className="text-sm text-gray-600">Impressions</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sampleData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                formatter={(value, entry, index) => (
                  <span className="text-sm font-medium" style={{ color: colors[index] }}>
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {sampleData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CTRAnalyticsChart;
