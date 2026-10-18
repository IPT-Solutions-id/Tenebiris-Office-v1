import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { createLiveAgent } from '../../services/liveHermesService';
import type { AgentCoreDefinition } from '../../types/office';
import { Sparkles, Plus, X, UserPlus, CheckCircle2 } from 'lucide-react';

const MODEL_OPTIONS = ['cx/gpt-5.6-sol[1m]', 'anthropic/claude-test', 'Dahonoai/dahono/claude-opus-5'];
const TOOL_OPTIONS = ['files', 'terminal', 'browser', 'github', 'delegation', 'kanban'];
const MEMORY_SCOPES = ['read-write', 'read', 'none'] as const;
const LEARNING_SOURCES = ['task-results', 'approved-feedback', 'hermes-skills'];
const createId = (name: string) => `agent_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;

const SUGGESTED_ROLES = [
  'Content Specialist',
  'Frontend Engineer',
  'CAD Architect',
  'Security Alchemist',
  'Research Inquisitor',
  'DevOps Warder',
  'Data Oracle',
];

const DEPARTMENTS = [
  'Central Command',
  'Infernal Development Chamber',
  'Forbidden Knowledge Archive',
  'Shadow Rendering Studio',
  'Obsidian Infrastructure Chamber',
  'Council of Agents',
];

const AVAILABLE_SKILL_OPTIONS = [
  'Writing',
  'Research',
  'SEO',
  'Social Media',
  'React / Next.js',
  'TypeScript',
  'CAD / DXF Layouts',
  'Docker / Kubernetes',
  'PostgreSQL Admin',
  'Security Hardening',
  'UI/UX Design',
];

export const SkillRoleBuilderView: React.FC = () => {
  const { summonAgent, skills } = useOffice();
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0]);
  const [soulName, setSoulName] = useState<string>('Adaptive Specialist');
  const [mission, setMission] = useState<string>('Deliver verified work for the assigned department.');
  const [learningEnabled, setLearningEnabled] = useState<boolean>(true);
  const [approvalDefault, setApprovalDefault] = useState<'auto' | 'ask' | 'deny'>('ask');
  const [workspace, setWorkspace] = useState<string>('/opt/data/Tenebiris Office');
  const [memoryScope, setMemoryScope] = useState<typeof MEMORY_SCOPES[number]>('read-write');
  const [outputCriteria, setOutputCriteria] = useState<string>('verified result, blockers, artifacts');
  const [boundaries, setBoundaries] = useState<string>('production changes require approval');
  const [fallbackModel, setFallbackModel] = useState<string>(MODEL_OPTIONS[1]);
  const [toolPolicy, setToolPolicy] = useState<string[]>(TOOL_OPTIONS.slice(0, 3));
  const [saving, setSaving] = useState<boolean>(false);

  const [name, setName] = useState<string>('NYX');
  const [role, setRole] = useState<string>('Content Specialist');
  const [department, setDepartment] = useState<string>('Forbidden Knowledge Archive');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Writing',
    'Research',
    'SEO',
  ]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const id = createId(name);
    const definition: AgentCoreDefinition = {
      id, name: name.toUpperCase(), agentNumber: 'NEW', department,
      soul: {name: soulName, version: 1, principles: ['Verify assigned work', 'Learn from approved feedback'], communicationStyle: 'Direct and concise'},
      role: {
        id: role.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: role, version: 1, mission,
        responsibilities: ['Execute assigned work', 'Report evidence'], jobTypes: [role],
        requiredOutput: outputCriteria.split(',').map(item => item.trim()).filter(Boolean),
        successCriteria: ['Output matches requested scope', 'Blockers are explicit'],
        boundaries: boundaries.split(',').map(item => item.trim()).filter(Boolean),
      },
      modelBinding: {providerId: 'tenebiris9', primaryModelId: model, fallbackModelIds: [fallbackModel]},
      skills: selectedSkills.map(skill => ({id: skill.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: skill, proficiency: 'Advanced'})),
      toolPolicy: {allowed: toolPolicy, denied: ['credential-export'], approvalRequired: ['production-deploy']},
      approvalPolicy: {default: approvalDefault, rules: ['production-deploy', 'credential-change']},
      learningPolicy: {enabled: learningEnabled, allowedSources: LEARNING_SOURCES, requiresApproval: true, retention: 'agent'},
      memoryPolicy: {profile: memoryScope, project: memoryScope, agent: memoryScope, task: memoryScope},
      profile: 'tenebiris', sessionName: `${id}-main`, workspace, status: 'DRAFT',
    };
    try {
      await createLiveAgent(definition);
      summonAgent({name, role, department, skills: selectedSkills});
      setSuccessMessage(`Agent ${name.toUpperCase()} saved with Soul v1 and Role v1.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setSuccessMessage(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#09090F] font-mono text-xs select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#9E172C]/40 bg-[#0E0C16] px-2.5 py-1.5 shrink-0 gap-1">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-[#C69245] shrink-0" />
          <span className="font-semibold text-[#E8E4E9] text-[10.5px] truncate">
            ROLE BUILDER
          </span>
        </div>
        <span className="text-[9px] text-[#A69EA9] shrink-0 font-mono">Hermes Binding</span>
      </div>

      {/* Form Content */}
      <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-2.5 space-y-2">
        <div className="text-[10.5px] font-bold text-[#E8E4E9] font-cinzel">
          Create New Agent Profile
        </div>

        {/* Name Field */}
        <div className="flex items-center justify-between space-x-2">
          <label className="text-[11px] text-[#A69EA9] w-20 shrink-0">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Agent name..."
            className="flex-1 bg-[#14121C] border border-[#9E172C]/40 rounded px-2.5 py-1 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
            required
          />
        </div>

        {/* Role Dropdown */}
        <div className="flex items-center justify-between space-x-2">
          <label className="text-[11px] text-[#A69EA9] w-20 shrink-0">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="flex-1 bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
          >
            {SUGGESTED_ROLES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div className="flex items-center justify-between space-x-2">
          <label className="text-[11px] text-[#A69EA9] w-20 shrink-0">Department</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="flex-1 bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
          >
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-[#A69EA9]">Soul name<input value={soulName} onChange={e => setSoulName(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]" /></label>
          <label className="text-[10px] text-[#A69EA9]">Primary model<select value={model} onChange={e => setModel(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]">{MODEL_OPTIONS.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="text-[10px] text-[#A69EA9]">Fallback model<select value={fallbackModel} onChange={e => setFallbackModel(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]">{MODEL_OPTIONS.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="text-[10px] text-[#A69EA9]">Approval<select value={approvalDefault} onChange={e => setApprovalDefault(e.target.value as 'auto' | 'ask' | 'deny')} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]"><option value="ask">Ask</option><option value="auto">Auto</option><option value="deny">Deny</option></select></label>
        </div>
        <label className="block text-[10px] text-[#A69EA9]">Mission<input value={mission} onChange={e => setMission(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]" /></label>
        <label className="block text-[10px] text-[#A69EA9]">Required output<textarea value={outputCriteria} onChange={e => setOutputCriteria(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]" rows={2} /></label>
        <label className="block text-[10px] text-[#A69EA9]">Boundaries<textarea value={boundaries} onChange={e => setBoundaries(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]" rows={2} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-[#A69EA9]">Memory scope<select value={memoryScope} onChange={e => setMemoryScope(e.target.value as typeof memoryScope)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]">{MEMORY_SCOPES.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="text-[10px] text-[#A69EA9]">Workspace<input value={workspace} onChange={e => setWorkspace(e.target.value)} className="mt-1 w-full bg-[#14121C] border border-[#9E172C]/40 rounded px-2 py-1 text-[#E8E4E9]" /></label>
        </div>
        <div className="flex flex-wrap gap-1">{TOOL_OPTIONS.map(tool => <button type="button" key={tool} onClick={() => setToolPolicy(current => current.includes(tool) ? current.filter(item => item !== tool) : [...current, tool])} className={`px-2 py-0.5 border rounded text-[9px] ${toolPolicy.includes(tool) ? 'text-[#39C5CF] border-[#39C5CF]/50' : 'text-[#7A7280] border-[#9E172C]/30'}`}>{tool}</button>)}</div>
        <label className="flex items-center gap-2 text-[10px] text-[#A69EA9]"><input type="checkbox" checked={learningEnabled} onChange={e => setLearningEnabled(e.target.checked)} /> Learning policy enabled; approved feedback required</label>

        {/* Skills Selection */}
        <div>
          <label className="block text-[11px] text-[#A69EA9] mb-1.5">
            Skills ({selectedSkills.length} selected)
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#14121C] rounded border border-[#9E172C]/30">
            {AVAILABLE_SKILL_OPTIONS.map(skill => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 border transition-all ${
                    isSelected
                      ? 'bg-[#490D1B] text-[#E8E4E9] border-[#9E172C]'
                      : 'bg-[#09090F] text-[#7A7280] border-[#9E172C]/20 hover:text-[#E8E4E9]'
                  }`}
                >
                  <span>{skill}</span>
                  {isSelected ? <X className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {successMessage && (
          <div className="p-2 rounded bg-[#14291F] text-[#39C5CF] text-[10.5px] flex items-center space-x-1.5 border border-[#39C5CF]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-[#9E172C]/30">
          <button
            type="button"
            onClick={() => {
              setName('');
              setSelectedSkills([]);
            }}
            className="px-3 py-1.5 rounded bg-[#14121C] text-[#A69EA9] hover:text-[#E8E4E9] text-[11px] border border-[#9E172C]/30"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-[11px] shadow-[0_0_8px_rgba(215,38,61,0.4)] flex items-center space-x-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Agent</span>
          </button>
        </div>
      </form>
    </div>
  );
};
