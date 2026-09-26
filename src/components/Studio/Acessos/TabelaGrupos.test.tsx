import { expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { groups } from '@/mocks/fixtures/acessos.json';
import { renderizarComProvedores } from '@/test/provedores';
import type { AccessGroup } from '@/types';
import { TabelaGrupos } from './TabelaGrupos';

const grupos = groups.map(({ id, name }) => ({ id, name, status: 'ACTIVE', members: [] })) as AccessGroup[];

it('abre o modal de renomear pelo menu de ações', () => {
  renderizarComProvedores(<TabelaGrupos grupos={grupos} usuarios={[]} />);

  fireEvent.keyDown(screen.getByRole('button', { name: 'Ações de Diretoria' }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Renomear' }));

  expect(screen.queryByRole('dialog', { name: 'Renomear grupo' })).not.toBeNull();
});

it('abre a confirmação de excluir pelo menu de ações', () => {
  renderizarComProvedores(<TabelaGrupos grupos={grupos} usuarios={[]} />);

  fireEvent.keyDown(screen.getByRole('button', { name: 'Ações de Rh' }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir grupo' }));

  expect(screen.queryByRole('dialog', { name: 'Excluir grupo?' })).not.toBeNull();
});
