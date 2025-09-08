// ========================================
// 🎯 DASHBOARD COMPONENT WITH ALIASED IMPORTS
// ========================================

import { Header, PipelineErrorBoundary, PipelineSection } from '@shared/components';
import { MarketingSection, CampaignSection, CalendarSection } from './';
import TaskManagementDashboard from './TaskManagementDashboard';
import styles from './Dashboard.module.css';

const Dashboard = () => (
  <div className={styles.container}>
    <Header />

    <main className={styles.main}>
      {/* Pipeline Section */}
      <section className={`${styles.section} ${styles.sectionPipeline}`}>
        <PipelineErrorBoundary>
          <PipelineSection isAdmin={true} />
        </PipelineErrorBoundary>
      </section>

      {/* Task Management and Calendar in One Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Task Management Dashboard */}
        <section className={`${styles.section} ${styles.sectionTasks}`}>
          <TaskManagementDashboard />
        </section>

        {/* Calendar */}
        <section className={`${styles.section} ${styles.sectionCalendar}`}>
          <CalendarSection />
        </section>
      </div>

      {/* Marketing Section */}
      <section>
        <MarketingSection />
      </section>

      {/* Campaigns */}
      <section>
        <CampaignSection />
      </section>
    </main>
  </div>
);

export default Dashboard;
