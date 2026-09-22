import { describe, expect, it } from 'vitest';
import { cn, formatCurrency, formatDuration } from './helpers';

describe('formatCurrency', () => {
  it('formata centavos como moeda brasileira', () => {
    expect(formatCurrency(157500).replace(/ /g, ' ')).toBe('R$ 1.575,00');
  });
});

describe('formatDuration', () => {
  it('omite a hora abaixo de sessenta minutos', () => {
    expect(formatDuration(1387)).toBe('23:07');
  });

  it('inclui a hora acima de sessenta minutos', () => {
    expect(formatDuration(3671)).toBe('01:01:11');
  });
});

describe('cn', () => {
  it('mantem junto o tamanho e a cor do texto', () => {
    expect(cn('text-button', 'text-orbit-dark')).toBe('text-button text-orbit-dark');
  });
});
