import { spawn } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const HERMES_BIN = process.env.HERMES_BIN ?? '/opt/hermes/.venv/bin/hermes';
const REQUEST_TIMEOUT_MS = 120_000;

type JsonRecord = Record<string, unknown>;

const sendJson = (res: ServerResponse, status: number, payload: JsonRecord) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readJson = async (req: IncomingMessage): Promise<JsonRecord> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  return parsed && typeof parsed === 'object' ? parsed as JsonRecord : {};
};

const runHermesCommand = (args: string[]): Promise<string> => new Promise((resolve, reject) => {
  const child = spawn(HERMES_BIN, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  const timeout = setTimeout(() => {
    child.kill('SIGTERM');
    reject(new Error('Hermes request timed out'));
  }, REQUEST_TIMEOUT_MS);

  child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)));
  child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)));
  child.on('error', error => {
    clearTimeout(timeout);
    reject(error);
  });
  child.on('close', code => {
    clearTimeout(timeout);
    if (code !== 0) {
      const detail = Buffer.concat(stderr).toString('utf8').trim();
      reject(new Error(detail || `Hermes exited with code ${code ?? 'unknown'}`));
      return;
    }
    resolve(Buffer.concat(stdout).toString('utf8').trim());
  });
});

const promptFromBody = (body: JsonRecord) => {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) throw new Error('prompt is required');
  return prompt;
};

const runHermes = (prompt: string) => runHermesCommand([
  'chat', '-q', prompt, '--oneshot', '-Q', '--source', 'tenebiris-office',
]);

export const liveHermesApi = (): Plugin => ({
  name: 'tenebiris-live-hermes-api',
  configureServer(server) {
    server.middlewares.use('/api/live/health', async (_req, res) => {
      const started = Date.now();
      try {
        const output = await runHermesCommand(['chat', '-q', 'Reply exactly HERMES_HEALTH_OK.', '--oneshot', '-Q']);
        const verified = output.includes('HERMES_HEALTH_OK');
        sendJson(res, verified ? 200 : 502, {
          status: verified ? 'live' : 'unavailable',
          connected: verified,
          latencyMs: Date.now() - started,
          runtime: 'Hermes CLI',
          endpoint: HERMES_BIN,
          verifiedAt: new Date().toISOString(),
          ...(verified ? {} : { error: 'Hermes returned an unexpected health response' }),
        });
      } catch (error) {
        sendJson(res, 502, {
          status: 'unavailable',
          connected: false,
          latencyMs: Date.now() - started,
          runtime: 'Hermes CLI',
          endpoint: HERMES_BIN,
          verifiedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    server.middlewares.use('/api/live/skills', async (req, res) => {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'GET required' });
      try {
        const output = await runHermesCommand(['skills', 'list']);
        const skills = output.split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.startsWith('│'))
          .map(line => line.split('│')[1]?.trim())
          .filter(Boolean)
          .filter(name => name !== 'Name' && !name.startsWith('─'));
        sendJson(res, 200, { status: 'completed', runtime: 'Hermes', skills });
      } catch (error) {
        sendJson(res, 502, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      }
    });

    server.middlewares.use('/api/live/chat', async (req, res) => {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST required' });
      try {
        const body = await readJson(req);
        const response = await runHermes(promptFromBody(body));
        sendJson(res, 200, { status: 'completed', response, runtime: 'Hermes' });
      } catch (error) {
        sendJson(res, 502, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      }
    });

    server.middlewares.use('/api/live/task', async (req, res) => {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST required' });
      try {
        const body = await readJson(req);
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const description = typeof body.description === 'string' ? body.description.trim() : '';
        if (!title) throw new Error('title is required');
        const response = await runHermes([
          'Execute this task now using the active Hermes runtime.',
          `Title: ${title}`,
          `Description: ${description || '(none)'}`,
          'Return a concise execution report with result, files created, and blockers.',
        ].join('\n'));
        sendJson(res, 200, { status: 'completed', response, runtime: 'Hermes' });
      } catch (error) {
        sendJson(res, 502, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      }
    });
  },
});
