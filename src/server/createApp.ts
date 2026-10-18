import {spawn, type ChildProcess} from 'node:child_process';
import path from 'node:path';
import express, {type Express, type Request, type Response} from 'express';
import {syncModelCatalog} from './modelRegistry';
import {type AgentDefinition, type ModelRecord, type TaskLifecycle, RuntimeStore} from './runtimeStore';
import {buildOneshotArgs, buildSessionArgs} from './sessionManager';

const HERMES_BIN = process.env.HERMES_BIN ?? '/opt/hermes/.venv/bin/hermes';
const REQUEST_TIMEOUT_MS = 25_000;

type RunHermesCommand = (args: string[]) => Promise<string>;

type SpawnHermesProcess = (args: string[]) => ChildProcess;

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
  spawnHermesProcess?: SpawnHermesProcess;
  runtimeStore: RuntimeStore;
  runtimeConfig: RuntimeConfig;
  syncModels?: () => Promise<ModelSyncResult>;
};

const spawnHermesChild: SpawnHermesProcess = args => spawn(HERMES_BIN, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

const runHermesProcess: RunHermesCommand = args => new Promise((resolve, reject) => {
  const child = spawn(HERMES_BIN, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  let settled = false;
  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    child.kill('SIGTERM');
    const forceKill = setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
    }, 2_000);
    forceKill.unref();
    reject(new Error('Hermes request timed out'));
  }, REQUEST_TIMEOUT_MS);

  child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)));
  child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)));
  child.on('error', error => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    reject(error);
  });
  child.on('close', code => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (code !== 0) {
      const detail = Buffer.concat(stderr).toString('utf8').trim();
      reject(new Error(detail || `Hermes exited with code ${code ?? 'unknown'}`));
      return;
    }
    resolve(Buffer.concat(stdout).toString('utf8').trim());
  });
  return child;
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
  spawnHermesProcess,
  runtimeStore,
  runtimeConfig,
  syncModels,
}: CreateProductionAppOptions): Express => {
  const spawnHermes = spawnHermesProcess ?? spawnHermesChild;
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
      jobTypes: ['orchestration', 'review', 'delegation'],
      requiredOutput: ['execution report', 'evidence summary'],
      successCriteria: ['verified result', 'clear blockers'],
      boundaries: ['approval-gated production changes'],
    },
    skills: [{id: 'orchestration', name: 'Orchestration', proficiency: 'Expert'}],
    approvalPolicy: {default: 'ask', rules: ['production-deploy', 'credential-change']},
    learningPolicy: {enabled: true, allowedSources: ['task-results', 'approved-feedback'], requiresApproval: true, retention: 'agent'},
    modelBinding: {providerId: runtimeConfig.providerId, primaryModelId: runtimeConfig.defaultModel, fallbackModelIds: []},
    toolPolicy: {
      allowed: ['files', 'terminal', 'browser', 'github', 'delegation', 'kanban'],
      denied: ['credential-export'], approvalRequired: ['production-deploy', 'credential-change'],
    },
    memoryPolicy: {profile: 'read-write', project: 'read-write', agent: 'read-write', task: 'read-write'},
    profile: runtimeConfig.profile, sessionName: mrSunanSession.name, workspace: process.cwd(), status: 'READY',
  };
  const existingMrSunan = runtimeStore.getAgent(defaultMrSunan.id);
  if (!existingMrSunan) {
    runtimeStore.upsertAgent(defaultMrSunan);
  } else if (existingMrSunan.modelBinding.primaryModelId === 'cx/gpt-5.6-sol[1m]') {
    runtimeStore.upsertAgent({
      ...existingMrSunan,
      modelBinding: {...existingMrSunan.modelBinding, primaryModelId: runtimeConfig.defaultModel},
      status: 'READY',
    });
  }
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

  app.get('/api/skills/registry', (_req, res) => {
    res.json({skills: runtimeStore.listSkills()});
  });

  app.post('/api/skills/registry', (req, res) => {
    if (!req.body?.id || !req.body?.owner) return res.status(400).json({error: 'skill id and owner are required'});
    const skill = runtimeStore.upsertSkill({
      id: String(req.body.id), version: Number(req.body.version ?? 1), owner: String(req.body.owner),
      scope: req.body.scope ?? 'private_agent', status: req.body.status ?? 'draft',
      dependencies: Array.isArray(req.body.dependencies) ? req.body.dependencies.map(String) : [],
      triggers: Array.isArray(req.body.triggers) ? req.body.triggers.map(String) : [],
      procedure: Array.isArray(req.body.procedure) ? req.body.procedure.map(String) : [],
      validation: Array.isArray(req.body.validation) ? req.body.validation.map(String) : [],
      usageCount: Number(req.body.usageCount ?? 0), evidence: Array.isArray(req.body.evidence) ? req.body.evidence.map(String) : [],
    });
    res.status(201).json(skill);
  });

  app.get('/api/workspaces/:agentId', (req, res) => {
    const policy = runtimeStore.getWorkspacePolicy(req.params.agentId);
    if (!policy) return res.status(404).json({error: 'Workspace policy not found'});
    res.json(policy);
  });

  app.put('/api/workspaces/:agentId', (req, res) => {
    const agent = runtimeStore.getAgent(req.params.agentId);
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    const policy = runtimeStore.setWorkspacePolicy({
      agentId: agent.id, workspace: String(req.body?.workspace ?? agent.workspace),
      filesystemRoots: Array.isArray(req.body?.filesystemRoots) ? req.body.filesystemRoots.map(String) : [agent.workspace],
      gitPermissions: Array.isArray(req.body?.gitPermissions) ? req.body.gitPermissions.map(String) : [],
      deploymentPermissions: Array.isArray(req.body?.deploymentPermissions) ? req.body.deploymentPermissions.map(String) : [],
      status: req.body?.status ?? 'READY',
    });
    res.json(policy);
  });

  app.get('/api/tasks/:id', (req, res) => {
    const task = runtimeStore.getTaskRecord(req.params.id);
    if (!task) return res.status(404).json({error: 'Task not found'});
    res.json(task);
  });

  app.post('/api/tasks', (req, res) => {
    const agent = runtimeStore.getAgent(String(req.body?.agentId));
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    const task = runtimeStore.createTaskRecord({
      id: `task_${Date.now()}`, agentId: agent.id, model: agent.modelBinding.primaryModelId,
      skills: agent.skills.map(skill => skill.id), tools: agent.toolPolicy.allowed,
      sessionId: agent.sessionName, workspace: agent.workspace, status: 'DRAFT', logs: [], artifacts: [],
      approval: null, evidence: [], result: null,
    });
    res.status(201).json(task);
  });

  app.patch('/api/tasks/:id/status', (req, res) => {
    const status = req.body?.status as TaskLifecycle;
    const allowed = ['DRAFT', 'QUEUED', 'ASSIGNED', 'RUNNING', 'WAITING_APPROVAL', 'REVIEW', 'COMPLETED', 'FAILED', 'BLOCKED', 'CANCELLED'];
    if (!allowed.includes(status)) return res.status(400).json({error: 'Invalid task status'});
    const task = runtimeStore.updateTaskStatus(req.params.id, status, req.body?.result ?? null);
    if (!task) return res.status(404).json({error: 'Task not found'});
    res.json(task);
  });

  app.get('/api/runtime/status/detail', (_req, res) => {
    const provider = runtimeStore.getProvider(runtimeConfig.providerId);
    const agent = runtimeStore.getAgent('agent_mr_sunan');
    res.json({
      profile: {name: runtimeConfig.profile, status: provider?.status === 'connected' ? 'CONNECTED' : 'UNAVAILABLE'},
      provider: {name: runtimeConfig.providerName, status: provider?.status === 'connected' ? 'CONNECTED' : 'UNAVAILABLE'},
      model: {requested: agent?.modelBinding.primaryModelId ?? runtimeConfig.defaultModel, status: runtimeStore.listModels(runtimeConfig.providerId).length ? 'AVAILABLE' : 'UNAVAILABLE'},
      session: {name: mrSunanSession.name, status: 'ACTIVE'},
      agentHeartbeat: {status: agent?.status === 'READY' ? 'ONLINE' : 'OFFLINE'},
      skills: {status: agent ? 'VALID' : 'UNKNOWN'},
      workspace: {path: agent?.workspace ?? process.cwd(), status: agent ? 'READY' : 'MISSING'},
      task: {status: 'IDLE'},
    });
  });

  app.get('/api/agents/:id/tools-policy', (req, res) => {
    const agent = runtimeStore.getAgent(req.params.id);
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    res.json({agentId: agent.id, tools: agent.toolPolicy, approval: agent.approvalPolicy, workspace: runtimeStore.getWorkspacePolicy(agent.id)});
  });

  app.get('/api/agents/:id', (req, res) => {
    const agent = runtimeStore.getAgent(req.params.id);
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    res.json(agent);
  });

  app.get('/api/sessions/:sessionId/messages', (req, res) => {
    res.json({
      sessionId: req.params.sessionId,
      messages: runtimeStore.listChatMessages(req.params.sessionId),
    });
  });

  app.put('/api/agents/:id', (req, res) => {
    const agent = req.body as AgentDefinition;
    if (!agent || agent.id !== req.params.id) return res.status(400).json({error: 'Agent ID mismatch'});
    if (!agent.soul || !agent.role || !agent.modelBinding || !agent.toolPolicy || !agent.memoryPolicy ||
        !agent.skills || !agent.approvalPolicy || !agent.learningPolicy) {
      return res.status(400).json({error: 'Incomplete agent definition'});
    }
    runtimeStore.upsertAgent(agent);
    res.json(runtimeStore.getAgent(agent.id));
  });

  app.post('/api/agents', (req, res) => {
    const agent = req.body as AgentDefinition;
    if (!agent?.id || !agent.name || !agent.soul || !agent.role || !agent.modelBinding || !agent.skills ||
        !agent.toolPolicy || !agent.memoryPolicy || !agent.approvalPolicy || !agent.learningPolicy) {
      return res.status(400).json({error: 'Incomplete agent definition'});
    }
    if (runtimeStore.getAgent(agent.id)) return res.status(409).json({error: 'Agent already exists'});
    runtimeStore.upsertAgent({...agent, status: agent.status ?? 'DRAFT'});
    res.status(201).json(runtimeStore.getAgent(agent.id));
  });

  app.get('/api/agents/:id/versions', (req, res) => {
    res.json({agentId: req.params.id, versions: runtimeStore.listDefinitionVersions(req.params.id)});
  });

  app.get('/api/agents/:id/sessions', (req, res) => {
    res.json({agentId: req.params.id, sessions: runtimeStore.listSessionVariants(req.params.id)});
  });

  app.post('/api/agents/:id/sessions', (req, res) => {
    const agent = runtimeStore.getAgent(req.params.id);
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    const kind = req.body?.kind as 'task' | 'council' | 'temporary';
    if (!['task', 'council', 'temporary'].includes(kind)) return res.status(400).json({error: 'kind must be task, council, or temporary'});
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : `${agent.id}-${kind}-${Date.now()}`;
    const session = runtimeStore.ensureSessionVariant({agentId: agent.id, profile: agent.profile, name, kind, parentSession: agent.sessionName});
    res.status(201).json(session);
  });

  app.get('/api/agents/:id/memory-policy', (req, res) => {
    const agent = runtimeStore.getAgent(req.params.id);
    if (!agent) return res.status(404).json({error: 'Agent not found'});
    res.json({agentId: agent.id, policy: runtimeStore.getMemoryPolicy(agent.id) ?? {...agent.memoryPolicy, session: 'read-write'}});
  });

  app.get('/api/agents/:id/skills', (req, res) => {
    res.json({agentId: req.params.id, skills: runtimeStore.listAgentSkills(req.params.id)});
  });

  app.post('/api/agents/:id/skills', (req, res) => {
    if (!runtimeStore.getAgent(req.params.id)) return res.status(404).json({error: 'Agent not found'});
    if (!req.body?.id || !req.body?.name) return res.status(400).json({error: 'skill id and name are required'});
    runtimeStore.setAgentSkill(req.params.id, {
      id: String(req.body.id), name: String(req.body.name), state: req.body.state ?? 'assigned', source: req.body.source ?? 'profile',
    });
    res.status(201).json({skills: runtimeStore.listAgentSkills(req.params.id)});
  });

  app.post('/api/agents/:id/learning-runs', (req, res) => {
    if (!runtimeStore.getAgent(req.params.id)) return res.status(404).json({error: 'Agent not found'});
    const gap = typeof req.body?.gap === 'string' ? req.body.gap.trim() : '';
    if (!gap) return res.status(400).json({error: 'gap is required'});
    const run = runtimeStore.createLearningRun({id: `learn_${Date.now()}`, agentId: req.params.id, gap, stage: 'gap_detected', skillId: req.body.skillId, requiresApproval: true});
    res.status(201).json(run);
  });

  app.get('/api/run-audits/:id', (req, res) => {
    const audit = runtimeStore.getRunAudit(req.params.id);
    if (!audit) return res.status(404).json({error: 'Run audit not found'});
    res.json(audit);
  });

  app.get('/api/task-runs/:id', (req, res) => {
    const run = runtimeStore.getTaskRun(req.params.id);
    if (!run) return res.status(404).json({error: 'Task run not found'});
    res.json(run);
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

  app.post('/api/live/chat/stream', async (req, res) => {
    const agent = runtimeStore.getAgent('agent_mr_sunan');
    let prompt: string;
    try {
      prompt = parsePrompt(req);
    } catch (error) {
      sendFailure(res, error);
      return;
    }
    const model = agent?.modelBinding.primaryModelId ?? runtimeConfig.defaultModel;
    runtimeStore.addChatMessage({
      sessionId: mrSunanSession.name, agentId: mrSunanSession.agentId, role: 'user', content: prompt, model: null,
    });
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const child = spawnHermes(buildSessionArgs({
      profile: mrSunanSession.profile,
      sessionName: mrSunanSession.name,
      prompt,
      model,
    }));
    let completed = false;
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      if (!completed) {
        completed = true;
        send('error', {error: 'Hermes request timed out'});
        res.end();
      }
    }, REQUEST_TIMEOUT_MS);
    req.on('close', () => {
      if (!child.killed) child.kill('SIGTERM');
    });
    let full = '';
    child.stdout?.on('data', chunk => {
      full += String(chunk);
      send('delta', {text: String(chunk)});
    });
    child.stderr?.on('data', chunk => send('stderr', {text: String(chunk)}));
    child.on('error', error => {
      clearTimeout(timer);
      if (!completed) {
        completed = true;
        send('error', {error: error.message});
        res.end();
      }
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (completed) return;
      completed = true;
      if (code !== 0) {
        send('error', {error: `Hermes exited with code ${code ?? 'unknown'}`});
        res.end();
        return;
      }
      const response = full.trim();
      runtimeStore.addChatMessage({
        sessionId: mrSunanSession.name, agentId: mrSunanSession.agentId, role: 'assistant', content: response, model,
      });
      send('done', {response, model, session: mrSunanSession.name});
      res.end();
    });
  });

  app.post('/api/live/chat', async (req, res) => {
    try {
      const agent = runtimeStore.getAgent('agent_mr_sunan');
      const prompt = parsePrompt(req);
      runtimeStore.addChatMessage({
        sessionId: mrSunanSession.name, agentId: mrSunanSession.agentId, role: 'user', content: prompt, model: null,
      });
      const model = agent?.modelBinding.primaryModelId ?? runtimeConfig.defaultModel;
      let response: string;
      let session = mrSunanSession.name;
      try {
        response = await Promise.race([
          runHermesCommand(buildSessionArgs({profile: mrSunanSession.profile, sessionName: mrSunanSession.name, prompt, model})),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Persistent session timed out')), 30_000)),
        ]);
      } catch (sessionError) {
        response = await runHermesCommand(buildOneshotArgs({profile: mrSunanSession.profile, prompt, model}));
        session = `${mrSunanSession.name}-recovery`;
        runtimeStore.addChatMessage({
          sessionId: session, agentId: mrSunanSession.agentId, role: 'user', content: prompt, model: null,
        });
        runtimeStore.addChatMessage({
          sessionId: session, agentId: mrSunanSession.agentId, role: 'assistant', content: response, model,
        });
        res.json({status: 'completed', response, runtime: 'Hermes', profile: mrSunanSession.profile, session, model, recovered: true, recoveryReason: sessionError instanceof Error ? sessionError.message : String(sessionError)});
        return;
      }
      runtimeStore.addChatMessage({
        sessionId: mrSunanSession.name, agentId: mrSunanSession.agentId, role: 'assistant', content: response, model,
      });
      res.json({status: 'completed', response, runtime: 'Hermes', profile: mrSunanSession.profile, session, model});
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.post('/api/live/task', async (req, res) => {
    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
      if (!title) throw new Error('title is required');
      const agent = runtimeStore.getAgent('agent_mr_sunan');
      const taskSession = `${mrSunanSession.name}-tasks`;
      const model = agent?.modelBinding.primaryModelId ?? runtimeConfig.defaultModel;
      const taskRunId = `run_${Date.now()}`;
      if (agent) runtimeStore.createTaskRun({
        id: taskRunId, agentId: agent.id, sessionId: taskSession, taskTitle: title, definition: agent,
      });
      const startedAt = Date.now();
      const requestedModel = model;
      const response = await runHermesCommand(buildSessionArgs({
        profile: mrSunanSession.profile,
        sessionName: taskSession,
        model,
        prompt: [
          'Execute this task now using the active Hermes runtime.',
          `Title: ${title}`,
          `Description: ${description || '(none)'}`,
          'Return a concise execution report with result, files created, and blockers.',
        ].join('\n'),
      }));
      runtimeStore.addChatMessage({
        sessionId: taskSession, agentId: mrSunanSession.agentId, role: 'user', content: `TASK: ${title}`, model: null,
      });
      runtimeStore.addChatMessage({
        sessionId: taskSession, agentId: mrSunanSession.agentId, role: 'assistant', content: response, model,
      });
      runtimeStore.addRunAudit({
        runId: taskRunId, agentId: mrSunanSession.agentId, sessionId: taskSession,
        requestedModel, resolvedModel: model, fallbackUsed: false, fallbackReason: null,
        latencyMs: Date.now() - startedAt, inputTokens: null, outputTokens: null, estimatedCost: null,
      });
      res.json({
        runId: taskRunId,
        status: 'completed',
        response,
        runtime: 'Hermes',
        profile: mrSunanSession.profile,
        session: taskSession,
        model,
      });
    } catch (error) {
      sendFailure(res, error);
    }
  });

  app.use(express.static(distDir, {index: false}));
  app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  return app;
};
