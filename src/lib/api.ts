/**
 * Cliente HTTP unico do app.
 *
 * Hoje as respostas vem do mock; trocar para o backend real e questao de
 * `VITE_USE_MOCKS=false` no .env - nenhum hook ou tela muda.
 */
import axios, { AxiosError } from 'axios';
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

    // 401 fora da tela de login significa sessao expirada.
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem(STORAGE_KEYS.token);
    }

    return Promise.reject(normalized);
  },
);

/** Helper tipado - todas as rotas mockadas devolvem o recurso direto no body. */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<T>(url, { params });
  return data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(url, body);
  return data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, body);
  return data;
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url);
  return data;
}
