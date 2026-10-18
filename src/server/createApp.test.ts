import assert from 'node:assert/strict';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {createProductionApp} from './createApp';

const withServer = async (run: (baseUrl: string) => Promise<void>) => {
  const distDir = await mkdtemp(path.join(tmpdir(), 'tenebiris-dist-'));
  await writeFile(path.join(distDir, 'index.html'), '<title>Tenebiris Production</title>');

  const app = createProductionApp({
    distDir,
    runHermesCommand: async args => {
      if (args.includes('skills')) return '│ Name │\n│ hermes-agent │';
      if (args.some(arg => arg.includes('HERMES_HEALTH_OK'))) return 'HERMES_HEALTH_OK';
      return 'TENEBIRIS_PRODUCTION_OK';
    },
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
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
  await withServer(async baseUrl => {
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
    });
  });
});
