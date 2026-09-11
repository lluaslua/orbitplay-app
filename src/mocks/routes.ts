/**
 * Tabela de rotas mockadas - fonte unica de verdade.
 *
 * Ela e consumida por dois consumidores diferentes:
 *   - `handlers.ts` -> MSW (service worker, quando o app roda no browser)
 *   - `adapter.ts`  -> adapter do axios (funciona tambem no Electron, em file://)
 *
 * Os caminhos aqui sao relativos a VITE_API_URL.
 */
import type {
  ApiError,
  AvailableTest,
  ParticipationStatus,
  PlayerDashboard,
  SessionResult,
  SessionSubmission,
} from '@/types';
import { TEST_MODEL_LABELS } from '@/utils/constants';
import { clamp, uid } from '@/utils/helpers';
import {
  buildPluginReport,
  buildReport,
  createGame,
  createTest,
  db,
  findAccount,
  findUserById,
  getGame,
  getParticipationByTest,
  getPlayerProfile,
  getSession,
  getStudioDashboard,
  listPlayerGameTests,
  getTest,
  issueToken,
  listAchievements,
  listGames,
  listParticipations,
  listSessions,
  listTests,
  upsertParticipation,
} from './db';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MockContext {
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
  headers: Record<string, string>;
}

export interface MockResult {
  status: number;
  data: unknown;
}

export interface MockRoute {
  method: HttpMethod;
  /** Suporta segmentos dinamicos no formato `:nome`. */
  path: string;
  resolve: (ctx: MockContext) => MockResult;
}

const ok = (data: unknown): MockResult => ({ status: 200, data });
const created = (data: unknown): MockResult => ({ status: 201, data });
const fail = (status: number, error: ApiError): MockResult => ({ status, data: error });

