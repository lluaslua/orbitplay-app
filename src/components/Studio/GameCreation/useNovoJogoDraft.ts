import { useState } from 'react';
import { NEW_GAME_DEFAULT_PERMISSIONS, type PermissionRow } from '@/utils/constants';

/**
 * Rascunho de "Novo jogo" — vive só em memória: sem tela de continuação
 * depois do fluxo, persistir em disco não tem consumidor.
 */
export interface NovoJogoDraft {
  name: string;
  tagline: string;
  shortDescription: string;
  genres: string[];
  subGenres: string[];
  platform: string;
  gameMode: string;
  engine: string;
  devStage: string;
  ageRating: string;
  language: string;
  /** Etapa 2 — data URLs (o MVP não tem upload real, igual ao resto do app). */
  coverUrl?: string;
  logoUrl?: string;
  iconUrl?: string;
  trailerUrl: string;
  /** Etapa 3 — responsáveis e permissões. */
  permissions: PermissionRow[];
}

const DRAFT_INICIAL: NovoJogoDraft = {
  name: '',
  tagline: '',
  shortDescription: '',
  genres: [],
  subGenres: [],
  platform: '',
  gameMode: '',
  engine: '',
  devStage: '',
  ageRating: '',
  language: '',
  trailerUrl: '',
  permissions: NEW_GAME_DEFAULT_PERMISSIONS,
};

export function useNovoJogoDraft() {
  const [draft, setDraft] = useState<NovoJogoDraft>(DRAFT_INICIAL);

  function update(patch: Partial<NovoJogoDraft>) {
    setDraft((atual) => ({ ...atual, ...patch }));
  }

  return { draft, update };
}

/**
 * Valida os campos marcados com `*` em cada etapa — só libera o "Próximo" /
 * "Finalizar" quando eles estão preenchidos.
 */
export function isNovoJogoStepValid(step: number, draft: NovoJogoDraft): boolean {
  switch (step) {
    case 1:
      return (
        draft.name.trim().length > 0 &&
        draft.tagline.trim().length > 0 &&
        draft.shortDescription.trim().length > 0 &&
        draft.genres.length > 0 &&
        draft.platform.trim().length > 0 &&
        draft.gameMode.trim().length > 0 &&
        draft.devStage.trim().length > 0 &&
        draft.ageRating.trim().length > 0
      );
    case 2:
      return !!draft.coverUrl && !!draft.logoUrl && !!draft.iconUrl;
    case 3:
      return true;
    default:
      return false;
  }
}
