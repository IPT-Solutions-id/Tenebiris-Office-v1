import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

export type ProviderRecord = {
  id: string;
  name: string;
  baseUrl: string;
  status: 'connected' | 'unavailable' | 'unconfigured';
  lastError: string | null;
};

export type ModelRecord = {
  id: string;
  ownedBy: string;
  capabilities: Record<string, unknown>;
};

export type SessionRecord = {
  agentId: string;
  profile: string;
  name: string;
};

export type ChatMessageRecord = {
  sessionId: string;
  agentId: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  createdAt: string;
};

export type AgentDefinition = {
  id: string;
  name: string;
  agentNumber: string;
  department: string;
  soul: {name: string; version: number; principles: string[]; communicationStyle: string};
  role: {
    id: string; name: string; version: number; mission: string; responsibilities: string[];
    jobTypes: string[]; requiredOutput: string[]; successCriteria: string[]; boundaries: string[];
  };
  modelBinding: {providerId: string; primaryModelId: string; fallbackModelIds: string[]};
  skills: Array<{id: string; name: string; proficiency: string}>;
  toolPolicy: {allowed: string[]; denied: string[]; approvalRequired: string[]};
  approvalPolicy: {default: 'auto' | 'ask' | 'deny'; rules: string[]};
  learningPolicy: {enabled: boolean; allowedSources: string[]; requiresApproval: boolean; retention: 'session' | 'agent' | 'project'};
  memoryPolicy: {
    profile: 'none' | 'read' | 'read-write';
    project: 'none' | 'read' | 'read-write';
    agent: 'none' | 'read' | 'read-write';
    task: 'none' | 'read' | 'read-write';
  };
  profile: string;
  sessionName: string;
  workspace: string;
  status: 'DRAFT' | 'READY' | 'UNAVAILABLE' | 'ERROR';
};

