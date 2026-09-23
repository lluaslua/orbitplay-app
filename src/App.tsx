import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/Common/MainLayout';
import { TitleBar } from '@/components/Common/TitleBar';
import { UpdateBanner } from '@/components/Common/UpdateBanner';
import { FullScreenLoader } from '@/components/Common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/utils/constants';
import { cn, isElectron } from '@/utils/helpers';

// Cada tela em seu proprio chunk - o app abre sem baixar todas de uma vez.
const LoginPage = lazy(() => import('@/pages/login'));

const StudioHomePage = lazy(() => import('@/pages/studio/index'));
const StudioGamesPage = lazy(() => import('@/pages/studio/games'));
const StudioNewGamePage = lazy(() => import('@/pages/studio/games/new'));
const StudioGameDetailPage = lazy(() => import('@/pages/studio/[gameId]'));
const StudioNewTestPage = lazy(() => import('@/pages/studio/tests/new'));
const StudioReportPage = lazy(() => import('@/pages/studio/reports/[testId]'));
const StudioSessionPage = lazy(() => import('@/pages/studio/reports/[sessionId]'));
const StudioPluginReportPage = lazy(() => import('@/pages/studio/reports/plugin'));

const PlayerHomePage = lazy(() => import('@/pages/player/index'));
const PlayerCatalogPage = lazy(() => import('@/pages/player/games'));
const PlayerGameDetailPage = lazy(() => import('@/pages/player/[gameId]'));
const PlayerTutorialPage = lazy(() => import('@/pages/player/test/tutorial'));
const PlayerGameplayPage = lazy(() => import('@/pages/player/test/gameplay'));
const PlayerSummaryPage = lazy(() => import('@/pages/player/test/summary'));
const PlayerResultPage = lazy(() => import('@/pages/player/test/result'));

/** Manda quem ja esta logado para a home do seu perfil. */
function RootRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to={ROUTES.login} replace />;
  return <Navigate to={user.role === 'STUDIO' ? ROUTES.studio.home : ROUTES.player.home} replace />;
}

/**
 * Ajusta a janela ao estado da sessão.
 *
 * Sem sessão, o Figma desenha o login como um cartão fixo e arredondado, sem
 * barra de título (`181:8146`); com sessão, a barra aparece e a janela vira o
 * app inteiro. Aqui só se avisa o Electron e se marca o `<html>` — o tamanho e
 * o arredondamento em si estão em electron/main.ts e App.css.
 */
function useJanelaDaSessao(logado: boolean) {
  useEffect(() => {
    void window.orbit?.window.setMode(logado ? 'app' : 'login');

    // A classe existe só no Electron: no browser o fundo escuro continua sendo
    // do `body`, senão a página do login ficaria branca em volta do cartão.
    const flutuante = !logado && isElectron();
    document.documentElement.classList.toggle('janela-login', flutuante);

    return () => document.documentElement.classList.remove('janela-login');
  }, [logado]);
}

export default function App() {
  const logado = useAuthStore((state) => state.user) != null;
  useJanelaDaSessao(logado);

  return (
    // HashRouter: no Electron a pagina roda em file:// e o BrowserRouter quebraria no refresh.
    <HashRouter>
      {/*
        A TitleBar fica FORA do roteador de propósito: a janela é frameless
        (`frame: false` no main), então sem ela não haveria como fechar,
        minimizar ou arrastar. No login ela não existe — é o próprio cartão que
        arrasta a janela.
      */}
      <div className={cn('flex h-screen flex-col overflow-hidden', !logado && 'items-center justify-center')}>
        {logado && (
          <>
            <TitleBar />
            <UpdateBanner />
          </>
        )}

        <div className={cn(logado ? 'min-h-0 flex-1 overflow-y-auto' : 'contents')}>
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path={ROUTES.login} element={<LoginPage />} />

          {/* ---------------------------- Estúdio ---------------------------- */}
          <Route element={<MainLayout allow={['STUDIO']} />}>
            <Route path="/studio" element={<StudioHomePage />} />
            <Route path="/studio/games" element={<StudioGamesPage />} />
            <Route path="/studio/games/new" element={<StudioNewGamePage />} />
            <Route path="/studio/games/:gameId" element={<StudioGameDetailPage />} />
            <Route path="/studio/tests/new" element={<StudioNewTestPage />} />
            <Route path="/studio/reports/:testId" element={<StudioReportPage />} />
            <Route
              path="/studio/reports/:testId/sessions/:sessionId"
              element={<StudioSessionPage />}
            />
            <Route path="/studio/reports/:testId/plugin" element={<StudioPluginReportPage />} />
          </Route>

          {/* ---------------------------- Jogador ---------------------------- */}
          <Route element={<MainLayout allow={['PLAYER']} />}>
            <Route path="/player" element={<PlayerHomePage />} />
            <Route path="/player/games" element={<PlayerCatalogPage />} />
            <Route path="/player/games/:gameId" element={<PlayerGameDetailPage />} />
            <Route path="/player/test/:testId/tutorial" element={<PlayerTutorialPage />} />
            <Route path="/player/test/:testId/summary" element={<PlayerSummaryPage />} />
            <Route path="/player/test/:testId/result" element={<PlayerResultPage />} />
          </Route>

          {/* Gameplay ocupa a tela inteira: sem navegação. */}
          <Route element={<MainLayout allow={['PLAYER']} bare />}>
            <Route path="/player/test/:testId/gameplay" element={<PlayerGameplayPage />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </HashRouter>
  );
}
