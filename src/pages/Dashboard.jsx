import * as React from 'react';
import StatCard from '@/components/stat-card';
import { OverdueTable } from '@/components/overdue-table';
import { FiltersBar } from '@/components/filters-bar';
import { Sparkline } from '@/components/sparkline';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

/** @type {import('@/lib/types').KPI[]} */
const kpis = [
  {
    id: 'on-schedule',
    title: '% on schedule',
    value: '82%',
    sublabel: '164 of 200 loans',
    delta: 6,
    trend: [
      { x: 'Mon', y: 78 },
      { x: 'Tue', y: 80 },
      { x: 'Wed', y: 81 },
      { x: 'Thu', y: 82 },
      { x: 'Fri', y: 82 },
    ],
    target: 90,
  },
  {
    id: 'avg-days',
    title: 'Avg days in processing',
    value: '4.2',
    delta: -0.8,
    trend: [
      { x: 'Mon', y: 5 },
      { x: 'Tue', y: 4.8 },
      { x: 'Wed', y: 4.5 },
      { x: 'Thu', y: 4.3 },
      { x: 'Fri', y: 4.2 },
    ],
  },
  {
    id: 'files-processed',
    title: 'Files processed (wk)',
    value: '312',
    delta: 12,
    trend: [
      { x: 'Mon', y: 60 },
      { x: 'Tue', y: 62 },
      { x: 'Wed', y: 63 },
      { x: 'Thu', y: 65 },
      { x: 'Fri', y: 62 },
    ],
  },
];

/** @type {import('@/lib/types').OverdueItem[]} */
const overdueRows = [
  { id: '1', borrower: 'Jane Doe', daysOverdue: 12, owner: 'Alice', severity: 'high' },
  { id: '2', borrower: 'John Smith', daysOverdue: 7, owner: 'Bob', severity: 'medium' },
  { id: '3', borrower: 'Mary Lee', daysOverdue: 3, owner: 'Alice', severity: 'low' },
  { id: '4', borrower: 'Carlos Ruiz', daysOverdue: 15, owner: 'Bob', severity: 'high' },
  { id: '5', borrower: 'Ava Patel', daysOverdue: 5, owner: 'Alice', severity: 'medium' },
];

export default function Dashboard() {
  const [filters, setFilters] = React.useState({});
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedKPI, setSelectedKPI] = React.useState(null);

  return (
    <div className="mx-auto px-6 max-w-6xl gap-6 flex flex-col">
      <FiltersBar value={filters} onChange={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map(kpi => (
          <StatCard
            key={kpi.id}
            {...kpi}
            onClick={() => { setSelectedKPI(kpi); setDrawerOpen(true); }}
          />
        ))}
      </div>
      <div className="bg-white dark:bg-slate-950 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Overdue Items</span>
            <span className="hidden md:inline-block"><Sparkline data={overdueRows.map((r, i) => ({ x: String(i), y: r.daysOverdue }))} /></span>
          </div>
          <Button variant="outline">View all</Button>
        </div>
        <OverdueTable
          rows={overdueRows}
          onOpen={id => alert('Open ' + id)}
          onAssign={id => alert('Assign ' + id)}
          onSnooze={id => alert('Snooze ' + id)}
        />
      </div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <div className="p-6">
            <div className="font-semibold text-lg mb-2">{selectedKPI?.title} Breakdown</div>
            <div className="text-slate-500 dark:text-slate-400">(Placeholder breakdown table)</div>
          </div>
        </Drawer.Content>
      </Drawer>
    </div>
  );
}
