import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { GameCard } from '@/components/Common/GameCard';
import { EarningsSparkline, GenreDonut } from '@/components/Common/Charts';
import {
  Card,
  CardHeader,
  CardLink,
  CardDescription,
  CardTitle,
  ErrorState,
  SkeletonCard,
  Tag,
} from '@/components/UI';
import { useGames } from '@/hooks/useGames';
import { usePlayerDashboard } from '@/hooks/usePlayer';
import { usePlayerUser } from '@/stores/authStore';
import type { Game } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatAmount, formatCurrency, formatNumber } from '@/utils/helpers';

/**
 * TELA 13 — Home do jogador. Figma: frame `197:496`.
 *
 * Saudação com os quatro números e a carteira, o teste em andamento, os
 * destaques, e a faixa de estatísticas com ganhos, missões e "Meus testes".
 */
export function HomeJogador() {
  const player = usePlayerUser();
  const dashboard = usePlayerDashboard();
  const games = useGames();

  if (dashboard.isError) {
    return (
      <ErrorState
        description="Não conseguimos carregar a sua home."
        onRetry={() => dashboard.refetch()}
      />
    );
  }

  const dados = dashboard.data;
  const porId = new Map((games.data ?? []).map((jogo) => [jogo.id, jogo]));
  const emAndamento = dados?.ongoing ? porId.get(dados.ongoing.gameId) : undefined;
  const destaques = (dados?.featuredGameIds ?? [])
    .map((id) => porId.get(id))
    .filter((jogo): jogo is Game => !!jogo);

  return (
    <div className="flex flex-col gap-6">
      {/*
        Saudação + carteira. A carteira tem 569px fixos; lado a lado com os
        quatro números da saudação isso não cabe numa janela estreita, então ela
        desce para baixo antes de espremer.
      */}
      <section className="flex flex-col gap-6 folgado:flex-row folgado:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[32px] font-normal text-white">Bem-vindo</h1>
            <span className="bg-orbit-flame-text bg-clip-text text-[32px] font-bold italic text-transparent">
              {player?.name ?? 'Jogador'}
            </span>
            {player && (
              <Tag font="sans" tone="sapphire">
                {player.player.tier}
              </Tag>
            )}
          </div>

          {player && (
            <div className="flex gap-6">
              <BigNumber icone="kpi-jogos-testados" rotulo="Nível" valor={player.player.level} />
              <BigNumber
                icone="kpi-nota-media"
                rotulo="Qualidade de Feedback"
                valor={player.player.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
              />
              <BigNumber
                icone="kpi-insights-ia"
                rotulo="Conquistas"
                valor={formatNumber(player.player.achievementsCount)}
              />
              <BigNumber
                icone="kpi-horas-gameplay"
                rotulo="Horas jogadas"
                valor={formatNumber(player.player.hoursPlayed)}
              />
            </div>
          )}
        </div>

        <CarteiraCard saldo={player?.player.balance ?? 0} />
      </section>

      <hr className="border-orbit-border" />

      {/* Continue seu teste */}
      <SecaoTitulo
        titulo="Continue seu teste"
        link="Ir para meu testes"
        para={ROUTES.player.catalog}
      />

      <section className="flex gap-6">
        {games.isLoading ? (
          <SkeletonCard />
        ) : emAndamento && dados?.ongoing ? (
          <GameCard
            game={emAndamento}
            to={ROUTES.player.game(emAndamento.id)}
            ctaLabel="Continuar!"
            ctaTone="flame"
            tracks={dados.ongoing.tracks}
          />
        ) : null}
      </section>

      {/* Destaques para você */}
      <SecaoTitulo titulo="Destaques para você" link="Ir para jogos" para={ROUTES.player.catalog} />

      <section className="grid grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
        {destaques.map((jogo) => (
          <GameCard
            key={jogo.id}
            game={jogo}
            to={ROUTES.player.game(jogo.id)}
            ctaLabel="Testar!"
            className="w-full"
          />
        ))}
      </section>

      {/* Estatisticas */}
      <SecaoTitulo titulo="Estatisticas" link="Ir para jogos" para={ROUTES.player.catalog} />

      {dados && (
        <>
          <Card className="items-end">
            <CardHeader action={<Info className="text-white" />}>
              <CardTitle>Meu resumo de ganhos</CardTitle>
              <CardDescription>Lorem ipsulum</CardDescription>
            </CardHeader>

            <div className="flex w-full items-center gap-6 whitespace-nowrap">
              <Campo
                rotulo="Últimos 7 dias"
                valor={formatCurrency(dados.earnings.last7DaysCents)}
              />
              <Campo rotulo="Total acumulado" valor={formatCurrency(dados.earnings.totalCents)} />
              <Campo
                rotulo="Próximo saque"
                valor={`${dados.earnings.nextPayoutDays} dias`}
              />
              <div className="h-[53px] w-[541px] shrink-0">
                <EarningsSparkline data={dados.earnings.series} />
              </div>
            </div>

            <CardLink asChild>
              <Link to={ROUTES.player.catalog}>Ir para ganhos</Link>
            </CardLink>
          </Card>

          <section className="flex gap-6">
            {/* Missões e Ranking */}
            <Card className="flex-[1035] items-end">
              <CardHeader action={<Info className="text-white" />}>
                <CardTitle>Missões e Ranking</CardTitle>
              </CardHeader>

              <div className="flex w-full gap-6">
                <Campo
                  rotulo="Ranking"
                  valor={
                    <span className="flex items-baseline gap-1">
                      {dados.missions.rankPosition}
                      <span className="text-caption text-orbit-success">
                        ↑{dados.missions.rankDelta}
                      </span>
                    </span>
                  }
                />
                <Campo rotulo="Pendente" valor={dados.missions.pending} />
                <Campo
                  rotulo="Próx. meta"
                  valor={formatCurrency(dados.missions.nextGoalCents)}
                />
              </div>

              <div className="h-[208px] w-full">
                <GenreDonut data={dados.missions.genres} />
              </div>

              <CardLink asChild>
                <Link to={ROUTES.player.catalog}>Ir para Missões e Ranking</Link>
              </CardLink>
            </Card>

            {/* Meus testes */}
            <Card className="flex-[733] justify-between">
              <CardHeader action={<Info className="text-white" />}>
                <CardTitle>Meus testes</CardTitle>
              </CardHeader>

              <div className="flex flex-1 flex-col justify-center">
                {dados.myTests.map((teste) => (
                  <LinhaTeste key={teste.id} teste={teste} />
                ))}
              </div>

              <CardLink asChild>
                <Link to={ROUTES.player.catalog}>Ir para meus testes</Link>
              </CardLink>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

/** Card da carteira: saldo grande e o botão de saque. */
function CarteiraCard({ saldo }: { saldo: number }) {
  return (
    <div className="flex w-[569px] max-w-full shrink-0 items-start justify-end gap-4 rounded-2xl border border-orbit-border bg-orbit-card px-6 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-2 text-subtitle text-white">
          <img src="./icons/figma/kpi-plugin-ativo.svg" alt="" className="size-6" />
          Minha carteira
        </span>
        <span className="whitespace-nowrap text-white">
          <span className="font-label text-[24px] font-light">R$</span>
          <span className="font-label text-[48px] font-bold">{formatAmount(saldo)}</span>
        </span>
      </div>

      <button
        type="button"
        className="flex h-full items-center justify-center rounded-lg bg-orbit-action-wide px-8 font-label text-[24px] font-normal text-white shadow-bevel"
        title="Ainda não disponível"
      >
        Sacar!
      </button>
    </div>
  );
}

function BigNumber({
  icone,
  rotulo,
  valor,
}: {
  icone: string;
  rotulo: string;
  valor: string | number;
}) {
  return (
    <div className="flex w-[150px] shrink-0 items-center gap-1">
      <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6 shrink-0" />
      <div className="flex min-w-0 flex-col whitespace-nowrap text-white">
        <span className="font-label text-[12px] font-light leading-[14px]">{rotulo}</span>
        <span className="font-label text-[24px] font-bold">{valor}</span>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-body text-orbit-muted">{rotulo}</span>
      <span className="text-[24px] font-bold text-white">{valor}</span>
    </div>
  );
}

function SecaoTitulo({ titulo, link, para }: { titulo: string; link: string; para: string }) {
  return (
    <div className="flex items-center gap-6">
      <h2 className="flex-1 text-subtitle font-bold italic text-white">{titulo}</h2>
      <CardLink asChild>
        <Link to={para}>{link}</Link>
      </CardLink>
    </div>
  );
}

/** Linha de "Meus testes": mesma anatomia das linhas do benchmark do estúdio. */
function LinhaTeste({
  teste,
}: {
  teste: { id: string; name: string; progress: number; rewardCents: number };
}) {
  const completo = teste.progress >= 1;
  const naoIniciado = teste.progress <= 0;
  const rotulo = naoIniciado ? 'Iniciar' : completo ? 'Completar' : 'Continuar';

  return (
    <div className="flex items-center gap-6 px-6 py-2">
      <span className="w-[110px] shrink-0 truncate text-graphic text-white">{teste.name}</span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-label text-[14px] font-normal leading-[1.1] text-white">
          {Math.round(teste.progress * 100)}%
        </span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5FAFE]">
          <div
            className={cn('h-full rounded-full', completo ? 'bg-[#56CA00]' : 'bg-[#16B1FF]')}
            style={{ width: `${Math.min(100, Math.max(0, teste.progress * 100))}%` }}
          />
        </div>
      </div>

      <span className="w-[100px] shrink-0 text-graphic text-white">
        + R${formatAmount(teste.rewardCents)}
      </span>

      <button
        type="button"
        className={cn(
          'h-[38px] w-24 shrink-0 rounded-lg font-label text-[16px] font-normal text-white shadow-bevel',
          completo ? 'bg-orbit-flame-wide' : 'bg-orbit-action-wide',
        )}
      >
        {rotulo}
      </button>
    </div>
  );
}
