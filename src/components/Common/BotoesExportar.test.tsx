import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
