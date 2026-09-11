/**
 * Publica o build atual na pasta de feed local.
 *
 * Gera um `latest.json` próprio e copia junto com o instalador para a pasta que
 * o app consulta ao abrir (`electron/updater.ts`). Sem servidor, sem conta, sem rede.
 *
 * O manifesto é nosso em vez do `latest.yml` do electron-builder porque aquele só
 * é gerado quando existe um `publish` configurado — e configurar um provider falso
 * só para arrancar o arquivo seria pior do que escrever duas linhas de JSON.
 *
 * Destino, nesta ordem:
 *   1. a variável de ambiente `ORBITPLAY_FEED`
 *   2. `~/OrbitPlayFeed`
 */
import { copyFile, mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');
const feedDir = process.env.ORBITPLAY_FEED ?? path.join(os.homedir(), 'OrbitPlayFeed');

const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const installer = `OrbitPlay-${version}-setup.exe`;
const installerPath = path.join(releaseDir, installer);

try {
  await stat(installerPath);
} catch {
  console.error(
    `Não encontrei ${installerPath}.\n` +
      'Rode "npm run build:win" antes — ou use "npm run release", que já faz tudo.',
  );
  process.exit(1);
}

await mkdir(feedDir, { recursive: true });
await copyFile(installerPath, path.join(feedDir, installer));
await writeFile(
  path.join(feedDir, 'latest.json'),
  `${JSON.stringify({ version, file: installer, publishedAt: new Date().toISOString() }, null, 2)}\n`,
);

const naPasta = (await readdir(feedDir)).filter((n) => n.endsWith('.exe')).sort();

console.log(`Versão ${version} publicada em ${feedDir}`);
console.log(`  instalador: ${installer}`);
console.log(`  já na pasta: ${naPasta.join(', ')}`);
console.log('\nAbra a versão instalada: ela vê a nova e oferece a atualização.');
