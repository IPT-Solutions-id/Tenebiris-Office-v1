import {spawn} from 'node:child_process';
import path from 'node:path';
import express, {type Express, type Request, type Response} from 'express';
import {syncModelCatalog} from './modelRegistry';
import {type AgentDefinition, type ModelRecord, RuntimeStore} from './runtimeStore';
import {buildSessionArgs} from './sessionManager';

const HERMES_BIN = process.env.HERMES_BIN ?? '/opt/hermes/.venv/bin/hermes';
const REQUEST_TIMEOUT_MS = 120_000;

type RunHermesCommand = (args: string[]) => Promise<string>;

export type RuntimeConfig = {
  profile: string;
  providerId: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
};

type ModelSyncResult = {
  status: 'connected';
  count: number;
  models: ModelRecord[];
};

type CreateProductionAppOptions = {
  distDir: string;
  runHermesCommand?: RunHermesCommand;
  runtimeStore: RuntimeStore;
  runtimeConfig: RuntimeConfig;
  syncModels?: () => Promise<ModelSyncResult>;
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

export const createProductionApp = ({
  distDir,
  runHermesCommand = runHermesProcess,
  runtimeStore,
  runtimeConfig,
  syncModels,
}: CreateProductionAppOptions): Express => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({limit: '1mb'}));

  const mrSunanSession = runtimeStore.ensureSession({
    agentId: 'agent_mr_sunan',
    profile: runtimeConfig.profile,
    name: 'mr-sunan-main',
  });
  const defaultMrSunan: AgentDefinition = {
    id: 'agent_mr_sunan', name: 'Mr Sunan', agentNumber: '001', department: 'Central Command',
    soul: {
      name: 'Strategic Commander', version: 1,
      principles: ['Verify before reporting', 'Delegate specialist work', 'Preserve approved architecture'],
      communicationStyle: 'Direct Indonesian',
    },
    role: {
      id: 'chief-ai-orchestrator', name: 'Chief AI Orchestrator', version: 1,
      mission: 'Coordinate the Tenebiris workforce and deliver verified results.',
      responsibilities: ['Create tasks', 'Route work', 'Review evidence', 'Report verified outcomes'],
    },
    modelBinding: {providerId: runtimeConfig.providerId, primaryModelId: runtimeConfig.defaultModel, fallbackModelIds: []},
    toolPolicy: {
      allowed: ['files', 'terminal', 'browser', 'github', 'delegation', 'kanban'],
      denied: ['credential-export'], approvalRequired: ['production-deploy', 'credential-change'],
    },
    memoryPolicy: {profile: 'read-write', project: 'read-write', agent: 'read-write', task: 'read-write'},
    profile: runtimeConfig.profile, sessionName: mrSunanSession.name, workspace: process.cwd(), status: 'READY',
  };
  if (!runtimeStore.getAgent(defaultMrSunan.id)) runtimeStore.upsertAgent(defaultMrSunan);
  const refreshModels = syncModels ?? (() => syncModelCatalog({
    store: runtimeStore,
    providerId: runtimeConfig.providerId,
    providerName: runtimeConfig.providerName,
    baseUrl: runtimeConfig.baseUrl,
    apiKey: runtimeConfig.apiKey,
  }));

  app.get('/api/live/health', async (_req, res) => {
    const started = Date.now();
    try {
      const output = await runHermesCommand([
        '-p', runtimeConfig.profile,
        'chat', '-q', 'Reply exactly HERMES_HEALTH_OK.', '--oneshot', '-Q',
        '-m', runtimeConfig.defaultModel,
      ]);
      const connected = output.includes('HERMES_HEALTH_OK');
      res.status(connected ? 200 : 502).json({
        status: connected ? 'live' : 'unavailable',
        connected,
        latencyMs: Date.now() - started,
        runtime: 'Hermes CLI',
        profile: runtimeConfig.profile,
        provider: runtimeConfig.providerName,
        model: runtimeConfig.defaultModel,
        verifiedAt: new Date().toISOString(),
        ...(connected ? {} : {error: 'Hermes returned an unexpected health response'}),
      });
    } catch (error) {
      res.status(502).json({
        status: 'unavailable',
        connected: false,
        latencyMs: Date.now() - started,
        runtime: 'Hermes CLI',
        profile: runtimeConfig.profile,
        provider: runtimeConfig.providerName,
        model: runtimeConfig.defaultModel,
        verifiedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post('/api/runtime/models/refresh', async (_req, res) => {
    try {
      const result = await refreshModels();
      runtimeStore.upsertProvider({
        id: runtimeConfig.providerId,
        name: runtimeConfig.providerName,
        baseUrl: runtimeConfig.baseUrl,
        status: 'connected',
        lastError: null,
      });
      runtimeStore.replaceModels(runtimeConfig.providerId, result.models);
      res.json({status: result.status, count: result.count});
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.get('/api/runtime/models', (_req, res) => {
    res.json({
      providerId: runtimeConfig.providerId,
      models: runtimeStore.listModels(runtimeConfig.providerId),
    });
  });

  app.get('/api/runtime/status', (_req, res) => {
    const provider = runtimeStore.getProvider(runtimeConfig.providerId) ?? {
      id: runtimeConfig.providerId,
      name: runtimeConfig.providerName,
      baseUrl: runtimeConfig.baseUrl,
      status: 'unconfigured' as const,
      lastError: null,
    };
    res.json({
      profile: runtimeConfig.profile,
      provider,
      model: {
        default: runtimeConfig.defaultModel,
        catalogCount: runtimeStore.listModels(runtimeConfig.providerId).length,
      },
      session: mrSunanSession,
    });
  });

  app.get('/api/agents', (_req, res) => {
    res.json({agents: runtimeStore.listAgents()});
  });

  app.get('/api/agents/:id', (req, res) => {
    const agent = runtimeStore.getAgent(req.params.id);
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    res.json(agent);
  });

  app.put('/api/agents/:id', (req, res) => {
    const agent = req.body as AgentDefinition;
    if (!agent || agent.id !== req.params.id) return res.status(400).json({error: 'Agent ID mismatch'});
    if (!agent.soul || !agent.role || !agent.modelBinding || !agent.toolPolicy || !agent.memoryPolicy) {
      return res.status(400).json({error: 'Incomplete agent definition'});
    }
    runtimeStore.upsertAgent(agent);
    res.json(runtimeStore.getAgent(agent.id));
  });

  app.get('/api/live/skills', async (_req, res) => {
    try {
      const output = await runHermesCommand(['-p', runtimeConfig.profile, 'skills', 'list']);
      const skills = output.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('│'))
        .map(line => line.split('│')[1]?.trim())
        .filter((name): name is string => Boolean(name))
        .filter(name => name !== 'Name' && !name.startsWith('─'));
      res.json({status: 'completed', runtime: 'Hermes', profile: runtimeConfig.profile, skills});
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.post('/api/live/chat', async (req, res) => {
    try {
      const response = await runHermesCommand(buildSessionArgs({
        profile: mrSunanSession.profile,
        sessionName: mrSunanSession.name,
        prompt: parsePrompt(req),
        model: runtimeConfig.defaultModel,
      }));
      res.json({
        status: 'completed',
        response,
        runtime: 'Hermes',
        profile: mrSunanSession.profile,
        session: mrSunanSession.name,
        model: runtimeConfig.defaultModel,
      });
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.post('/api/live/task', async (req, res) => {
    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
      if (!title) throw new Error('title is required');
      const response = await runHermesCommand(buildSessionArgs({
        profile: mrSunanSession.profile,
        sessionName: `${mrSunanSession.name}-tasks`,
        model: runtimeConfig.defaultModel,
        prompt: [
          'Execute this task now using the active Hermes runtime.',
          `Title: ${title}`,
          `Description: ${description || '(none)'}`,
          'Return a concise execution report with result, files created, and blockers.',
        ].join('\n'),
      }));
      res.json({
        status: 'completed',
        response,
        runtime: 'Hermes',
        profile: mrSunanSession.profile,
        session: `${mrSunanSession.name}-tasks`,
        model: runtimeConfig.defaultModel,
      });
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.use(express.static(distDir, {index: false}));
  app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  return app;
};
