import { expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { get } from '@/lib/api';
import { users } from '@/mocks/fixtures/acessos.json';
import { renderizarComProvedores } from '@/test/provedores';
import type { AccessOverview, AccessUser } from '@/types';
import { TabelaUsuarios } from './TabelaUsuarios';

const usuarios = users.map((usuario) => ({ ...usuario, groups: [] })) as AccessUser[];

function abrirMenu(nome: string) {
  fireEvent.keyDown(screen.getByRole('button', { name: `Ações de ${nome}` }), { key: 'Enter' });
}

it('grava a permissão ao mexer no toggle', async () => {
  renderizarComProvedores(<TabelaUsuarios usuarios={usuarios} />);

  fireEvent.click(screen.getByRole('switch', { name: 'Excluir usuário — Hideo Kojima' }));

  await waitFor(async () => {
    const { users: atuais } = await get<AccessOverview>('/studio/access');
    expect(atuais.find((usuario) => usuario.id === 'usr-hideo')?.permissions.deleteUsers).toBe(true);
  });
});

it('oferece restabelecer o acesso de quem está suspenso', () => {
  renderizarComProvedores(<TabelaUsuarios usuarios={usuarios} />);

  abrirMenu('yoda');

  expect(screen.queryByRole('menuitem', { name: 'Restabelecer acesso' })).not.toBeNull();
  expect(screen.queryByRole('menuitem', { name: 'Suspender acesso' })).toBeNull();
});

it('oferece suspender o acesso de quem está ativo', () => {
  renderizarComProvedores(<TabelaUsuarios usuarios={usuarios} />);

  abrirMenu('gaules');

  expect(screen.queryByRole('menuitem', { name: 'Suspender acesso' })).not.toBeNull();
});
