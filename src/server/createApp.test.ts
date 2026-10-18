import assert from 'node:assert/strict';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {EventEmitter} from 'node:events';
import {createProductionApp} from './createApp';
import {RuntimeStore} from './runtimeStore';

const withServer = async (run: (baseUrl: string, commands: string[][]) => Promise<void>) => {
  const distDir = await mkdtemp(path.join(tmpdir(), 'tenebiris-dist-'));
  const runtimeDir = await mkdtemp(path.join(tmpdir(), 'tenebiris-runtime-'));
  const runtimeStore = new RuntimeStore(path.join(runtimeDir, 'runtime.sqlite'));
  await writeFile(path.join(distDir, 'index.html'), '<title>Tenebiris Production</title>');
  const commands: string[][] = [];

  const spawnHermesProcess = (args: string[]) => {
    commands.push(args);
    const child = new EventEmitter() as import('node:child_process').ChildProcess & {
      stdout: EventEmitter; stderr: EventEmitter; killed: boolean; kill: () => boolean;
    };
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    child.stdout = stdout as never;
    child.stderr = stderr as never;
    child.killed = false;
    child.kill = () => {
      child.killed = true;
      return true;
    };
    queueMicrotask(() => {
      stdout.emit('data', Buffer.from('STREAM_PHASE3_OK'));
      child.emit('close', 0);
    });
    return child;
  };

  const app = createProductionApp({
    distDir,
    runHermesCommand: async args => {
      commands.push(args);
      if (args.includes('skills')) return '│ Name │\n│ hermes-agent │';
      if (args.some(arg => arg.includes('HERMES_HEALTH_OK'))) return 'HERMES_HEALTH_OK';
      return 'TENEBIRIS_PRODUCTION_OK';
    },
    spawnHermesProcess,
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

test('persists chat history per session', () => {
  const store = new RuntimeStore(`/tmp/tenebiris-chat-history-${process.pid}-${Date.now()}.sqlite`);
  try {
    store.addChatMessage({sessionId: 'mr-sunan-main', agentId: 'agent_mr_sunan', role: 'user', content: 'ping', model: null});
    store.addChatMessage({sessionId: 'mr-sunan-main', agentId: 'agent_mr_sunan', role: 'assistant', content: 'pong', model: 'cx/gpt-5.6-sol[1m]'});
    const history = store.listChatMessages('mr-sunan-main');
    assert.equal(history.length, 2);
    assert.equal(history[0].role, 'user');
    assert.equal(history[1].role, 'assistant');
    assert.equal(history[1].model, 'cx/gpt-5.6-sol[1m]');
    assert.deepEqual(store.listChatMessages('other-session'), []);
  } finally {
    store.close();
  }
});

test('serves chat history via API', async () => {
  await withServer(async baseUrl => {
    const history = await fetch(`${baseUrl}/api/sessions/mr-sunan-main/messages`);
    assert.equal(history.status, 200);
    const payload = await history.json() as {sessionId: string; messages: Array<{role: string; content: string}>};
    assert.equal(payload.sessionId, 'mr-sunan-main');
    assert.ok(Array.isArray(payload.messages));
  });
});

test('streams chat deltas and persists the final response', async () => {
  await withServer(async baseUrl => {
    const stream = await fetch(`${baseUrl}/api/live/chat/stream`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({prompt: 'Reply exactly STREAM_PHASE3_OK.'}),
    });
    assert.equal(stream.status, 200);
    assert.ok(stream.headers.get('content-type')?.includes('text/event-stream'));
    const body = await stream.text();
    assert.ok(body.includes('event: done'), 'stream should end with done event');
    const doneBlock = body.split('\n\n').find(block => block.includes('event: done')) ?? '';
    const doneLine = doneBlock.split('\n').find(line => line.startsWith('data:')) ?? '';
    const done = JSON.parse(doneLine.slice(5)) as {response: string; model: string; session: string};
    assert.ok(done.response.includes('STREAM_PHASE3_OK'));
    assert.equal(done.model, 'anthropic/claude-test');
    assert.equal(done.session, 'mr-sunan-main');

    const history = await fetch(`${baseUrl}/api/sessions/mr-sunan-main/messages`);
    const payload = await history.json() as {messages: Array<{role: string; content: string}>};
    assert.ok(payload.messages.some(message => message.role === 'user' && message.content.includes('STREAM_PHASE3_OK')));
    assert.ok(payload.messages.some(message => message.role === 'assistant' && message.content.includes('STREAM_PHASE3_OK')));
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
