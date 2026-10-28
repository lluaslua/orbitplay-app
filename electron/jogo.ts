import { BrowserWindow, net, powerMonitor, type WebContents } from 'electron';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { pastaDasBuilds } from './builds';

/**
 * O jogo do teste aberto pelo app (Tela 17).
 *
 * "Iniciar Jogo!" abre a build baixada — só com o clique do tester e só o
 * arquivo de `userData/builds` que passou pelo sha256 do download. Daí em
 * diante o main acompanha: a cada 5s vê se ainda roda algum processo da pasta
 * do jogo (vale para launcher que abre outro executável e sai) e se o tester
 * mexeu no teclado ou no mouse no último minuto. Jogo aberto e largado não conta.
 *
 * A cada 30s manda à API os segundos ativos; quem soma e classifica é a API.
 * Quando o último processo fecha, avisa a API com o código de saída, traz o app
 * para a frente e avisa o renderer, que leva à avaliação.
 */
export interface PedidoDeJogo {
  testId: string;
  participationId: string;
  fileName: string;
  /** "Jogável com controle": o controle não conta como uso do computador, então o ocioso não desconta. */
  comControle: boolean;
  /** A base da API (`VITE_API_URL`) e o token do tester, como no download. */
  apiUrl: string;
  token: string;
}

const TICK_MS = 5_000;
const BATIDA_MS = 30_000;
/** Sem teclado nem mouse há mais que isso, o tempo não conta. */
const OCIOSO_SEGUNDOS = 60;
/** A API aceita até uma hora por batida. */
const MAX_POR_BATIDA = 3600;
/** Executáveis que acompanham o jogo mas não são ele: o relatório de travamento e os instaladores. */
const NAO_E_O_JOGO = /crash|unins|setup|redist|prereq|helper/i;

const executar = promisify(execFile);
const sistema = (programa: string) => path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', programa);

interface Sessao {
  pedido: PedidoDeJogo;
  janela: WebContents;
  /** Onde estão os executáveis do jogo. */
  pasta: string;
  /** Nomes (minúsculos) dos executáveis da pasta, para achar o jogo no `tasklist` do Windows. */
  nomes: Set<string>;
  filho: ChildProcess;
  filhoVivo: boolean;
  codigoDeSaida: number | null;
  /** Segundos ativos ainda não aceitos pela API. */
  pendentes: number;
  ultimoTick: number;
  ultimaBatida: number;
}

let sessao: Sessao | null = null;
/** O aviso de fechamento à API: abrir de novo espera por ele, senão o fechamento chegaria depois da abertura. */
let fechando: Promise<void> | null = null;

export function estadoDoJogo(testId: string): { aberto: boolean } {
  return { aberto: sessao?.pedido.testId === testId };
}

