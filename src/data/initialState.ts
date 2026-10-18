import { Agent, AuditLog, HermesState, SkillItem, Task, Workstation, Workflow, A2AMessage } from '../types/office';

export const PRIMARY_AGENT_MR_SUNAN: Agent = {
  id: 'agent_mr_sunan',
  agentNumber: '001',
  name: 'Mr Sunan',
  title: 'Chief AI Orchestrator',
  department: 'Central Command',
  role: 'Chief AI Orchestrator',
  model: 'Hermes runtime (unverified)',
  status: 'SYNC_PENDING',
  currentAction: 'Awaiting live Hermes binding verification...',
  workstationId: 'ws_supreme_command',
  isPrimary: true,
  avatarTheme: 'Gothic Commander',
  skills: [],
  position: { col: 5, row: 5 },
  spriteColor: '#d7263d',
  hermesBound: false,
};

export const INITIAL_WORKSTATIONS: Workstation[] = [
  {
    id: 'ws_supreme_command',
    name: 'Supreme Command Altar',
    zone: 'Supreme Command Chamber',
    type: 'COMMAND',
    position: { col: 5, row: 5 },
    screenGlow: 'crimson',
    assignedAgentId: PRIMARY_AGENT_MR_SUNAN.id,
  },
  {
    id: 'ws_dev_01',
    name: 'Infernal Terminal Alpha',
    zone: 'Infernal Development Chamber',
    type: 'CODING',
    position: { col: 5, row: 2 },
    screenGlow: 'cyan',
  },
  {
    id: 'ws_archive_01',
    name: 'Grimoire Research Desk',
    zone: 'Forbidden Knowledge Archive',
    type: 'RESEARCH',
    position: { col: 2, row: 3 },
    screenGlow: 'gold',
  },
  {
    id: 'ws_archive_02',
    name: 'Scriptorium Desk',
    zone: 'Forbidden Knowledge Archive',
    type: 'RESEARCH',
    position: { col: 4, row: 8 },
    screenGlow: 'purple',
  },
  {
    id: 'ws_cad_01',
    name: 'Occult Blueprint Drafting Board',
    zone: 'Shadow Rendering Studio',
    type: 'CAD',
    position: { col: 8, row: 5 },
    screenGlow: 'crimson',
  },
  {
    id: 'ws_infra_01',
    name: 'Obsidian Server Monolith',
    zone: 'Obsidian Infrastructure Chamber',
    type: 'DEVOPS',
    position: { col: 2, row: 7 },
    screenGlow: 'cyan',
  },
  {
    id: 'ws_council_01',
    name: 'Council Round Terminal',
    zone: 'Council of Agents',
    type: 'COUNCIL',
    position: { col: 9, row: 3 },
    screenGlow: 'gold',
  },
  {
    id: 'ws_supreme_02',
    name: 'Strategic Hologram Array',
    zone: 'Supreme Command Chamber',
    type: 'COMMAND',
    position: { col: 8, row: 8 },
    screenGlow: 'crimson',
  },
];

const NOT_VERIFIED = 'NOT VERIFIED' as const;

export const INITIAL_HERMES_STATE: HermesState = {
  connected: false,
  gatewayUrl: '/api/live',
  latencyMs: 0,
  lastPing: 'Not verified',
  activeModel: 'Not verified',
  bindingStatus: 'UNVERIFIED',
  capabilities: [
    { name: 'Hermes Primary Agent Binding', status: NOT_VERIFIED, description: 'Requires a verified runtime binding for Mr Sunan.' },
    { name: 'Skills Registry & Auto-Discovery', status: NOT_VERIFIED, description: 'Awaiting live Hermes skill registry response.' },
    { name: 'Agent-to-Agent (A2A) Delegation', status: NOT_VERIFIED, description: 'No live capability evidence available yet.' },
    { name: 'Artifact Generation & File Sink', status: NOT_VERIFIED, description: 'No live artifact capability evidence available yet.' },
    { name: 'Streaming Execution Events', status: NOT_VERIFIED, description: 'No live event stream has been verified yet.' },
    { name: 'Memory & State Persistence', status: NOT_VERIFIED, description: 'Runtime persistence is not exposed through this bridge yet.' },
  ],
};

export const INITIAL_SKILLS: SkillItem[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_MESSAGES: A2AMessage[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_WORKFLOWS: Workflow[] = [];
export const EMPTY_TASKS: Task[] = [];
export const EMPTY_MESSAGES: A2AMessage[] = [];
export const EMPTY_AUDIT_LOGS: AuditLog[] = [];
export const EMPTY_WORKFLOWS: Workflow[] = [];
export const EMPTY_SKILLS: SkillItem[] = [];
export const EMPTY_AGENT_ROSTER: Agent[] = [PRIMARY_AGENT_MR_SUNAN];
export const EMPTY_AUDIT: AuditLog[] = [];
