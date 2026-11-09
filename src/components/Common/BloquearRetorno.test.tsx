import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { BloquearRetorno } from './BloquearRetorno';

it('impede que o histórico leve o usuário para a etapa anterior', () => {
  const avancarNoHistorico = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);

  render(<BloquearRetorno />);
  window.dispatchEvent(new PopStateEvent('popstate'));

  expect(avancarNoHistorico).toHaveBeenCalledWith(1);
});
