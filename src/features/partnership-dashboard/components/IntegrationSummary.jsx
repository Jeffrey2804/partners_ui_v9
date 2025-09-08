import React from 'react';
import { Link, Plug, BarChart3, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

const IntegrationSummary = () => {
  const integrationGroups = [
    {
      title: 'CRM LEAD SYNCS',
      integrations: [
        ['GHL', 'WARNING', 'yellow'],
        ['HubSpot', 'DISCONNECTED', 'red'],
        ['Salesforce', 'SYNCED', 'green'],
      ],
    },
    {
      title: 'EMAIL PLATFORMS',
      integrations: [
        ['Mailchimp', 'WARNING', 'yellow'],
        ['ActiveCampaign', 'DISCONNECTED', 'red'],
      ],
    },
    {
      title: 'AD PLATFORMS',
      integrations: [
        ['Meta', 'WARNING', 'yellow'],
        ['Google', 'DISCONNECTED', 'red'],
        ['LinkedIn', 'SYNCED', 'green'],
      ],
    },
  ];

  const statusConfig = {
    SYNCED: {
      tooltip: 'Connection is active and fully synced.',
      base: 'bg-green-600 text-white',
      glow: 'shadow-[0_0_8px_rgba(34,197,94,0.4)]',
      icon: CheckCircle,
    },
    WARNING: {
      tooltip: 'Sync issue detected — review settings.',
      base: 'bg-yellow-400 text-black',
      glow: 'shadow-[0_0_8px_rgba(250,204,21,0.4)]',
      icon: AlertTriangle,
    },
    DISCONNECTED: {
      tooltip: 'Disconnected — needs reauthentication.',
      base: 'bg-red-600 text-white',
      glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      icon: XCircle,
    },
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden h-full flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg">
              <Plug className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Integration Status</h3>
              <p className="text-xs text-slate-500">Platform connections and sync monitoring</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Real-time monitoring
                </div>
                <div className="text-xs text-slate-400">
                  Last check: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium">9 integrations</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 border-b border-slate-200/60 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs font-bold text-slate-700">Active</span>
            </div>
            <div className="text-xl font-bold text-slate-900">3</div>
            <div className="text-xs text-green-600 font-medium">Fully synced</div>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3 h-3 text-yellow-600" />
              <span className="text-xs font-bold text-slate-700">Warning</span>
            </div>
            <div className="text-xl font-bold text-slate-900">3</div>
            <div className="text-xs text-yellow-600 font-medium">Need attention</div>
          </div>
          <div className="bg-white border border-slate-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="text-xs font-bold text-slate-700">Disconnected</span>
            </div>
            <div className="text-xl font-bold text-slate-900">3</div>
            <div className="text-xs text-red-600 font-medium">Require setup</div>
          </div>
        </div>
      </div>

      {/* Integration Groups - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4">
          <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl overflow-hidden">
            {integrationGroups.map((group) => (
              <div key={group.title} className="border-b border-slate-200/50 last:border-b-0">
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold px-4 py-2.5 text-xs flex items-center gap-2">
                  <Plug className="w-3 h-3" />
                  {group.title}
                  <div className="ml-auto text-xs opacity-80">
                    {group.integrations.length} platforms
                  </div>
                </div>

                <div className="divide-y divide-slate-200/30 bg-white">
                  {group.integrations.map(([name, status]) => {
                    const { tooltip, base, glow, icon: StatusIcon } = statusConfig[status];

                    return (
                      <div
                        key={name}
                        className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                            <Link className="w-4 h-4 text-slate-500 group-hover:text-teal-600" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-900">{name}</span>
                            <div className="text-xs text-slate-500">Platform integration</div>
                          </div>
                        </div>

                        <Tooltip.Provider delayDuration={200}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 ${base} ${glow}`}>
                                <StatusIcon className="w-3 h-3" />
                                <span className="text-xs">{status}</span>
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Content
                              className="px-3 py-2 rounded-lg shadow-lg text-xs max-w-[200px] bg-slate-800 text-white border border-slate-700"
                              side="top"
                              sideOffset={5}
                            >
                              {tooltip}
                              <Tooltip.Arrow className="fill-slate-800" />
                            </Tooltip.Content>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200/50 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 group">
              <CheckCircle className="w-4 h-4 text-slate-500 group-hover:text-teal-600" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-teal-700">Test All Connections</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200/50 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 group">
              <Plug className="w-4 h-4 text-slate-500 group-hover:text-teal-600" />
              <span className="text-sm font-medium text-slate-700 group-hover:text-teal-700">Add Integration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSummary;
