import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * A sessão de jogo em andamento — do "Iniciar Jogo!" do tutorial ao
 * "Finalizar teste" da gameplay. Dá a duração que vai no envio da avaliação e
 * o segundo de cada evento (microfone, webcam, bug).
 *
 * Fica no `sessionStorage`: recarregar a janela não zera o cronômetro, mas
 * fechar o app sim — a próxima abertura começa uma sessão nova.
 */
interface SessaoState {
  testId: string | null;
  participationId: string | null;
  /** `Date.now()` do "Iniciar Jogo!". */
  inicio: number | null;
  /** `Date.now()` do "Finalizar teste"; `null` enquanto joga. */
  fim: number | null;

  iniciar: (testId: string, participationId: string, agora?: number) => void;
  encerrar: (agora?: number) => void;
  /** Segundos jogados até agora, ou até o fim, se a sessão já acabou. */
  segundos: (agora?: number) => number;
  limpar: () => void;
}

export const useSessaoStore = create<SessaoState>()(
  persist(
    (set, get) => ({
      testId: null,
      participationId: null,
      inicio: null,
      fim: null,

      // Voltar ao tutorial do mesmo teste e iniciar de novo continua a mesma sessão.
      iniciar: (testId, participationId, agora = Date.now()) => {
        const atual = get();
        if (atual.testId === testId && atual.inicio !== null && atual.fim === null) return;
        set({ testId, participationId, inicio: agora, fim: null });
      },

      encerrar: (agora = Date.now()) => {
        if (get().inicio !== null && get().fim === null) set({ fim: agora });
      },

      segundos: (agora = Date.now()) => {
        const { inicio, fim } = get();
        if (inicio === null) return 0;
        return Math.max(0, Math.round(((fim ?? agora) - inicio) / 1000));
      },

      limpar: () => set({ testId: null, participationId: null, inicio: null, fim: null }),
    }),
    {
      name: 'orbitplay:sessao-de-jogo',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ testId, participationId, inicio, fim }) => ({ testId, participationId, inicio, fim }),
    },
  ),
);
