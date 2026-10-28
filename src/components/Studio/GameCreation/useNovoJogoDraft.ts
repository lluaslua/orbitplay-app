import { useState } from 'react';
import { useStudioUser } from '@/stores/authStore';
import type { CreateGamePayload } from '@/types';
import type { PermissionKey, PermissionRow } from '@/utils/constants';

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
  platforms: string[];
  gameMode: string;
  engine: string;
  devStage: string;
  ageRating: string;
  languages: string[];
  /** Etapa 2 — data URLs já reduzidas; a API grava os arquivos no "Finalizar". */
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
  platforms: [],
  gameMode: '',
  engine: '',
  devStage: '',
  ageRating: '',
  languages: [],
  trailerUrl: '',
  permissions: [],
};

/**
 * A etapa 3 abre só com quem está criando, com as quatro permissões — a tabela
 * substitui a do jogo inteira, e quem cria não pode sair dela. Grupos e membros
 * entram pelo modal, com a equipe de verdade (`GET /studio/team`).
 */
export function useNovoJogoDraft() {
  const studio = useStudioUser();
  const [draft, setDraft] = useState<NovoJogoDraft>(() => ({
    ...DRAFT_INICIAL,
    permissions: studio
      ? [
          {
            id: studio.id,
            kind: 'member',
            name: studio.name,
            permissions: { editPermissions: true, editInfo: true, editTests: true, viewReports: true },
          },
        ]
      : [],
  }));

  function update(patch: Partial<NovoJogoDraft>) {
    setDraft((atual) => ({ ...atual, ...patch }));
  }

  return { draft, update };
}

/** O "Finalizar" manda o rascunho como a tela guarda: a API converte os rótulos em códigos. */
export function payloadDoRascunho(draft: NovoJogoDraft): CreateGamePayload {
  return {
    name: draft.name.trim(),
    tagline: draft.tagline.trim(),
    shortDescription: draft.shortDescription.trim(),
    description: draft.shortDescription.trim(),
    genres: draft.genres,
    subGenres: draft.subGenres,
    platforms: draft.platforms,
    gameModes: draft.gameMode ? [draft.gameMode] : [],
    engine: draft.engine || null,
    developmentStage: draft.devStage || null,
    ageRating: draft.ageRating || null,
    languages: draft.languages,
    trailerUrl: draft.trailerUrl.trim() || null,
    bannerUrl: draft.coverUrl,
    logoUrl: draft.logoUrl ?? null,
    thumbnailUrl: draft.iconUrl ?? null,
  };
}

/** As quatro colunas da tabela, na ordem do Figma, e a permissão que cada uma dá na API. */
const PERMISSAO_DA_COLUNA: Record<PermissionKey, string> = {
  editPermissions: 'MANAGE_ACCESS',
  editInfo: 'EDIT_INFO',
  editTests: 'MANAGE_TESTS',
  viewReports: 'VIEW_REPORTS',
};

export interface EntradaDeAcesso {
  userId?: string;
  groupId?: string;
  permissions: string[];
}

/** A tabela "Responsáveis e permissões" no formato do `PUT /games/:id/access`. */
export function acessoDoRascunho(linhas: PermissionRow[]): EntradaDeAcesso[] {
  return linhas.map((linha) => ({
    ...(linha.kind === 'group' ? { groupId: linha.id } : { userId: linha.id }),
    permissions: (Object.keys(PERMISSAO_DA_COLUNA) as PermissionKey[])
      .filter((coluna) => linha.permissions[coluna])
      .map((coluna) => PERMISSAO_DA_COLUNA[coluna]),
  }));
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
        draft.platforms.length > 0 &&
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
