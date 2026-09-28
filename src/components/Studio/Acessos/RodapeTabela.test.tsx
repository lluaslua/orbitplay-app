import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RodapeTabela } from './RodapeTabela';

it('escreve a contagem de registros exibidos', () => {
  render(<RodapeTabela exibidos={4} total={4} />);

  expect(screen.queryByText('Mostrando 1-4 de 4 registros.')).not.toBeNull();
});
