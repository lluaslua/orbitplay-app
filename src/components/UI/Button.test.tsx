import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

it('desabilita o botao enquanto carrega', () => {
  render(<Button loading>Enviar</Button>);

  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Enviar' }).disabled).toBe(true);
});
