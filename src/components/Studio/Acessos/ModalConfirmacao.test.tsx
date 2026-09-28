import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalConfirmacao } from './ModalConfirmacao';

function abrir(props: { onConfirmar?: () => void; onOpenChange?: (aberto: boolean) => void } = {}) {
  render(
    <ModalConfirmacao
      aberto
      onOpenChange={props.onOpenChange ?? (() => undefined)}
      selo="alerta"
      titulo="Excluir usuário?"
      descricao="Esta ação não poderá ser desfeita."
      acao="Excluir"
      onConfirmar={props.onConfirmar ?? (() => undefined)}
    />,
  );
}

it('confirma a ação pelo botão da direita', () => {
  const onConfirmar = vi.fn();
  abrir({ onConfirmar });

  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

  expect(onConfirmar).toHaveBeenCalledTimes(1);
});

it('cancelar fecha sem confirmar', () => {
  const onConfirmar = vi.fn();
  const onOpenChange = vi.fn();
  abrir({ onConfirmar, onOpenChange });

  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(onConfirmar).not.toHaveBeenCalled();
});
