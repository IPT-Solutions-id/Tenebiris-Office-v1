import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { Terminal, CheckCircle2, RotateCw, Play, ShieldAlert } from 'lucide-react';

export const TaskExecutionView: React.FC = () => {
  const { selectedAgent, tasks, retryTask } = useOffice();
  const [isRerunning, setIsRerunning] = useState<boolean>(false);

  // Find active task or Drake's CAD task
  const activeTask =
    tasks.find(t => t.assignedAgentId === selectedAgent.id) ||
    tasks.find(t => t.id === 'task_001') ||
    tasks[0];

  const handleRerun = () => {
    setIsRerunning(true);
    if (activeTask) retryTask(activeTask.id);
    setTimeout(() => setIsRerunning(false), 1000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#09090F] font-mono text-xs select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#9E172C]/40 bg-[#0E0C16] px-2.5 py-1.5 shrink-0 gap-1">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-[#39C5CF] shrink-0" />
          <span className="font-semibold text-[#E8E4E9] text-[10.5px] truncate" title={`${selectedAgent.name} — ${selectedAgent.role}`}>
            {selectedAgent.name} — {selectedAgent.role}
          </span>
          <span className="text-[8.5px] px-1 py-0.2 rounded bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/30 shrink-0">
            {activeTask ? activeTask.status : 'IDLE'}
          </span>
        </div>

        <button
          onClick={handleRerun}
          disabled={isRerunning}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#14121C] border border-[#9E172C]/40 hover:border-[#9E172C] text-[#E8E4E9] text-[10px] transition-all disabled:opacity-50 shrink-0"
        >
          <RotateCw className={`w-3 h-3 text-[#39C5CF] ${isRerunning ? 'animate-spin' : ''}`} />
          <span>{isRerunning ? 'Re-exec...' : 'Re-run'}</span>
        </button>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[10.5px] bg-[#09090F]">
        {activeTask ? (
          activeTask.logs.map((line, idx) => {
            const isOk = line.includes('[OK]');
            const isInfo = line.includes('[INFO]');
            const isWarn = line.includes('[WARN]');
            const isErr = line.includes('[ERR]') || line.includes('[ERROR]');

            return (
              <div
                key={idx}
                className={`leading-relaxed ${
                  isOk
                    ? 'text-[#39C5CF] font-semibold'
                    : isErr
                    ? 'text-[#D7263D] font-bold'
                    : isWarn
                    ? 'text-[#C69245]'
                    : isInfo
                    ? 'text-[#E8E4E9]'
                    : 'text-[#A69EA9]'
                }`}
              >
                {line}
              </div>
            );
          })
        ) : (
          <div className="text-[#7A7280] italic">No active task logs in current chamber.</div>
        )}
      </div>

      {/* Progress & Artifacts Bar */}
      <div className="border-t border-[#9E172C]/40 bg-[#0E0C16] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 max-w-xs">
          <span className="text-[10px] text-[#A69EA9]">Progress:</span>
          <div className="flex-1 bg-[#14121C] h-2 rounded-full overflow-hidden border border-[#9E172C]/30">
            <div
              className="bg-[#D7263D] h-full transition-all duration-300"
              style={{ width: `${activeTask ? activeTask.progressPercent : 0}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-[#39C5CF] font-bold font-mono">
            {activeTask ? activeTask.progressPercent : 0}%
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-[#A69EA9]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#39C5CF]" />
          <span>Hermes Runtime Session Active</span>
        </div>
      </div>
    </div>
  );
};
