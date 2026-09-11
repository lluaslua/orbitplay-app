import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/components/UI';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { Navbar } from './Navbar';
import { PageLoader } from './LoadingSpinner';

/**
 * Casca das telas autenticadas: navegação no topo + conteúdo.
 * A barra de título fica em `App.tsx`, acima do roteador, porque a janela é
 * frameless e o login também precisa dela.
 *
 * O Figma desenha as telas em 1920px de largura, com o conteúdo respirando
 * 24px nas laterais (mesmo padding da navegação). Também faz o guard por perfil.
 */
export function MainLayout({
  allow,
  /** Gameplay ocupa tudo: sem navegação e sem padding. */
  bare = false,
}: {
  allow?: UserRole[];
  bare?: boolean;
}) {
  const { user, isAuthenticated, homeFor } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="orbit-glow flex min-h-full flex-col bg-orbit-bg bg-fixed">
        {!bare && <Navbar />}

        {/*
          O conteúdo dos frames de 1920 começa em 64 (`px-16`). Numa janela de
          1180 esses 128px das laterais são a diferença entre caber e não caber,
          então eles só valem a partir de `figma`.
        */}
        <main className={cn('min-w-0 flex-1', bare ? 'p-0' : 'px-6 py-8 folgado:px-10 figma:px-16')}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </TooltipProvider>
  );
}

/** Cabeçalho de seção reutilizado no topo das telas. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-headline text-white">{title}</h1>
        {subtitle && <p className="text-body text-orbit-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
