/**
 * Cliente HTTP unico do app.
 *
 * Fala com a orbitplay-api (`VITE_API_URL`). Com `VITE_USE_MOCKS=true` as
 * respostas das telas antigas vem do mock em memoria - nenhum hook ou tela muda.
 */
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { mockAdapter } from '@/mocks/adapter';
import { USE_MOCKS } from '@/mocks/server';
import { STORAGE_KEYS } from '@/utils/constants';
import type { ApiError } from '@/types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Liga o adapter mock. Chamado no boot depois de saber se o MSW assumiu:
 * se o service worker esta ativo, o axios faz requisicoes de verdade e o
 * worker responde; caso contrario o adapter responde direto em memoria.
 */
export function configureApi(mswActive: boolean) {
  if (USE_MOCKS && !mswActive) {
    api.defaults.adapter = mockAdapter;
  }
}

// Anexa o token guardado em cada requisicao.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normaliza o erro para o formato que as telas esperam.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const normalized: ApiError = {
      message:
        error.response?.data?.message ??
        (error.code === 'ECONNABORTED'
          ? 'A requisição demorou demais. Tente novamente.'
          : 'Não foi possível concluir a operação.'),
      code: error.response?.data?.code ?? error.code,
      fields: error.response?.data?.fields,
    };

    // 401 numa chamada que levou token (o login nao leva) e sessao expirada:
    // o authStore escuta o evento, sai da conta e o guard volta para o login.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem(STORAGE_KEYS.token);
      window.dispatchEvent(new Event(SESSAO_EXPIRADA));
    }

    return Promise.reject(normalized);
  },
);

/** Evento disparado quando a API recusa o token guardado. */
export const SESSAO_EXPIRADA = 'orbit:sessao-expirada';

/**
 * No Electron o app diz em que sistema roda (`X-Client-Platform`): a API marca
 * como indisponivel o teste cuja build nao roda nele. No navegador nada e barrado.
 */
export function definirPlataforma(plataforma: string) {
  api.defaults.headers.common['X-Client-Platform'] = plataforma;
}

/**
 * `Idempotency-Key` das escritas que nao podem duplicar (criar teste, pagar,
 * enviar a sessao): a mesma chave devolve a mesma resposta.
 */
export function comChave(chave: string): AxiosRequestConfig {
  return { headers: { 'Idempotency-Key': chave } };
}

/** Helper tipado - todas as rotas mockadas devolvem o recurso direto no body. */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<T>(url, { params });
  return data;
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.put<T>(url, body, config);
  return data;
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url);
  return data;
}

/**
 * Upload multipart (a build da etapa 3). Sem timeout - a build pode ter GB - e
 * com o progresso de 0 a 1. O `Content-Type` padrao do cliente e JSON; aqui ele
 * vai como multipart para o navegador completar o boundary.
 */
export async function enviarArquivo<T>(
  url: string,
  form: FormData,
  onProgresso?: (fracao: number) => void,
): Promise<T> {
  const { data } = await api.post<T>(url, form, {
    timeout: 0,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evento) => {
      if (evento.total) onProgresso?.(evento.loaded / evento.total);
    },
  });
  return data;
}

/**
 * Download com progresso (a build do teste, no navegador). `totalEsperado` em
 * bytes cobre a resposta sem `Content-Length`.
 */
export async function baixarArquivo(
  url: string,
  { onProgresso, totalEsperado, signal }: { onProgresso?: (fracao: number) => void; totalEsperado?: number; signal?: AbortSignal } = {},
): Promise<Blob> {
  const { data } = await api.get<Blob>(url, {
    timeout: 0,
    responseType: 'blob',
    signal,
    onDownloadProgress: (evento) => {
      const total = evento.total ?? totalEsperado;
      if (total) onProgresso?.(Math.min(1, evento.loaded / total));
    },
  });
  return data;
}

/** URL completa de um caminho da API - para quem baixa fora do axios (o Electron). */
export function urlDaApi(caminho: string): string {
  return `${api.defaults.baseURL}${caminho}`;
}
