import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { ROUTES } from '@/utils/constants';
import type { LoginCredentials, UserRole } from '@/types';

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
  const logoutAction = useAuthStore((state) => state.logout);
  const recoverPassword = useAuthStore((state) => state.recoverPassword);
  const clearError = useAuthStore((state) => state.clearError);

  const homeFor = useCallback((role: UserRole) => {
    return role === 'STUDIO' ? ROUTES.studio.home : ROUTES.player.home;
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const loggedUser = await loginAction(credentials);
      navigate(homeFor(loggedUser.role), { replace: true });
      return loggedUser;
    },
    [loginAction, navigate, homeFor],
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
    logout,
    recoverPassword,
    clearError,
    homeFor,
  };
}
