import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { configureApi } from '@/lib/api';
import { issueToken } from '@/mocks/db';
import { accounts } from '@/mocks/fixtures/players.json';
import type { UserRole } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

// Liga o adapter mock do axios, como o boot faz quando o MSW não assume.
configureApi(false);

/**
 * Guarda o token de uma conta de demonstração, como o login faz. Rota que
 * confere o perfil (as de "Gerenciamento de acessos") precisa disso.
 */
export function entrarComo(role: UserRole) {
  const conta = accounts.find((item) => item.user.role === role)!;
  localStorage.setItem(STORAGE_KEYS.token, issueToken(conta.user.id, role));
}

export function clienteDeTeste() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** QueryClient novo e roteador em memória, o que toda tela e hook do app esperam por cima. */
export function Provedores({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={clienteDeTeste()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderizarComProvedores(ui: ReactElement) {
  return render(ui, { wrapper: Provedores });
}
