// ========================================
// 🎯 TASK CARD COMPONENT WITH ALIASED IMPORTS
// ========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@shared/components/ui/Modal';

const TaskCard = ({ title, color, tasks, id, listeners, attributes, setNodeRef, isDragging, onEdit, showUserInfo = true }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleEdit = (task) => {
    if (onEdit) {
      onEdit(task);
    } else {
      setSelectedTask(task);
    }
  };
  const handleClose = () => setSelectedTask(null);
  const toggleCollapse = () => setCollapsed(!collapsed);

  const completedCount = tasks.filter((task) => {
    const actions = task.actions || task.body;
    return typeof actions === 'string' ? actions.includes('Completed') :
           Array.isArray(actions) ? actions.some(action => action === 'Completed') : false;
  }).length;
  const completionPercent =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 
        overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] 
        ${isDragging ? 'opacity-60 scale-95' : ''}`}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-3 cursor-pointer bg-[#01818E] text-white transition-all"
        onClick={toggleCollapse}
      >
        <h3 className="text-sm font-bold tracking-wide uppercase">{title}</h3>
        <span
          className={`text-lg transform transition-transform duration-300 ${
            collapsed ? 'rotate-0' : 'rotate-180'
          }`}
        >
          ⌄
        </span>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 space-y-4 overflow-hidden"
          >
            {/* Progress Bar */}
            {tasks.length > 0 && (
              <>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    layout
                    className="h-full rounded-full"
                    style={{
                      width: `${completionPercent}%`,
                      backgroundColor: '#01818E',
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {completedCount} of {tasks.length} completed
                </p>
              </>
            )}

            {/* No Tasks */}
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No tasks available.
              </p>
            ) : (
              tasks.map((task, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.015 }}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>📅 {task.date || 'No due date'}</span>
                        {showUserInfo && task.assignedTo && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                            👤 Assigned
                          </span>
                        )}
                        {task.priority && (
                          <span className={`px-2 py-1 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}>
                            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-xs px-3 py-1 rounded bg-[#01818E]/10 text-[#01818E] hover:bg-[#01818E]/20 dark:text-white dark:bg-[#01818E]/40 dark:hover:bg-[#01818E]/60 transition"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Array.isArray(task.tags) ? (
                      task.tags.map((tag, idx) => {
                        const tagText = typeof tag === 'object' ? tag.label || tag.value : tag;
                        return (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                              tagText.includes('High')
                            ? 'bg-red-500 text-white'
                                : tagText.includes('Low')
                            ? 'bg-yellow-400 text-black'
                                : tagText.includes('Meeting')
                            ? 'bg-gray-500 text-white'
                            : 'bg-[#01818E]/20 text-[#01818E] dark:bg-[#01818E]/30 dark:text-white'
                        }`}
                      >
                            {tagText}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        No tags
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(task.body) ? (
                      task.body.map((action, idx) => (
                      <button
                          key={`${task.id || i}-${idx}`}
                        className={`text-xs px-2 py-1 rounded transition font-medium ${
                          action === 'Call'
                            ? 'bg-blue-600 text-white'
                            : action === 'Schedule Now'
                            ? 'bg-gray-300 dark:bg-gray-600 text-black dark:text-white'
                            : action === 'Completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-[#01818E]/20 text-[#01818E] dark:bg-[#01818E]/30 dark:text-white'
                        }`}
                      >
                        {action}
                      </button>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.body || task.actions || 'No actions'}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!selectedTask}
        task={selectedTask}
        onClose={handleClose}
        mode="edit"
      />
    </motion.div>
  );
};

export default TaskCard;
