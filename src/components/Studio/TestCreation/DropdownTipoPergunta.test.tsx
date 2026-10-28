import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DropdownTipoPergunta } from './DropdownTipoPergunta';

function abrirMenu() {
  fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'mouse', button: 0 });
}

it('mostra Resposta curta no campo fechado, nunca o "Resposta curto" do arquivo', () => {
  render(<DropdownTipoPergunta valor="SHORT_TEXT" onChange={vi.fn()} />);

  expect(screen.getByRole('button').textContent).toBe('Resposta curta');
  expect(screen.queryByText('Resposta curto')).toBeNull();
});

it('lista só os quatro tipos do Figma, na ordem do arquivo', () => {
  render(<DropdownTipoPergunta valor="SHORT_TEXT" onChange={vi.fn()} />);

  abrirMenu();

  expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
    'Resposta curta',
    'Escolha',
    'Múltipla escolha',
    'Escala linear',
  ]);
});

it('Escolha é a de uma resposta e Múltipla escolha a de várias', () => {
  const onChange = vi.fn();
  render(<DropdownTipoPergunta valor="SHORT_TEXT" onChange={onChange} />);

  abrirMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Escolha' }));
  expect(onChange).toHaveBeenLastCalledWith('MULTIPLE_CHOICE');

  abrirMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Múltipla escolha' }));
  expect(onChange).toHaveBeenLastCalledWith('CHECKBOXES');
});
