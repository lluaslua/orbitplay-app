import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CadastroForm } from '@/components/Auth/CadastroForm';
import { ABAS_AUTH, MolduraAuth } from '@/components/Auth/MolduraAuth';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROUTES } from '@/utils/constants';

/**
 * "Criar uma conta grátis" — tela provisória, sem frame no Figma: vale até o
 * design desenhar o cadastro (ver AGENTS.md). Usa o mesmo cartão do login, com
 * as abas tester/estúdio; o formulário rola dentro dele.
 */
export default function CadastroPage() {
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
      className="justify-start gap-5"
    >
      <div className="app-no-drag relative min-h-0 flex-1 overflow-y-auto pr-2">
        {/* A key remonta o formulário ao trocar de aba, limpando o que foi digitado. */}
        <CadastroForm key={aba.role} role={aba.role} />
      </div>

      <p className="relative flex shrink-0 items-center gap-5 text-body text-white">
        Já tem uma conta OrbitPlay?
        <Link
          to={ROUTES.login}
          state={{ role: aba.role }}
          onClick={clearError}
          className="flex items-center gap-1 text-button text-orbit-blue-deep hover:underline"
        >
          Entrar
          <ArrowRight className="size-5" />
        </Link>
      </p>
    </MolduraAuth>
  );
}
