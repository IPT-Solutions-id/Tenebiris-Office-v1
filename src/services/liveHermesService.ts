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
