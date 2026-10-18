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

  close() {
    this.database.close();
  }
}
