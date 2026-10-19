import type { ArchetypeId, PlayerTypeId, TestLocation } from './test';

/**
 * Os dois perfis do app. A API também tem OWNER e ADMIN (a administração da
 * plataforma), que não têm tela aqui: o login recusa essas contas.
 */
export type UserRole = 'STUDIO' | 'PLAYER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

/** Dentro da organização: VIEW lê, EDIT mexe em jogos, testes e builds, MANAGE também paga. */
export type StudioPermission = 'MANAGE' | 'EDIT' | 'VIEW';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  /** Idioma da interface — o seletor "PT" da navbar. */
  locale?: string;
  createdAt: string;
}

export interface StudioProfile {
  /** A organização — é para ela que `Game.studioId` aponta. Não é o id da conta. */
  studioId: string;
  permission: StudioPermission;
  organization: string;
  cnpj?: string;
  website?: string;
  totalGames: number;
  balance: number;
}

export interface PlayerProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  balance: number;
  pendingBalance: number;
  completedSessions: number;
  /** "Qualidade de Feedback" no cabeçalho da home — escala de 0 a 10. */
  rating: number;
  rankPosition: number;
  badges: string[];
  /** Tag ao lado do nome, ex.: "ELITE". */
  tier: string;
  /** "Conquistas" — total acumulado, não só as desbloqueadas nesta lista. */
  achievementsCount: number;
  /** "Horas jogadas". */
  hoursPlayed: number;
  /** Elegibilidade para o público dos testes. */
  location?: TestLocation;
  playerType?: PlayerTypeId;
  archetype?: ArchetypeId;
  birthDate?: string;
  /** Já viu o tutorial do teste: o modal final mostra "Rever tutorial" (Figma `224:7540`). */
  tutorialSeen?: boolean;
}

export interface StudioUser extends BaseUser {
  role: 'STUDIO';
  studio: StudioProfile;
}

export interface PlayerUser extends BaseUser {
  role: 'PLAYER';
  player: PlayerProfile;
}

export type AuthUser = StudioUser | PlayerUser;

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
  remember?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

/**
 * "Criar uma conta grátis" no login — a tela de cadastro (provisória, sem frame
 * no Figma). `POST /auth/register` devolve a mesma sessão do login.
 */
export interface RegisterPayload {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  /** Estúdio: nome da organização (obrigatório), CNPJ e site. */
  organization?: string;
  cnpj?: string;
  website?: string;
  /** Tester: dados de elegibilidade para o público dos testes. */
  birthDate?: string;
  location?: TestLocation;
  playerType?: PlayerTypeId;
  archetype?: ArchetypeId;
}

/** Segundo passo da recuperação e do convite: o token chega pelo link do e-mail. */
export interface ResetPasswordPayload {
  token: string;
  password: string;
}

/** Grupo do estúdio na tabela "Responsáveis e permissões" de Novo jogo. */
export interface StudioTeamGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface StudioTeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface StudioTeam {
  groups: StudioTeamGroup[];
  members: StudioTeamMember[];
}