export async function abrirJogo(pedido: PedidoDeJogo, janela: WebContents): Promise<void> {
  if (!/^[\w-]+$/.test(pedido.testId) || !/^[\w-]+$/.test(pedido.participationId)) throw new Error('Teste inválido.');
  await fechando;
  if (sessao?.pedido.testId === pedido.testId) return;
  if (sessao) throw new Error('Feche o jogo do outro teste antes de abrir este.');

  const arquivo = path.join(pastaDasBuilds(), pedido.testId, path.basename(pedido.fileName));
  if (!existsSync(arquivo)) throw new Error('A build não está neste computador. Volte ao tutorial para baixá-la.');
  const executavel = await prepararExecutavel(arquivo);
  const pasta = path.dirname(executavel);
  const nomes = new Set((await executaveisDaPasta(pasta, 3)).map((nome) => path.basename(nome).toLowerCase()));

  // O plug-in do jogo manda a telemetria com este token (`/plugin/telemetry`). Sem plug-in, o jogo ignora.
  const telemetria = await chamarApi<{ token: string; endpoint: string }>(pedido, 'telemetry-token').catch(() => null);
  await chamarApi(pedido, 'play/open');

  const filho = spawn(executavel, [], {
    cwd: pasta,
    stdio: 'ignore',
    env: {
      ...process.env,
      ...(telemetria
        ? { ORBITPLAY_TELEMETRY_TOKEN: telemetria.token, ORBITPLAY_TELEMETRY_URL: `${pedido.apiUrl}${telemetria.endpoint}` }
        : {}),
    },
  });
  const agora = Date.now();
  const atual: Sessao = {
    pedido,
    janela,
    pasta,
    nomes,
    filho,
    filhoVivo: true,
    codigoDeSaida: null,
    pendentes: 0,
    ultimoTick: agora,
    ultimaBatida: agora,
  };
  // Logo depois do spawn: um launcher pode sair em milissegundos.
  filho.once('exit', (codigo) => {
    atual.filhoVivo = false;
    // O Windows dá códigos como 0xC0000005: a API guarda em 32 bits com sinal.
    atual.codigoDeSaida = codigo === null ? null : codigo | 0;
  });
  try {
    await new Promise<void>((pronto, falhou) => {
      filho.once('spawn', pronto);
      filho.once('error', falhou);
    });
  } catch {
    // Contou como aberto na API: fecha lá também, sem tempo nenhum.
    await chamarApi(pedido, 'play/close', { activeSeconds: 0, exitCode: null }).catch(() => null);
    throw new Error('Não foi possível abrir o jogo.');
  }
  sessao = atual;
  agendar(atual);
}

/** Um passo de cada vez: o próximo só é marcado quando este termina, e parar é não marcar mais. */
function agendar(atual: Sessao) {
  setTimeout(() => void acompanhar(atual), TICK_MS);
}

async function acompanhar(atual: Sessao) {
  const agora = Date.now();
  // Depois de o computador dormir, o intervalo não vira tempo de jogo.
  const decorridos = Math.min((agora - atual.ultimoTick) / 1000, (2 * TICK_MS) / 1000);
  atual.ultimoTick = agora;

  const aberto = atual.filhoVivo || (await processosDoJogo(atual)) > 0;
  if (!aberto) {
    sessao = null;
    fechando = encerrar(atual).finally(() => (fechando = null));
    return;
  }

  if (atual.pedido.comControle || powerMonitor.getSystemIdleTime() < OCIOSO_SEGUNDOS) atual.pendentes += decorridos;

  if (agora - atual.ultimaBatida >= BATIDA_MS) {
    atual.ultimaBatida = agora;
    const segundos = Math.min(Math.floor(atual.pendentes), MAX_POR_BATIDA);
    // Batida que falhou não perde o tempo: vai na próxima.
    const aceita = await chamarApi(atual.pedido, 'play/heartbeat', { activeSeconds: segundos }).then(() => true, () => false);
    if (aceita) atual.pendentes -= segundos;
  }
  agendar(atual);
}

async function encerrar(atual: Sessao) {
  const status = await chamarApi(atual.pedido, 'play/close', {
    activeSeconds: Math.min(Math.floor(atual.pendentes), MAX_POR_BATIDA),
    exitCode: atual.codigoDeSaida,
  }).catch(() => null);

  // O app volta para a frente: o próximo passo é a avaliação.
  const janela = BrowserWindow.fromWebContents(atual.janela);
  if (janela && !janela.isDestroyed()) {
    if (janela.isMinimized()) janela.restore();
    janela.setAlwaysOnTop(true);
    janela.show();
    janela.focus();
    janela.setAlwaysOnTop(false);
  }
  if (!atual.janela.isDestroyed()) atual.janela.send('jogo:fechou', { testId: atual.pedido.testId, status });
}

/** Quantos processos da pasta do jogo ainda rodam — o launcher pode ter saído e deixado o jogo aberto. */
async function processosDoJogo(atual: Sessao): Promise<number> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await executar(sistema('tasklist.exe'), ['/FO', 'CSV', '/NH'], { windowsHide: true });
      return stdout
        .split(/\r?\n/)
        .map((linha) => linha.split('","')[0]?.replace(/^"/, '').toLowerCase())
        .filter((nome) => nome && atual.nomes.has(nome)).length;
    }
    const { stdout } = await executar('/bin/ps', ['-axo', 'comm=']);
    return stdout.split('\n').filter((caminho) => caminho.startsWith(atual.pasta + path.sep)).length;
  } catch {
    // Sem como listar, vale o processo que o app abriu.
    return 0;
  }
}

