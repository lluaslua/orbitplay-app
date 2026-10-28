import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LoginForm } from '@/components/Auth/LoginForm';
import { ABAS_AUTH, MolduraAuth } from '@/components/Auth/MolduraAuth';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROUTES } from '@/utils/constants';

/**
 * TELA 01 — Login. Figma: `181:8146` (tester) e `291:2022` (estúdio).
 *
 * O cartão (arte, controles da janela, logo e abas) é a `MolduraAuth`, a mesma
 * do cadastro. "Criar uma conta grátis" leva ao cadastro já na aba escolhida.
 */
export default function LoginPage() {
  const { isAuthenticated, user, homeFor, clearError } = useAuth();
  const { state } = useLocation() as { state: { role?: UserRole } | null };
  const [ativa, setAtiva] = useState(() =>
    Math.max(0, ABAS_AUTH.findIndex((aba) => aba.role === state?.role)),
  );

  if (isAuthenticated && user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  const aba = ABAS_AUTH[ativa];

  return (
    <MolduraAuth
      ativa={ativa}
      onTrocarAba={(indice) => {
        clearError();
        setAtiva(indice);
      }}
    >
      <div className="relative">
        {/* A key remonta o formulário ao trocar de aba, limpando o que foi digitado. */}
        <LoginForm key={aba.role} role={aba.role} demoEmail={aba.email} />
      </div>

      <p className="relative flex items-center gap-5 text-body text-white">
        Não tem uma conta OrbitPlay?
        <Link
          to={ROUTES.register}
          state={{ role: aba.role }}
          onClick={clearError}
          className="flex items-center gap-1 text-button text-orbit-blue-deep hover:underline"
        >
          Criar uma conta grátis
          <ArrowRight className="size-5" />
        </Link>
      </p>
    </MolduraAuth>
  );
}
