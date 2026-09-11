/**
 * Adapter mock do axios.
 *
 * E o caminho padrao do MVP: funciona no browser e no Electron (`file://`),
 * onde o service worker do MSW nao pode ser registrado.
 *
 * Para desligar tudo e falar com a API real, basta `VITE_USE_MOCKS=false`.
 */
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosError, AxiosHeaders } from 'axios';
import { matchRoute } from './routes';

const LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY ?? 400);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extrai `/games/game-001` e a query de uma URL absoluta ou relativa. */
function parseUrl(config: AxiosRequestConfig): { pathname: string; query: URLSearchParams } {
  const raw = config.url ?? '';
  const base = config.baseURL ?? '';
  const absolute = /^https?:\/\//i.test(raw) ? raw : `${base}${raw}`;

  try {
    const url = new URL(absolute, 'http://mock.local');
    const basePath = base ? new URL(base, 'http://mock.local').pathname : '';
    const pathname =
      basePath && basePath !== '/' && url.pathname.startsWith(basePath)
        ? url.pathname.slice(basePath.length)
        : url.pathname;

    const query = url.searchParams;
    // `params` do axios nao entram na URL antes do adapter rodar.
    Object.entries(config.params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.set(key, String(value));
    });

    return { pathname: pathname || '/', query };
  } catch {
    return { pathname: raw, query: new URLSearchParams() };
  }
}

function parseBody(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(LATENCY);

  const method = (config.method ?? 'get').toUpperCase();
  const { pathname, query } = parseUrl(config);
  const match = matchRoute(method, pathname);

  const headers = AxiosHeaders.from(config.headers as any);

  if (!match) {
    throw new AxiosError(
      `Rota mockada nao encontrada: ${method} ${pathname}`,
      'ERR_MOCK_NOT_FOUND',
      config,
      null,
      {
        data: { message: 'Recurso não encontrado no mock.' },
        status: 404,
        statusText: 'Not Found',
        headers,
        config,
      } as AxiosResponse,
    );
  }

  const result = match.route.resolve({
    params: match.params,
    query,
    body: parseBody(config.data),
    headers: (headers.toJSON() as Record<string, string>) ?? {},
  });

  const response: AxiosResponse = {
    data: result.data,
    status: result.status,
    statusText: result.status >= 400 ? 'Error' : 'OK',
    headers,
    config,
  };

  if (result.status >= 400) {
    throw new AxiosError(
      (result.data as { message?: string })?.message ?? 'Erro na requisição',
      String(result.status),
      config,
      null,
      response,
    );
  }

  return response;
};
