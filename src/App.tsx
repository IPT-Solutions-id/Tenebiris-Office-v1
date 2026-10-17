import React from 'react';
import { OfficeProvider, useOffice } from './store/officeStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { IsometricCanvas } from './components/office/IsometricCanvas';
import { AgentInspector } from './components/office/AgentInspector';
import { WorkstationDock } from './components/dock/WorkstationDock';

import { SummonedAgentsView } from './components/views/SummonedAgentsView';
import { SkillsArchiveView } from './components/views/SkillsArchiveView';
import { RoleForgeView } from './components/views/RoleForgeView';
import { TaskAltarView } from './components/views/TaskAltarView';
import { RitualFlowsView } from './components/views/RitualFlowsView';
import { ActivityScrollsView } from './components/views/ActivityScrollsView';
import { HermesGateView } from './components/views/HermesGateView';
import { OccultSettingsView } from './components/views/OccultSettingsView';

const OfficeDashboard: React.FC = () => {
  const { activeTab } = useOffice();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState<boolean>(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = React.useState<boolean>(false);

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-[#09090F] text-[#E8E4E9] overflow-hidden select-none">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onToggleInspector={() => setMobileInspectorOpen(!mobileInspectorOpen)}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Desktop + Mobile Drawer) */}
        <div className={`fixed inset-y-0 left-0 z-40 md:static md:z-auto transition-transform duration-300 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar />
        </div>

        {/* Mobile Backdrop when Sidebar Drawer is open */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          />
        )}

        {/* Central Area: Virtual Office 2.5D or View Tabs */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {activeTab === 'virtual_office' ? (
            <div className="flex flex-1 h-full overflow-hidden">
              {/* Central Isometric Canvas & Bottom Workstation Dock */}
              <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                <div className="flex-1 relative overflow-hidden">
                  <IsometricCanvas />
                </div>
                <WorkstationDock />
              </div>

              {/* Right Agent Inspector Panel (Desktop visible, mobile togglable) */}
              <div className={`fixed inset-y-0 right-0 z-40 xl:static xl:z-auto transition-transform duration-300 xl:translate-x-0 ${
                mobileInspectorOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
              }`}>
                <AgentInspector />
              </div>

              {mobileInspectorOpen && (
                <div
                  onClick={() => setMobileInspectorOpen(false)}
                  className="fixed inset-0 bg-black/60 z-30 xl:hidden backdrop-blur-xs"
                />
              )}
            </div>
          ) : activeTab === 'summoned_agents' ? (
            <SummonedAgentsView />
          ) : activeTab === 'skills_archive' ? (
            <SkillsArchiveView />
          ) : activeTab === 'role_forge' ? (
            <RoleForgeView />
          ) : activeTab === 'task_altar' ? (
            <TaskAltarView />
          ) : activeTab === 'ritual_flows' ? (
            <RitualFlowsView />
          ) : activeTab === 'activity_scrolls' ? (
            <ActivityScrollsView />
          ) : activeTab === 'hermes_gate' ? (
            <HermesGateView />
          ) : (
            <OccultSettingsView />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <OfficeProvider>
      <OfficeDashboard />
    </OfficeProvider>
  );
}
