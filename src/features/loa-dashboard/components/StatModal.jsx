import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const StatModal = ({ open, onClose, stat }) => {
  if (!open || !stat) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="bg-zinc-900 text-white p-6 rounded-xl w-full max-w-md shadow-xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-sm text-zinc-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-2">{stat.title}</h2>

        <p className="text-3xl font-bold mb-4">{stat.value}</p>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stat.chart}>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-sm text-zinc-300">
          {/* Placeholder for future drilldown data */}
          More insights, history, or actions can go here.
        </div>
      </motion.div>
    </div>
  );
};

export default StatModal;
