/**
 * Banco em memoria do MVP.
 *
 * Toda a rotina de dados do app passa por aqui. Quando o backend existir,
 * este arquivo e o adapter somem e o axios passa a falar com a API de verdade -
 * os contratos em `src/types` ja sao os mesmos.
 */
import gamesFixture from './fixtures/games.json';
import testsFixture from './fixtures/tests.json';
import playersFixture from './fixtures/players.json';
import reportsFixture from './fixtures/reports.json';
import sessionsFixture from './fixtures/sessions.json';
import communityFixture from './fixtures/community.json';
import acessosFixture from './fixtures/acessos.json';

import type {
  AccessGroup,
  AccessGroupPatch,
  AccessOverview,
  AccessUser,
  AccessUserPatch,
  Achievement,
  AuthUser,
  ChatAuthor,
  ChatMessage,
  ChatRole,
  CommunityChannel,
  Game,
  Participation,
  PlayerEarningPoint,
  Playtest,
  Session,
  PlayerDashboard,
  PlayerGameTest,
  GameAchievement,
  GameCommunity,
  PlayerGameHistory,
  PlayerSessionReview,
  PluginReport,
  SessionOutcome,
  SessionDetail,
  StudioDashboard,
  StudioTeam,
  TestReport,
  UserRole,
} from '@/types';
import { uid } from '@/utils/helpers';

interface Account {
  password: string;
  user: AuthUser;
}

/** Usuário do gerenciamento de acessos: os grupos dele são derivados dos `memberIds` de cada grupo. */
type UsuarioAcesso = Omit<AccessUser, 'groups'>;

interface GrupoAcesso {
  id: string;
  name: string;
  memberIds: string[];
}

/** Clone profundo na inicializacao: os fixtures importados nunca sao mutados. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Reancora o fim da janela de testes na hora em que o app abriu.
 *
 * A capa do jogo mostra uma contagem regressiva ("Termina em 27h 32m"). Com uma
 * data fixa no fixture, ela venceria e o card passaria a exibir um prazo
 * negativo depois de um dia — num MVP mockado, sem backend para renovar nada.
 */
function reancorarPrazos(games: Game[]): Game[] {
  const VINTE_SETE_H_TRINTA_DOIS = (27 * 60 + 32) * 60 * 1000;

  return games.map((game) =>
    game.endsAt
      ? { ...game, endsAt: new Date(Date.now() + VINTE_SETE_H_TRINTA_DOIS).toISOString() }
      : game,
  );
}

/**
 * Mesmo problema de `reancorarPrazos`, agora nas tabelas de teste: o desenho
 * mostra "27h 32m 54s" e um prazo fixo no fixture já nasceria vencido.
 */
function reancorarTestes<T extends { expiresAt: string | null }>(linhas: T[]): T[] {
  const VINTE_SETE_H_TRINTA_DOIS = (27 * 60 + 32) * 60 * 1000;

  return linhas.map((linha) =>
    linha.expiresAt
      ? { ...linha, expiresAt: new Date(Date.now() + VINTE_SETE_H_TRINTA_DOIS).toISOString() }
      : linha,
  );
}

