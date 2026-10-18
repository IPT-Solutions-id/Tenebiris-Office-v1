import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {RuntimeStore} from './runtimeStore';
import {syncModelCatalog} from './modelRegistry';
import {buildSessionArgs} from './sessionManager';

test('runtime store persists provider, models, and named sessions', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'tenebiris-runtime-'));
  const databasePath = path.join(dir, 'runtime.sqlite');
  const store = new RuntimeStore(databasePath);

  store.upsertProvider({
    id: 'tenebiris9',
    name: '9Router',
    baseUrl: 'https://tenebiris9.ipt.solutions/v1',
    status: 'connected',
    lastError: null,
  });
  store.replaceModels('tenebiris9', [
    {id: 'provider/model-a', ownedBy: 'provider', capabilities: {vision: true}},
  ]);
  store.ensureSession({agentId: 'mr-sunan', profile: 'tenebiris', name: 'mr-sunan-main'});
  store.close();

  const reopened = new RuntimeStore(databasePath);
  assert.equal(reopened.getProvider('tenebiris9')?.status, 'connected');
  assert.equal(reopened.listModels('tenebiris9')[0]?.id, 'provider/model-a');
  assert.equal(reopened.getSession('mr-sunan')?.name, 'mr-sunan-main');
  reopened.close();
});

test('model registry sync persists the real OpenAI-compatible catalog shape', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'tenebiris-models-'));
  const store = new RuntimeStore(path.join(dir, 'runtime.sqlite'));
  const seenHeaders: Record<string, string> = {};
  const fetcher: typeof fetch = async (_input, init) => {
    Object.assign(seenHeaders, init?.headers);
    return new Response(JSON.stringify({
      object: 'list',
      data: [{
        id: 'anthropic/claude-test',
        object: 'model',
        owned_by: 'anthropic',
        capabilities: {vision: true, audioInput: false},
      }],
    }), {status: 200, headers: {'content-type': 'application/json'}});
  };

  const result = await syncModelCatalog({
    store,
    providerId: 'tenebiris9',
    providerName: '9Router',
    baseUrl: 'https://router.example/v1',
    apiKey: 'secret',
    fetcher,
  });

  assert.equal(result.count, 1);
  assert.equal(seenHeaders.Authorization, 'Bearer secret');
  assert.match(seenHeaders['User-Agent'], /Tenebiris-Office/);
  assert.deepEqual(store.listModels('tenebiris9')[0]?.capabilities, {
    vision: true,
    audioInput: false,
  });
  store.close();
});

test('persistent agent sessions use the Tenebiris Hermes profile and named continuation', () => {
  assert.deepEqual(buildSessionArgs({
    profile: 'tenebiris',
    sessionName: 'mr-sunan-main',
    prompt: 'hello',
    model: 'anthropic/claude-test',
  }), [
    '-p', 'tenebiris', 'chat', '-q', 'hello', '-Q',
    '--continue', 'mr-sunan-main', '--create-if-missing',
    '--source', 'tenebiris-office', '-m', 'anthropic/claude-test',
  ]);
});
