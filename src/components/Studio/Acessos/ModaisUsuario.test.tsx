import { expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { get } from '@/lib/api';
import { users } from '@/mocks/fixtures/acessos.json';
import { renderizarComProvedores } from '@/test/provedores';
import type { AccessOverview, AccessUser } from '@/types';
import { ConfirmacaoUsuarioModal, NovoUsuarioModal, RedefinirSenhaModal } from './ModaisUsuario';

const usuario = (id: string) =>
  ({ ...users.find((item) => item.id === id), groups: [] }) as AccessUser;

it('só libera Atualizar quando a senha cumpre as regras', () => {
  renderizarComProvedores(<RedefinirSenhaModal usuario={usuario('usr-hideo')} onFechar={() => undefined} />);
  const campo = screen.getByPlaceholderText('Digite...');
  const atualizar = screen.getByRole<HTMLButtonElement>('button', { name: 'Atualizar' });

  fireEvent.change(campo, { target: { value: 'fraca' } });
  expect(atualizar.disabled).toBe(true);

  fireEvent.change(campo, { target: { value: 'Forte#2026' } });
  expect(atualizar.disabled).toBe(false);
});

it('convida pelo Enter e limpa o campo', async () => {
  renderizarComProvedores(<NovoUsuarioModal aberto onOpenChange={() => undefined} pendentes={[]} />);
  const campo = screen.getByPlaceholderText<HTMLInputElement>('Digite...');

  fireEvent.change(campo, { target: { value: 'henry.cavill@example.com' } });
  fireEvent.submit(campo.closest('form')!);

  await waitFor(() => expect(campo.value).toBe(''));
  const { users: atuais } = await get<AccessOverview>('/studio/access');
  expect(atuais.find((item) => item.email === 'henry.cavill@example.com')?.status).toBe('PENDING');
});

it('suspender grava o status e fecha', async () => {
  const onFechar = vi.fn();
  renderizarComProvedores(
    <ConfirmacaoUsuarioModal pedido={{ tipo: 'suspender', usuario: usuario('usr-fallen') }} onFechar={onFechar} />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Suspender' }));

  await waitFor(() => expect(onFechar).toHaveBeenCalled());
  const { users: atuais } = await get<AccessOverview>('/studio/access');
  expect(atuais.find((item) => item.id === 'usr-fallen')?.status).toBe('INACTIVE');
});