/**
 * O executável da build: o próprio `.exe`, ou o de dentro do `.zip`, extraído
 * uma vez em `jogo/` ao lado. No Mac, o binário do `.app` de dentro do zip.
 */
async function prepararExecutavel(arquivo: string): Promise<string> {
  const extensao = path.extname(arquivo).toLowerCase();
  if (extensao === '.exe' && process.platform === 'win32') return arquivo;
  if (extensao !== '.zip' || (process.platform !== 'win32' && process.platform !== 'darwin')) {
    throw new Error('Este formato de build não abre neste computador.');
  }

  const destino = path.join(path.dirname(arquivo), 'jogo');
  if (!existsSync(destino)) {
    // Extrai ao lado e só depois renomeia: extração interrompida não passa por pronta.
    const temporario = `${destino}-extraindo`;
    await rm(temporario, { recursive: true, force: true });
    try {
      if (process.platform === 'win32') {
        // O `tar` do Windows abre zip e recusa caminho que sai da pasta (`..`, absoluto).
        await mkdir(temporario, { recursive: true });
        await executar(sistema('tar.exe'), ['-xf', arquivo, '-C', temporario], { windowsHide: true });
      } else {
        await executar('/usr/bin/ditto', ['-x', '-k', arquivo, temporario]);
      }
      await rename(temporario, destino);
    } catch {
      await rm(temporario, { recursive: true, force: true });
      throw new Error('Não foi possível extrair a build.');
    }
  }

  const executavel =
    process.platform === 'win32' ? (await executaveisDaPasta(destino, 3))[0] : await binarioDoApp(destino);
  if (!executavel) throw new Error('A build não tem um executável para abrir.');
  return executavel;
}

/** Os `.exe` da pasta, do mais raso ao mais fundo — o do topo é o que o jogador abriria. */
async function executaveisDaPasta(pasta: string, profundidade: number): Promise<string[]> {
  const achados: string[] = [];
  let nivel = [pasta];
  for (let i = 0; i < profundidade && nivel.length; i++) {
    const proximo: string[] = [];
    for (const atual of nivel) {
      const itens = await readdir(atual, { withFileTypes: true }).catch(() => []);
      for (const item of itens) {
        const caminho = path.join(atual, item.name);
        if (item.isDirectory()) proximo.push(caminho);
        else if (item.name.toLowerCase().endsWith('.exe') && !NAO_E_O_JOGO.test(item.name)) achados.push(caminho);
      }
    }
    nivel = proximo;
  }
  return achados;
}

/** `Jogo.app/Contents/MacOS/<binário>` do primeiro `.app` da pasta. */
async function binarioDoApp(pasta: string): Promise<string | undefined> {
  const itens = await readdir(pasta, { withFileTypes: true });
  const pacote = itens.find((item) => item.isDirectory() && item.name.endsWith('.app'));
  if (!pacote) return undefined;
  const macos = path.join(pasta, pacote.name, 'Contents', 'MacOS');
  const [binario] = await readdir(macos).catch(() => []);
  return binario ? path.join(macos, binario) : undefined;
}

/** `POST /player/participations/:id/<rota>` com o token do tester; devolve o JSON ou falha com a mensagem da API. */
async function chamarApi<T = unknown>(pedido: PedidoDeJogo, rota: string, corpo?: object): Promise<T> {
  const resposta = await net.fetch(`${pedido.apiUrl}/player/participations/${pedido.participationId}/${rota}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pedido.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo ?? {}),
  });
  const dados = (await resposta.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!resposta.ok) throw new Error(dados?.message ?? `A API recusou (${resposta.status}).`);
  return dados as T;
}
