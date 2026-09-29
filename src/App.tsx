/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { DemoBanner } from './components/common/DemoBanner';
import { NotificationToast } from './components/common/NotificationToast';

import { DashboardView } from './components/dashboard/DashboardView';
import { ChatView } from './components/chat/ChatView';
import { BuildView } from './components/build/BuildView';
import { ProjectsView } from './components/projects/ProjectsView';
import { FilesView } from './components/files/FilesView';
import { AgentsView } from './components/agents/AgentsView';
import { ModelsView } from './components/models/ModelsView';
import { ApiKeysView } from './components/apikeys/ApiKeysView';
import { UsageView } from './components/usage/UsageView';

function MainLayout() {
  const { activeTab } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'chat':
        return <ChatView />;
      case 'build':
        return <BuildView />;
      case 'projects':
        return <ProjectsView />;
      case 'files':
        return <FilesView />;
      case 'agents':
        return <AgentsView />;
      case 'models':
        return <ModelsView />;
      case 'apikeys':
        return <ApiKeysView />;
      case 'usage':
        return <UsageView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Banner for Demo Mode status */}
      <DemoBanner />

      {/* Primary Top Bar */}
      <TopBar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto bg-neutral-950">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Notification Toast */}
      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
