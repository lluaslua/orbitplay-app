import { expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { get } from '@/lib/api';
import { users } from '@/mocks/fixtures/acessos.json';
import { renderizarComProvedores } from '@/test/provedores';
import type { AccessGroup, AccessOverview, AccessUser } from '@/types';
import { AdicionarMembrosModal, NovoGrupoModal, RenomearGrupoModal } from './ModaisGrupo';

const usuarios = users.map((usuario) => ({ ...usuario, groups: [] })) as AccessUser[];

it('Novo grupo só libera Concluído com nome', () => {
  renderizarComProvedores(<NovoGrupoModal aberto onOpenChange={() => undefined} usuarios={usuarios} />);
  const concluido = screen.getByRole<HTMLButtonElement>('button', { name: 'Concluído' });

  expect(concluido.disabled).toBe(true);

  fireEvent.change(screen.getByPlaceholderText('Digite...'), { target: { value: 'Marketing' } });

  expect(concluido.disabled).toBe(false);
});

it('Adicionar membro abre com os membros atuais marcados', () => {
  const diretoria: AccessGroup = {
    id: 'grp-diretoria',
    name: 'Diretoria',
    status: 'ACTIVE',
    members: [
      { id: 'usr-hideo', name: 'Hideo Kojima' },
      { id: 'usr-funkyblackcat', name: 'funkyblackcat' },
    ],
  };
  renderizarComProvedores(<AdicionarMembrosModal grupo={diretoria} usuarios={usuarios} onFechar={() => undefined} />);

  expect(screen.getByRole('checkbox', { name: /Hideo Kojima/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('checkbox', { name: /funkyblackcat/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('checkbox', { name: /alanzoka/ }).getAttribute('aria-checked')).toBe('false');
});

it('Renomear grava o nome novo e fecha', async () => {
  const onFechar = vi.fn();
  const rh: AccessGroup = { id: 'grp-rh', name: 'Rh', status: 'INACTIVE', members: [] };
  renderizarComProvedores(<RenomearGrupoModal grupo={rh} onFechar={onFechar} />);

  fireEvent.change(screen.getByPlaceholderText('Digite...'), { target: { value: 'Pessoas' } });
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

  await waitFor(() => expect(onFechar).toHaveBeenCalled());
  const { groups } = await get<AccessOverview>('/studio/access');
  expect(groups.find((grupo) => grupo.id === 'grp-rh')?.name).toBe('Pessoas');
});
