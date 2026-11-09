import { useMutation } from '@tanstack/react-query';
import { enviarArquivo, patch, post } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthSession, AuthUser, ChangePasswordPayload, UpdateMePayload } from '@/types';

/**
 * "Minha conta" — a própria conta, nos dois perfis. As três rotas devolvem a
 * conta (ou a sessão) atualizada, e ela substitui a da sessão no `authStore`:
 * a navbar e as homes leem o nome e a foto de lá.
 *
 * Não há mock: é feature nova e fala direto com a API (`PATCH /me`,
 * `POST /me/avatar`, `POST /me/password`).
 */
export function useSalvarConta() {
  return useMutation({
    mutationFn: (dados: UpdateMePayload) => patch<AuthUser>('/me', dados),
    onSuccess: (conta) => useAuthStore.getState().atualizarUsuario(conta),
  });
}

/** "Importar" a foto de perfil: multipart com o arquivo no campo `file`. */
export function useEnviarFoto() {
  return useMutation({
    mutationFn: (arquivo: File) => {
      const form = new FormData();
      form.append('file', arquivo);
      return enviarArquivo<AuthUser>('/me/avatar', form);
    },
    onSuccess: (conta) => useAuthStore.getState().atualizarUsuario(conta),
  });
}

/**
 * "Alterar senha". A API derruba as outras sessões e devolve uma nova para
 * esta, que entra no lugar da antiga com o mesmo "Lembrar login".
 */
export function useAlterarSenha() {
  return useMutation({
    mutationFn: (dados: ChangePasswordPayload) => post<AuthSession>('/me/password', dados),
    onSuccess: (sessao) => {
      const { aplicarSessao, remember } = useAuthStore.getState();
      aplicarSessao(sessao, remember);
    },
  });
}
