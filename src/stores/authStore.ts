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
import { clearToken, getToken, setToken } from '@/lib/tokenStorage';
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
    /** A recompensa entra no saldo ao enviar o teste e o saque sai dele no pedido. */
    balanceDelta?: number;
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

          // O interceptor do axios lê o token de `tokenStorage`: localStorage só com "Lembrar login".
          setToken(session.token, remember);

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
          // A API revoga o token (ele deixa de valer mesmo antes de vencer). O pedido leva o token
          // explicitamente porque a limpeza local acontece logo em seguida.
          const token = getToken();
          clearToken();
          set({ user: null, token: null, status: 'idle', error: null });
          if (token) {
            void post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
          }
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
                balance: current.player.balance + (patch.balanceDelta ?? 0),
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
      // O perfil acompanha o token: com "Lembrar login" fica em localStorage; sem ele, só na sessão.
      storage: createJSONStorage(() => ({
        getItem: (nome) => sessionStorage.getItem(nome) ?? localStorage.getItem(nome),
        setItem: (nome, valor) => {
          const lembrar = (JSON.parse(valor) as { state?: { remember?: boolean } }).state?.remember === true;
          (lembrar ? localStorage : sessionStorage).setItem(nome, valor);
          (lembrar ? sessionStorage : localStorage).removeItem(nome);
        },
        removeItem: (nome) => {
          sessionStorage.removeItem(nome);
          localStorage.removeItem(nome);
        },
      })),
      // `status` e `error` sao efemeros. O TOKEN nao e persistido aqui: ele vive so em `tokenStorage`.
      partialize: (state) => ({
        user: state.user,
        remember: state.remember,
      }),
      onRehydrateStorage: () => (state) => {
        const token = getToken();
        if (state && token && state.user) {
          state.token = token;
          state.status = 'authenticated';
        } else if (state) {
          // Perfil sem token (sessão encerrada ou aba nova sem "Lembrar login"): volta ao login.
          state.user = null;
          state.token = null;
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
