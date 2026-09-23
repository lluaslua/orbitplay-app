import { useState } from 'react';
import { NEW_GAME_DEFAULT_PERMISSIONS, type PermissionRow } from '@/utils/constants';

/**
 * Rascunho de "Novo jogo" — só a etapa 1 (Informações) é funcional por
 * enquanto; Mídias e Permissões ainda não têm design. Vive só em memória:
 * sem tela de continuação depois dela, persistir em disco não tem consumidor.
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