export const db = {
  games: reancorarPrazos(clone(gamesFixture) as unknown as Game[]),
  tests: clone(testsFixture) as unknown as Playtest[],
  sessions: clone(sessionsFixture) as unknown as Session[],
  accounts: clone(playersFixture.accounts) as unknown as Account[],
  achievements: clone(playersFixture.achievements) as unknown as Achievement[],
  participations: clone(playersFixture.participations) as unknown as Participation[],
  earnings: clone(playersFixture.earnings) as unknown as PlayerEarningPoint[],
  testReport: clone(reportsFixture.testReport) as unknown as TestReport,
  sessionDetail: clone(reportsFixture.sessionDetail) as unknown as SessionDetail,
  pluginReport: clone(reportsFixture.pluginReport) as unknown as PluginReport,
  studioDashboard: clone(reportsFixture.studioDashboard) as unknown as StudioDashboard,
  playerDashboard: clone(playersFixture.playerDashboard) as unknown as PlayerDashboard,
  gameTests: Object.fromEntries(
    Object.entries(clone(playersFixture.gameTests) as unknown as Record<string, PlayerGameTest[]>).map(
      ([jogo, linhas]) => [jogo, reancorarTestes(linhas)],
    ),
  ) as Record<string, PlayerGameTest[]>,
  sessionReview: clone(playersFixture.sessionReview) as unknown as PlayerSessionReview,
  communityChannels: clone(communityFixture.channels) as CommunityChannel[],
  communityMembers: clone(communityFixture.members) as unknown as CommunityMember[],
  /** Mensagens por jogo. Jogo sem entrada ainda não recebeu nenhuma. */
  communityMessages: Object.fromEntries(
    Object.entries(clone(communityFixture.messages)).map(([jogo, mensagens]) => [
      jogo,
      mensagens.map((mensagem) => ({ ...mensagem, reactedBy: [] as string[] })),
    ]),
  ) as Record<string, StoredMessage[]>,
  gameAchievements: clone(playersFixture.gameAchievements) as unknown as GameAchievement[],
  gameMyTests: reancorarTestes(
    clone(playersFixture.gameMyTests) as unknown as PlayerGameHistory[],
  ),
  sessionOutcome: clone(playersFixture.sessionOutcome) as unknown as SessionOutcome,
  acessos: {
    users: clone(acessosFixture.users) as unknown as UsuarioAcesso[],
    groups: clone(acessosFixture.groups) as GrupoAcesso[],
  },
};

/**
 * Testes de um jogo na visão do jogador (Figma `199:1291`).
 *
 * Só o Horizon Chase 2 tem a tabela desenhada no arquivo; os outros jogos caem
 * numa lista derivada dos próprios testes, para a tela não abrir vazia.
 */
export function listPlayerGameTests(gameId: string): PlayerGameTest[] {
  const desenhados = db.gameTests[gameId];
  if (desenhados) return desenhados;

  return listTests(gameId).map((teste) => ({
    id: teste.id,
    name: teste.title,
    kind: teste.kind,
    kindTone: 'topaz' as const,
    expiresAt: teste.expiresAt,
    estimatedMinutes: teste.estimatedMinutes,
    slotsTaken: teste.currentParticipants,
    slotsTotal: teste.budget.slots,
    progress: 0,
    rewardCents: teste.budget.rewardPerSessionCents,
    action: 'START' as const,
  }));
}

// ---------------------------------------------------------------------------
// Autenticacao
// ---------------------------------------------------------------------------

export function findAccount(email: string, password: string): Account | undefined {
  return db.accounts.find(
    (account) =>
      account.user.email.toLowerCase() === email.trim().toLowerCase() &&
      account.password === password,
  );
}

export function findUserById(id: string): AuthUser | undefined {
  return db.accounts.find((account) => account.user.id === id)?.user;
}

/** Token opaco no formato do JWT so para o app ter algo real para guardar. */
export function issueToken(userId: string, role: UserRole): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }),
  );
  return `${header}.${payload}.mock-signature`;
}

// ---------------------------------------------------------------------------
// Jogos
// ---------------------------------------------------------------------------

export function listGames(studioId?: string): Game[] {
  return studioId ? db.games.filter((game) => game.studioId === studioId) : db.games;
}

export function getGame(id: string): Game | undefined {
  return db.games.find((game) => game.id === id);
}

export function createGame(input: Partial<Game>): Game {
  const now = new Date().toISOString();
  const game: Game = {
    id: uid('game'),
    studioId: 'studio-001',
    studioName: 'Blackstar games',
    name: input.name ?? 'Novo jogo',
    description: input.description ?? '',
    shortDescription: input.shortDescription ?? '',
    bannerUrl: input.bannerUrl ?? '/assets/backgrounds/default-banner.svg',
    thumbnailUrl: input.thumbnailUrl ?? input.bannerUrl ?? '/assets/images/default-game.svg',
    status: 'DRAFT',
    genres: input.genres ?? [],
    platforms: input.platforms ?? ['PC'],
    buildVersion: '0.1.0-draft',
    minRewardCents: 0,
    maxRewardCents: 0,
    estimatedMinutes: 0,
    stats: {
      activeTests: 0,
      completedTests: 0,
      totalPlayers: 0,
      averageRating: 0,
      bugsReported: 0,
      pendingRewards: 0,
      remainingRewardCents: 0,
      playingNow: 0,
      campaignProgress: 0,
    },
    endsAt: null,
    isNew: true,
    createdAt: now,
    updatedAt: now,
    specs: input.specs ?? {
      minOs: 'Windows 10 64-bit',
      minCpu: 'A definir',
      minRam: '4 GB',
      minGpu: 'A definir',
      diskSpace: 'A definir',
      requiresController: false,
      requiresMicrophone: false,
      requiresWebcam: false,
    },
  };
  db.games.unshift(game);
  return game;
}

