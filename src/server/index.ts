import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProductionApp, type RuntimeConfig} from './createApp';
import {RuntimeStore} from './runtimeStore';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(projectRoot, 'dist');
const runtimeStore = new RuntimeStore(
  process.env.TENEBIRIS_DATABASE_PATH ?? path.join(projectRoot, 'data', 'runtime.sqlite'),
);
const runtimeConfig: RuntimeConfig = {
  profile: process.env.TENEBIRIS_HERMES_PROFILE ?? 'tenebiris',
  providerId: 'tenebiris9',
  providerName: '9Router',
  baseUrl: process.env.TENEBIRIS_9ROUTER_BASE_URL ?? 'https://tenebiris9.ipt.solutions/v1',
  apiKey: process.env.HERMES_CUSTOM_TENEBIRIS9_IPT_SOLUTIONS_API_KEY ?? '',
  defaultModel: process.env.TENEBIRIS_DEFAULT_MODEL ?? 'cx/gpt-5.6-sol[1m]',
};

if (!runtimeConfig.apiKey) {
  process.stderr.write('Missing 9Router credential for Tenebiris runtime\n');
  process.exit(1);
}

const server = createProductionApp({distDir, runtimeStore, runtimeConfig}).listen(port, host, () => {
  process.stdout.write(`Tenebiris Office listening on http://${host}:${port}\n`);
});

const shutdown = () => server.close(() => {
  runtimeStore.close();
  process.exit(0);
});
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
