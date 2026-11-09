import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BotoesExportar } from './BotoesExportar';

it('corta a lista de botões pela quantidade', () => {
  render(<BotoesExportar quantidade={2} />);

  expect(screen.getAllByRole('button', { name: 'Exportar' })).toHaveLength(2);
});

it('troca o espaço entre os botões pela classe recebida', () => {
  const { container } = render(<BotoesExportar className="gap-6" />);
  const grupo = container.firstElementChild as HTMLElement;

  expect(grupo.className).toContain('gap-6');
  expect(grupo.className).not.toContain('gap-2');
});

it('só o botão de download baixa o CSV', () => {
  const baixar = vi.fn();
  render(<BotoesExportar aoBaixar={baixar} />);
  const botoes = screen.getAllByRole('button');

  fireEvent.click(botoes[0]);
  fireEvent.click(botoes[1]);
  expect(baixar).not.toHaveBeenCalled();

  fireEvent.click(botoes[2]);
  expect(baixar).toHaveBeenCalledTimes(1);
  expect(botoes[2].getAttribute('title')).toBe('Baixar CSV');
  expect(botoes[0].getAttribute('title')).toBe('Ainda não disponível');
});