// ---------------------------------------------------------------------------
// Equipe do estúdio — grupos e membros da tela "Responsáveis e permissões"
// ---------------------------------------------------------------------------

const studioTeam: StudioTeam = {
  groups: [
    { id: 'grp-diretores', name: 'Diretores', memberCount: 2 },
    { id: 'grp-qa', name: 'QA', memberCount: 25 },
    { id: 'grp-analitics', name: 'Analitics', memberCount: 12 },
  ],
  members: [
    { id: 'mem-hideo', name: 'Hideo Kojima' },
    { id: 'mem-guilherme', name: 'Guilherme Hoffmann' },
  ],
};

export function listStudioTeam(): StudioTeam {
  return studioTeam;
}

// ---------------------------------------------------------------------------
// Gerenciamento de acessos — usuários e grupos do estúdio
// ---------------------------------------------------------------------------

function usuarioComGrupos(usuario: UsuarioAcesso): AccessUser {
  return {
    ...usuario,
    groups: db.acessos.groups
      .filter((grupo) => grupo.memberIds.includes(usuario.id))
      .map((grupo) => grupo.name),
  };
}

/** Grupo sem participante fica INACTIVE — é o que a tabela mostra para o "Rh". */
function grupoComMembros(grupo: GrupoAcesso): AccessGroup {
  const members = grupo.memberIds
    .map((id) => db.acessos.users.find((usuario) => usuario.id === id))
    .filter((usuario): usuario is UsuarioAcesso => !!usuario)
    .map(({ id, name, avatarUrl }) => ({ id, name, avatarUrl }));

  return { id: grupo.id, name: grupo.name, status: members.length ? 'ACTIVE' : 'INACTIVE', members };
}

export function listarAcessos(): AccessOverview {
  const { users, groups } = db.acessos;

  return {
    summary: {
      activeUsers: users.filter((usuario) => usuario.status === 'ACTIVE').length,
      groups: groups.length,
      pendingInvites: users.filter((usuario) => usuario.status === 'PENDING').length,
      admins: users.filter((usuario) => usuario.admin).length,
    },
    users: users.map(usuarioComGrupos),
    groups: groups.map(grupoComMembros),
  };
}

export function buscarUsuarioAcesso(id: string): UsuarioAcesso | undefined {
  return db.acessos.users.find((usuario) => usuario.id === id);
}

/** Convite: entra como PENDING até a pessoa criar a conta. Devolve null se o e-mail já está no estúdio. */
export function convidarUsuario(email: string): AccessUser | null {
  const normalizado = email.trim().toLowerCase();
  if (db.acessos.users.some((usuario) => usuario.email.toLowerCase() === normalizado)) return null;

  const usuario: UsuarioAcesso = {
    id: uid('usr'),
    name: normalizado.split('@')[0],
    email: normalizado,
    status: 'PENDING',
    admin: false,
    lastAccessAt: null,
    permissions: { manageUsers: false, deleteUsers: false },
  };
  db.acessos.users.push(usuario);
  return usuarioComGrupos(usuario);
}

export function atualizarUsuario(id: string, patch: AccessUserPatch): AccessUser | null {
  const usuario = buscarUsuarioAcesso(id);
  if (!usuario) return null;

  if (patch.status) usuario.status = patch.status;
  if (patch.permissions) usuario.permissions = { ...usuario.permissions, ...patch.permissions };
  return usuarioComGrupos(usuario);
}

