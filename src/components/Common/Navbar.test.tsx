import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { accounts } from '@/mocks/fixtures/players.json';
import type { AuthUser } from '@/types';
import { Navbar } from './Navbar';

const [estudio, tester] = accounts.map((conta) => conta.user as AuthUser);

function abrirMenuDoPerfil(user: AuthUser) {
  useAuthStore.setState({ user, token: 'token-teste' });
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
  fireEvent.keyDown(screen.getByRole('button', { expanded: false, name: /Blackstar|Guilherme/ }), {
    key: 'Enter',
  });
}

describe('menu do perfil', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it('mostra gerenciamento de acessos para o estúdio', () => {
    abrirMenuDoPerfil(estudio);

    const itens = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(itens).toEqual(['Gerenciamento de acessos', 'Minha conta', 'Sair']);
  });

  it('esconde gerenciamento de acessos do tester', () => {
    abrirMenuDoPerfil(tester);

    const itens = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(itens).toEqual(['Minha conta', 'Sair']);
  });

  it('encerra a sessão ao escolher sair', () => {
    abrirMenuDoPerfil(estudio);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Sair' }));

    expect(useAuthStore.getState().user).toBeNull();
  });
});
