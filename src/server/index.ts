import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProductionApp} from './createApp';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(projectRoot, 'dist');

createProductionApp({distDir}).listen(port, host, () => {
  process.stdout.write(`Tenebiris Office listening on http://${host}:${port}\n`);
});
