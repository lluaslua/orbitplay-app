/**
 * Setup do MSW para o modo browser (`npm run dev`).
 *
 * O worker so e iniciado quando os tres pontos batem:
 *   - VITE_USE_MOCKS=true
 *   - o app nao esta rodando dentro do Electron
 *   - o navegador expoe service worker (nao existe em `file://`)
 *
 * Quando o worker nao sobe, o app continua funcionando: o adapter mock do axios
 * cobre exatamente as mesmas rotas.
 */
import { isElectron } from '@/utils/helpers';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export function canUseServiceWorker(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    window.location.protocol.startsWith('http') &&
    !isElectron()
  );
}

/**
 * Inicia o MSW. Retorna `true` se o worker assumiu as requisicoes -
 * nesse caso o adapter mock do axios nao precisa entrar em acao.
 */
export async function startMockServer(): Promise<boolean> {
  if (!USE_MOCKS || !canUseServiceWorker()) return false;

  try {
    const [{ setupWorker }, { handlers }] = await Promise.all([
      import('msw/browser'),
      import('./handlers'),
    ]);

    const worker = setupWorker(...handlers);
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });

    console.info('[OrbitPlay] MSW ativo - requisicoes interceptadas pelo service worker.');
    return true;
  } catch (error) {
    // Sem o arquivo mockServiceWorker.js publicado o start falha; seguimos no adapter.
    console.info(
      '[OrbitPlay] MSW indisponivel, usando o adapter mock do axios.',
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
