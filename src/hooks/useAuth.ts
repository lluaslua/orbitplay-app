import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { ROUTES } from '@/utils/constants';
import type { AuthSession, LoginCredentials, RegisterPayload, UserRole } from '@/types';

/**
 * O que "Verifique seu e-mail" recebe pelo `state` da navegação: o e-mail que
 * recebeu o código e de onde ele veio. Nada disso fica guardado — atualizar a
 * página sem `state` volta para o login.
 */
export interface EstadoVerificacao {
  email: string;
  /** `cadastro` confirma a conta nova; `login` é o segundo passo do "MFA por E-mail". */
  modo: 'cadastro' | 'login';
  /** O "Lembrar login" do primeiro passo, para o login com MFA. */
  remember?: boolean;
}

/**
 * Ponte entre o authStore e a navegacao.
 * As telas usam este hook; ninguem chama o store direto para login/logout.
 */
export function useAuth() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const remember = useAuthStore((state) => state.remember);
  const loginAction = useAuthStore((state) => state.login);
  const registerAction = useAuthStore((state) => state.register);
  const verificarEmail = useAuthStore((state) => state.verificarEmail);
  const verificarLoginAction = useAuthStore((state) => state.verificarLogin);
  const reenviarCodigo = useAuthStore((state) => state.reenviarCodigo);
  const aplicarSessaoAction = useAuthStore((state) => state.aplicarSessao);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const logoutAction = useAuthStore((state) => state.logout);
  const recoverPassword = useAuthStore((state) => state.recoverPassword);
  const clearError = useAuthStore((state) => state.clearError);

  const homeFor = useCallback((role: UserRole) => {
    return role === 'STUDIO' ? ROUTES.studio.home : ROUTES.player.home;
  }, []);

  const irParaVerificacao = useCallback(
    (estado: EstadoVerificacao) => navigate(ROUTES.verifyEmail, { state: estado }),
    [navigate],
  );

  /**
   * Entra e vai para a home do perfil. Duas saídas levam a "Verifique seu
   * e-mail": a conta com MFA (a senha conferiu e o código foi para o e-mail) e
   * o cadastro que ainda não confirmou o e-mail (a API mandou um código novo).
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const resposta = await loginAction(credentials);
        if ('mfaRequired' in resposta) {
          irParaVerificacao({ email: resposta.email, modo: 'login', remember: credentials.remember });
          return;
        }
        navigate(homeFor(resposta.role), { replace: true });
      } catch (erro) {
        if ((erro as { code?: string })?.code === 'EMAIL_NOT_VERIFIED') {
          clearError();
          irParaVerificacao({ email: credentials.email.trim().toLowerCase(), modo: 'cadastro' });
          return;
        }
        throw erro;
      }
    },
    [loginAction, navigate, homeFor, irParaVerificacao, clearError],
  );

  /** "Criar conta": a conta nasce pendente e a próxima tela pede o código do e-mail. */
  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { email } = await registerAction(payload);
      irParaVerificacao({ email, modo: 'cadastro' });
    },
    [registerAction, irParaVerificacao],
  );

  /** Segundo passo do login com MFA: o código certo entra direto, sem cartão de sucesso. */
  const verificarLogin = useCallback(
    async (email: string, code: string, lembrar: boolean) => {
      const conta = await verificarLoginAction(email, code, lembrar);
      navigate(homeFor(conta.role), { replace: true });
    },
    [verificarLoginAction, navigate, homeFor],
  );

  /** O "Continuar" de "E-mail verificado!": a sessão guardada pela tela vira a sessão do app. */
  const aplicarSessao = useCallback(
    (session: AuthSession) => {
      const conta = aplicarSessaoAction(session, false);
      navigate(homeFor(conta.role), { replace: true });
    },
    [aplicarSessaoAction, navigate, homeFor],
  );

  const logout = useCallback(() => {
    logoutAction();
    // Sem isso a proxima conta veria o cache da anterior.
    queryClient.clear();
    navigate(ROUTES.login, { replace: true });
  }, [logoutAction, navigate]);

  return {
    user,
    token,
    status,
    error,
    remember,
    isAuthenticated: !!user && !!token,
    isLoading: status === 'loading',
    role: user?.role ?? null,
    login,
    register,
    verificarEmail,
    verificarLogin,
    reenviarCodigo,
    aplicarSessao,
    logout,
    recoverPassword,
    resetPassword,
    clearError,
    homeFor,
  };
}
