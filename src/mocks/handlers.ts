/**
 * Handlers do MSW (Mock Service Worker).
 *
 * Sao gerados a partir da mesma tabela de `routes.ts` que alimenta o adapter do
 * axios, entao browser e Electron respondem exatamente igual.
 *
 * Uso: apenas em `npm run dev` (browser). No Electron a pagina roda em `file://`
 * e um service worker nao pode ser registrado - la vale o adapter.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { routes, type MockRoute } from './routes';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api';
const LATENCY = Number(import.meta.env.VITE_MOCK_LATENCY ?? 400);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toHandler(route: MockRoute): HttpHandler {
  const url = `${API_URL}${route.path}`;

  const resolver = async ({ request, params }: { request: Request; params: any }) => {
    await delay(LATENCY);

    let body: unknown = undefined;
    if (route.method !== 'GET' && route.method !== 'DELETE') {
      try {
        body = await request.clone().json();
      } catch {
        body = undefined;
      }
    }

    const result = route.resolve({
      params: params as Record<string, string>,
      query: new URL(request.url).searchParams,
      body,
      headers: Object.fromEntries(request.headers.entries()),
    });

    return HttpResponse.json(result.data as any, { status: result.status });
  };

  switch (route.method) {
    case 'GET':
      return http.get(url, resolver);
    case 'POST':
      return http.post(url, resolver);
    case 'PUT':
      return http.put(url, resolver);
    case 'PATCH':
      return http.patch(url, resolver);
    case 'DELETE':
      return http.delete(url, resolver);
  }
}

export const handlers: HttpHandler[] = routes.map(toHandler);
