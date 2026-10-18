import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {RuntimeStore, type AgentDefinition} from './runtimeStore';

const mrSunan: AgentDefinition = {
  id: 'agent_mr_sunan', name: 'Mr Sunan', agentNumber: '001', department: 'Central Command',
  soul: {name: 'Strategic Commander', version: 1, principles: ['Verify before reporting'], communicationStyle: 'Direct Indonesian'},
  role: {id: 'chief-ai-orchestrator', name: 'Chief AI Orchestrator', version: 1, mission: 'Coordinate the Tenebiris workforce.', responsibilities: ['Orchestrate agents'], jobTypes: ['orchestration'], requiredOutput: ['execution report'], successCriteria: ['verified result'], boundaries: ['approval-gated deploys']},
  skills: [{id: 'orchestration', name: 'Orchestration', proficiency: 'Expert'}],
  approvalPolicy: {default: 'ask', rules: ['production-deploy']},
  learningPolicy: {enabled: true, allowedSources: ['task-results'], requiresApproval: true, retention: 'agent'},
  modelBinding: {providerId: 'tenebiris9', primaryModelId: 'cx/gpt-5.6-sol[1m]', fallbackModelIds: []},
  toolPolicy: {allowed: ['files', 'terminal', 'browser'], denied: [], approvalRequired: ['production-deploy']},
  memoryPolicy: {profile: 'read-write', project: 'read-write', agent: 'read-write', task: 'read-write'},
  profile: 'tenebiris', sessionName: 'mr-sunan-main', workspace: '/opt/data/Tenebiris Office', status: 'READY',
};

test('agent definition persists all core policies', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'agent-core-'));
  const store = new RuntimeStore(path.join(dir, 'runtime.sqlite'));
  store.upsertAgent(mrSunan);
  assert.deepEqual(store.getAgent(mrSunan.id), mrSunan);
  assert.deepEqual(store.listAgents(), [mrSunan]);
  store.close();
});

test('agent update versions soul, role, model, tools, and memory atomically', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'agent-core-'));
  const store = new RuntimeStore(path.join(dir, 'runtime.sqlite'));
  store.upsertAgent(mrSunan);
  const changed = {...mrSunan, soul: {...mrSunan.soul, version: 2}, modelBinding: {...mrSunan.modelBinding, primaryModelId: 'Dahonoai/dahono/claude-opus-5'}};
  store.upsertAgent(changed);
  const saved = store.getAgent(mrSunan.id);
  assert.equal(saved?.soul.version, 2);
  assert.equal(saved?.role.version, 1);
  assert.equal(store.listDefinitionVersions(mrSunan.id).length, 2);
  const run = store.createTaskRun({id: 'run_1', agentId: mrSunan.id, sessionId: mrSunan.sessionName, taskTitle: 'Audit', definition: saved!});
  assert.equal(run?.soulVersion, 2);
  assert.equal(run?.roleVersion, 1);
  assert.equal(run?.definition.modelBinding.primaryModelId, 'Dahonoai/dahono/claude-opus-5');
  store.close();
});

test('agent definition contains complete creation policy sections', async () => {
  assert.ok(mrSunan.skills.length > 0);
  assert.equal(mrSunan.role.jobTypes[0], 'orchestration');
  assert.ok(mrSunan.role.requiredOutput.length > 0);
  assert.ok(mrSunan.role.successCriteria.length > 0);
  assert.ok(mrSunan.role.boundaries.length > 0);
  assert.equal(mrSunan.approvalPolicy.default, 'ask');
  assert.equal(mrSunan.learningPolicy.enabled, true);
});
