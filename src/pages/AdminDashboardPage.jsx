// ========================================
// 🎯 LOAN ADMINISTRATOR DASHBOARD PAGE
// ========================================

import React from 'react';
import { Header } from '@shared/components';
import { AdminDashboard } from '@features';

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
      <Header title="Loan Administrator Dashboard" />

      {/* 🧩 Loan Administrator Dashboard Content */}
      <main className="w-full max-w-full">
        <AdminDashboard />
      </main>
    </div>
  );
};

export default AdminDashboardPage;
