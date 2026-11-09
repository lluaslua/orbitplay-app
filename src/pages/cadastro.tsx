import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CadastroForm, ID_FORM_CADASTRO } from '@/components/Auth/CadastroForm';
import { BotaoConta, MolduraConta } from '@/components/Auth/MolduraConta';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { ROUTES } from '@/utils/constants';

/**
 * "Criar conta" — Figma: os cartões do estúdio e do jogador, que só mudam os
 * rótulos. O perfil marcado de início vem da aba do login; a seta volta para lá
 * na mesma aba. Criar a conta leva a "Verifique seu e-mail".
 */
export default function CadastroPage() {
  const { isAuthenticated, user, homeFor, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { role?: UserRole } | null };
  const roleInicial = state?.role === 'PLAYER' ? 'PLAYER' : 'STUDIO';

  if (isAuthenticated && user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return (
    <MolduraConta
      titulo="Criar conta"
      aoVoltar={() => {
        clearError();
        navigate(ROUTES.login, { state: { role: roleInicial } });
      }}
      acao={
        <BotaoConta form={ID_FORM_CADASTRO} ocupado={isLoading}>
          {isLoading ? 'Criando...' : 'Criar conta'}
        </BotaoConta>
      }
    >
      <CadastroForm roleInicial={roleInicial} />
    </MolduraConta>
  );
}
