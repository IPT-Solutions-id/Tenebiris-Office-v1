import {spawn} from 'node:child_process';
import path from 'node:path';
import express, {type Express, type Request, type Response} from 'express';

const HERMES_BIN = process.env.HERMES_BIN ?? '/opt/hermes/.venv/bin/hermes';
const REQUEST_TIMEOUT_MS = 120_000;

type RunHermesCommand = (args: string[]) => Promise<string>;

type CreateProductionAppOptions = {
  distDir: string;
  runHermesCommand?: RunHermesCommand;
};

const runHermesProcess: RunHermesCommand = args => new Promise((resolve, reject) => {
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

const sendFailure = (res: Response, error: unknown) => {
  res.status(502).json({
    status: 'failed',
    error: error instanceof Error ? error.message : String(error),
  });
};

const parsePrompt = (req: Request) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) throw new Error('prompt is required');
  return prompt;
};

const runHermes = (run: RunHermesCommand, prompt: string) => run([
  'chat', '-q', prompt, '--oneshot', '-Q', '--source', 'tenebiris-office',
]);

export const createProductionApp = ({
  distDir,
  runHermesCommand = runHermesProcess,
}: CreateProductionAppOptions): Express => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({limit: '1mb'}));

  app.get('/api/live/health', async (_req, res) => {
    const started = Date.now();
    try {
      const output = await runHermesCommand([
        'chat', '-q', 'Reply exactly HERMES_HEALTH_OK.', '--oneshot', '-Q',
      ]);
      const connected = output.includes('HERMES_HEALTH_OK');
      res.status(connected ? 200 : 502).json({
        status: connected ? 'live' : 'unavailable',
        connected,
        latencyMs: Date.now() - started,
        runtime: 'Hermes CLI',
        verifiedAt: new Date().toISOString(),
        ...(connected ? {} : {error: 'Hermes returned an unexpected health response'}),
      });
    } catch (error) {
      res.status(502).json({
        status: 'unavailable',
        connected: false,
        latencyMs: Date.now() - started,
        runtime: 'Hermes CLI',
        verifiedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get('/api/live/skills', async (_req, res) => {
    try {
      const output = await runHermesCommand(['skills', 'list']);
      const skills = output.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('│'))
        .map(line => line.split('│')[1]?.trim())
        .filter((name): name is string => Boolean(name))
        .filter(name => name !== 'Name' && !name.startsWith('─'));
      res.json({status: 'completed', runtime: 'Hermes', skills});
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.post('/api/live/chat', async (req, res) => {
    try {
      const response = await runHermes(runHermesCommand, parsePrompt(req));
      res.json({status: 'completed', response, runtime: 'Hermes'});
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.post('/api/live/task', async (req, res) => {
    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
      if (!title) throw new Error('title is required');
      const response = await runHermes(runHermesCommand, [
        'Execute this task now using the active Hermes runtime.',
        `Title: ${title}`,
        `Description: ${description || '(none)'}`,
        'Return a concise execution report with result, files created, and blockers.',
      ].join('\n'));
      res.json({status: 'completed', response, runtime: 'Hermes'});
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.use(express.static(distDir, {index: false}));
  app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  return app;
};
