import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { Agent } from '../../types/office';
import { Users, UserPlus, Trash2, Edit3, Shield, Sparkles, MapPin } from 'lucide-react';

export const SummonedAgentsView: React.FC = () => {
  const {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    dismissAgent,
    workstations,
    focusAgentWorkstation,
    setActiveTab,
  } = useOffice();

  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');

  const departments = ['ALL', ...Array.from(new Set(agents.map(a => a.department)))];

  const filteredAgents = filterDepartment === 'ALL'
    ? agents
    : agents.filter(a => a.department === filterDepartment);

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-[#09090F] select-none">
      {/* View Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#D7263D]" />
            <span>SUMMONED AGENTS ROSTER</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Active Hermes AI agents bound to chambers and workstations.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('role_forge')}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_12px_rgba(215,38,61,0.4)] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Summon New Agent</span>
        </button>
      </div>

      {/* Department Filter Pills */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-1">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setFilterDepartment(dept)}
            className={`px-3 py-1 rounded text-xs transition-all ${
              filterDepartment === dept
                ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] font-semibold'
                : 'bg-[#14121C] text-[#A69EA9] hover:text-[#E8E4E9] border border-[#9E172C]/30'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map(agent => {
          const ws = workstations.find(w => w.id === agent.workstationId);
          const isSelected = selectedAgentId === agent.id;

          return (
            <div
              key={agent.id}
              className={`bg-[#14121C] rounded-lg border p-4 transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-[#D7263D] shadow-[0_0_14px_rgba(215,38,61,0.35)]'
                  : 'border-[#9E172C]/30 hover:border-[#9E172C]/70'
              }`}
            >
              {agent.isPrimary && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-[#C69245]/20 text-[#C69245] border border-[#C69245]/40 font-mono">
                  CHIEF ORCHESTRATOR
                </div>
              )}

              <div>
                {/* Header & Avatar */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-14 bg-[#09090F] border border-[#9E172C] rounded flex flex-col items-center justify-center shrink-0">
                    <div
                      className="w-5 h-5 rounded-xs"
                      style={{ backgroundColor: agent.spriteColor || '#D7263D' }}
                    ></div>
                    <span className="text-[8px] text-[#A69EA9] font-mono mt-1">#{agent.agentNumber}</span>
                  </div>

                  <div>
                    <h3 className="font-cinzel text-sm font-bold text-[#E8E4E9]">{agent.name}</h3>
                    <p className="text-xs text-[#39C5CF] font-medium">{agent.role}</p>
                    <p className="text-[10px] text-[#A69EA9] truncate max-w-[150px]">{agent.department}</p>
                  </div>
                </div>

                {/* Workstation & Action Status */}
                <div className="space-y-1.5 text-[11px] mb-3 bg-[#09090F] p-2.5 rounded border border-[#9E172C]/20 font-mono">
                  <div className="flex items-center justify-between text-[#A69EA9]">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#C69245]" />
                      <span>Station:</span>
                    </span>
                    <span className="text-[#E8E4E9] truncate max-w-[130px]">
                      {ws ? ws.name : 'Chamber'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#A69EA9]">
                    <span>Status:</span>
                    <span className="text-[#C69245] truncate max-w-[130px] font-semibold">
                      {agent.currentAction}
                    </span>
                  </div>
                </div>

                {/* Skills Preview */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase text-[#7A7280] font-mono tracking-wider block mb-1">
                    Equipped Skills ({agent.skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 4).map((s, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#0E0C16] border border-[#9E172C]/30 text-[#A69EA9]"
                      >
                        {s.name}
                      </span>
                    ))}
                    {agent.skills.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#490D1B] text-[#D7263D] font-mono">
                        +{agent.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-3 border-t border-[#9E172C]/20">
                <button
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    focusAgentWorkstation(agent.id);
                    setActiveTab('virtual_office');
                  }}
                  className="flex-1 py-1.5 rounded bg-[#490D1B] hover:bg-[#9E172C] text-[#E8E4E9] text-xs font-semibold transition-all text-center"
                >
                  Inspect in Office
                </button>

                {!agent.isPrimary && (
                  <button
                    onClick={() => dismissAgent(agent.id)}
                    className="p-1.5 rounded bg-[#1A1624] hover:bg-[#D7263D]/20 text-[#A69EA9] hover:text-[#D7263D] border border-[#9E172C]/30"
                    title="Dismiss Agent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