/** Tira o usuário do estúdio e de todos os grupos em que estava. */
export function excluirUsuario(id: string): boolean {
  const indice = db.acessos.users.findIndex((usuario) => usuario.id === id);
  if (indice < 0) return false;

  db.acessos.users.splice(indice, 1);
  db.acessos.groups.forEach((grupo) => {
    grupo.memberIds = grupo.memberIds.filter((membro) => membro !== id);
  });
  return true;
}

export function criarGrupo(name: string, memberIds: string[]): AccessGroup {
  const grupo: GrupoAcesso = { id: uid('grp'), name: name.trim(), memberIds: [...new Set(memberIds)] };
  db.acessos.groups.push(grupo);
  return grupoComMembros(grupo);
}

export function atualizarGrupo(id: string, patch: AccessGroupPatch): AccessGroup | null {
  const grupo = db.acessos.groups.find((item) => item.id === id);
  if (!grupo) return null;

  if (patch.name !== undefined) grupo.name = patch.name.trim();
  if (patch.memberIds) grupo.memberIds = [...new Set(patch.memberIds)];
  return grupoComMembros(grupo);
}

export function excluirGrupo(id: string): boolean {
  const indice = db.acessos.groups.findIndex((grupo) => grupo.id === id);
  if (indice < 0) return false;

  db.acessos.groups.splice(indice, 1);
  return true;
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

export function listTests(gameId?: string): Playtest[] {
  return gameId ? db.tests.filter((test) => test.gameId === gameId) : db.tests;
}

export function getTest(id: string): Playtest | undefined {
  return db.tests.find((test) => test.id === id);
}

export function createTest(input: Partial<Playtest>): Playtest {
  const game = getGame(input.gameId ?? '');
  const now = new Date();
  const durationDays = input.budget?.durationDays ?? 14;

  const test: Playtest = {
    id: uid('test'),
    gameId: input.gameId ?? '',
    gameName: game?.name ?? 'Jogo',
    gameThumbnailUrl: game?.thumbnailUrl ?? '/assets/images/default-game.svg',
    title: input.title ?? 'Novo teste',
    model: input.model ?? 'FREE_EXPLORATION',
    status: 'ACTIVE',
    kind: input.kind ?? 'DEMO ABERTA',
    plugin: input.plugin ?? false,
    endedAt: null,
    instructions: input.instructions ?? '',
    requiresRecording: input.requiresRecording ?? true,
    requiresMicrophone: input.requiresMicrophone ?? false,
    requiresWebcam: input.requiresWebcam ?? false,
    questions: input.questions ?? [],
    audience: input.audience ?? {
      locations: ['BRASIL'],
      playerType: 'CASUAL',
      archetype: 'ALL',
      minAge: 16,
      maxAge: 45,
    },
    budget: input.budget ?? {
      slots: 20,
      untilDisabled: false,
      basePriceCents: 59,
      audienceCents: 0,
      boostCents: 0,
      pricePerTestCents: 59,
      totalCents: 1180,
      rewardPerSessionCents: 250,
      durationDays: 14,
    },
    currentParticipants: 0,
    estimatedMinutes: input.estimatedMinutes ?? 25,
    buildFileName: input.buildFileName ?? 'build.zip',
    buildSizeMb: input.buildSizeMb ?? 0,
    createdAt: now.toISOString(),
    startsAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + durationDays * 86_400_000).toISOString(),
  };

  db.tests.unshift(test);

  // O teste novo aparece imediatamente nas metricas do jogo.
  if (game) {
    game.stats.activeTests += 1;
    game.updatedAt = now.toISOString();
    if (game.status === 'DRAFT') game.status = 'ACTIVE';
  }

  // Relatorio nasce vazio ate a primeira sessao chegar.
  return test;
}

// ---------------------------------------------------------------------------
// Sessoes e relatorios
// ---------------------------------------------------------------------------

export function listSessions(testId?: string): Session[] {
  return testId ? db.sessions.filter((session) => session.testId === testId) : db.sessions;
}

export function getSession(id: string): Session | undefined {
  return db.sessions.find((session) => session.id === id);
}

