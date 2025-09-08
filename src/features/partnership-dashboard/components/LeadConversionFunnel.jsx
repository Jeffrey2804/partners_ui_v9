import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveFunnel } from '@nivo/funnel';
import { TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

const rawData = [
  { id: 'Clicks', value: 100 },
  { id: 'Landing Page Views', value: 85 },
  { id: 'Form Submissions', value: 47 },
  { id: 'Qualified Leads', value: 25 },
  { id: 'Booked Appointments', value: 15 },
  { id: 'Closed/Won Deals', value: 8 },
];

const FunnelSkeleton = () => (
  <div className="relative h-[400px] w-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-200/70 to-gray-300/50 animate-pulse">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
  </div>
);

const LeadConversionFunnel = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const data = useMemo(() => {
    return rawData.map((step) => ({
      ...step,
      percentage: ((step.value / rawData[0].value) * 100).toFixed(0),
    }));
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Lead Conversion Funnel</h3>
              <p className="text-xs text-slate-500">Monthly lead generation trends & conversion analytics</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Live tracking
                </div>
                <div className="text-xs text-slate-400">
                  Updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium">Real-time data</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 border-b border-slate-200/60 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-700">Total Leads</span>
            </div>
            <div className="text-xl font-bold text-slate-900">100</div>
            <div className="text-xs text-slate-500">Starting volume</div>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-700">Conversion Rate</span>
            </div>
            <div className="text-xl font-bold text-slate-900">8%</div>
            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +1.2% vs last period
            </div>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-700">Deals Closed</span>
            </div>
            <div className="text-xl font-bold text-slate-900">8</div>
            <div className="text-xs text-slate-500">Won opportunities</div>
          </div>
        </div>
      </div>

      {/* Funnel Chart - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4">
          <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Conversion Funnel</h4>
                <p className="text-xs text-slate-600">Lead progression through sales stages</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Active
              </div>
            </div>

            <div className="w-full h-[350px] bg-white rounded-lg border border-slate-200/50 p-2">
              {isLoading ? (
                <FunnelSkeleton />
              ) : (
                <ResponsiveFunnel
                  data={data}
                  margin={{ top: 15, right: 60, bottom: 15, left: 60 }}
                  spacing={6}
                  shapeBlending={0.7}
                  direction="vertical"
                  valueFormat={(v) => `${v}%`}
                  labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
                  labelPosition="inside"
                  labelOffset={-6}
                  borderWidth={1}
                  borderColor="#0f766e"
                  motionConfig="wobbly"
                  defs={[
                    {
                      id: 'tealGradient',
                      type: 'linearGradient',
                      colors: [
                        { offset: 0, color: '#0f766e' },
                        { offset: 100, color: '#0d9488' },
                      ],
                    },
                  ]}
                  fill={[
                    {
                      match: '*',
                      id: 'tealGradient',
                    },
                  ]}
                  theme={{
                    labels: {
                      text: {
                        fontSize: 11,
                        fontWeight: 600,
                        fill: '#ffffff',
                      },
                    },
                  }}
                  tooltip={({ part }) => (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
                      <div className="font-semibold text-white mb-1">{part.data.id}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                        <span className="text-slate-200">{part.data.value} leads ({part.data.percentage}%)</span>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Drop-off Analysis</span>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Clicks → Landing</span>
                  <span className="font-medium text-slate-900">15% loss</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Landing → Form</span>
                  <span className="font-medium text-slate-900">45% loss</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Form → Qualified</span>
                  <span className="font-medium text-slate-900">47% loss</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Optimization Score</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 mb-1">82/100</div>
              <div className="text-xs text-green-600 font-medium">Good performance</div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div className="bg-gradient-to-r from-teal-500 to-green-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadConversionFunnel;
