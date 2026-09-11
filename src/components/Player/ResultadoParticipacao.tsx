import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BadgeDollarSign, Home, Target, UserRound } from 'lucide-react';
import { PageHeading } from '@/components/Common/PageHeading';
import { Button, Card, ErrorState, SkeletonCard, UserAvatar } from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import { useSessionOutcome } from '@/hooks/usePlayer';
import { usePlayerUser } from '@/stores/authStore';
import type { SessionOutcome } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatAmount } from '@/utils/helpers';

/**
 * TELA 19 — Conclusão. Figma: `287:4911` (processando) e `287:5085` (pronto).
 *
 * São dois momentos da mesma tela. As quatro etapas do envio vão sendo
 * marcadas uma a uma; enquanto isso, no lugar dos cards de recompensa fica um
 * aviso de que a IA ainda está analisando. Quando a última fecha, os quatro
 * cards aparecem.
 *
 * Sem backend, as etapas avançam por tempo — é o que faz os dois estados
 * desenhados serem alcançáveis.
 */
const ETAPAS = [
  'Gravação vinculada',
  'Formulário completo',
  'Gerando insights de IA',
  'Compilando e enviando ao estúdio',
];

const INTERVALO_ETAPA_MS = 2200;

export function ResultadoParticipacao() {
  const player = usePlayerUser();
  const outcome = useSessionOutcome();
  const jogo = useGame(outcome.data?.gameId);

  const [concluidas, setConcluidas] = useState(2);

  useEffect(() => {
    if (concluidas >= ETAPAS.length) return;
    const timer = window.setTimeout(() => setConcluidas((n) => n + 1), INTERVALO_ETAPA_MS);
    return () => window.clearTimeout(timer);
  }, [concluidas]);

  if (outcome.isError) {
    return (
      <ErrorState description="Não conseguimos carregar o resultado." onRetry={() => outcome.refetch()} />
    );
  }

  if (outcome.isLoading || !outcome.data) return <SkeletonCard />;

  const pronto = concluidas >= ETAPAS.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.player.home },
          { label: 'jogos', to: ROUTES.player.catalog },
          { label: 'Detalhes', to: ROUTES.player.game(outcome.data.gameId) },
          { label: 'Avaliação do jogo' },
        ]}
        titulo="Avaliação do jogo"
      />

      <Card className="gap-6 p-8">
        {/* Quem testou o quê */}
        <div className="flex items-center justify-center gap-4">
          <UserAvatar name={player?.name ?? 'Jogador'} src={player?.avatarUrl} className="size-8" />
          <span className="text-subtitle text-white">{player?.name?.split(' ')[0]}</span>
          <span className="flex items-center gap-1 text-subtitle text-orbit-blue">
            <UserRound className="size-5" />
            Testou
          </span>
          <span className="text-subtitle text-white">{outcome.data.gameName}</span>
          {jogo.data && (
            <img
              src={jogo.data.bannerUrl}
              alt=""
              className="h-6 w-10 rounded object-cover"
            />
          )}
        </div>

        {/* Selo verde entre dois traços */}
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-[106px] bg-orbit-g-emerald" />
          <span className="grid size-8 place-items-center rounded-full bg-orbit-g-emerald text-orbit-bg">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
              <path
                d="m5 12.5 4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="h-px w-[106px] bg-orbit-g-emerald" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h2 className="text-headline text-white">Avaliação enviada!</h2>

          <ol className="flex flex-col items-center">
            {ETAPAS.map((etapa, indice) => {
              const feita = indice < concluidas;

              return (
                <li key={etapa} className="flex items-center gap-2 text-subtitle text-white">
                  {feita ? (
                    <span className="text-orbit-g-emerald" aria-label="Concluído">
                      ✔
                    </span>
                  ) : (
                    <Girando />
                  )}
                  {etapa}
                </li>
              );
            })}
          </ol>
        </div>

        <hr className="border-orbit-border" />

        {pronto ? (
          <CardsDeGanho outcome={outcome.data} />
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-subtitle text-white">Recompensas</p>
            <Girando grande />
            <p className="max-w-[640px] text-center text-caption text-orbit-muted">
              Assim que nossa IA analisar seu feedback e o estúdio confirmar o teste, sua
              recompensa será liberada. Fique tranquilo, avisaremos você assim que estiver pronta!
            </p>
          </div>
        )}

        <hr className="border-orbit-border" />

        <div className="flex justify-end">
          <Button variant="nightfall" asChild>
            <Link to={ROUTES.player.home}>
              Voltar para a Home
              <Home className="size-5" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Os quatro cards do estado final. */
function CardsDeGanho({ outcome }: { outcome: SessionOutcome }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <CardGanho titulo="Conquistas:" icone={<Award className="size-5" />}>
        <ul className="flex flex-col gap-3">
          {outcome.achievements.map((conquista) => (
            <li key={conquista.id} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orbit-nightfall">
                <Award className="size-4 text-white" />
              </span>
              <span className="min-w-0">
                <span className="block text-caption-bold text-white">{conquista.name}</span>
                <span className="block text-caption text-orbit-muted">{conquista.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </CardGanho>

      <CardGanho titulo="Qualidade de Feedback" icone={<UserRound className="size-5" />}>
        <Memoria linhas={outcome.feedbackQuality.lines} />
        <p className="text-center">
          <span className="block text-[32px] font-bold leading-none text-white">
            {outcome.feedbackQuality.total.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
          </span>
          <span className="text-caption text-orbit-muted">Total</span>
        </p>
      </CardGanho>

      <CardGanho titulo="Nível:" icone={<Target className="size-5" />}>
        <Memoria linhas={outcome.level.lines} />
        <p className="text-center">
          <span className="block text-[32px] font-bold leading-none text-orbit-blue">
            +{outcome.level.gainedXp}xp
          </span>
          <span className="mt-1 flex items-center gap-2 text-caption text-white">
            {outcome.level.from}
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
              <span
                className="block h-full rounded-full bg-orbit-blue"
                style={{ width: `${outcome.level.progress * 100}%` }}
              />
            </span>
            {outcome.level.to}
          </span>
          <span className="text-caption text-orbit-muted">Total</span>
        </p>
      </CardGanho>

      <CardGanho titulo="Recompensa:" icone={<BadgeDollarSign className="size-5" />}>
        <Memoria linhas={outcome.reward.lines} />
        <p className="text-center whitespace-nowrap text-white">
          <span className="font-label text-[16px] font-light">R$</span>
          <span className="font-label text-[32px] font-bold">
            {formatAmount(outcome.reward.totalCents)}
          </span>
          <span className="block text-caption text-orbit-muted">Total</span>
        </p>
      </CardGanho>
    </div>
  );
}

function CardGanho({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-orbit-border p-4">
      <p className="flex items-center justify-center gap-2 text-body-bold text-white">
        {icone}
        {titulo}
      </p>
      {children}
    </div>
  );
}

/** As linhas de cálculo que aparecem acima do número. */
function Memoria({ linhas }: { linhas: string[] }) {
  return (
    <ul className="flex flex-col items-center gap-1">
      {linhas.map((linha) => (
        <li key={linha} className="text-center text-caption text-orbit-muted">
          {linha}
        </li>
      ))}
    </ul>
  );
}

/** Spinner tracejado laranja das etapas ainda em curso. */
function Girando({ grande }: { grande?: boolean }) {
  return (
    <span
      aria-label="Em andamento"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-dashed border-orbit-orange',
        grande ? 'size-8' : 'size-4',
      )}
    />
  );
}
