/**
 * Core type definitions for Tenebiris Office
 */

export type NavigationTab =
  | 'virtual_office'
  | 'summoned_agents'
  | 'skills_archive'
  | 'role_forge'
  | 'task_altar'
  | 'ritual_flows'
  | 'activity_scrolls'
  | 'hermes_gate'
  | 'occult_settings';

export type AgentStatus =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'SYNC_PENDING'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'ERROR';

export type TaskStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WorkstationType =
  | 'COMMAND'
  | 'CODING'
  | 'CAD'
  | 'RESEARCH'
  | 'DEVOPS'
  | 'COUNCIL';

export type DockPanelTab =
  | 'coding'
  | 'cad'
  | 'task_execution'
  | 'communication'
  | 'role_builder';

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  proficiency?: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
  description: string;
  isHermesNative: boolean;
  isAvailable: boolean;
  version?: string;
}

export interface Agent {
  id: string;
  agentNumber: string;
  name: string;
  title: string;
  department: string;
  role: string;
  model: string;
  status: AgentStatus;
  currentAction: string;
  workstationId: string;
  isPrimary: boolean;
  avatarTheme: string;
  skills: { name: string; proficiency: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' }[];
  currentTaskId?: string;
  position: { col: number; row: number };
  spriteColor: string;
  hermesBound: boolean;
  core?: AgentCoreDefinition;
}

export interface AgentCoreDefinition {
  id: string;
  name: string;
  agentNumber: string;
  department: string;
  soul: { name: string; version: number; principles: string[]; communicationStyle: string };
  role: { id: string; name: string; version: number; mission: string; responsibilities: string[]; jobTypes: string[]; requiredOutput: string[]; successCriteria: string[]; boundaries: string[] };
  modelBinding: { providerId: string; primaryModelId: string; fallbackModelIds: string[] };
  skills: Array<{ id: string; name: string; proficiency: string }>;
  toolPolicy: { allowed: string[]; denied: string[]; approvalRequired: string[] };
  approvalPolicy: { default: 'auto' | 'ask' | 'deny'; rules: string[] };
  learningPolicy: { enabled: boolean; allowedSources: string[]; requiresApproval: boolean; retention: 'session' | 'agent' | 'project' };
  memoryPolicy: {
    profile: 'none' | 'read' | 'read-write';
    project: 'none' | 'read' | 'read-write';
    agent: 'none' | 'read' | 'read-write';
    task: 'none' | 'read' | 'read-write';
  };
  profile: string;
  sessionName: string;
  workspace: string;
  status: 'DRAFT' | 'READY' | 'UNAVAILABLE' | 'ERROR';
}

export interface Workstation {
  id: string;
  name: string;
  zone: string;
  type: WorkstationType;
  position: { col: number; row: number };
  screenGlow: 'crimson' | 'cyan' | 'purple' | 'gold';
  assignedAgentId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  requiredSkills: string[];
  progressPercent: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  logs: string[];
  artifacts: Artifact[];
}

export interface Artifact {
  id: string;
  title: string;
  type: 'CODE' | 'CAD' | 'PDF' | 'LOG' | 'IMAGE';
  url?: string;
  content?: string;
  format: string;
  createdAt: string;
}

export interface A2AMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  timestamp: string;
  content: string;
  taskRef?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  requiresApproval?: boolean;
  mentions?: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'RITUAL';
}

export interface HermesCapability {
  name: string;
  status: 'SUPPORTED' | 'PARTIALLY SUPPORTED' | 'REQUIRES CONFIGURATION' | 'UNSUPPORTED' | 'NOT VERIFIED';
  description: string;
  verifiedAt?: string;
}

export interface HermesState {
  connected: boolean;
  gatewayUrl: string;
  latencyMs: number;
  lastPing: string;
  activeModel: string;
  bindingStatus: 'BOUND' | 'PENDING' | 'DISCONNECTED' | 'UNVERIFIED';
  capabilities: HermesCapability[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  assignedRole: string;
  skillsRequired: string[];
  dependsOn?: string[];
  requiresApproval: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}
