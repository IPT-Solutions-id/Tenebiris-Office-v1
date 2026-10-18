import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {RuntimeStore, type AgentDefinition} from './runtimeStore';

const mrSunan: AgentDefinition = {
  id: 'agent_mr_sunan', name: 'Mr Sunan', agentNumber: '001', department: 'Central Command',
  soul: {name: 'Strategic Commander', version: 1, principles: ['Verify before reporting'], communicationStyle: 'Direct Indonesian'},
  role: {id: 'chief-ai-orchestrator', name: 'Chief AI Orchestrator', version: 1, mission: 'Coordinate the Tenebiris workforce.', responsibilities: ['Orchestrate agents']},
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
  assert.deepEqual(store.getAgent(mrSunan.id), changed);
  store.close();
});
