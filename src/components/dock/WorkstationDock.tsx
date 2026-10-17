import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { DockPanelTab } from '../../types/office';
import { LiveCodingView } from './LiveCodingView';
import { CadRenderView } from './CadRenderView';
import { TaskExecutionView } from './TaskExecutionView';
import { AgentCommunicationView } from './AgentCommunicationView';
import { SkillRoleBuilderView } from './SkillRoleBuilderView';
import {
  Code,
  Layout,
  Terminal,
  MessageSquare,
  Hammer,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Columns,
  Globe,
} from 'lucide-react';

interface TabItem {
  id: DockPanelTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'coding', label: 'Live Coding Preview', icon: Code },
  { id: 'cad', label: 'Preview', icon: Globe },
  { id: 'task_execution', label: 'Task Execution', icon: Terminal },
  { id: 'communication', label: 'Agent Communication', icon: MessageSquare },
  { id: 'role_builder', label: 'Skill & Role Builder', icon: Hammer },
];

export const WorkstationDock: React.FC = () => {
  const {
    activeDockTab,
    setActiveDockTab,
    isDockOpen,
    setIsDockOpen,
    isDockExpanded,
    setIsDockExpanded,
  } = useOffice();

  // Multi-panel layout toggle: Grid View (matches screenshot with all 5 panels side-by-side) or Single Focused Panel
  const [isPanoramicGrid, setIsPanoramicGrid] = useState<boolean>(true);

  if (!isDockOpen) {
    return (
      <div className="h-8 bg-[#0E0C16] border-t border-[#9E172C]/40 px-4 flex items-center justify-between z-20 shrink-0">
        <span className="text-[11px] font-mono text-[#A69EA9] flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-[#D7263D]" />
          <span>Workstation Dock (Minimized)</span>
        </span>
        <button
          onClick={() => setIsDockOpen(true)}
          className="text-xs text-[#39C5CF] hover:text-[#E8E4E9] flex items-center space-x-1"
        >
          <span>Restore Dock</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <section
      className={`border-t border-[#9E172C]/50 bg-[#09090F] flex flex-col z-20 transition-all duration-200 shrink-0 select-none ${
        isDockExpanded ? 'h-[65vh]' : 'h-72'
      }`}
    >
      {/* Top Dock Navigation Header */}
      <div className="h-8 bg-[#0E0C16] border-b border-[#9E172C]/30 px-3 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeDockTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveDockTab(tab.id);
                  setIsPanoramicGrid(false);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 ${
                  isActive && !isPanoramicGrid
                    ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] shadow-[0_0_8px_rgba(215,38,61,0.3)]'
                    : 'text-[#A69EA9] hover:text-[#E8E4E9] hover:bg-[#14121C]'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-[#D7263D]' : 'text-[#7A7280]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dock Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Panoramic 5-Panel Grid Toggle */}
          <button
            onClick={() => setIsPanoramicGrid(!isPanoramicGrid)}
            className={`px-2 py-0.5 rounded text-[10.5px] border flex items-center space-x-1 transition-all ${
              isPanoramicGrid
                ? 'bg-[#9E172C] text-[#E8E4E9] border-[#D7263D]'
                : 'bg-[#14121C] text-[#A69EA9] border-[#9E172C]/40 hover:text-[#E8E4E9]'
            }`}
            title="Toggle All 5 Workstation Panels in Deck View"
          >
            <Columns className="w-3 h-3" />
            <span>{isPanoramicGrid ? 'Deck (All 5)' : 'Single View'}</span>
          </button>

          {/* Expand / Collapse */}
          <button
            onClick={() => setIsDockExpanded(!isDockExpanded)}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#A69EA9] hover:text-[#E8E4E9]"
            title={isDockExpanded ? 'Reduce height' : 'Expand height'}
          >
            {isDockExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsDockOpen(false)}
            className="p-1 rounded bg-[#14121C] hover:bg-[#490D1B] text-[#A69EA9] hover:text-[#E8E4E9]"
            title="Minimize Dock"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dock Content Body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isPanoramicGrid ? (
          /* Multi-Panel Card Deck: each panel is an isolated gothic card that scrolls horizontally cleanly without overlap */
          <div className="w-full h-full flex overflow-x-auto p-2 gap-2.5 bg-[#09090F] select-none items-stretch">
            <div className="h-full min-w-[310px] md:min-w-[340px] max-w-[420px] flex-1 bg-[#0E0C16] border border-[#9E172C]/40 rounded-md overflow-hidden flex flex-col shadow-[0_0_12px_rgba(0,0,0,0.5)] shrink-0">
              <LiveCodingView />
            </div>
            <div className="h-full min-w-[310px] md:min-w-[340px] max-w-[420px] flex-1 bg-[#0E0C16] border border-[#9E172C]/40 rounded-md overflow-hidden flex flex-col shadow-[0_0_12px_rgba(0,0,0,0.5)] shrink-0">
              <CadRenderView />
            </div>
            <div className="h-full min-w-[310px] md:min-w-[340px] max-w-[420px] flex-1 bg-[#0E0C16] border border-[#9E172C]/40 rounded-md overflow-hidden flex flex-col shadow-[0_0_12px_rgba(0,0,0,0.5)] shrink-0">
              <TaskExecutionView />
            </div>
            <div className="h-full min-w-[310px] md:min-w-[340px] max-w-[420px] flex-1 bg-[#0E0C16] border border-[#9E172C]/40 rounded-md overflow-hidden flex flex-col shadow-[0_0_12px_rgba(0,0,0,0.5)] shrink-0">
              <AgentCommunicationView />
            </div>
            <div className="h-full min-w-[310px] md:min-w-[340px] max-w-[420px] flex-1 bg-[#0E0C16] border border-[#9E172C]/40 rounded-md overflow-hidden flex flex-col shadow-[0_0_12px_rgba(0,0,0,0.5)] shrink-0">
              <SkillRoleBuilderView />
            </div>
          </div>
        ) : (
          /* Single Focused Panel */
          <div className="w-full h-full overflow-hidden">
            {activeDockTab === 'coding' && <LiveCodingView />}
            {activeDockTab === 'cad' && <CadRenderView />}
            {activeDockTab === 'task_execution' && <TaskExecutionView />}
            {activeDockTab === 'communication' && <AgentCommunicationView />}
            {activeDockTab === 'role_builder' && <SkillRoleBuilderView />}
          </div>
        )}
      </div>
    </section>
  );
};
