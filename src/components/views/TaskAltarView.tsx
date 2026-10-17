import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { Task, TaskPriority, TaskStatus } from '../../types/office';
import {
  Scroll,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

export const TaskAltarView: React.FC = () => {
  const { tasks, agents, createTask, updateTaskStatus, retryTask, focusAgentWorkstation, setActiveTab } = useOffice();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);

  // New task form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [assignedAgentId, setAssignedAgentId] = useState<string>(agents[0]?.id || '');

  const statuses = ['ALL', 'RUNNING', 'QUEUED', 'ASSIGNED', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED'];

  const filteredTasks = filterStatus === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask(title, description, priority, assignedAgentId);
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <Scroll className="w-5 h-5 text-[#C69245]" />
            <span>THE TASK ALTAR</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Sacred queue of computational vows, delegations, and execution decrees.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_12px_rgba(215,38,61,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Inscribe New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto shrink-0 pb-1">
        {statuses.map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded text-xs transition-all whitespace-nowrap ${
              filterStatus === st
                ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] font-semibold'
                : 'bg-[#14121C] text-[#A69EA9] hover:text-[#E8E4E9] border border-[#9E172C]/30'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Grid: Tasks List & Detail Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Task Cards Column */}
        <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-3 max-h-[calc(100vh-220px)]">
          {filteredTasks.map(task => {
            const isSelected = selectedTask?.id === task.id;
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A101C] border-[#D7263D] shadow-[0_0_12px_rgba(215,38,61,0.3)]'
                    : 'bg-[#14121C] border-[#9E172C]/30 hover:border-[#9E172C]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-[#A69EA9] font-mono">
                      #{task.id.slice(-6)}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                        task.priority === 'CRITICAL'
                          ? 'bg-[#D7263D] text-[#E8E4E9]'
                          : task.priority === 'HIGH'
                          ? 'bg-[#9E172C] text-[#E8E4E9]'
                          : 'bg-[#2A2336] text-[#A69EA9]'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                      task.status === 'COMPLETED'
                        ? 'bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/30'
                        : task.status === 'RUNNING'
                        ? 'bg-[#490D1B] text-[#D7263D] border border-[#9E172C] animate-pulse'
                        : 'bg-[#1A1826] text-[#A69EA9]'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[#E8E4E9] mb-1">{task.title}</h3>
                <p className="text-xs text-[#A69EA9] leading-relaxed mb-3 line-clamp-2">
                  {task.description}
                </p>

                {/* Assigned Agent & Progress Bar */}
                <div className="flex items-center justify-between text-xs text-[#A69EA9] pt-2 border-t border-[#9E172C]/20">
                  <span className="font-mono">
                    Assigned: <strong className="text-[#39C5CF]">{task.assignedAgentName || 'Unassigned'}</strong>
                  </span>
                  <span className="font-mono text-[#39C5CF]">{task.progressPercent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Detail Inspector */}
        {selectedTask && (
          <div className="bg-[#14121C] border border-[#9E172C]/50 rounded-lg p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-[#A69EA9]">
                  TASK IDENTIFIER: {selectedTask.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9E172C] text-[#E8E4E9]">
                  {selectedTask.priority} PRIORITY
                </span>
              </div>

              <h3 className="font-cinzel text-base font-bold text-[#E8E4E9] text-glow-crimson mb-2">
                {selectedTask.title}
              </h3>
              <p className="text-xs text-[#A69EA9] leading-relaxed mb-4 bg-[#09090F] p-3 rounded border border-[#9E172C]/30">
                {selectedTask.description}
              </p>

              {/* State Transitions Bar */}
              <div className="mb-4">
                <span className="text-[10px] uppercase font-mono text-[#7A7280] block mb-2">
                  Ritual Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.status === 'RUNNING' && (
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/40 hover:bg-[#39C5CF] hover:text-[#09090F] text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Task</span>
                    </button>
                  )}

                  {selectedTask.status === 'FAILED' && (
                    <button
                      onClick={() => retryTask(selectedTask.id)}
                      className="px-3 py-1.5 rounded bg-[#490D1B] text-[#D7263D] border border-[#9E172C] hover:bg-[#9E172C] hover:text-[#E8E4E9] text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Execution</span>
                    </button>
                  )}

                  {selectedTask.status === 'QUEUED' && (
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, 'RUNNING')}
                      className="px-3 py-1.5 rounded bg-[#9E172C] text-[#E8E4E9] text-xs font-bold flex items-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(215,38,61,0.4)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Decree</span>
                    </button>
                  )}

                  {selectedTask.assignedAgentId && (
                    <button
                      onClick={() => {
                        focusAgentWorkstation(selectedTask.assignedAgentId!);
                        setActiveTab('virtual_office');
                      }}
                      className="px-3 py-1.5 rounded bg-[#14121C] border border-[#9E172C]/40 text-[#E8E4E9] hover:border-[#9E172C] text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <span>Go to Agent Workstation</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Logs */}
              <div>
                <span className="text-[10px] uppercase font-mono text-[#7A7280] block mb-1.5">
                  Execution Chronicle ({selectedTask.logs.length} entries)
                </span>
                <div className="bg-[#09090F] p-3 rounded border border-[#9E172C]/30 font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto text-[#A69EA9]">
                  {selectedTask.logs.map((log, i) => (
                    <div key={i} className="leading-snug">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#9E172C]/30 text-[10px] text-[#7A7280] font-mono flex justify-between">
              <span>Created: {selectedTask.createdAt}</span>
              <span>Status: {selectedTask.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Inscribe Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#14121C] border border-[#9E172C] rounded-lg p-6 w-full max-w-lg shadow-[0_0_30px_rgba(215,38,61,0.4)]">
            <h3 className="font-cinzel text-lg font-bold text-[#E8E4E9] mb-1 text-glow-crimson">
              Inscribe Decree on the Task Altar
            </h3>
            <p className="text-xs text-[#A69EA9] mb-4">
              Commits an authoritative task to the Hermes workflow engine.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#A69EA9] uppercase font-mono mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Conduct Cryptographic Vulnerability Audit..."
                  className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A69EA9] uppercase font-mono mb-1">
                  Description & Specifications
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Specify parameters, constraints, and required outputs..."
                  className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded p-3 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#A69EA9] uppercase font-mono mb-1">
                    Priority Altar
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A69EA9] uppercase font-mono mb-1">
                    Assign Agent
                  </label>
                  <select
                    value={assignedAgentId}
                    onChange={e => setAssignedAgentId(e.target.value)}
                    className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#9E172C]/30">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-[#14121C] text-[#A69EA9] hover:text-[#E8E4E9] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_12px_rgba(215,38,61,0.4)]"
                >
                  Summon Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
