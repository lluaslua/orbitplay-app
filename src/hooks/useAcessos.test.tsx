import { expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provedores } from '@/test/provedores';
import { useAcessos, useExcluirGrupo } from './useAcessos';

it('toda ação recarrega a lista de acessos', async () => {
  const { result } = renderHook(() => ({ lista: useAcessos(), excluir: useExcluirGrupo() }), {
    wrapper: Provedores,
  });
  await waitFor(() => expect(result.current.lista.data).toBeDefined());
  const antes = result.current.lista.data!.groups.length;

  act(() => result.current.excluir.mutate('grp-analitics'));

  await waitFor(() => expect(result.current.lista.data?.groups).toHaveLength(antes - 1));
});
