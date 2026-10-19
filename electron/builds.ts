import { app, net, shell, type WebContents } from 'electron';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Download da build do teste pelo app do tester (Tela 16).
 *
 * O arquivo vai em partes direto para o disco (a build pode ter GB), em
 * `userData/builds/<teste>/`, com o progresso avisado ao renderer. No fim o
 * sha256 é conferido com o que a API mandou: arquivo diferente é apagado.
 *
 * Abrir é só mostrar o arquivo na pasta: o app nunca executa sozinho uma build
 * que veio de terceiros — quem roda é o tester, com o clique dele.
 */
export interface PedidoDeBuild {
  testId: string;
  url: string;
  token: string | null;
  fileName: string;
  sha256: string | null;
}

const pastaDasBuilds = () => path.join(app.getPath('userData'), 'builds');

export async function baixarBuild(pedido: PedidoDeBuild, janela: WebContents): Promise<string> {
  if (!/^[\w-]+$/.test(pedido.testId)) throw new Error('Teste inválido.');
  if (!/^https?:\/\//.test(pedido.url)) throw new Error('Endereço de download inválido.');

  const pasta = path.join(pastaDasBuilds(), pedido.testId);
  const destino = path.join(pasta, path.basename(pedido.fileName) || 'build');
  await mkdir(pasta, { recursive: true });

  const resposta = await net.fetch(pedido.url, {
    headers: pedido.token ? { Authorization: `Bearer ${pedido.token}` } : {},
  });
  if (!resposta.ok || !resposta.body) throw new Error(`O download falhou (${resposta.status}).`);

  const total = Number(resposta.headers.get('content-length')) || 0;
  const hash = createHash('sha256');
  const arquivo = createWriteStream(destino);
  let recebidos = 0;
  let ultimoAviso = 0;

  try {
    const leitor = resposta.body.getReader();
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      hash.update(value);
      recebidos += value.length;
      if (!arquivo.write(value)) await new Promise<void>((pronto) => arquivo.once('drain', () => pronto()));

      // Um aviso a cada ~250ms basta para a barra andar sem inundar o IPC.
      const agora = Date.now();
      if (total && agora - ultimoAviso > 250) {
        ultimoAviso = agora;
        janela.send('build:progresso', { testId: pedido.testId, fracao: recebidos / total });
      }
    }
    await new Promise<void>((pronto, falhou) => arquivo.end((erro?: Error | null) => (erro ? falhou(erro) : pronto())));
  } catch (erro) {
    arquivo.destroy();
    await rm(destino, { force: true });
    throw erro;
  }

  if (pedido.sha256 && hash.digest('hex') !== pedido.sha256) {
    await rm(destino, { force: true });
    throw new Error('O arquivo baixado não confere com a build do teste. Tente de novo.');
  }

  janela.send('build:progresso', { testId: pedido.testId, fracao: 1 });
  return destino;
}

/** Mostra a build baixada na pasta. Só vale para arquivos dentro de `userData/builds`. */
export function mostrarBuild(caminho: string): void {
  const base = pastaDasBuilds() + path.sep;
  const alvo = path.resolve(caminho);
  if (!alvo.startsWith(base)) throw new Error('Arquivo fora da pasta das builds.');
  shell.showItemInFolder(alvo);
}
