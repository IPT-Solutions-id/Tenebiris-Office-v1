import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { GitBranch, CheckCircle2, Clock, ShieldAlert, Play, ArrowDown, UserCheck, Flame } from 'lucide-react';

export const RitualFlowsView: React.FC = () => {
  const { workflows } = useOffice();
  const [activeWorkflow, setActiveWorkflow] = useState(workflows[0]);
  const [approvedSteps, setApprovedSteps] = useState<Record<string, boolean>>({});

  const handleApproveGate = (stepId: string) => {
    setApprovedSteps(prev => ({ ...prev, [stepId]: true }));
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-[#D7263D]" />
            <span>RITUAL FLOWS & MULTI-AGENT DAG</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Sequential and parallel ritual orchestrations with human-in-the-loop gates.
          </p>
        </div>

        <span className="px-3 py-1 rounded bg-[#490D1B] text-[#D7263D] border border-[#9E172C] font-mono text-xs font-semibold">
          STATUS: {activeWorkflow ? activeWorkflow.status : 'ACTIVE'}
        </span>
      </div>

      {/* Workflow Header Banner */}
      <div className="bg-[#14121C] border border-[#9E172C]/50 rounded-lg p-5 mb-6">
        <h3 className="font-cinzel text-base font-bold text-[#E8E4E9] mb-1">
          {activeWorkflow?.name}
        </h3>
        <p className="text-xs text-[#A69EA9] leading-relaxed">
          {activeWorkflow?.description}
        </p>
      </div>

      {/* Visual Step-by-Step DAG Flow */}
      <div className="max-w-3xl mx-auto space-y-4 py-4 w-full">
        {activeWorkflow?.steps.map((step, idx) => {
          const isApproved = approvedSteps[step.id];
          const isCompleted = step.status === 'completed' || isApproved;
          const isInProgress = step.status === 'in_progress' && !isApproved;

          return (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <div
                className={`p-5 rounded-lg border transition-all ${
                  isCompleted
                    ? 'bg-[#14291F]/30 border-[#39C5CF]/50 shadow-[0_0_12px_rgba(57,197,207,0.15)]'
                    : isInProgress
                    ? 'bg-[#490D1B]/30 border-[#D7263D] shadow-[0_0_15px_rgba(215,38,61,0.25)]'
                    : 'bg-[#14121C] border-[#9E172C]/30 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-[#09090F] border border-[#9E172C] text-xs font-bold font-mono flex items-center justify-center text-[#E8E4E9]">
                      {idx + 1}
                    </span>
                    <h4 className="font-semibold text-sm text-[#E8E4E9]">{step.title}</h4>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isCompleted
                        ? 'bg-[#14291F] text-[#39C5CF]'
                        : isInProgress
                        ? 'bg-[#9E172C] text-[#E8E4E9] animate-pulse'
                        : 'bg-[#1A1826] text-[#A69EA9]'
                    }`}
                  >
                    {isCompleted ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#A69EA9] my-2 bg-[#09090F] p-3 rounded border border-[#9E172C]/20 font-mono">
                  <div>
                    <span className="text-[#7A7280]">Assigned Role: </span>
                    <span className="text-[#E8E4E9] font-semibold">{step.assignedRole}</span>
                  </div>
                  <div>
                    <span className="text-[#7A7280]">Required Skills: </span>
                    <span className="text-[#39C5CF]">{step.skillsRequired.join(', ')}</span>
                  </div>
                </div>

                {/* Approval Gate */}
                {step.requiresApproval && (
                  <div className="mt-3 pt-3 border-t border-[#9E172C]/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#C69245] text-xs font-medium">
                      <ShieldAlert className="w-4 h-4" />
                      <span>High Priest Approval Gate</span>
                    </div>

                    {!isApproved ? (
                      <button
                        onClick={() => handleApproveGate(step.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_10px_rgba(215,38,61,0.4)] transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Grant Approval</span>
                      </button>
                    ) : (
                      <span className="text-[#39C5CF] text-xs font-mono font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approval Sealed</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Connecting Downward Flow Arrow */}
              {idx < activeWorkflow.steps.length - 1 && (
                <div className="flex justify-center text-[#9E172C]">
                  <ArrowDown className="w-5 h-5 animate-bounce" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
