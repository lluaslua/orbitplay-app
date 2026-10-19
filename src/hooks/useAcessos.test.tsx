import { beforeEach, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { patch } from '@/lib/api';
import { Provedores, entrarComo } from '@/test/provedores';
import { useAcessos, useAtualizarUsuario, useExcluirGrupo } from './useAcessos';

// `patch` continua o de verdade; só um caso o troca por uma resposta que nunca chega.
vi.mock('@/lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/api')>();
  return { ...original, patch: vi.fn(original.patch) };
});

// As rotas de acessos só respondem ao estúdio.
beforeEach(() => entrarComo('STUDIO'));

it('toda ação recarrega a lista de acessos', async () => {
  const { result } = renderHook(() => ({ lista: useAcessos(), excluir: useExcluirGrupo() }), {
    wrapper: Provedores,
  });
  await waitFor(() => expect(result.current.lista.data).toBeDefined());
  const antes = result.current.lista.data!.groups.length;

  act(() => result.current.excluir.mutate('grp-analitics'));

  await waitFor(() => expect(result.current.lista.data?.groups).toHaveLength(antes - 1));
});

function permissaoDeExcluir(lista: ReturnType<typeof useAcessos>, id: string) {
  return lista.data?.users.find((usuario) => usuario.id === id)?.permissions.deleteUsers;
}

it('o toggle de permissão muda antes da resposta do servidor', async () => {
  const { result } = renderHook(
    () => ({ lista: useAcessos(), atualizar: useAtualizarUsuario() }),
    { wrapper: Provedores },
  );
  await waitFor(() => expect(result.current.lista.data).toBeDefined());

  vi.mocked(patch).mockReturnValueOnce(new Promise(() => undefined));
  act(() => result.current.atualizar.mutate({ id: 'usr-gaules', permissions: { deleteUsers: true } }));

  await waitFor(() => expect(permissaoDeExcluir(result.current.lista, 'usr-gaules')).toBe(true));
  expect(result.current.atualizar.isPending).toBe(true);
});

it('o toggle volta ao que era quando a gravação falha', async () => {
  const { result } = renderHook(
    () => ({ lista: useAcessos(), atualizar: useAtualizarUsuario() }),
    { wrapper: Provedores },
  );
  await waitFor(() => expect(result.current.lista.data).toBeDefined());
  const antes = permissaoDeExcluir(result.current.lista, 'usr-alanzoka');

  // Sessão de tester: a rota recusa com 403 e a mudança otimista é desfeita.
  entrarComo('PLAYER');
  act(() =>
    result.current.atualizar.mutate({ id: 'usr-alanzoka', permissions: { deleteUsers: !antes } }),
  );

  await waitFor(() => expect(result.current.atualizar.isError).toBe(true));
  expect(permissaoDeExcluir(result.current.lista, 'usr-alanzoka')).toBe(antes);
});
