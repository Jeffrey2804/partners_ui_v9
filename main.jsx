// ========================================
// 🎯 MAIN ENTRY POINT WITH NEW STRUCTURE
// ========================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// App providers using new structure
import { TaskProvider, PipelineProvider, RoleProvider, UserProvider, CalendarProvider, NotificationProvider } from '@context';

// App component
import App from './App';

// Global styles
import '@styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <UserProvider>
          <RoleProvider>
            <TaskProvider>
              <PipelineProvider>
                <CalendarProvider>
                  <App />
                </CalendarProvider>
              </PipelineProvider>
            </TaskProvider>
          </RoleProvider>
        </UserProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
