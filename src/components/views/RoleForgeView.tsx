import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { Hammer, Sparkles, UserCheck, Flame, Compass, ArrowRight } from 'lucide-react';

interface RoleTemplate {
  name: string;
  archetype: string;
  department: string;
  skills: string[];
  description: string;
  promptSnippet: string;
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Infernal Full-Stack Sorcerer',
    archetype: 'Developer',
    department: 'Infernal Development Chamber',
    skills: ['React / Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL Admin'],
    description: 'Specializes in high-velocity gothic UI construction, type-safe API bindings, and reactive client state.',
    promptSnippet: 'You are an elite TypeScript engineer. Write elegant, modular code with zero runtime errors and gothic precision.',
  },
  {
    name: 'Shadow CAD & Spatial Architect',
    archetype: 'Architect',
    department: 'Shadow Rendering Studio',
    skills: ['CAD / DXF Layouts', 'Distributed Systems'],
    description: 'Generates precision 2D vector schematics, 3D room geometries, and engineering specifications.',
    promptSnippet: 'You are a master CAD draftsperson. Compute millimeter-accurate blueprints with verified door swings and wall offsets.',
  },
  {
    name: 'Arcane Knowledge Inquisitor',
    archetype: 'Researcher',
    department: 'Forbidden Knowledge Archive',
    skills: ['Deep Web Research', 'Writing', 'SEO'],
    description: 'Discovers competitor telemetry, analyzes academic papers, and synthesizes occult technical reports.',
    promptSnippet: 'Conduct exhaustive web and academic research. Provide rigorous citations and actionable executive summaries.',
  },
  {
    name: 'Obsidian Mesh Infrastructure Warden',
    archetype: 'DevOps',
    department: 'Obsidian Infrastructure Chamber',
    skills: ['Docker / Kubernetes', 'PostgreSQL Admin', 'Security Hardening'],
    description: 'Maintains container clusters, zero-downtime database migrations, and cryptographic security boundaries.',
    promptSnippet: 'Enforce stringent security rules, orchestrate microservice meshes, and optimize SQL execution plans.',
  },
];

export const RoleForgeView: React.FC = () => {
  const { summonAgent, skills, setActiveTab } = useOffice();

  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate>(ROLE_TEMPLATES[0]);
  const [customName, setCustomName] = useState<string>('VORTEX');
  const [summonSuccess, setSummonSuccess] = useState<boolean>(false);

  const handleSummon = () => {
    if (!customName.trim()) return;
    summonAgent({
      name: customName,
      role: selectedTemplate.name,
      department: selectedTemplate.department,
      skills: selectedTemplate.skills,
    });
    setSummonSuccess(true);
    setTimeout(() => {
      setSummonSuccess(false);
      setActiveTab('virtual_office');
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <Hammer className="w-5 h-5 text-[#C69245]" />
            <span>ROLE FORGE & CAPABILITY SYNTHESIS</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Synthesize dynamic agent roles from discovered Hermes skills.
          </p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Templates Selection */}
        <div className="space-y-3">
          <h3 className="font-cinzel text-sm font-bold text-[#E8E4E9] uppercase tracking-wider mb-2">
            Suggested Archetypes
          </h3>
          {ROLE_TEMPLATES.map(tpl => {
            const isSelected = selectedTemplate.name === tpl.name;
            return (
              <div
                key={tpl.name}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1A101C] border-[#D7263D] shadow-[0_0_12px_rgba(215,38,61,0.35)]'
                    : 'bg-[#14121C] border-[#9E172C]/30 hover:border-[#9E172C]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#490D1B] text-[#D7263D]">
                    {tpl.archetype}
                  </span>
                  <span className="text-[10px] text-[#A69EA9] font-mono">{tpl.skills.length} Skills</span>
                </div>
                <h4 className="font-semibold text-sm text-[#E8E4E9] mb-1">{tpl.name}</h4>
                <p className="text-[11px] text-[#A69EA9] leading-relaxed mb-2">{tpl.description}</p>
                <span className="text-[10px] text-[#39C5CF] font-mono">{tpl.department}</span>
              </div>
            );
          })}
        </div>

        {/* Forge Crucible / Configuration */}
        <div className="lg:col-span-2 bg-[#14121C] border border-[#9E172C]/50 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Flame className="w-4 h-4 text-[#D7263D] animate-pulse" />
              <h3 className="font-cinzel text-base font-bold text-[#E8E4E9] text-glow-crimson">
                The Crucible of Summons
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] text-[#A69EA9] font-mono uppercase mb-1">
                  Agent Moniker
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. VORTEX, KHALID, VALERIA..."
                  className="w-full bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A69EA9] font-mono uppercase mb-1">
                  Assigned Office Chamber
                </label>
                <input
                  type="text"
                  value={selectedTemplate.department}
                  readOnly
                  className="w-full bg-[#09090F] border border-[#9E172C]/20 rounded px-3 py-2 text-xs text-[#A69EA9] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Inscribed Hermes Prompt Blueprint */}
            <div className="mb-4">
              <label className="block text-[11px] text-[#A69EA9] font-mono uppercase mb-1">
                Hermes Behavioral Directive (System Blueprint)
              </label>
              <textarea
                value={selectedTemplate.promptSnippet}
                readOnly
                rows={3}
                className="w-full bg-[#09090F] border border-[#9E172C]/30 rounded p-3 text-xs text-[#39C5CF] font-mono leading-relaxed resize-none focus:outline-none"
              />
            </div>

            {/* Skills Being Infused */}
            <div className="mb-4">
              <label className="block text-[11px] text-[#A69EA9] font-mono uppercase mb-1">
                Infused Skill Array ({selectedTemplate.skills.length})
              </label>
              <div className="flex flex-wrap gap-2 bg-[#09090F] p-3 rounded border border-[#9E172C]/30">
                {selectedTemplate.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded text-xs bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] font-semibold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-[#C69245]" />
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Summon Button */}
          <div className="pt-4 border-t border-[#9E172C]/40 flex items-center justify-between">
            <span className="text-[11px] text-[#A69EA9] font-mono">
              Binding target: Hermes Primary Runtime
            </span>

            <button
              onClick={handleSummon}
              disabled={summonSuccess}
              className="flex items-center space-x-2 px-6 py-2.5 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_15px_rgba(215,38,61,0.5)] transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>{summonSuccess ? 'Summoned to Chamber!' : 'Forge Role & Summon Agent'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
