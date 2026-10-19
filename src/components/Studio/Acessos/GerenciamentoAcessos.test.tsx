import { beforeEach, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import StudioAcessosPage from '@/pages/studio/acessos';
import { entrarComo, renderizarComProvedores } from '@/test/provedores';

// As rotas de acessos só respondem ao estúdio.
beforeEach(() => entrarComo('STUDIO'));

async function abrirTela() {
  renderizarComProvedores(<StudioAcessosPage />);
  await screen.findByText('Hideo Kojima');
}

it('filtra os usuários pela busca', async () => {
  await abrirTela();

  fireEvent.change(screen.getByPlaceholderText('Digite...'), { target: { value: 'hideo' } });

  expect(screen.getAllByRole('button', { name: /^Ações de/ })).toHaveLength(1);
  expect(screen.queryByText('funkyblackcat')).toBeNull();
});

it('troca para a aba Grupos e muda o CTA', async () => {
  await abrirTela();

  // O Tabs do Radix troca de aba no mousedown, não no click.
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Grupos' }));

  expect(screen.queryByRole('button', { name: 'Novo grupo' })).not.toBeNull();
  expect(screen.queryByText('Participantes')).not.toBeNull();
  expect(screen.queryByText('Último acesso')).toBeNull();
});
