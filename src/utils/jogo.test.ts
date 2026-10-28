import { describe, expect, it } from 'vitest';
import type { PlayOutcome, PlayStatus } from '@/types';
import { avaliacaoBloqueada, avisoDoJogo, minutos } from './jogo';

const jogo = (outcome: PlayOutcome, activeSeconds = 40): PlayStatus => ({
  outcome,
  launches: outcome === 'NOT_OPENED' ? 0 : 1,
  activeSeconds,
  minSeconds: 120,
  targetSeconds: 900,
  playing: false,
  lastExitCode: outcome === 'CRASHED' ? -1073741819 : 0,
});

describe('avaliacaoBloqueada', () => {
  it('bloqueia quem não abriu o jogo', () => {
    expect(avaliacaoBloqueada(jogo('NOT_OPENED', 0))).toBe(true);
  });

  it('bloqueia quem abriu e fechou logo', () => {
    expect(avaliacaoBloqueada(jogo('QUICK_EXIT'))).toBe(true);
  });

  it('libera o travamento, o jogo parcial e o completo', () => {
    expect(avaliacaoBloqueada(jogo('CRASHED'))).toBe(false);
    expect(avaliacaoBloqueada(jogo('PARTIAL', 300))).toBe(false);
    expect(avaliacaoBloqueada(jogo('COMPLETE', 900))).toBe(false);
  });

  it('libera o teste sem build', () => {
    expect(avaliacaoBloqueada(null)).toBe(false);
    expect(avaliacaoBloqueada(undefined)).toBe(false);
  });
});

describe('minutos', () => {
  it('arredonda para cima', () => {
    expect(minutos(90)).toBe('2 min');
    expect(minutos(120)).toBe('2 min');
  });
});

describe('avisoDoJogo', () => {
  it('diz quanto jogou e quanto falta na saída rápida', () => {
    expect(avisoDoJogo(jogo('QUICK_EXIT'))).toEqual({
      titulo: 'Você jogou só 00:40',
      texto: 'Para avaliar, jogue pelo menos 2 min. O teste foi pensado para cerca de 15 min de jogo.',
    });
  });

  it('não avisa nada no jogo completo nem no teste sem build', () => {
    expect(avisoDoJogo(jogo('COMPLETE', 900))).toBeNull();
    expect(avisoDoJogo(null)).toBeNull();
  });
});