/**
 * Relatório de um teste (Figma `326:6452`).
 *
 * O conteúdo é o do arquivo, então vem pronto do fixture; só o título e o jogo
 * acompanham o teste que a rota pediu, para o relatório de outro teste não
 * abrir com o nome errado.
 */
export function buildReport(testId: string): TestReport | undefined {
  const test = getTest(testId);
  if (!test) return undefined;

  return {
    ...db.testReport,
    testId,
    testTitle: test.title,
    gameId: test.gameId,
    kind: test.kind,
  };
}

/**
 * Relatório do plug-in de telemetria (Figma `427:3376`).
 *
 * Mesma regra do relatório do teste: o conteúdo é o do arquivo e só o teste e o
 * jogo acompanham a rota.
 */
export function buildPluginReport(testId: string): PluginReport | undefined {
  const test = getTest(testId);
  if (!test) return undefined;

  return { ...db.pluginReport, testId, testName: test.title, gameId: test.gameId, testKind: test.kind };
}

/**
 * A tabela, o benchmark e os números vêm prontos do fixture, porque são o
 * conteúdo exato do Figma.
 *
 * A única exceção é `gamesTested`, derivado da lista de jogos — cadastrar um
 * jogo mexe no painel de verdade. `overview.activeTests` ainda não é derivado
 * de `db.tests` porque o fixture de testes é o conteúdo antigo e devolveria 3
 * onde o desenho pede 5; quando ele for refeito, passa a ser calculado aqui.
 */
