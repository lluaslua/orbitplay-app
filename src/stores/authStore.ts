import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, LoginCredentials, PlayerUser, StudioUser, UserRole } from '@/types';
import { post } from '@/lib/api';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  remember: boolean;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
  recoverPassword: (email: string) => Promise<string>;
  clearError: () => void;
  /** Aplica ganhos de XP/saldo vindos do fim de uma sessao. */
  applyPlayerProgress: (patch: {
    xp?: number;
    level?: number;
    pendingBalanceDelta?: number;
    completedSessionsDelta?: number;
  }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      remember: false,
      status: 'idle',
      error: null,

      login: async (credentials) => {
        set({ status: 'loading', error: null });
        try {
          const session = await post<{ token: string; user: AuthUser }>('/auth/login', credentials);

          // O token tambem vai para a chave lida pelo interceptor do axios.
          localStorage.setItem(STORAGE_KEYS.token, session.token);

          set({
            user: session.user,
            token: session.token,
            remember: credentials.remember ?? false,
            status: 'authenticated',
            error: null,
          });
          return session.user;
        } catch (error) {
          const message =
            (error as { message?: string })?.message ?? 'Não foi possível entrar. Tente novamente.';
          set({ status: 'error', error: message });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.token);
        void post('/auth/logout').catch(() => undefined);
        set({ user: null, token: null, status: 'idle', error: null });
      },

      recoverPassword: async (email) => {
        const response = await post<{ message: string }>('/auth/recover', { email });
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
    }),
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
