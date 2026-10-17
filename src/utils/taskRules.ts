/**
 * Task state machine and business validation rules for Tenebiris Office
 */

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

export interface TaskRecord {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  requiredSkills: string[];
  assignedAgentId?: string;
  progressPercent: number;
}

export interface AgentRecord {
  id: string;
  name: string;
  skills: string[];
  status: string;
}

/**
 * Valid transitions table for the Task Altar state machine
 */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ['QUEUED', 'CANCELLED'],
  QUEUED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['RUNNING', 'QUEUED', 'CANCELLED'],
  RUNNING: ['WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED'],
  WAITING_APPROVAL: ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: ['QUEUED'], // retry allowed
  CANCELLED: ['DRAFT'], // restore allowed
};

/**
 * Validates whether a state transition is permitted
 */
export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Evaluates whether an agent has all required skills for a given task
 */
export function checkAgentSkillMatch(agent: AgentRecord, requiredSkills: string[]): {
  isMatch: boolean;
  missingSkills: string[];
  matchScore: number;
} {
  if (requiredSkills.length === 0) {
    return { isMatch: true, missingSkills: [], matchScore: 1.0 };
  }

  const missing = requiredSkills.filter(req => !agent.skills.includes(req));
  const matchedCount = requiredSkills.length - missing.length;
  const matchScore = matchedCount / requiredSkills.length;

  return {
    isMatch: missing.length === 0,
    missingSkills: missing,
    matchScore: Math.round(matchScore * 100) / 100,
  };
}

/**
 * Sorts tasks by priority (CRITICAL > HIGH > MEDIUM > LOW)
 */
export function sortTasksByPriority(tasks: TaskRecord[]): TaskRecord[] {
  const priorityWeight: Record<TaskPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return [...tasks].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
}
