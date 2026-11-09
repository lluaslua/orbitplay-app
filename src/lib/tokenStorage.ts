/**
 * Onde o token de acesso fica.
 *
 * - "Lembrar login" marcado: `localStorage` (sobrevive ao fechar o app, até o token vencer).
 * - Desmarcado: `sessionStorage` (some ao fechar a aba/janela).
 *
 * O token NUNCA é guardado em outro lugar (o store do Zustand não o persiste).
 * Atenção: qualquer armazenamento legível por JavaScript pode ser lido por um XSS;
 * por isso a defesa principal é não ter XSS (CSP, React sem HTML cru, dados da API
 * sempre como texto) e o token ter validade curta e ser revogável (logout).
 */
import { STORAGE_KEYS } from '@/utils/constants';

function seguro<T>(fn: () => T, padrao: T): T {
  try {
    return fn();
  } catch {
    return padrao;
  }
}

export function getToken(): string | null {
  return seguro(
    () => sessionStorage.getItem(STORAGE_KEYS.token) ?? localStorage.getItem(STORAGE_KEYS.token),
    null,
  );
}

export function setToken(token: string, remember: boolean): void {
  seguro(() => {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEYS.token, token);
  }, undefined);
}

export function clearToken(): void {
  seguro(() => {
    sessionStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.token);
  }, undefined);
}
