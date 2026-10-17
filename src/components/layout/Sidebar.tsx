import React from 'react';
import { useOffice } from '../../store/officeStore';
import { NavigationTab } from '../../types/office';
import { ChatInterface } from '../chat/ChatInterface';
import {
  Castle,
  Users2,
  BookOpen,
  Hammer,
  Scroll,
  GitBranch,
  History,
  DoorOpen,
  Settings,
  ChevronUp,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'virtual_office', label: 'Virtual Office', icon: Castle },
  { id: 'summoned_agents', label: 'Summoned Agents', icon: Users2 },
  { id: 'skills_archive', label: 'Skills Archive', icon: BookOpen },
  { id: 'role_forge', label: 'Role Forge', icon: Hammer },
  { id: 'task_altar', label: 'Task Altar', icon: Scroll },
  { id: 'ritual_flows', label: 'Ritual Flows', icon: GitBranch },
  { id: 'activity_scrolls', label: 'Activity Scrolls', icon: History },
  { id: 'hermes_gate', label: 'Hermes Gate', icon: DoorOpen },
  { id: 'occult_settings', label: 'Occult Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useOffice();
  const [isMenuCollapsed, setIsMenuCollapsed] = React.useState(false);

  return (
    <aside className="w-56 bg-[#0E0C16] border-r border-[#9E172C]/40 flex flex-col select-none z-20 shrink-0 h-full">
      {/* Navigation List (Top) */}
      <nav className={`p-3 space-y-1.5 overflow-y-auto transition-all duration-300 ${isMenuCollapsed ? 'h-0 opacity-0 overflow-hidden' : 'h-1/2 opacity-100'}`}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] shadow-[0_0_10px_rgba(215,38,61,0.35)]'
                  : 'text-[#A69EA9] hover:text-[#E8E4E9] hover:bg-[#14121C] border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#D7263D]' : 'text-[#7A7280]'
                  }`}
                />
                <span className={isActive ? 'font-semibold tracking-wide' : ''}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Chat Interface Container (Bottom, takes remaining space) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-[#9E172C]/30">
        {/* Toggle Bar / Header of Chat */}
        <button 
          onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
          className="w-full flex items-center justify-center py-1.5 text-[#A69EA9] hover:text-[#E8E4E9] bg-[#09090F] shrink-0 border-b border-[#9E172C]/30 transition-colors cursor-pointer"
          title={isMenuCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${isMenuCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Chat Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </aside>
  );
};
