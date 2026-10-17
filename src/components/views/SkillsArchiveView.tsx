import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { BookOpen, Search, RefreshCw, CheckCircle2, Shield, Plus, Check } from 'lucide-react';

export const SkillsArchiveView: React.FC = () => {
  const {
    skills,
    agents,
    assignSkillToAgent,
    removeSkillFromAgent,
    syncHermesSkills,
  } = useOffice();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(skills[0]?.id || null);

  const categories = ['ALL', ...Array.from(new Set(skills.map(s => s.category)))];

  const filteredSkills = skills.filter(skill => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeSkill = skills.find(s => s.id === selectedSkillId) || skills[0];

  const handleSync = async () => {
    setIsSyncing(true);
    await syncHermesSkills();
    setIsSyncing(false);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#39C5CF]" />
            <span>HERMES SKILLS ARCHIVE</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Discovered runtime skills, tools, and procedural capabilities.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded bg-[#14121C] border border-[#9E172C]/50 hover:border-[#9E172C] text-[#E8E4E9] text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#39C5CF] ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronizing...' : 'Sync Skills'}</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7A7280] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search skills or keywords..."
            className="w-full bg-[#14121C] border border-[#9E172C]/40 rounded pl-9 pr-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded text-xs transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] font-semibold'
                  : 'bg-[#14121C] text-[#A69EA9] hover:text-[#E8E4E9] border border-[#9E172C]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column View: Skills List & Skill Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Skills Grid */}
        <div className="lg:col-span-2 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[calc(100vh-220px)]">
          {filteredSkills.map(skill => {
            const isSelected = activeSkill?.id === skill.id;
            const assignedCount = agents.filter(a => a.skills.some(s => s.name === skill.name)).length;

            return (
              <div
                key={skill.id}
                onClick={() => setSelectedSkillId(skill.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1A101C] border-[#D7263D] shadow-[0_0_12px_rgba(215,38,61,0.3)]'
                    : 'bg-[#14121C] border-[#9E172C]/30 hover:border-[#9E172C]/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#09090F] text-[#39C5CF] border border-[#39C5CF]/30">
                      {skill.category}
                    </span>
                    <span className="text-[10px] text-[#A69EA9] font-mono">
                      {assignedCount} {assignedCount === 1 ? 'Agent' : 'Agents'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-[#E8E4E9] mb-1">{skill.name}</h3>
                  <p className="text-[11px] text-[#A69EA9] leading-relaxed line-clamp-2">
                    {skill.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#9E172C]/20 text-[10.5px]">
                  <span className="text-[#C69245] flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hermes Verified</span>
                  </span>
                  <span className="text-[#39C5CF] font-mono">Active</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Skill Inspector / Assignment Box */}
        {activeSkill && (
          <div className="bg-[#14121C] border border-[#9E172C]/50 rounded-lg p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-[#D7263D]" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#A69EA9]">
                  Skill Dossier
                </span>
              </div>
              <h3 className="font-cinzel text-lg font-bold text-[#E8E4E9] text-glow-crimson mb-2">
                {activeSkill.name}
              </h3>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-[#490D1B] text-[#D7263D] border border-[#9E172C] font-mono mb-4">
                {activeSkill.category}
              </span>

              <p className="text-xs text-[#E8E4E9] leading-relaxed mb-6 bg-[#09090F] p-3 rounded border border-[#9E172C]/30">
                {activeSkill.description}
              </p>

              {/* Agents Assignment Matrix */}
              <h4 className="text-xs font-bold text-[#E8E4E9] uppercase font-mono tracking-wider mb-2">
                Assign to Summoned Agents
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {agents.map(agent => {
                  const hasSkill = agent.skills.some(s => s.name === activeSkill.name);

                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-2 rounded bg-[#09090F] border border-[#9E172C]/30"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-xs"
                          style={{ backgroundColor: agent.spriteColor || '#D7263D' }}
                        ></div>
                        <span className="text-xs text-[#E8E4E9] font-medium">{agent.name}</span>
                        <span className="text-[10px] text-[#7A7280]">({agent.role})</span>
                      </div>

                      <button
                        onClick={() => {
                          if (hasSkill) {
                            removeSkillFromAgent(agent.id, activeSkill.name);
                          } else {
                            assignSkillToAgent(agent.id, activeSkill.name);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center space-x-1 transition-all ${
                          hasSkill
                            ? 'bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/40 hover:bg-[#2A141A] hover:text-[#D7263D]'
                            : 'bg-[#490D1B] text-[#E8E4E9] hover:bg-[#9E172C]'
                        }`}
                      >
                        {hasSkill ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Equipped</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Equip</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#9E172C]/30 text-[10.5px] text-[#A69EA9] font-mono">
              Binding source: Hermes Dynamic Toolset Loader
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
