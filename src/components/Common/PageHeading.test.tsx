import { expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageHeading } from './PageHeading';

function linha(props: { linha?: 'clara' | 'azul' }) {
  const { container } = render(
    <MemoryRouter>
      <PageHeading trilha={[{ label: 'Home', to: '/' }, { label: 'Tela' }]} titulo="Tela" {...props} />
    </MemoryRouter>,
  );
  return container.querySelector('hr')!.className;
}

it('fecha o bloco com a linha clara por padrão', () => {
  expect(linha({})).toContain('border-orbit-border');
});

it('fecha o bloco com a linha azul quando a tela pede', () => {
  expect(linha({ linha: 'azul' })).toContain('border-orbit-azure');
});
