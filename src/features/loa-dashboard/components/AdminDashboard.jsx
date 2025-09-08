// ========================================
// 🎯 LOADashboard ADMIN DASHBOARD COMPONENT WITH ALIASED IMPORTS
// ========================================

import React from 'react';
import { LOAPipelineSection, LOAUnifiedTaskManager, CommunicationLog, CollaborationHandoff, QuickStats } from './';
import { PipelineProvider } from '@context/PipelineContext';

const AdminDashboard = () => {
  return (
    <PipelineProvider>
      <div
        className="w-full min-h-screen text-gray-800"
        style={{
          background: 'linear-gradient(120deg, #01818e 0%, #22d3ee 100%)',
          backgroundBlendMode: 'overlay',
        }}
      >
        <main className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 w-full">
          {/* LOA Pipeline */}
          <Section>
            <LOAPipelineSection isAdmin={true} />
          </Section>

          {/* Unified Task Management */}
          <Section>
            <LOAUnifiedTaskManager />
          </Section>

          {/*Quick Stats Row */}
          <Section>
                <QuickStats />
          </Section>

          {/* Communication Log and Collaboration Handoff Row */}
          <Section>
            <div className="flex flex-col lg:flex-row gap-6 w-full">
              <div className="flex-1">
                <CommunicationLog />
              </div>
              <div className="flex-1">
                <CollaborationHandoff />
              </div>
            </div>
          </Section>
        </main>
      </div>
    </PipelineProvider>
  );
};

const Section = ({ title, children }) => (
  <section className="w-full">
    {title && (
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
        {title}
      </h2>
    )}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {children}
    </div>
  </section>
);

export default AdminDashboard;