export class RuntimeStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(path.dirname(databasePath), {recursive: true});
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        status TEXT NOT NULL,
        last_error TEXT,
        checked_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS models (
        provider_id TEXT NOT NULL,
        id TEXT NOT NULL,
        owned_by TEXT NOT NULL,
        capabilities_json TEXT NOT NULL,
        synced_at TEXT NOT NULL,
        PRIMARY KEY (provider_id, id),
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS agent_sessions (
        agent_id TEXT PRIMARY KEY,
        profile TEXT NOT NULL,
        name TEXT NOT NULL UNIQUE,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        definition_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session
        ON chat_messages (session_id, id);
      CREATE TABLE IF NOT EXISTS agent_definition_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        soul_version INTEGER NOT NULL,
        role_version INTEGER NOT NULL,
        soul_json TEXT NOT NULL,
        role_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS task_runs (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        task_title TEXT NOT NULL,
        soul_version INTEGER NOT NULL,
        role_version INTEGER NOT NULL,
        definition_snapshot_json TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_task_runs_agent ON task_runs (agent_id, created_at);
    `);
  }

  upsertProvider(provider: ProviderRecord) {
    this.database.prepare(`
      INSERT INTO providers (id, name, base_url, status, last_error, checked_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        base_url = excluded.base_url,
        status = excluded.status,
        last_error = excluded.last_error,
        checked_at = excluded.checked_at
    `).run(provider.id, provider.name, provider.baseUrl, provider.status, provider.lastError, new Date().toISOString());
  }

  getProvider(id: string): ProviderRecord | null {
    const row = this.database.prepare('SELECT * FROM providers WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      name: String(row.name),
      baseUrl: String(row.base_url),
      status: row.status as ProviderRecord['status'],
      lastError: row.last_error === null ? null : String(row.last_error),
    };
  }

  replaceModels(providerId: string, models: ModelRecord[]) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.database.prepare('DELETE FROM models WHERE provider_id = ?').run(providerId);
      const insert = this.database.prepare(`
        INSERT INTO models (provider_id, id, owned_by, capabilities_json, synced_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const syncedAt = new Date().toISOString();
      for (const model of models) {
        insert.run(providerId, model.id, model.ownedBy, JSON.stringify(model.capabilities), syncedAt);
      }
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  listModels(providerId: string): ModelRecord[] {
    const rows = this.database.prepare(`
      SELECT id, owned_by, capabilities_json FROM models
      WHERE provider_id = ? ORDER BY id
    `).all(providerId) as Array<Record<string, unknown>>;
    return rows.map(row => ({
      id: String(row.id),
      ownedBy: String(row.owned_by),
      capabilities: JSON.parse(String(row.capabilities_json)) as Record<string, unknown>,
    }));
  }

  ensureSession(session: SessionRecord): SessionRecord {
    this.database.prepare(`
      INSERT INTO agent_sessions (agent_id, profile, name, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(agent_id) DO UPDATE SET
        profile = excluded.profile,
        name = excluded.name,
        updated_at = excluded.updated_at
    `).run(session.agentId, session.profile, session.name, new Date().toISOString());
    return session;
  }

  getSession(agentId: string): SessionRecord | null {
    const row = this.database.prepare('SELECT * FROM agent_sessions WHERE agent_id = ?').get(agentId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {agentId: String(row.agent_id), profile: String(row.profile), name: String(row.name)};
  }

  upsertAgent(agent: AgentDefinition) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const previous = this.getAgent(agent.id);
      const changedSoul = !previous || JSON.stringify(previous.soul) !== JSON.stringify(agent.soul);
      const changedRole = !previous || JSON.stringify(previous.role) !== JSON.stringify(agent.role);
      const nextSoul = changedSoul && previous ? previous.soul.version + 1 : agent.soul.version;
      const nextRole = changedRole && previous ? previous.role.version + 1 : agent.role.version;
      const normalized = {
        ...agent,
        soul: {...agent.soul, version: nextSoul},
        role: {...agent.role, version: nextRole},
      } as AgentDefinition;
      this.database.prepare(`
        INSERT INTO agents (id, definition_json, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET definition_json = excluded.definition_json, updated_at = excluded.updated_at
      `).run(normalized.id, JSON.stringify(normalized), new Date().toISOString());
      this.database.prepare(`
        INSERT INTO agent_definition_versions
          (agent_id, soul_version, role_version, soul_json, role_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(normalized.id, normalized.soul.version, normalized.role.version,
        JSON.stringify(normalized.soul), JSON.stringify(normalized.role), new Date().toISOString());
      this.ensureSession({agentId: normalized.id, profile: normalized.profile, name: normalized.sessionName});
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  createTaskRun(run: {id: string; agentId: string; sessionId: string; taskTitle: string; definition: AgentDefinition}) {
    this.database.prepare(`
      INSERT INTO task_runs
        (id, agent_id, session_id, task_title, soul_version, role_version, definition_snapshot_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'RUNNING', ?)
    `).run(run.id, run.agentId, run.sessionId, run.taskTitle, run.definition.soul.version,
      run.definition.role.version, JSON.stringify(run.definition), new Date().toISOString());
    return this.getTaskRun(run.id);
  }

  listDefinitionVersions(agentId: string) {
    const rows = this.database.prepare(`
      SELECT agent_id, soul_version, role_version, soul_json, role_json, created_at
      FROM agent_definition_versions WHERE agent_id = ? ORDER BY id
    `).all(agentId) as Array<Record<string, unknown>>;
    return rows.map(row => ({
      agentId: String(row.agent_id), soulVersion: Number(row.soul_version), roleVersion: Number(row.role_version),
      soul: JSON.parse(String(row.soul_json)), role: JSON.parse(String(row.role_json)), createdAt: String(row.created_at),
    }));
  }

  getTaskRun(id: string) {
    const row = this.database.prepare('SELECT * FROM task_runs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id), agentId: String(row.agent_id), sessionId: String(row.session_id),
      taskTitle: String(row.task_title), soulVersion: Number(row.soul_version), roleVersion: Number(row.role_version),
      definition: JSON.parse(String(row.definition_snapshot_json)) as AgentDefinition,
      status: String(row.status), createdAt: String(row.created_at),
    };
  }

  getAgent(id: string): AgentDefinition | null {
    const row = this.database.prepare('SELECT definition_json FROM agents WHERE id = ?').get(id) as {definition_json: string} | undefined;
    return row ? JSON.parse(row.definition_json) as AgentDefinition : null;
  }

  listAgents(): AgentDefinition[] {
    const rows = this.database.prepare('SELECT definition_json FROM agents ORDER BY id').all() as Array<{definition_json: string}>;
    return rows.map(row => JSON.parse(row.definition_json) as AgentDefinition);
  }

  addChatMessage(message: Omit<ChatMessageRecord, 'createdAt'>): ChatMessageRecord {
    const createdAt = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO chat_messages (session_id, agent_id, role, content, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(message.sessionId, message.agentId, message.role, message.content, message.model, createdAt);
    return {...message, createdAt};
  }

  listChatMessages(sessionId: string): ChatMessageRecord[] {
    const rows = this.database.prepare(`
      SELECT session_id, agent_id, role, content, model, created_at
      FROM chat_messages WHERE session_id = ? ORDER BY id
    `).all(sessionId) as Array<Record<string, unknown>>;
    return rows.map(row => ({
      sessionId: String(row.session_id),
      agentId: String(row.agent_id),
      role: row.role === 'user' ? 'user' as const : 'assistant' as const,
      content: String(row.content),
      model: row.model === null ? null : String(row.model),
      createdAt: String(row.created_at),
    }));
  }

  close() {
    this.database.close();
  }
}
