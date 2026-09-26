import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { users } from '@/mocks/fixtures/acessos.json';
import type { AccessUser } from '@/types';
import { ListaMembros } from './ListaMembros';

const usuarios = users.map((usuario) => ({ ...usuario, groups: [] })) as AccessUser[];

it('filtra os membros pela busca', () => {
  render(<ListaMembros usuarios={usuarios} selecionados={new Set()} onAlternar={() => undefined} />);

  fireEvent.change(screen.getByPlaceholderText('Pesquise...'), { target: { value: 'gaules' } });

  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
});

it('marca o membro pelo checkbox', () => {
  const onAlternar = vi.fn();
  render(<ListaMembros usuarios={usuarios} selecionados={new Set(['usr-hideo'])} onAlternar={onAlternar} />);

  expect(screen.getByRole('checkbox', { name: /Hideo Kojima/ }).getAttribute('aria-checked')).toBe('true');

  fireEvent.click(screen.getByRole('checkbox', { name: /funkyblackcat/ }));

  expect(onAlternar).toHaveBeenCalledWith('usr-funkyblackcat');
});
