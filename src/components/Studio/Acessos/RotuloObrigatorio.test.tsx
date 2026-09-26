import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RotuloObrigatorio } from './RotuloObrigatorio';

it('marca o campo como obrigatório com o asterisco', () => {
  render(
    <RotuloObrigatorio texto="Nome do grupo">
      <input />
    </RotuloObrigatorio>,
  );

  expect(screen.getByText('Nome do grupo').textContent).toBe('Nome do grupo*');
});
