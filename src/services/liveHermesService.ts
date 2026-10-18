export interface HermesLiveResult {
  status: 'completed' | 'failed';
  response?: string;
  error?: string;
  runtime?: string;
}

export interface HermesHealthResult {
  status: 'live' | 'unavailable';
  connected: boolean;
  latencyMs?: number;
  activeModel?: string;
  verifiedAt: string;
  error?: string;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const payload = await response.json() as T;
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? `Hermes bridge returned HTTP ${response.status}`);
  return payload;
};

export type PersistedChatMessage = {
  sessionId: string;
  agentId: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  createdAt: string;
};

export const fetchChatHistory = (sessionId = 'mr-sunan-main') => request<{sessionId: string; messages: PersistedChatMessage[]}>(`/api/sessions/${encodeURIComponent(sessionId)}/messages`);

export const checkHermesLive = () => request<HermesHealthResult>('/api/live/health');

export const sendHermesMessage = (prompt: string) => request<HermesLiveResult>('/api/live/chat', {
  method: 'POST',
  body: JSON.stringify({ prompt }),
});

export const executeHermesTask = (title: string, description: string) => request<HermesLiveResult>('/api/live/task', {
  method: 'POST',
  body: JSON.stringify({ title, description }),
});

export const discoverHermesSkills = () => request<{ status: string; skills: string[]; runtime: string }>('/api/live/skills');

export const fetchLiveAgents = () => request<{agents: import('../types/office').AgentCoreDefinition[]}>('/api/agents');

export const createLiveAgent = (definition: import('../types/office').AgentCoreDefinition) => request<import('../types/office').AgentCoreDefinition>('/api/agents', {
  method: 'POST',
  body: JSON.stringify(definition),
});

export const updateLiveAgent = (id: string, definition: import('../types/office').AgentCoreDefinition) => request<import('../types/office').AgentCoreDefinition>(`/api/agents/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(definition),
});

export const fetchAgentVersions = (id: string) => request<{agentId: string; versions: Array<{soulVersion: number; roleVersion: number; createdAt: string}>}>(`/api/agents/${encodeURIComponent(id)}/versions`);
