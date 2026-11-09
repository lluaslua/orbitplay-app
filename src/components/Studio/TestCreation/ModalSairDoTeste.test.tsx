import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalSairDoTeste } from './ModalSairDoTeste';

function abrir() {
  const aoMudar = vi.fn();
  const salvar = vi.fn();
  const descartar = vi.fn();
  render(
    <ModalSairDoTeste aberto onOpenChange={aoMudar} onSalvar={salvar} onDescartar={descartar} />,
  );
  return { aoMudar, salvar, descartar };
}

it('oferece salvar o rascunho, descartar ou continuar editando', () => {
  abrir();

  expect(screen.getByText('Salvar como rascunho?')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Descartar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continuar editando' })).toBeTruthy();
});

it('cada botão dispara só a própria ação', () => {
  const { salvar, descartar, aoMudar } = abrir();

  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  expect(salvar).toHaveBeenCalledTimes(1);
  expect(descartar).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
  expect(descartar).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }));
  expect(aoMudar).toHaveBeenCalledWith(false);
});
