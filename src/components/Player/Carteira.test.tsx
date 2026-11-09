import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Wallet } from '@/types';
import { Carteira } from './Carteira';

const mutate = vi.fn();
let carteira: Wallet;

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({ isLoading: false, isError: false, data: carteira, refetch: vi.fn() }),
  useRequestWithdrawal: () => ({ mutate, isPending: false, error: null }),
}));

function umaCarteira(mudancas: Partial<Wallet> = {}): Wallet {
  return {
    balanceCents: 18_155,
    pendingBalanceCents: 0,
    minWithdrawalCents: 2000,
    dailyLimitCents: 100_000,
    canWithdraw: true,
    withdrawBlockedReason: null,
    transactions: [],
    withdrawals: [],
    ...mudancas,
  };
}

function abrir() {
  render(
    <MemoryRouter>
      <Carteira />
    </MemoryRouter>,
  );
}

const botaoDeSacar = () => screen.getByRole('button', { name: /^Sacar/ });
const campoValor = () => screen.getByLabelText(/^Valor(?!es)/);
const campoChave = () => screen.getByLabelText(/^Chave Pix/);

describe('Carteira (TELA 13)', () => {
  beforeEach(() => {
    mutate.mockReset();
    carteira = umaCarteira();
  });

  it('mostra o saldo, o limite e deixa claro que o Pix é simulado', () => {
    abrir();

    expect(screen.getByText('181,55')).toBeTruthy();
    expect(screen.getAllByText(/simulad/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Limite em 24 h/)).toBeTruthy();
  });

  it('só habilita o saque com valor e chave Pix válidos', () => {
    abrir();
    expect((botaoDeSacar() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(campoValor(), { target: { value: '5000' } });
    expect((botaoDeSacar() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(campoChave(), { target: { value: 'minha chave' } });
    expect(screen.getByText(/Use CPF, CNPJ, telefone/)).toBeTruthy();
    expect((botaoDeSacar() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(campoChave(), { target: { value: '123.456.789-09' } });
    expect(screen.getByText('CPF identificado.')).toBeTruthy();
    expect((botaoDeSacar() as HTMLButtonElement).disabled).toBe(false);
  });

  it('avisa quando o valor passa do mínimo ou do saldo, sem liberar o botão', () => {
    abrir();
    fireEvent.change(campoChave(), { target: { value: 'tester@orbitplay.com' } });

    fireEvent.change(campoValor(), { target: { value: '500' } });
    expect(screen.getByText(/saque mínimo é de/)).toBeTruthy();
    expect((botaoDeSacar() as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(campoValor(), { target: { value: '99999' } });
    expect(screen.getByText('O valor passa do seu saldo.')).toBeTruthy();
    expect((botaoDeSacar() as HTMLButtonElement).disabled).toBe(true);
  });

  it('envia valor em centavos e a chave Pix com uma Idempotency-Key', () => {
    abrir();
    fireEvent.change(campoValor(), { target: { value: '5000' } });
    fireEvent.change(campoChave(), { target: { value: '123.456.789-09' } });
    fireEvent.click(botaoDeSacar());

    expect(mutate).toHaveBeenCalledTimes(1);
    const [pedido] = mutate.mock.calls[0] as [{ amountCents: number; pixKey: string; chave: string }];
    expect(pedido).toMatchObject({ amountCents: 5000, pixKey: '123.456.789-09' });
    expect(pedido.chave.length).toBeGreaterThan(8);
  });

  it('com saque em análise, mostra o motivo da API e trava o formulário', () => {
    carteira = umaCarteira({
      canWithdraw: false,
      withdrawBlockedReason: 'Já existe um saque em análise.',
      withdrawals: [
        {
          id: 's1',
          amountCents: 5000,
          status: 'REQUESTED',
          pixKey: '•••8909',
          note: null,
          createdAt: '2026-11-09T12:00:00.000Z',
          processedAt: null,
        },
      ],
    });
    abrir();

    expect(screen.getByText('Já existe um saque em análise.')).toBeTruthy();
    expect((campoValor() as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText('Em análise', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText(/•••8909/)).toBeTruthy();
  });

  it('lista saque pago e recompensa no extrato', () => {
    carteira = umaCarteira({
      withdrawals: [
        {
          id: 's2',
          amountCents: 3000,
          status: 'PAID',
          pixKey: '•••8909',
          note: 'Pix simulado: nenhum dinheiro real foi movimentado.',
          createdAt: '2026-11-09T12:00:00.000Z',
          processedAt: '2026-11-09T12:00:15.000Z',
        },
      ],
      transactions: [
        {
          id: 't1',
          type: 'REWARD',
          status: 'AVAILABLE',
          amountCents: 250,
          description: 'Racha de Rua! — Teste A/B',
          createdAt: '2026-11-09T11:00:00.000Z',
        },
      ],
    });
    abrir();

    expect(screen.getByText('Pago')).toBeTruthy();
    expect(screen.getByText('Racha de Rua! — Teste A/B')).toBeTruthy();
    expect(screen.getByText(/^\+\s/)).toBeTruthy();
  });
});
