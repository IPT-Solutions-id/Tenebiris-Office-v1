import {type ModelRecord, type RuntimeStore} from './runtimeStore';

type ModelCatalogItem = {
  id?: unknown;
  owned_by?: unknown;
  capabilities?: unknown;
};

type SyncModelCatalogOptions = {
  store: RuntimeStore;
  providerId: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  fetcher?: typeof fetch;
};

const normalizeModel = (item: ModelCatalogItem): ModelRecord | null => {
  if (typeof item.id !== 'string' || !item.id.trim()) return null;
  return {
    id: item.id,
    ownedBy: typeof item.owned_by === 'string' ? item.owned_by : 'unknown',
    capabilities: item.capabilities && typeof item.capabilities === 'object'
      ? item.capabilities as Record<string, unknown>
      : {},
  };
};

export const syncModelCatalog = async ({
  store,
  providerId,
  providerName,
  baseUrl,
  apiKey,
  fetcher = fetch,
}: SyncModelCatalogOptions) => {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/models`;
  try {
    const response = await fetcher(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'User-Agent': 'Tenebiris-Office/1.0',
      },
    });
    if (!response.ok) throw new Error(`Model catalog returned HTTP ${response.status}`);
    const payload = await response.json() as {data?: ModelCatalogItem[]};
    const models = Array.isArray(payload.data)
      ? payload.data.map(normalizeModel).filter((model): model is ModelRecord => model !== null)
      : [];
    store.upsertProvider({id: providerId, name: providerName, baseUrl, status: 'connected', lastError: null});
    store.replaceModels(providerId, models);
    return {status: 'connected' as const, count: models.length, models};
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    store.upsertProvider({id: providerId, name: providerName, baseUrl, status: 'unavailable', lastError: detail});
    throw error;
  }
};
