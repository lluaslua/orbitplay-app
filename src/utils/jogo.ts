import type { PlayStatus } from '@/types';
import { formatDuration } from '@/utils/helpers';

/**
 * Como foi o jogo, na avaliação (Telas 17 e 18). Quem classifica é a API, pelo
 * tempo ativo que ela somou; aqui fica só o que a tela faz com isso.
 */

/** Abriu e fechou (ou nem abriu): a avaliação espera o jogador jogar. Teste sem build não tem jogo. */
export function avaliacaoBloqueada(jogo: PlayStatus | null | undefined): boolean {
  return jogo?.outcome === 'NOT_OPENED' || jogo?.outcome === 'QUICK_EXIT';
}

/** Para cima: jogar 1min30 não cumpre um mínimo de "2 min". */
export function minutos(segundos: number): string {
  return `${Math.ceil(segundos / 60)} min`;
}

/** O aviso do topo da avaliação, ou `null` quando não há o que dizer. */
export function avisoDoJogo(jogo: PlayStatus | null | undefined): { titulo: string; texto: string } | null {
  switch (jogo?.outcome) {
    case 'NOT_OPENED':
      return {
        titulo: 'Você ainda não jogou',
        texto: 'A avaliação abre depois que você jogar a build pelo app OrbitPlay.',
      };
    case 'QUICK_EXIT':
      return {
        titulo: `Você jogou só ${formatDuration(jogo.activeSeconds)}`,
        texto: `Para avaliar, jogue pelo menos ${minutos(jogo.minSeconds)}. O teste foi pensado para cerca de ${minutos(jogo.targetSeconds)} de jogo.`,
      };
    case 'CRASHED':
      return {
        titulo: 'O jogo fechou com erro',
        texto: 'O estúdio já recebeu o travamento. Conte na avaliação o que aconteceu antes de o jogo fechar.',
      };
    case 'PARTIAL':
      return {
        titulo: `Você jogou ${formatDuration(jogo.activeSeconds)} de cerca de ${minutos(jogo.targetSeconds)}`,
        texto: 'Você já pode avaliar, mas o bônus de feedback completo só vale jogando o tempo do teste.',
      };
    default:
      return null;
  }
}
