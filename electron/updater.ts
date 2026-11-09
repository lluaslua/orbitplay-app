import { app, shell } from 'electron';
import { createHash } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Atualização a partir de uma pasta local.
 *
 * Por que não `electron-updater`: ele só busca o feed por HTTP, o que exigiria
 * um servidor no ar toda vez que o app abrisse. Aqui a pasta é lida do disco —
 * abrir o app basta.
 *
 * O feed é um `latest.json` escrito por `scripts/publish-local.mjs`, ao lado do
 * instalador. `npm run release` sobe a versão, empacota e publica os dois.
 *
 * Onde procura, nesta ordem:
 *   1. a variável `ORBITPLAY_FEED`
 *   2. `~/OrbitPlayFeed`
 *
 * **Por que não há diálogo nativo aqui:** a primeira versão usava
 * `dialog.showMessageBox` na inicialização e ele retornou o índice 0 sem
 * nenhum clique, disparando o instalador sozinho. Um modal que se auto-responde
 * e executa um .exe é risco puro. Agora o main só *informa* que existe versão
 * nova; quem decide é a interface, com um botão que o usuário aperta.
 *
 * Limites: é um laço de desenvolvimento, não distribuição. Sem verificação de
 * assinatura, sem download incremental, sem instalação silenciosa.
 */
const FEED_DIR = process.env.ORBITPLAY_FEED ?? path.join(os.homedir(), 'OrbitPlayFeed');

export interface UpdateInfo {
  version: string;
  file: string;
  /** Opcional (escrito por `publish-local`): quando existe, o instalador só abre se o hash bater. */
  sha256?: string;
}

/** Compara `1.2.10` com `1.2.9` numericamente, campo a campo. */
function isNewer(candidate: string, current: string): boolean {
  const a = candidate.split('.').map(Number);
  const b = current.split('.').map(Number);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left > right;
  }
  return false;
}

/**
 * O app empacotado não tem console. Sem este log, uma checagem que devolve
 * `null` é indistinguível de "não há atualização" — e foi exatamente isso que
 * travou o diagnóstico na primeira tentativa. Fica em `userData/updater.log`.
 */
async function log(message: string) {
  try {
    await appendFile(
      path.join(app.getPath('userData'), 'updater.log'),
      `${new Date().toISOString()} ${message}\n`,
      'utf8',
    );
  } catch {
    // Diagnóstico não pode derrubar a checagem.
  }
}

/** Devolve a versão disponível, ou `null` se não há feed nem novidade. */
export async function getAvailableUpdate(): Promise<UpdateInfo | null> {
  const current = app.getVersion();

  try {
    const raw = await readFile(path.join(FEED_DIR, 'latest.json'), 'utf8');
    const parsed = JSON.parse(raw) as Partial<UpdateInfo>;

    if (!parsed.version || !parsed.file) {
      await log(`latest.json sem version/file em ${FEED_DIR}`);
      return null;
    }

    if (!isNewer(parsed.version, current)) {
      await log(`feed=${parsed.version} atual=${current}: nada novo`);
      return null;
    }

    await log(`feed=${parsed.version} atual=${current}: atualização disponível`);
    return { version: parsed.version, file: parsed.file };
  } catch (error) {
    await log(
      `sem feed utilizável em ${FEED_DIR} (atual ${current}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

/**
 * Abre o instalador e encerra o app.
 * Só deve ser chamado a partir de uma ação explícita do usuário na interface.
 */
export async function runInstaller(file: string): Promise<string | null> {
  // O renderer só diz "instalar": o que abre é o arquivo que o feed anuncia, nunca um caminho dele.
  // Antes, `file` ia direto para `shell.openPath` — um nome como `..\\..\\x.exe` executava qualquer programa.
  const anunciado = await readFile(path.join(FEED_DIR, 'latest.json'), 'utf8')
    .then((raw) => JSON.parse(raw) as Partial<UpdateInfo>)
    .catch(() => null);
  const nome = typeof file === 'string' ? file : '';
  const valido =
    anunciado?.file === nome &&
    nome === path.basename(nome) &&
    /^[\w .()+-]+\.(exe|dmg)$/i.test(nome);
  if (!valido) return 'Instalador não reconhecido pelo feed de atualização.';

  const installer = path.join(FEED_DIR, nome);
  if (anunciado?.sha256) {
    const atual = createHash('sha256').update(await readFile(installer)).digest('hex');
    if (atual.toLowerCase() !== anunciado.sha256.toLowerCase()) {
      await log(`instalador ${nome} com hash diferente do feed: recusado`);
      return 'O instalador não confere com o publicado (SHA-256). Atualização recusada.';
    }
  }
  const error = await shell.openPath(installer);

  if (error) return `${error} (${installer})`;

  // Dá tempo do instalador assumir a tela antes de a janela sumir.
  setTimeout(() => app.quit(), 800);
  return null;
}
