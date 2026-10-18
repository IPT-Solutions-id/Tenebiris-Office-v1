import React, { useState, useEffect } from 'react';
import { useOffice } from '../../store/officeStore';
import {
  Users,
  CheckSquare,
  Sparkles,
  Settings,
  Wifi,
  WifiOff,
  Flame,
} from 'lucide-react';

export const Header: React.FC<{
  onToggleSidebar?: () => void;
  onToggleInspector?: () => void;
  sidebarOpen?: boolean;
}> = ({ onToggleSidebar, onToggleInspector, sidebarOpen }) => {
  const {
    agents,
    tasks,
    skills,
    hermesState,
    setActiveTab,
  } = useOffice();

  const [currentTime, setCurrentTime] = useState<string>('23:14');
  const [currentDate, setCurrentDate] = useState<string>('09 Oct 2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const runningTasks = tasks.filter(t => t.status === 'RUNNING').length;
  const pendingTasks = tasks.filter(t => t.status === 'QUEUED' || t.status === 'ASSIGNED').length;
  const activeAgents = agents.filter(a => a.status === 'AVAILABLE').length;

  return (
    <header className="h-16 bg-[#0E0C16] border-b border-[#9E172C]/40 px-3 md:px-4 flex items-center justify-between text-xs select-none z-30 shrink-0">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded bg-[#14121C] border border-[#9E172C]/40 text-[#E8E4E9]"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#1A0A10] border border-[#9E172C] rounded shadow-[0_0_12px_rgba(215,38,61,0.4)] shrink-0">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D7263D] animate-occult" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
            <circle cx="50" cy="50" r="44" stroke="#9E172C" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" stroke="#D7263D" strokeWidth="2" strokeDasharray="6 4" />
            <polygon points="50,14 79,80 18,39 82,39 21,80" stroke="#D7263D" strokeWidth="5" fill="none" />
            <circle cx="50" cy="50" r="8" fill="#D7263D" />
          </svg>
        </div>
        <div>
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <h1 className="font-cinzel text-xs md:text-base font-bold text-[#E8E4E9] tracking-wider text-glow-crimson truncate">
              TENEBIRIS OFFICE
            </h1>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest px-1 py-0.2 bg-[#490D1B] text-[#D7263D] font-bold border border-[#9E172C]/50 rounded">
              v1.0
            </span>
          </div>
          <p className="hidden sm:block text-[9px] md:text-[10px] text-[#A69EA9] tracking-widest uppercase font-mono">
            AI AGENTS · SKILLS · RITUALS · RESULTS
          </p>
        </div>
      </div>

      {/* Hermes Gateway & Mode Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setActiveTab('hermes_gate')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded bg-[#14121C] border transition-all ${
            hermesState.connected
              ? 'border-[#39C5CF]/40 text-[#39C5CF] hover:border-[#39C5CF]'
              : 'border-[#9E172C]/60 text-[#D7263D] hover:border-[#D7263D]'
          }`}
          title="Click to inspect Hermes Gate & Capability Matrix"
        >
          {hermesState.connected ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39C5CF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39C5CF]"></span>
            </span>
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#D7263D]" />
          )}
          <span className="font-medium text-[11px]">
            {hermesState.connected ? 'Hermes Gateway Connected' : 'Hermes Binding Required'}
          </span>
        </button>

        {/* Live runtime status */}
        <div className="flex bg-[#14121C] border border-[#9E172C]/40 rounded p-0.5">
          <span className="px-3 py-1 rounded text-[11px] font-semibold bg-[#9E172C] text-[#E8E4E9] shadow-[0_0_8px_rgba(215,38,61,0.5)]">
            Live Runtime
          </span>
        </div>
      </div>

      {/* Metrics Counters */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Agents Counter */}
        <div
          onClick={() => setActiveTab('summoned_agents')}
          className="flex items-center space-x-1.5 md:space-x-2 px-2 md:px-2.5 py-1 rounded bg-[#14121C] border border-[#9E172C]/30 hover:border-[#9E172C] cursor-pointer transition-all"
        >
          <Users className="w-3.5 h-3.5 text-[#D7263D]" />
          <div>
            <span className="font-bold text-[#E8E4E9]">{agents.length}</span>
            <span className="hidden sm:inline font-bold text-[#E8E4E9] ml-1">Agents</span>
            <span className="hidden lg:inline text-[10px] text-[#A69EA9] ml-1.5 font-mono">({activeAgents} Online)</span>
          </div>
        </div>

        {/* Tasks Counter */}
        <div
          onClick={() => setActiveTab('task_altar')}
          className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded bg-[#14121C] border border-[#9E172C]/30 hover:border-[#9E172C] cursor-pointer transition-all"
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#C69245]" />
          <div>
            <span className="font-bold text-[#E8E4E9]">{tasks.length} Tasks</span>
            <span className="hidden lg:inline text-[10px] text-[#C69245] ml-1.5 font-mono">({pendingTasks} Pending)</span>
          </div>
        </div>

        {/* Skills Counter */}
        <div
          onClick={() => setActiveTab('skills_archive')}
          className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded bg-[#14121C] border border-[#9E172C]/30 hover:border-[#9E172C] cursor-pointer transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#39C5CF]" />
          <div>
            <span className="font-bold text-[#E8E4E9]">{skills.length} Skills</span>
            <span className="hidden lg:inline text-[10px] text-[#39C5CF] ml-1.5 font-mono">(Live)</span>
          </div>
        </div>

        {/* Inspector toggle button for mobile/tablet */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className="xl:hidden px-2 py-1 rounded bg-[#14121C] border border-[#9E172C]/40 text-[#E8E4E9] font-mono text-[10px] flex items-center space-x-1"
          >
            <span>Agent</span>
          </button>
        )}

        {/* Clock & Date */}
        <div className="hidden sm:block text-right font-mono border-l border-[#9E172C]/30 pl-2 md:pl-3">
          <div className="text-xs md:text-sm font-bold text-[#E8E4E9] tracking-wider">{currentTime}</div>
          <div className="hidden lg:block text-[10px] text-[#A69EA9]">{currentDate}</div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setActiveTab('occult_settings')}
          className="p-1.5 md:p-2 rounded bg-[#14121C] border border-[#9E172C]/30 hover:border-[#9E172C] text-[#A69EA9] hover:text-[#E8E4E9] transition-all"
          title="Occult Settings"
        >
          <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </header>
  );
};
