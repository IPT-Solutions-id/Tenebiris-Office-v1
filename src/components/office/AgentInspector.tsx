import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import {
  Shield,
  Activity,
  Code2,
  Terminal,
  FileText,
  UserCheck,
  ChevronDown,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';

export const AgentInspector: React.FC = () => {
  const {
    selectedAgent,
    workstations,
    tasks,
    auditLogs,
    createTask,
    focusAgentWorkstation,
    setActiveDockTab,
    setIsDockOpen,
  } = useOffice();

  const [activeTab, setActiveTab] = useState<'skills' | 'task' | 'logs' | 'actions'>('skills');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const currentWorkstation = workstations.find(w => w.id === selectedAgent.workstationId);
  const agentTasks = tasks.filter(t => t.assignedAgentId === selectedAgent.id);
  const activeTask = agentTasks.find(t => t.status === 'RUNNING') || agentTasks[0];

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask(
      newTaskTitle,
      `Direct decree to ${selectedAgent.name} via Agent Inspector`,
      newTaskPriority,
      selectedAgent.id,
      selectedAgent.skills.map(s => s.name)
    );
    setNewTaskTitle('');
    setShowAssignModal(false);
  };

  return (
    <aside className="w-80 bg-[#0E0C16] border-l border-[#9E172C]/40 flex flex-col justify-between text-xs select-none z-20 shrink-0">
      {/* Top Inspector Box */}
      <div className="p-4 border-b border-[#9E172C]/30 overflow-y-auto max-h-[62vh]">
        {/* Header Title with Sigil */}
        <div className="flex items-center justify-between pb-3 border-b border-[#9E172C]/20 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 flex items-center justify-center text-[#D7263D]">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="font-cinzel text-sm font-bold text-[#E8E4E9] tracking-wider text-glow-crimson">
              AGENT: {selectedAgent.name}
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/40 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39C5CF] animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>

        {/* Character Card & Portrait */}
        <div className="flex space-x-3 mb-4 bg-[#14121C] p-2.5 rounded border border-[#9E172C]/30">
          {/* Pixel Character Portrait Box */}
          <div className="w-20 h-24 bg-[#09090F] border border-[#9E172C] rounded flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_10px_rgba(215,38,61,0.2)] shrink-0">
            {/* Occult aura circle */}
            <div className="absolute inset-0 bg-radial from-[#9E172C]/20 to-transparent"></div>
            {/* Pixel Character Avatar Art */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Head & Hair */}
              <div
                className="w-7 h-7 rounded-sm relative flex items-center justify-center mb-1"
                style={{ backgroundColor: selectedAgent.isPrimary ? '#C69245' : '#D7263D' }}
              >
                <div className="w-5 h-5 bg-[#E3C1A8] rounded-xs flex items-center justify-around px-0.5">
                  <div className="w-1 h-1 bg-[#09090F] rounded-full"></div>
                  <div className="w-1 h-1 bg-[#09090F] rounded-full"></div>
                </div>
              </div>
              {/* Robe/Armor */}
              <div
                className="w-9 h-8 rounded-xs relative"
                style={{ backgroundColor: selectedAgent.isPrimary ? '#490D1B' : '#14121C' }}
              >
                <div
                  className="w-2 h-full mx-auto"
                  style={{ backgroundColor: selectedAgent.spriteColor || '#D7263D' }}
                ></div>
              </div>
            </div>
            <span className="text-[9px] text-[#A69EA9] font-mono mt-1">
              #{selectedAgent.agentNumber}
            </span>
          </div>

          {/* Metadata Table */}
          <div className="flex-1 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#7A7280]">Name</span>
              <span className="font-semibold text-[#E8E4E9]">{selectedAgent.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7280]">Role</span>
              <span className="text-[#A69EA9] text-right font-medium">{selectedAgent.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7280]">Department</span>
              <span className="text-[#A69EA9] text-right truncate max-w-[110px]" title={selectedAgent.department}>
                {selectedAgent.department}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7280]">Model</span>
              <span className="text-[#39C5CF] font-mono text-[10px]">{selectedAgent.model}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#7A7280]">Status</span>
              <span className="text-[#C69245] font-semibold text-[10px] truncate max-w-[110px]">
                {selectedAgent.currentAction}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7280]">Workstation</span>
              <span className="text-[#E8E4E9] text-[10px] truncate max-w-[110px]">
                {currentWorkstation ? currentWorkstation.name : 'Chamber'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Skills, Current Task, Logs, Actions) */}
        <div className="flex border-b border-[#9E172C]/30 mb-3 bg-[#14121C] rounded p-0.5">
          {(['skills', 'task', 'logs', 'actions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-center capitalize text-[10.5px] rounded transition-all ${
                activeTab === tab
                  ? 'bg-[#490D1B] text-[#E8E4E9] font-semibold shadow-[0_0_6px_rgba(215,38,61,0.3)]'
                  : 'text-[#A69EA9] hover:text-[#E8E4E9]'
              }`}
            >
              {tab === 'skills' ? `Skills (${selectedAgent.skills.length})` : tab === 'task' ? 'Current Task' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'skills' && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {selectedAgent.skills.map((skill, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#14121C] border border-[#9E172C]/20 hover:border-[#9E172C]/60 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#39C5CF]" />
                  <span className="text-[#E8E4E9] font-medium text-[11px]">{skill.name}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    skill.proficiency === 'Master'
                      ? 'bg-[#490D1B] text-[#D7263D] border border-[#9E172C]'
                      : skill.proficiency === 'Expert'
                      ? 'bg-[#1A2633] text-[#39C5CF] border border-[#39C5CF]/40'
                      : 'bg-[#261E14] text-[#C69245] border border-[#C69245]/40'
                  }`}
                >
                  {skill.proficiency}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'task' && (
          <div className="bg-[#14121C] p-3 rounded border border-[#9E172C]/30 space-y-2">
            {activeTask ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#A69EA9] font-mono">TASK #{activeTask.id.slice(-4)}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#9E172C] text-[#E8E4E9] font-bold">
                    {activeTask.priority}
                  </span>
                </div>
                <h4 className="font-semibold text-[#E8E4E9] text-xs">{activeTask.title}</h4>
                <p className="text-[10.5px] text-[#A69EA9] leading-relaxed">{activeTask.description}</p>
                <div className="w-full bg-[#09090F] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-[#D7263D] h-full transition-all duration-500"
                    style={{ width: `${activeTask.progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#A69EA9] pt-1">
                  <span>Progress</span>
                  <span className="text-[#39C5CF] font-bold">{activeTask.progressPercent}%</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-[#7A7280] italic">No active task currently assigned.</p>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#09090F] p-2 rounded border border-[#9E172C]/30 font-mono text-[10px] text-[#A69EA9] max-h-40 overflow-y-auto space-y-1">
            {activeTask && activeTask.logs.length > 0 ? (
              activeTask.logs.map((log, i) => (
                <div key={i} className="leading-snug">
                  {log}
                </div>
              ))
            ) : (
              <div>[23:14:00] Awaiting task execution streaming from Hermes...</div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            <button
              onClick={() => {
                focusAgentWorkstation(selectedAgent.id);
                setIsDockOpen(true);
              }}
              className="w-full py-1.5 px-3 rounded bg-[#14121C] border border-[#9E172C]/40 hover:border-[#9E172C] text-[#E8E4E9] flex items-center justify-center space-x-2 transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-[#39C5CF]" />
              <span>Open Workstation Dock</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full py-1.5 px-3 rounded bg-[#490D1B] hover:bg-[#9E172C] text-[#E8E4E9] font-medium transition-all"
            >
              Assign New Decree
            </button>
          </div>
        )}

        {/* Primary Action Button Bar */}
        <div className="flex space-x-2 mt-4 pt-3 border-t border-[#9E172C]/30">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex-1 py-2 px-3 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-semibold text-xs transition-all shadow-[0_0_10px_rgba(215,38,61,0.4)] flex items-center justify-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Assign Task</span>
          </button>
          <button
            onClick={() => focusAgentWorkstation(selectedAgent.id)}
            className="px-3 py-2 rounded bg-[#14121C] border border-[#9E172C]/40 hover:border-[#9E172C] text-[#E8E4E9] flex items-center space-x-1"
          >
            <span>More</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Task Logs Panel (Bottom right of UI) */}
      <div className="p-3 bg-[#09090F] flex-1 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-[#9E172C]/20">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-[#D7263D]" />
            <h3 className="font-mono text-[11px] font-bold text-[#E8E4E9] uppercase tracking-wider">
              LIVE TASK LOGS
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-[#A69EA9]">
            <span>Auto-scroll</span>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`w-7 h-3.5 rounded-full transition-colors relative ${
                autoScroll ? 'bg-[#9E172C]' : 'bg-[#1E1B29]'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  autoScroll ? 'left-4' : 'left-0.5'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Streaming Logs View matching reference format */}
        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 pt-2 text-[#A69EA9]">
          {auditLogs.map((log, idx) => (
            <div key={idx} className="leading-snug truncate hover:whitespace-normal">
              <span className="text-[#7A7280]">[{log.timestamp}]</span>{' '}
              <span className="text-[#D7263D] font-semibold">{log.actor}:</span>{' '}
              <span className="text-[#E8E4E9]">{log.action}:</span>{' '}
              <span className="text-[#A69EA9]">{log.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#14121C] border border-[#9E172C] rounded-lg p-5 w-full max-w-md shadow-[0_0_25px_rgba(215,38,61,0.4)]">
            <h3 className="font-cinzel text-base font-bold text-[#E8E4E9] mb-1 text-glow-crimson">
              Assign Decree to {selectedAgent.name}
            </h3>
            <p className="text-xs text-[#A69EA9] mb-4">
              Dispatches an authoritative execution vow to the Hermes runtime.
            </p>

            <form onSubmit={handleAssignTask} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#A69EA9] uppercase font-mono mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Generate 3D Room Render and DXF layout..."
                  className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A69EA9] uppercase font-mono mb-1">
                  Priority Altar
                </label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as any)}
                  className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 rounded bg-[#1A1624] text-[#A69EA9] hover:text-[#E8E4E9] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_10px_rgba(215,38,61,0.4)]"
                >
                  Summon Decree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
