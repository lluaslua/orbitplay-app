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
  /** Minha conta: "Notificações via E-mail". A API sempre manda; as contas do mock não têm. */
  emailNotifications?: boolean;
  /** Minha conta: "MFA por E-mail" — o login pede o código do e-mail. */
  mfaEnabled?: boolean;
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
  /** Minha conta: dados da pessoa ("Cargo / função", nascimento e país). */
  jobTitle?: string;
  birthDate?: string;
  location?: TestLocation;
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

/** Login de conta com "MFA por E-mail": a senha conferiu e o código foi para o e-mail. */
export interface MfaChallenge {
  mfaRequired: true;
  email: string;
}

/** `POST /auth/login` devolve a sessão, ou o desafio do MFA quando a conta o ligou. */
export type LoginResult = AuthSession | MfaChallenge;

/** "Verifique seu e-mail": o código que chegou. Acertou, devolve a `AuthSession`. */
export interface VerifyEmailPayload {
  email: string;
  code: string;
}

/** Segundo passo do login com MFA (`POST /auth/verify-login`). */
export interface VerifyLoginPayload extends VerifyEmailPayload {
  /** O "Lembrar login" do primeiro passo. */
  remember?: boolean;
}

/**
 * "Criar conta" (Figma: cartões "Criar conta" do estúdio e do jogador).
 * `POST /auth/register` não entra: devolve `RegisterResult`, e a sessão só sai
 * em `POST /auth/verify-email`, com o código de 6 dígitos do e-mail.
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
  /** "Li e aceito os Termos de Uso e a Política de Privacidade": sem `true` não há conta. */
  acceptTerms: boolean;
  /** "Quero receber novidades, conteúdos e atualizações da OrbitPlay." */
  marketingOptIn?: boolean;
}

/** Resposta do cadastro: a conta nasce pendente e o código vai para este e-mail. */
export interface RegisterResult {
  email: string;
}

/** Minha conta (`PATCH /me`). Nome e site do estúdio só com permissão MANAGE; site vazio apaga. */
export interface UpdateMePayload {
  name?: string;
  locale?: string;
  birthDate?: string;
  location?: TestLocation;
  emailNotifications?: boolean;
  mfaEnabled?: boolean;
  /** Só estúdio. */
  jobTitle?: string;
  organization?: string;
  website?: string;
}

/** "Alterar senha" logado (`POST /me/password`): devolve uma sessão nova e derruba as outras. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
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

