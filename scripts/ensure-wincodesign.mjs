/**
 * Prepara o cache do `winCodeSign` antes do electron-builder rodar.
 *
 * O electron-builder baixa esse pacote para pegar o `rcedit` (que grava ícone e
 * metadados no .exe). O .7z contém symlinks de macOS, e o Windows só permite
 * criar symlink com Modo de Desenvolvedor ligado ou terminal como administrador.
 * Sem isso a extração falha, o electron-builder tenta 4 vezes e desiste — e o
 * build termina **sem instalador**, com `win-unpacked` ainda gerado, o que faz o
 * erro passar despercebido.
 *
 * A saída é extrair aqui, excluindo `darwin*`. A pasta só serve para assinar
 * builds de macOS; nada no pacote Windows depende dela.
 *
 * O caminho do cache é `<LOCALAPPDATA>/electron-builder/Cache/winCodeSign/2.6.0`.
 * O nome é só a versão, **sem** o prefixo `winCodeSign-` que aparece na URL de
 * download — pré-extrair com o nome da URL não funciona: o app-builder ignora e
 * baixa de novo.
 *
 * Roda sozinho no `build:win`. Em macOS e Linux não faz nada.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const VERSION = '2.6.0';
const URL = `https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-${VERSION}/winCodeSign-${VERSION}.7z`;

if (process.platform !== 'win32') {
  process.exit(0);
}

const cacheRoot = path.join(
  process.env.LOCALAPPDATA ?? path.join(process.env.USERPROFILE ?? '', 'AppData', 'Local'),
  'electron-builder',
  'Cache',
  'winCodeSign',
);
const target = path.join(cacheRoot, VERSION);

// `rcedit` é o que o build realmente consome: se ele está lá, o cache serve.
if (existsSync(path.join(target, 'rcedit-x64.exe'))) {
  console.log(`winCodeSign ${VERSION}: cache ok`);
  process.exit(0);
}

const archive = path.join(cacheRoot, `winCodeSign-${VERSION}.7z`);
mkdirSync(cacheRoot, { recursive: true });

if (!existsSync(archive)) {
  console.log(`winCodeSign ${VERSION}: baixando...`);
  const response = await fetch(URL);
  if (!response.ok) {
    console.error(`Falha ao baixar winCodeSign: HTTP ${response.status}`);
    process.exit(1);
  }
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
}

const sevenZip = path.join(
  process.cwd(),
  'node_modules',
  '7zip-bin',
  'win',
  process.arch === 'arm64' ? 'arm64' : 'x64',
  '7za.exe',
);

console.log(`winCodeSign ${VERSION}: extraindo sem a pasta darwin...`);
execFileSync(sevenZip, ['x', archive, `-o${target}`, '-xr!darwin*', '-y'], { stdio: 'inherit' });

if (!existsSync(path.join(target, 'rcedit-x64.exe'))) {
  console.error('winCodeSign extraído, mas rcedit-x64.exe não apareceu — build vai falhar.');
  process.exit(1);
}

console.log(`winCodeSign ${VERSION}: pronto em ${target}`);
