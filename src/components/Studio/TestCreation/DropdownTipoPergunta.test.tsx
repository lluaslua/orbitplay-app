import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DropdownTipoPergunta } from './DropdownTipoPergunta';

it('mostra Resposta curta no gatilho, nunca Resposta curto', () => {
  render(<DropdownTipoPergunta valor="SHORT_TEXT" onChange={vi.fn()} />);

  expect(screen.getByRole('button').textContent).toBe('Resposta curta');
  expect(screen.queryByText('Resposta curto')).toBeNull();
});

function abrirMenu() {
  fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'mouse', button: 0 });
}

it('lista escolha, múltipla escolha e escala linear ao abrir', () => {
  render(<DropdownTipoPergunta valor="SHORT_TEXT" onChange={vi.fn()} />);

  abrirMenu();

  expect(screen.getByRole('menuitem', { name: 'Escolha' })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Múltipla escolha' })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Escala linear' })).toBeTruthy();
});

it('avisa o tipo escolhido', () => {
  const onChange = vi.fn();
  render(<DropdownTipoPergunta valor="SHORT_TEXT" onChange={onChange} />);

  abrirMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Múltipla escolha' }));

  expect(onChange).toHaveBeenCalledWith('CHECKBOXES');
});
