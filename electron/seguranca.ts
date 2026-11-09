import type { IpcMainInvokeEvent } from 'electron';

/**
 * Origem da API, fixada em tempo de build (`VITE_API_URL`, ver vite.config.ts).
 * O processo principal NUNCA confia num endereço de API vindo do renderer:
 * um XSS na interface não pode mandar o app baixar de (ou enviar o token para)
 * um servidor qualquer, nem baixar um executável de lá.
 */
declare const __API_ORIGIN__: string;

export function apiOrigin(): string {
  return typeof __API_ORIGIN__ === 'string' && __API_ORIGIN__ ? __API_ORIGIN__ : 'http://localhost:3333';
}

/** A URL aponta para a API configurada (mesma origem e, em produção, https)? */
export function urlDaApi(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const alvo = new URL(url);
    const origem = new URL(apiOrigin());
    const local = alvo.hostname === 'localhost' || alvo.hostname === '127.0.0.1';
    return alvo.origin === origem.origin && (alvo.protocol === 'https:' || local);
  } catch {
    return false;
  }
}

/** O pedido de IPC veio da nossa interface (arquivo empacotado ou o dev server), e não de outra página? */
export function remetenteConfiavel(evento: IpcMainInvokeEvent): boolean {
  const url = evento.senderFrame?.url ?? '';
  const dev = process.env.VITE_DEV_SERVER_URL;
  if (dev) return url.startsWith(dev);
  return url.startsWith('file://');
}
