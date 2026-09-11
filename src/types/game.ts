export type GameStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'ARCHIVED';

export type Platform = 'PC' | 'MAC' | 'LINUX' | 'ANDROID' | 'IOS' | 'WEB' | 'CONSOLE';

export type Genre =
  | 'Ação'
  | 'Aventura'
  | 'Corrida'
  | 'Estratégia'
  | 'Puzzle'
  | 'RPG'
  | 'Simulação'
  | 'Esporte'
  | 'Terror'
  | 'Casual';

export interface GameStats {
  activeTests: number;
  completedTests: number;
  totalPlayers: number;
  averageRating: number;
  bugsReported: number;
  pendingRewards: number;
  /** "Prêmio restante" do card de jogo — o que sobra da verba dos testes abertos. */
  remainingRewardCents: number;
  /** "Jogando agora" — simultâneos, diferente de `totalPlayers`, que é acumulado. */
  playingNow: number;
  /**
   * 0 a 1 — a barra azul no rodapé da capa, na tela de configuração de testes.
   * O Figma desenha a barra sem rótulo, então o valor vive como dado do jogo em
   * vez de ser derivado de uma fórmula inventada.
   */
  campaignProgress: number;
}

export interface Game {
  id: string;
  studioId: string;
  studioName: string;
  name: string;
  description: string;
  shortDescription: string;
  bannerUrl: string;
  thumbnailUrl: string;
  status: GameStatus;
  genres: Genre[];
  platforms: Platform[];
  buildVersion: string;
  minRewardCents: number;
  maxRewardCents: number;
  estimatedMinutes: number;
  stats: GameStats;
  /** Fim da janela de testes — vira "Termina em 27h 32m" na capa. `null` quando não há. */
  endsAt: string | null;
  /** Tag "Novo" na capa. */
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
  specs: GameSpecs;
}

export interface GameSpecs {
  minOs: string;
  minCpu: string;
  minRam: string;
  minGpu: string;
  diskSpace: string;
  requiresController: boolean;
  requiresMicrophone: boolean;
  requiresWebcam: boolean;
}

export interface CreateGamePayload {
  name: string;
  shortDescription: string;
  description: string;
  bannerUrl?: string;
  genres: Genre[];
  platforms: Platform[];
}