export function getStudioDashboard(): StudioDashboard {
  return {
    ...db.studioDashboard,
    highlights: {
      ...db.studioDashboard.highlights,
      gamesTested: db.games.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Jogador
// ---------------------------------------------------------------------------

export function getPlayerProfile() {
  const account = db.accounts.find((a) => a.user.role === 'PLAYER');
  if (!account || account.user.role !== 'PLAYER') {
    throw new Error('Conta de jogador nao encontrada no mock');
  }
  return account.user;
}

export function listParticipations(): Participation[] {
  return db.participations;
}

export function getParticipationByTest(testId: string): Participation | undefined {
  return db.participations.find((p) => p.testId === testId);
}

export function upsertParticipation(testId: string, patch: Partial<Participation>): Participation {
  const existing = getParticipationByTest(testId);
  if (existing) {
    Object.assign(existing, patch);
    return existing;
  }

  const test = getTest(testId);
  const participation: Participation = {
    id: uid('part'),
    testId,
    gameId: test?.gameId ?? '',
    gameName: test?.gameName ?? '',
    thumbnailUrl: test?.gameThumbnailUrl ?? '/assets/images/default-game.svg',
    status: 'IN_PROGRESS',
    rewardCents: test?.budget.rewardPerSessionCents ?? 0,
    rewardStatus: 'PENDING',
    xpEarned: 0,
    startedAt: new Date().toISOString(),
    ...patch,
  };
  db.participations.unshift(participation);
  return participation;
}

export function listAchievements(): Achievement[] {
  return db.achievements;
}

// ---------------------------------------------------------------------------
// Comunidade
// ---------------------------------------------------------------------------

/**
 * Como uma conta aparece no chat.
 *
 * As quatro pessoas do Figma estão no fixture — inclusive o Gusmão, que é quem
 * fala pela conta do estúdio (Blackstar games).
 */
interface CommunityMember {
  userId: string;
  name: string;
  role: ChatRole;
  avatarUrl: string;
  online: boolean;
}

/** Mensagem como o "banco" guarda: o autor só pelo id; o resto sai na leitura. */
interface StoredMessage {
  id: string;
  channelId: string;
  authorId: string;
  text: string;
  sentAt: string;
  /** Ids de quem reagiu. */
  reactedBy: string[];
}

/**
 * O chat abre quando o jogo tem build para testar — ou seja, algum teste.
 *
 * `listPlayerGameTests` cobre os dois casos do mock: os testes criados pelo
 * estúdio e a tabela desenhada do Horizon Chase 2, que não passa por `db.tests`.
 */
export function communityIsOpen(gameId: string): boolean {
  return listPlayerGameTests(gameId).length > 0;
}

/**
 * O jogador já participou de algum teste do jogo?
 *
 * Vale a participação registrada — iniciar um teste cria uma — e, no Horizon
 * Chase 2, a própria tabela desenhada, que mostra testes em andamento, baixando
 * e em análise: coisa que só existe para quem começou. O mock tem um jogador
 * só, então as participações são todas dele.
 */
function playerTestedGame(gameId: string): boolean {
  const registrada = db.participations.some(
    (participacao) => (getTest(participacao.testId)?.gameId ?? participacao.gameId) === gameId,
  );
  const desenhada = (db.gameTests[gameId] ?? []).some((teste) =>
    ['CONTINUE', 'DOWNLOADING', 'REVIEW'].includes(teste.action),
  );

  return registrada || desenhada;
}

/** Quem entra no chat: o estúdio dono do jogo e os testers que já jogaram. */
export function canAccessCommunity(user: AuthUser, gameId: string): boolean {
  if (user.role === 'STUDIO') return getGame(gameId)?.studioId === user.id;
  return playerTestedGame(gameId);
}

/** Uma conta fora do fixture entra com o nome e a foto do cadastro. */
function memberOf(userId: string): CommunityMember {
  const conhecido = db.communityMembers.find((membro) => membro.userId === userId);
  if (conhecido) return conhecido;

  const user = findUserById(userId);
  const qa = user?.role === 'PLAYER' && user.player.tier === 'QA';

  return {
    userId,
    name: user?.name ?? 'Usuário',
    role: user?.role === 'STUDIO' ? 'DEV' : qa ? 'QA' : 'ELITE',
    avatarUrl: user?.avatarUrl ?? '',
    online: false,
  };
}

function authorOf(userId: string): ChatAuthor {
  const { name, role, avatarUrl } = memberOf(userId);
  return { id: userId, name, role, avatarUrl };
}

/** A mensagem do ponto de vista de quem está vendo: `own` e `reacted` são dele. */
function toChatMessage(guardada: StoredMessage, viewerId: string): ChatMessage {
  return {
    id: guardada.id,
    channelId: guardada.channelId,
    author: authorOf(guardada.authorId),
    // Quem está vendo está com o app aberto, então está online.
    online: memberOf(guardada.authorId).online || guardada.authorId === viewerId,
    text: guardada.text,
    sentAt: guardada.sentAt,
    own: guardada.authorId === viewerId,
    reacted: guardada.reactedBy.includes(viewerId),
  };
}

function messagesOf(gameId: string): StoredMessage[] {
  if (!db.communityMessages[gameId]) db.communityMessages[gameId] = [];
  return db.communityMessages[gameId];
}

export function findChannel(channelId: string): CommunityChannel | undefined {
  return db.communityChannels.find((canal) => canal.id === channelId);
}

export function getCommunity(gameId: string, viewerId: string): GameCommunity {
  return { gameId, channels: db.communityChannels, me: authorOf(viewerId) };
}

export function listChannelMessages(
  gameId: string,
  channelId: string,
  viewerId: string,
): ChatMessage[] {
  return messagesOf(gameId)
    .filter((mensagem) => mensagem.channelId === channelId)
    .map((mensagem) => toChatMessage(mensagem, viewerId));
}

export function postChannelMessage(
  gameId: string,
  channelId: string,
  authorId: string,
  text: string,
): ChatMessage {
  const guardada: StoredMessage = {
    id: uid('msg'),
    channelId,
    authorId,
    text,
    sentAt: new Date().toISOString(),
    reactedBy: [],
  };
  messagesOf(gameId).push(guardada);
  return toChatMessage(guardada, authorId);
}

/** Liga ou desliga a reação de quem pediu. `undefined` se a mensagem não é deste jogo. */
export function toggleReaction(
  gameId: string,
  messageId: string,
  userId: string,
): ChatMessage | undefined {
  const guardada = messagesOf(gameId).find((mensagem) => mensagem.id === messageId);
  if (!guardada) return undefined;

  guardada.reactedBy = guardada.reactedBy.includes(userId)
    ? guardada.reactedBy.filter((id) => id !== userId)
    : [...guardada.reactedBy, userId];

  return toChatMessage(guardada, userId);
}

