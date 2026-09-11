import { STORAGE_KEYS } from '@/utils/constants';

/*
 * O store de UI que ficava aqui guardava busca e filtro de status da tela
 * "Meus jogos". O Figma não desenha nenhum dos dois, então a tela foi refeita
 * sem eles e o store deixou de ter consumidor.
 */

/**
 * Upload de imagem no MVP: o arquivo vira data URL e fica no localStorage.
 * Quando houver backend, isto vira um POST multipart e some daqui.
 */
export const gameImageStorage = {
  save(gameId: string, dataUrl: string) {
    const all = gameImageStorage.readAll();
    all[gameId] = dataUrl;
    try {
      localStorage.setItem(STORAGE_KEYS.gameImages, JSON.stringify(all));
    } catch {
      // Quota estourada: a imagem simplesmente nao persiste entre sessoes.
      console.warn('[OrbitPlay] Nao foi possivel guardar a imagem do jogo (quota do localStorage).');
    }
  },

  get(gameId: string): string | null {
    return gameImageStorage.readAll()[gameId] ?? null;
  },

  readAll(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.gameImages) ?? '{}');
    } catch {
      return {};
    }
  },
};
