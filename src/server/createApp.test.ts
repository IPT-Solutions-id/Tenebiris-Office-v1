import assert from 'node:assert/strict';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {createProductionApp} from './createApp';
import {RuntimeStore} from './runtimeStore';

const withServer = async (run: (baseUrl: string, commands: string[][]) => Promise<void>) => {
  const distDir = await mkdtemp(path.join(tmpdir(), 'tenebiris-dist-'));
  const runtimeDir = await mkdtemp(path.join(tmpdir(), 'tenebiris-runtime-'));
  const runtimeStore = new RuntimeStore(path.join(runtimeDir, 'runtime.sqlite'));
  await writeFile(path.join(distDir, 'index.html'), '<title>Tenebiris Production</title>');
  const commands: string[][] = [];

  const app = createProductionApp({
    distDir,
    runHermesCommand: async args => {
      commands.push(args);
      if (args.includes('skills')) return '│ Name │\n│ hermes-agent │';
      if (args.some(arg => arg.includes('HERMES_HEALTH_OK'))) return 'HERMES_HEALTH_OK';
      return 'TENEBIRIS_PRODUCTION_OK';
    },
    runtimeStore,
    runtimeConfig: {
      profile: 'tenebiris',
      providerId: 'tenebiris9',
      providerName: '9Router',
      baseUrl: 'https://router.example/v1',
      apiKey: 'secret',
      defaultModel: 'anthropic/claude-test',
    },
    syncModels: async () => ({status: 'connected', count: 1, models: [{
      id: 'anthropic/claude-test', ownedBy: 'anthropic', capabilities: {vision: true},
    }]}),
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');

  try {
    await run(`http://127.0.0.1:${address.port}`, commands);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    runtimeStore.close();
  }
};

test('serves the production SPA', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Tenebiris Production/);
  });
});

test('verifies Hermes health through the production bridge', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/live/health`);
    const payload = await response.json() as {connected: boolean; status: string};
    assert.equal(response.status, 200);
    assert.deepEqual({connected: payload.connected, status: payload.status}, {connected: true, status: 'live'});
  });
});

test('sends chat through the production bridge', async () => {
  await withServer(async (baseUrl, commands) => {
    const response = await fetch(`${baseUrl}/api/live/chat`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({prompt: 'production probe'}),
    });
    const payload = await response.json() as {response: string; status: string};
    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      status: 'completed',
      response: 'TENEBIRIS_PRODUCTION_OK',
      runtime: 'Hermes',
      profile: 'tenebiris',
      session: 'mr-sunan-main',
      model: 'anthropic/claude-test',
    });
    assert.deepEqual(commands.at(-1), [
      '-p', 'tenebiris', 'chat', '-q', 'production probe', '-Q',
      '--continue', 'mr-sunan-main', '--create-if-missing',
      '--source', 'tenebiris-office', '-m', 'anthropic/claude-test',
    ]);
  });
});

test('exposes provider, profile, session, and model runtime status', async () => {
  await withServer(async baseUrl => {
    const refresh = await fetch(`${baseUrl}/api/runtime/models/refresh`, {method: 'POST'});
    assert.equal(refresh.status, 200);

    const response = await fetch(`${baseUrl}/api/runtime/status`);
    const payload = await response.json() as {
      profile: string;
      provider: {id: string; status: string};
      model: {default: string; catalogCount: number};
      session: {agentId: string; name: string};
    };
    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      profile: 'tenebiris',
      provider: {id: 'tenebiris9', name: '9Router', status: 'connected', baseUrl: 'https://router.example/v1', lastError: null},
      model: {default: 'anthropic/claude-test', catalogCount: 1},
      session: {agentId: 'agent_mr_sunan', profile: 'tenebiris', name: 'mr-sunan-main'},
    });
  });
});

test('serves and updates a complete live agent definition', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/agents/agent_mr_sunan`);
    assert.equal(response.status, 200);
    const agent = await response.json() as {
      soul: {name: string; version: number; communicationStyle: string};
      role: {name: string};
      modelBinding: {providerId: string};
      status: string;
    };
    assert.equal(agent.soul.name, 'Strategic Commander');
    assert.equal(agent.role.name, 'Chief AI Orchestrator');
    assert.equal(agent.modelBinding.providerId, 'tenebiris9');
    assert.equal(agent.status, 'READY');

    const updated = {...agent, soul: {...agent.soul, version: 2, communicationStyle: 'Concise Indonesian'}};
    const save = await fetch(`${baseUrl}/api/agents/agent_mr_sunan`, {
      method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify(updated),
    });
    assert.equal(save.status, 200);
    const saved = await save.json() as {soul: {version: number; communicationStyle: string}};
    assert.equal(saved.soul.version, 2);
    assert.equal(saved.soul.communicationStyle, 'Concise Indonesian');
  });
});
