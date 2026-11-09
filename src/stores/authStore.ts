import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  LoginResult,
  MfaChallenge,
  PlayerUser,
  RegisterPayload,
  RegisterResult,
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

  /** Entra direto, ou devolve o desafio quando a conta ligou o "MFA por E-mail". */
  login: (credentials: LoginCredentials) => Promise<AuthUser | MfaChallenge>;
  /** "Criar conta": a conta nasce pendente e o código vai para o e-mail. Não entra. */
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  /**
   * "Verificar e-mail" do cadastro. Devolve a sessão sem entrar: antes vem o
   * cartão "E-mail verificado!", e só o "Continuar" chama `aplicarSessao`.
   */
  verificarEmail: (email: string, code: string) => Promise<AuthSession>;
  /** Segundo passo do login com MFA: o código certo já entra. */
  verificarLogin: (email: string, code: string, remember: boolean) => Promise<AuthUser>;
  /** "Reenviar código", do cadastro ou do login com MFA. */
  reenviarCodigo: (email: string) => Promise<string>;
  /** A sessão da API vira a sessão do app (token, perfil e "Lembrar login"). */
  aplicarSessao: (session: AuthSession, remember: boolean) => AuthUser;
  /** Minha conta salvou: a conta que a API devolveu substitui a da sessão. */
  atualizarUsuario: (user: AuthUser) => void;
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
      /** Pedido de conta com `status` e `error` no store: as telas de conta leem o erro daqui. */
      async function pedir<T>(pedido: () => Promise<T>): Promise<T> {
        set({ status: 'loading', error: null });
        try {
          const resposta = await pedido();
          set({ status: get().user ? 'authenticated' : 'idle' });
          return resposta;
        } catch (error) {
          const message =
            (error as { message?: string })?.message ?? 'Não foi possível concluir. Tente novamente.';
          set({ status: 'error', error: message });
          throw error;
        }
      }

      function aplicarSessao(session: AuthSession, remember: boolean): AuthUser {
        const role = (session.user as { role: string }).role;
        if (role !== 'STUDIO' && role !== 'PLAYER') {
          set({ status: 'error', error: CONTA_SEM_APP });
          throw { message: CONTA_SEM_APP };
        }

        // O interceptor do axios lê o token de `tokenStorage`: localStorage só com "Lembrar login".
        setToken(session.token, remember);

        set({ user: session.user, token: session.token, remember, status: 'authenticated', error: null });
        return session.user;
      }

      return {
        user: null,
        token: null,
        remember: false,
        status: 'idle',
        error: null,

        login: async (credentials) => {
          const resposta = await pedir(() => post<LoginResult>('/auth/login', credentials));
          if ('mfaRequired' in resposta) return resposta;
          return aplicarSessao(resposta, credentials.remember ?? false);
        },

        register: (payload) => pedir(() => post<RegisterResult>('/auth/register', payload)),

        verificarEmail: (email, code) => pedir(() => post<AuthSession>('/auth/verify-email', { email, code })),

        verificarLogin: async (email, code, remember) =>
          aplicarSessao(await pedir(() => post<AuthSession>('/auth/verify-login', { email, code, remember })), remember),

        reenviarCodigo: async (email) =>
          (await pedir(() => post<{ message: string }>('/auth/resend-code', { email }))).message,

        aplicarSessao,

        atualizarUsuario: (user) => set({ user }),

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
