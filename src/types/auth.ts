export type UserRole = 'STUDIO' | 'PLAYER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface StudioProfile {
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

