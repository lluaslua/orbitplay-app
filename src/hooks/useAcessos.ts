import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { AccessGroup, AccessGroupPatch, AccessOverview, AccessUser, AccessUserPatch } from '@/types';

/** Usuários, grupos e os quatro números do topo de "Gerenciamento de acessos" — `GET /studio/access`. */
export function useAcessos() {
  return useQuery({
    queryKey: queryKeys.studioAccess,
    queryFn: () => get<AccessOverview>('/studio/access'),
  });
}

/** Toda ação dos modais muda a mesma lista, então todas invalidam a mesma chave. */
function useMutacaoAcessos<TVariaveis, TResposta>(mutationFn: (variaveis: TVariaveis) => Promise<TResposta>) {
  const client = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.studioAccess }),
  });
}

export function useConvidarUsuario() {
  return useMutacaoAcessos((email: string) => post<AccessUser>('/studio/access/users', { email }));
}

export function useAtualizarUsuario() {
  return useMutacaoAcessos(({ id, ...mudancas }: AccessUserPatch & { id: string }) =>
    patch<AccessUser>(`/studio/access/users/${id}`, mudancas),
  );
}

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      post<{ message: string }>(`/studio/access/users/${id}/password`, { password }),
  });
}

export function useExcluirUsuario() {
  return useMutacaoAcessos((id: string) => del<{ id: string }>(`/studio/access/users/${id}`));
}

export function useCriarGrupo() {
  return useMutacaoAcessos((grupo: { name: string; memberIds: string[] }) =>
    post<AccessGroup>('/studio/access/groups', grupo),
  );
}

export function useAtualizarGrupo() {
  return useMutacaoAcessos(({ id, ...mudancas }: AccessGroupPatch & { id: string }) =>
    patch<AccessGroup>(`/studio/access/groups/${id}`, mudancas),
  );
}

export function useExcluirGrupo() {
  return useMutacaoAcessos((id: string) => del<{ id: string }>(`/studio/access/groups/${id}`));
}