/** Deriva o status do card do catalogo a partir da participacao e das vagas. */
function catalogStatus(testId: string, slotsTaken: number, slotsTotal: number): ParticipationStatus {
  const participation = getParticipationByTest(testId);
  if (participation) {
    if (participation.status === 'COMPLETED') return 'COMPLETED';
    if (participation.status === 'PENDING_REVIEW') return 'PENDING_REVIEW';
    if (participation.status === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (participation.status === 'REJECTED') return 'REJECTED';
  }
  if (slotsTaken >= slotsTotal) return 'UNAVAILABLE';
  return 'AVAILABLE';
}

function toAvailableTest(testId: string): AvailableTest | null {
  const test = getTest(testId);
  if (!test) return null;
  const game = getGame(test.gameId);

  return {
    id: test.id,
    testId: test.id,
    gameId: test.gameId,
    gameName: test.gameName,
    studioName: game?.studioName ?? 'Estúdio',
    thumbnailUrl: test.gameThumbnailUrl,
    genres: game?.genres ?? [],
    modelLabel: TEST_MODEL_LABELS[test.model],
    estimatedMinutes: test.estimatedMinutes,
    rewardCents: test.budget.rewardPerSessionCents,
    slotsTotal: test.budget.slots,
    slotsTaken: test.currentParticipants,
    expiresAt: test.expiresAt,
    status:
      test.status === 'FINISHED' || test.status === 'PAUSED' || test.status === 'DRAFT'
        ? 'UNAVAILABLE'
        : catalogStatus(test.id, test.currentParticipants, test.budget.slots),
    requiresRecording: test.requiresRecording,
  };
}

function catalog(): AvailableTest[] {
  return db.tests
    .map((test) => toAvailableTest(test.id))
    .filter((item): item is AvailableTest => item !== null);
}

/** Qualidade do feedback: texto longo e bugs reportados puxam a nota para cima. */
function scoreFeedback(submission: SessionSubmission): number {
  const textLength = Object.values(submission.answers)
    .filter((value): value is string => typeof value === 'string')
    .reduce((sum, value) => sum + value.trim().length, 0);

  const answered = Object.values(submission.answers).filter(
    (value) => value !== '' && value !== undefined && value !== null,
  ).length;

  const base = 2.5;
  const textBonus = clamp(textLength / 220, 0, 1.5);
  const bugBonus = clamp(submission.bugsReported * 0.2, 0, 0.6);
  const completenessBonus = clamp(answered * 0.1, 0, 0.4);

  return Number(clamp(base + textBonus + bugBonus + completenessBonus, 1, 5).toFixed(1));
}

export const routes: MockRoute[] = [
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  {
    method: 'POST',
    path: '/auth/login',
    resolve: ({ body }) => {
      const { email, password, role } = body ?? {};
      const account = findAccount(String(email ?? ''), String(password ?? ''));

      if (!account) {
        return fail(401, {
          message: 'E-mail ou senha inválidos.',
          code: 'INVALID_CREDENTIALS',
        });
      }

      // O perfil escolhido na aba precisa bater com o da conta (admin entra por qualquer aba).
      if (role && account.user.role !== role) {
        return fail(403, {
          message: `Esta conta é do tipo ${account.user.role === 'STUDIO' ? 'Estúdio' : 'Jogador'}. Troque a aba de login.`,
          code: 'ROLE_MISMATCH',
        });
      }

      return ok({
        token: issueToken(account.user.id, account.user.role),
        user: account.user,
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      });
    },
  },
  {
    method: 'GET',
    path: '/auth/me',
    resolve: ({ query }) => {
      const user = findUserById(query.get('userId') ?? '');
      return user ? ok(user) : fail(404, { message: 'Usuário não encontrado.' });
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    resolve: () => ok({ success: true }),
  },
  {
    method: 'POST',
    path: '/auth/recover',
    resolve: ({ body }) =>
      ok({
        message: `Se existir uma conta para ${body?.email ?? 'este e-mail'}, enviaremos as instruções de recuperação.`,
      }),
  },

  // -------------------------------------------------------------------------
  // Estudio - jogos
  // -------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/games',
    resolve: ({ query }) => ok(listGames(query.get('studioId') ?? undefined)),
  },
  {
    method: 'POST',
    path: '/games',
    resolve: ({ body }) => created(createGame(body ?? {})),
  },
  {
    method: 'GET',
    path: '/games/:id',
    resolve: ({ params }) => {
      const game = getGame(params.id);
      return game ? ok(game) : fail(404, { message: 'Jogo não encontrado.' });
    },
  },

  // -------------------------------------------------------------------------
  // Estudio - testes, dashboard e relatorios
  // -------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/tests',
    resolve: ({ query }) => ok(listTests(query.get('gameId') ?? undefined)),
  },
  {
    method: 'POST',
    path: '/tests',
    resolve: ({ body }) => created(createTest(body ?? {})),
  },
  {
    method: 'GET',
    path: '/tests/:id',
    resolve: ({ params }) => {
      const test = getTest(params.id);
      return test ? ok(test) : fail(404, { message: 'Teste não encontrado.' });
    },
  },
  {
    method: 'GET',
    path: '/studio/dashboard',
    resolve: () => ok(getStudioDashboard()),
  },
  {
    method: 'GET',
    path: '/reports/:testId',
    resolve: ({ params }) => {
      const report = buildReport(params.testId);
      return report ? ok(report) : fail(404, { message: 'Relatório não encontrado.' });
    },
  },
  {
    method: 'GET',
    path: '/reports/:testId/plugin',
    resolve: ({ params }) => {
      const report = buildPluginReport(params.testId);
      return report ? ok(report) : fail(404, { message: 'Relatório não encontrado.' });
    },
  },
  {
    method: 'GET',
    path: '/sessions',
    resolve: ({ query }) => ok(listSessions(query.get('testId') ?? undefined)),
  },
  {
    method: 'GET',
    path: '/sessions/:id',
    resolve: ({ params }) => {
      const session = getSession(params.id);
      return session ? ok(session) : fail(404, { message: 'Sessão não encontrada.' });
    },
  },

  // -------------------------------------------------------------------------
  // Jogador
  // -------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/player/dashboard',
    // O conteúdo da home do jogador é exatamente o do Figma, então vem do
    // fixture; nada aqui é derivado do estado.
    resolve: () => ok(db.playerDashboard satisfies PlayerDashboard),
  },
  {
    method: 'GET',
    path: '/player/games/:gameId/tests',
    resolve: ({ params }) => ok(listPlayerGameTests(params.gameId)),
  },
  {
    method: 'GET',
    // O chat é o mesmo em qualquer jogo: o Figma só desenha um.
    path: '/player/games/:gameId/community',
    resolve: () => ok(db.gameCommunity),
  },
  {
    method: 'GET',
    // Conquistas e histórico também são os mesmos em qualquer jogo no arquivo.
    path: '/player/games/:gameId/achievements',
    resolve: () => ok(db.gameAchievements),
  },
  {
    method: 'GET',
    path: '/player/games/:gameId/history',
    resolve: () => ok(db.gameMyTests),
  },
  {
    method: 'GET',
    path: '/reports/:testId/sessions/:sessionId',
    resolve: ({ params }) => ok({ ...db.sessionDetail, id: params.sessionId }),
  },
  {
    method: 'GET',
    path: '/player/session-review',
    resolve: () => ok(db.sessionReview),
  },
  {
    method: 'GET',
    path: '/player/session-outcome',
    resolve: () => ok(db.sessionOutcome),
  },
  {
    method: 'GET',
    path: '/player/catalog',
    resolve: () => ok(catalog()),
  },
  {
    method: 'GET',
    path: '/player/participations',
    resolve: () => ok(listParticipations()),
  },
  {
    method: 'GET',
    path: '/player/achievements',
    resolve: () => ok(listAchievements()),
  },
  {
    method: 'POST',
    path: '/player/tests/:testId/start',
    resolve: ({ params }) => {
      const test = getTest(params.testId);
      if (!test) return fail(404, { message: 'Teste não encontrado.' });
      if (test.currentParticipants >= test.budget.slots) {
        return fail(409, { message: 'Este teste não tem mais vagas.', code: 'NO_SLOTS' });
      }

      const participation = upsertParticipation(params.testId, { status: 'IN_PROGRESS' });
      test.currentParticipants = Math.min(test.currentParticipants + 1, test.budget.slots);
      if (test.currentParticipants >= test.budget.slots) test.status = 'FULL';

      return created(participation);
    },
  },
  {
    method: 'POST',
    path: '/player/tests/:testId/submit',
    resolve: ({ params, body }) => {
      const submission = body as SessionSubmission;
      const test = getTest(params.testId);
      if (!test) return fail(404, { message: 'Teste não encontrado.' });

      const profile = getPlayerProfile();
      const feedbackQuality = scoreFeedback(submission);
      const xpEarned = Math.round(80 + feedbackQuality * 24 + submission.bugsReported * 15);

      const newXpRaw = profile.player.xp + xpEarned;
      const leveledUp = newXpRaw >= profile.player.xpToNextLevel;
      const newLevel = leveledUp ? profile.player.level + 1 : profile.player.level;
      const newXp = leveledUp ? newXpRaw - profile.player.xpToNextLevel : newXpRaw;

      // Persiste o progresso no "banco" para as outras telas verem o mesmo estado.
      profile.player.xp = newXp;
      profile.player.level = newLevel;
      if (leveledUp) profile.player.xpToNextLevel = Math.round(profile.player.xpToNextLevel * 1.2);
      profile.player.completedSessions += 1;
      profile.player.pendingBalance += test.budget.rewardPerSessionCents;

      upsertParticipation(params.testId, {
        status: 'PENDING_REVIEW',
        rewardStatus: 'PENDING',
        xpEarned,
        finishedAt: new Date().toISOString(),
        durationSeconds: submission.durationSeconds,
      });

      // Conquistas ainda bloqueadas viram recompensa quando a sessao e boa o bastante.
      const unlocked = db.achievements
        .filter((achievement) => !achievement.unlockedAt)
        .slice(0, feedbackQuality >= 4 ? 2 : 1)
        .map((achievement) => {
          achievement.unlockedAt = new Date().toISOString();
          return achievement;
        });

      const result: SessionResult = {
        participationId: getParticipationByTest(params.testId)?.id ?? uid('part'),
        xpEarned,
        newXp,
        newLevel,
        leveledUp,
        rewardCents: test.budget.rewardPerSessionCents,
        rewardStatus: 'PENDING',
        unlockedAchievements: unlocked,
        feedbackQuality,
      };

      return created(result);
    },
  },

];

/** Casa `/games/game-001` com o padrao `/games/:id` e devolve os params. */
export function matchRoute(
  method: string,
  pathname: string,
): { route: MockRoute; params: Record<string, string> } | null {
  const segments = pathname.split('/').filter(Boolean);

  for (const route of routes) {
    if (route.method !== method.toUpperCase()) continue;

    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;

    const params: Record<string, string> = {};
    const matched = routeSegments.every((segment, index) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(segments[index]);
        return true;
      }
      return segment === segments[index];
    });

    if (matched) return { route, params };
  }

  return null;
}
