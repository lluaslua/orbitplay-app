import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  PlayerUser,
  RegisterPayload,
  StudioUser,
  UserRole,
} from '@/types';
import { post, SESSAO_EXPIRADA } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  remember: boolean;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  /** "Criar uma conta grátis": cria a conta e já entra, como o login. */
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  recoverPassword: (email: string) => Promise<string>;
  /** Nova senha pelo link do e-mail (recuperação ou convite da equipe). */
  resetPassword: (token: string, password: string) => Promise<string>;
  clearError: () => void;
  /** Aplica ganhos de XP/saldo vindos do fim de uma sessao. */
  applyPlayerProgress: (patch: {
    xp?: number;
    level?: number;
    pendingBalanceDelta?: number;
    completedSessionsDelta?: number;
  }) => void;
}

/** Contas da administração da plataforma (OWNER/ADMIN) não têm tela no app. */
export const CONTA_SEM_APP = 'Esta conta é da administração da plataforma e não tem acesso pelo app.';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      /** Login e cadastro terminam igual: a sessão da API vira a sessão do app. */
      async function entrar(pedido: () => Promise<AuthSession>, remember: boolean): Promise<AuthUser> {
        set({ status: 'loading', error: null });
        try {
          const session = await pedido();
          const role = (session.user as { role: string }).role;
          if (role !== 'STUDIO' && role !== 'PLAYER') throw { message: CONTA_SEM_APP };

          // O token tambem vai para a chave lida pelo interceptor do axios.
          localStorage.setItem(STORAGE_KEYS.token, session.token);

          set({ user: session.user, token: session.token, remember, status: 'authenticated', error: null });
          return session.user;
        } catch (error) {
          const message =
            (error as { message?: string })?.message ?? 'Não foi possível entrar. Tente novamente.';
          set({ status: 'error', error: message });
          throw error;
        }
      }

      return {
        user: null,
        token: null,
        remember: false,
        status: 'idle',
        error: null,

        login: (credentials) =>
          entrar(() => post<AuthSession>('/auth/login', credentials), credentials.remember ?? false),

        register: (payload) => entrar(() => post<AuthSession>('/auth/register', payload), false),

        logout: () => {
          localStorage.removeItem(STORAGE_KEYS.token);
          void post('/auth/logout').catch(() => undefined);
          set({ user: null, token: null, status: 'idle', error: null });
        },

        recoverPassword: async (email) => {
          const response = await post<{ message: string }>('/auth/recover', { email });
          return response.message;
        },

        resetPassword: async (token, password) => {
          const response = await post<{ message: string }>('/auth/reset-password', { token, password });
          return response.message;
        },

        clearError: () => set({ error: null }),

        applyPlayerProgress: (patch) => {
          const current = get().user;
          if (!current || current.role !== 'PLAYER') return;

          set({
            user: {
              ...current,
              player: {
                ...current.player,
                xp: patch.xp ?? current.player.xp,
                level: patch.level ?? current.player.level,
                pendingBalance: current.player.pendingBalance + (patch.pendingBalanceDelta ?? 0),
                completedSessions:
                  current.player.completedSessions + (patch.completedSessionsDelta ?? 0),
              },
            },
          });
        },
      };
    },
    {
      name: STORAGE_KEYS.user,
      storage: createJSONStorage(() => localStorage),
      // `status` e `error` sao efemeros: nao faz sentido restaurar "loading".
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        remember: state.remember,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem(STORAGE_KEYS.token, state.token);
          state.status = 'authenticated';
        }
      },
    },
  ),
);

/*
 * A API recusou o token guardado (venceu, a senha mudou, a conta foi
 * suspensa): sai da conta e limpa o cache, e o guard das rotas volta ao login.
 */
if (typeof window !== 'undefined') {
  window.addEventListener(SESSAO_EXPIRADA, () => {
    if (!useAuthStore.getState().user) return;
    useAuthStore.getState().logout();
    queryClient.clear();
  });
}

// --- Seletores tipados -------------------------------------------------------

export const selectIsAuthenticated = (state: AuthState) => !!state.user && !!state.token;

export const selectRole = (state: AuthState): UserRole | null => state.user?.role ?? null;

export function useStudioUser(): StudioUser | null {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'STUDIO' ? user : null;
}

export function usePlayerUser(): PlayerUser | null {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'PLAYER' ? user : null;
}
