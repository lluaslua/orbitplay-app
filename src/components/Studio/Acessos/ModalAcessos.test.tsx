import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalAcessos } from './ModalAcessos';

function abrir(props: { cancelar?: boolean; desabilitado?: boolean }) {
  render(
    <ModalAcessos
      aberto
      onOpenChange={() => undefined}
      titulo="Renomear grupo"
      acao="Finalizar"
      onConfirmar={() => undefined}
      {...props}
    >
      <p>conteúdo</p>
    </ModalAcessos>,
  );
}

it('trava o botão da ação quando o formulário não está pronto', () => {
  abrir({ desabilitado: true });

  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Finalizar' }).disabled).toBe(true);
});

it('só mostra Cancelar quando o modal pede', () => {
  abrir({ cancelar: true });
  expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeNull();
});

it('esconde Cancelar nos modais que fecham só pelo ×', () => {
  abrir({});
  expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
});
