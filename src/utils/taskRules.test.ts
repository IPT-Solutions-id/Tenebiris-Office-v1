import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionTask,
  checkAgentSkillMatch,
  sortTasksByPriority,
} from './taskRules.ts';
import type { AgentRecord, TaskRecord } from './taskRules.ts';

test('valid task transitions are permitted', () => {
  assert.equal(canTransitionTask('DRAFT', 'QUEUED'), true);
  assert.equal(canTransitionTask('QUEUED', 'ASSIGNED'), true);
  assert.equal(canTransitionTask('RUNNING', 'COMPLETED'), true);
  assert.equal(canTransitionTask('FAILED', 'QUEUED'), true); // retry
});

test('invalid task transitions are blocked', () => {
  assert.equal(canTransitionTask('DRAFT', 'COMPLETED'), false);
  assert.equal(canTransitionTask('COMPLETED', 'RUNNING'), false);
  assert.equal(canTransitionTask('QUEUED', 'COMPLETED'), false);
});

test('checkAgentSkillMatch scores matching and missing skills', () => {
  const agent: AgentRecord = {
    id: 'agent-1',
    name: 'Mr Sunan',
    skills: ['Orchestration', 'Architecture', 'Hermes A2A'],
    status: 'AVAILABLE',
  };

  const perfectMatch = checkAgentSkillMatch(agent, ['Orchestration', 'Hermes A2A']);
  assert.equal(perfectMatch.isMatch, true);
  assert.equal(perfectMatch.missingSkills.length, 0);
  assert.equal(perfectMatch.matchScore, 1.0);

  const partialMatch = checkAgentSkillMatch(agent, ['Orchestration', 'CAD']);
  assert.equal(partialMatch.isMatch, false);
  assert.deepEqual(partialMatch.missingSkills, ['CAD']);
  assert.equal(partialMatch.matchScore, 0.5);
});

test('sortTasksByPriority puts CRITICAL and HIGH ahead of LOW', () => {
  const tasks: TaskRecord[] = [
    { id: '1', title: 'Low Task', status: 'QUEUED', priority: 'LOW', requiredSkills: [], progressPercent: 0 },
    { id: '2', title: 'Critical Task', status: 'RUNNING', priority: 'CRITICAL', requiredSkills: [], progressPercent: 50 },
    { id: '3', title: 'Medium Task', status: 'ASSIGNED', priority: 'MEDIUM', requiredSkills: [], progressPercent: 20 },
  ];

  const sorted = sortTasksByPriority(tasks);
  assert.equal(sorted[0].id, '2'); // Critical
  assert.equal(sorted[1].id, '3'); // Medium
  assert.equal(sorted[2].id, '1'); // Low
});
