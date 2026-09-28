import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { configureApi } from '@/lib/api';

// Liga o adapter mock do axios, como o boot faz quando o MSW não assume.
configureApi(false);

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
