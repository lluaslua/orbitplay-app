import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MenuAcoes } from './MenuAcoes';

function abrir(onSelect: () => void = () => undefined) {
  render(
    <MenuAcoes
      rotulo="Ações de teste"
      acoes={[
        { rotulo: 'Editar perfil', icone: <span /> },
        { rotulo: 'Excluir', icone: <span />, perigo: true, onSelect },
      ]}
    />,
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Ações de teste' }), { key: 'Enter' });
}

it('avisa que o item sem ação ainda não está disponível', () => {
  abrir();

  expect(screen.getByRole('menuitem', { name: 'Editar perfil' }).getAttribute('title')).toBe(
    'Ainda não disponível',
  );
  expect(screen.getByRole('menuitem', { name: 'Excluir' }).getAttribute('title')).toBeNull();
});

it('chama a ação do item escolhido', () => {
  const onSelect = vi.fn();
  abrir(onSelect);

  fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir' }));

  expect(onSelect).toHaveBeenCalledTimes(1);
});
