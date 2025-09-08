// ========================================
// 🎯 TASK MANAGEMENT PAGE
// ========================================

import { Header } from '@shared/components';
import { TaskManagementDashboard } from '@features';

export default function TaskManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TaskManagementDashboard />
    </div>
  );
}
