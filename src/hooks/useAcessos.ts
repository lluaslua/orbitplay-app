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

/**
 * Otimista: o toggle de permissão e o status mudam na lista na hora, sem
 * esperar o PATCH e a recarga. Se a gravação falhar, a lista volta ao que era;
 * no fim, a recarga traz os números do topo que o servidor recalcula.
 */
export function useAtualizarUsuario() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...mudancas }: AccessUserPatch & { id: string }) =>
      patch<AccessUser>(`/studio/access/users/${id}`, mudancas),
    onMutate: async ({ id, permissions, ...resto }) => {
      await client.cancelQueries({ queryKey: queryKeys.studioAccess });
      const anterior = client.getQueryData<AccessOverview>(queryKeys.studioAccess);

      client.setQueryData<AccessOverview>(queryKeys.studioAccess, (atual) =>
        atual && {
          ...atual,
          users: atual.users.map((usuario) =>
            usuario.id === id
              ? { ...usuario, ...resto, permissions: { ...usuario.permissions, ...permissions } }
              : usuario,
          ),
        },
      );

      return { anterior };
    },
    onError: (_erro, _variaveis, contexto) => {
      if (contexto?.anterior) client.setQueryData(queryKeys.studioAccess, contexto.anterior);
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.studioAccess }),
  });
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
