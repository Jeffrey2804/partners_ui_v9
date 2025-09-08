import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

const bgColors = {
  mint: 'bg-white text-emerald-900 dark:bg-zinc-900 dark:text-emerald-100',
  lemon: 'bg-white text-yellow-900 dark:bg-zinc-900 dark:text-yellow-100',
  sky: 'bg-white text-sky-900 dark:bg-zinc-900 dark:text-sky-100',
};

const MetricCard = ({ title = 'Metric', value = '0', trend = '+0%', delta = '', bg = 'mint', meta = '', data = [] }) => {
  const isPositive = trend.startsWith('+');
  const trendColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const trendIcon = isPositive ? '📈' : '📉';

  const isPercent = value.includes('%');
  const isK = value.includes('k');
  const rawNumber = parseFloat(value.replace('%', '').replace('k', '')) * (isK ? 1000 : 1) || 0;

  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, rawNumber, {
      duration: 2,
      ease: 'easeInOut',
      onUpdate: (v) => setAnimatedValue(v),
    });
    return () => controls.stop();
  }, [rawNumber]);

  const displayValue = () => {
    if (isPercent) return `${animatedValue.toFixed(1)}%`;
    if (isK) return `${(animatedValue / 1000).toFixed(2)}k`;
    return animatedValue.toFixed(0);
  };

  return (
    <div
      className={`w-full px-6 py-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-zinc-700
      ${bgColors[bg] || 'bg-white text-gray-900 dark:bg-zinc-900 dark:text-white'}`}
    >
      {/* Title */}
      <div className="text-base font-semibold mb-1 tracking-tight">{title}</div>

      {/* Animated Value */}
      <div className="text-3xl font-extrabold mb-2 tabular-nums">{displayValue()}</div>

      {/* Trend Delta */}
      <div className={`text-sm font-medium flex items-center gap-2 mb-3 ${trendColor}`}>
        <span className="text-lg">{trendIcon}</span>
        <span>{trend}</span>
        {delta && (
          <span className="text-gray-600 dark:text-gray-300 text-xs font-normal">
            {delta}
          </span>
        )}
      </div>

      {/* Percent Progress Bar */}
      {isPercent && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-500"
            style={{ width: `${parseFloat(value) || 0}%` }}
          />
        </div>
      )}

      {/* Chart */}
      <div className="w-full h-16 min-h-[64px] mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: '#fff',
              }}
              labelFormatter={() => ''}
              formatter={(v) => [`${v}`, 'Value']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={{ r: 2.5, stroke: '#fff', strokeWidth: 1 }}
              animationDuration={600}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Meta Label */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
        {meta || 'Compared to last week'}
      </p>
    </div>
  );
};

export default MetricCard;
