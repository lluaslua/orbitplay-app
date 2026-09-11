import { Link } from 'react-router-dom';
import { ChevronDown, Info, MoreVertical } from 'lucide-react';
import { BenchmarkCard } from '@/components/Studio/BenchmarkCard';
import { GameCard } from '@/components/Common/GameCard';
import { PluginBanner } from '@/components/Studio/PluginBanner';
import {
  caixaCampo,
  Card,
  CardDescription,
  CardHeader,
  CardLink,
  CardTitle,
  ErrorState,
  IconButton,
  SkeletonCard,
  Table,
  TableFooter,
  TableHeader,
  Tag,
} from '@/components/UI';
import { useGames } from '@/hooks/useGames';
import { useStudioDashboard } from '@/hooks/useReports';
import { useTests } from '@/hooks/useTests';
import { useStudioUser } from '@/stores/authStore';
import type { Playtest } from '@/types';
import { ROUTES, TEST_STATUS_LABELS, TEST_STATUS_TONES } from '@/utils/constants';
import { cn, formatDate, formatNumber } from '@/utils/helpers';

/**
 * TELA 02 — Home do estúdio. Figma: frame `291:1257` (1920×2428).
 *
 * As seções aparecem na ordem do arquivo e são separadas por 24px: saudação com
 * os sete números, "Seus Jogos", "Estatisticas", o par banner + benchmark, e a
 * tabela de testes. O respiro lateral de 64px vem do `MainLayout`.
 */
export function HomeStudio() {
  const studio = useStudioUser();
  const dashboard = useStudioDashboard();
  const games = useGames(studio?.id);
  const tests = useTests();

  if (dashboard.isError) {
    return (
      <ErrorState
        description="Não conseguimos carregar o painel do estúdio."
        onRetry={() => dashboard.refetch()}
      />
    );
  }

  const dados = dashboard.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Saudação + os sete números */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[32px] font-normal text-white">Bem-vindo</h1>
          <span className="bg-orbit-flame-text bg-clip-text text-[32px] font-bold italic text-transparent">
            {studio?.studio.organization ?? 'Estúdio'}
          </span>
          <Tag font="sans" tone="jade-soft">
            Desenvolvedor
          </Tag>
        </div>

        {dados && (
          <div className="flex w-[1492px] max-w-full gap-6">
            <BigNumber icone="kpi-jogos-testados" rotulo="Jogos Testados" valor={dados.highlights.gamesTested} />
            <BigNumber icone="kpi-testes-realizados" rotulo="Testes Realizados" valor={dados.highlights.testsRun} />
            <BigNumber icone="kpi-horas-gameplay" rotulo="Horas de Gameplay Testadas" valor={dados.highlights.gameplayHours} />
            <BigNumber
              icone="kpi-nota-media"
              rotulo="Nota Média dos Testes"
              valor={dados.highlights.averageRating.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
              })}
            />
            <BigNumber
              icone="kpi-engajamento"
              rotulo="Engajamento Médio"
              valor={`${Math.round(dados.highlights.engagement * 100)}%`}
            />
            <BigNumber icone="kpi-insights-ia" rotulo="Insights Gerados pela IA" valor={dados.highlights.aiInsights} />
            <BigNumber icone="kpi-plugin-ativo" rotulo="Testes com Plugin Ativo" valor={dados.highlights.testsWithPlugin} />
          </div>
        )}
      </section>

      <hr className="border-orbit-border" />

      {/* Seus Jogos */}
      <SecaoTitulo titulo="Seus Jogos" link="Ir para meus jogos" para={ROUTES.studio.games} />

      <section className="grid grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
        {games.isLoading ? (
          <SkeletonCard />
        ) : (
          games.data?.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              to={ROUTES.studio.game(game.id)}
              className="w-full"
            />
          ))
        )}
      </section>

      {/* Estatisticas */}
      <SecaoTitulo titulo="Estatisticas" link="Ir para jogos" para={ROUTES.studio.games} />

      {dados && (
        <>
          <section className="flex gap-6">
            <CardEstatistica
              titulo="Visão geral"
              link="Ir para relatórios"
              para={ROUTES.studio.games}
              campos={[
                ['Testes ativos', dados.overview.activeTests],
                ['Testadores jogando', formatNumber(dados.overview.playersPlaying)],
                ['Testes por hora', dados.overview.testsPerHour.toLocaleString('pt-BR')],
              ]}
            />
            <CardEstatistica
              titulo="Fatores chave"
              link="Ir para configurações"
              para={ROUTES.studio.games}
              campos={[
                ['Fator diversão', dados.keyFactors.funFactor],
                ['Bugs e Glitches', formatNumber(dados.keyFactors.bugs)],
                ['Retenção', `${Math.round(dados.keyFactors.retention * 100)}%`],
              ]}
            />
            <CardEstatistica
              titulo="Plug-in telemetria"
              link="Ir para Orbit Plug-in"
              para={ROUTES.studio.games}
              campos={[
                ['Pontos ativos', dados.plugin.activePoints],
                ['Acionamentos', formatNumber(dados.plugin.triggers)],
                ['Insights de IA', formatNumber(dados.plugin.aiInsights)],
              ]}
            />
          </section>

          <section className="grid grid-cols-2 gap-6">
            <PluginBanner />
            <BenchmarkCard rows={dados.benchmark} />
          </section>

          <TabelaTestes testes={tests.data ?? []} total={dados.totalTests} />
        </>
      )}
    </div>
  );
}

/** Um dos sete números do topo: ícone 24 à esquerda, rótulo pequeno sobre o valor. */
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
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6 shrink-0" />
      <div className="flex min-w-0 flex-col whitespace-nowrap text-white">
        <span className="font-label text-[12px] font-light leading-[14px]">{rotulo}</span>
        <span className="font-label text-[24px] font-bold">{valor}</span>
      </div>
    </div>
  );
}

/** Título de seção em Bold Italic com o link alinhado à direita. */
function SecaoTitulo({
  titulo,
  link,
  para,
}: {
  titulo: string;
  link: string;
  para: string;
}) {
  return (
    <div className="flex items-center gap-6">
      <h2 className="flex-1 text-subtitle font-bold italic text-white">{titulo}</h2>
      <CardLink asChild>
        <Link to={para}>{link}</Link>
      </CardLink>
    </div>
  );
}

/** Card de três números — "Visão geral", "Fatores chave" e "Plug-in telemetria". */
function CardEstatistica({
  titulo,
  link,
  para,
  campos,
}: {
  titulo: string;
  link: string;
  para: string;
  campos: [string, string | number][];
}) {
  return (
    <Card className="min-w-0 flex-1 items-end">
      <CardHeader action={<Info className="text-white" />}>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>Lorem ipsulum</CardDescription>
      </CardHeader>

      <div className="flex w-full gap-6">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body text-orbit-muted">{rotulo}</span>
            <span className="text-[24px] font-bold text-white">{valor}</span>
          </div>
        ))}
      </div>

      <CardLink asChild>
        <Link to={para}>{link}</Link>
      </CardLink>
    </Card>
  );
}

/**
 * Tabela de testes — Figma 301:1596.
 *
 * O cabeçalho é a única superfície clara da tela (`Systems/S-Info Bg`). O botão
 * "Detalhes" só aparece quando o teste já saiu do ar, e vem em laranja no que
 * está finalizado: é o único com relatório pronto para ler.
 */
function TabelaTestes({ testes, total }: { testes: Playtest[]; total: number }) {
  return (
    <Table>
      <TableHeader>
        <span className="flex-1">Jogo</span>
        <span className="flex-1">Teste</span>
        <span className="flex flex-1 items-center gap-2">
          Tipo de teste
          <Ordenacao />
        </span>
        <span className="flex flex-1 items-center gap-2">
          Status
          <Ordenacao />
        </span>
        <span className="flex-1">Data início</span>
        <span className="flex-1">Data fim</span>
        <span className="flex-1">Orbit Plug-in</span>
        <span className="w-[265px] shrink-0">Ações</span>
      </TableHeader>

      {testes.map((teste) => {
        const rodando = teste.status === 'ACTIVE';

        return (
          <div key={teste.id} className="flex items-center gap-6 px-6 py-3">
            <span className="flex-1 truncate text-graphic text-white">{teste.gameName}</span>
            <span className="flex-1 truncate text-graphic text-white">{teste.title}</span>

            <span className="flex-1">
              <Tag tone="topaz">{teste.kind}</Tag>
            </span>
            <span className="flex-1">
              <Tag tone={TEST_STATUS_TONES[teste.status]}>{TEST_STATUS_LABELS[teste.status]}</Tag>
            </span>

            <span className="flex-1 text-graphic font-bold text-white">
              {formatDate(teste.startsAt)}
            </span>
            <span className="flex-1 text-graphic font-bold text-white">
              {teste.endedAt ? formatDate(teste.endedAt) : '-'}
            </span>

            <span className="flex-1">
              <Tag tone={teste.plugin ? 'sapphire' : 'ruby'}>{teste.plugin ? 'SIM' : 'NÃO'}</Tag>
            </span>

            <span className="flex h-9 w-[265px] shrink-0 items-center justify-end gap-2.5">
              {!rodando && (
                <Link
                  to={ROUTES.studio.report(teste.id)}
                  className={cn(
                    'flex h-full flex-1 items-center justify-center rounded-lg text-button text-white shadow-bevel',
                    teste.status === 'FINISHED' ? 'bg-orbit-flame' : 'bg-orbit-action-wide',
                  )}
                >
                  Detalhes
                </Link>
              )}
              <IconButton aria-label="Mais ações" className="shrink-0">
                <MoreVertical className="size-6" />
              </IconButton>
            </span>
          </div>
        );
      })}

      <TableFooter>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-caption text-white">Mostrar:</span>
          <span className={cn(caixaCampo(), 'w-[74px] text-body')}>
            {testes.length}
            <ChevronDown className="size-5" />
          </span>
          <span className="text-caption text-white">
            Mostrando 1-{testes.length} de {formatNumber(total)} registros.
          </span>
          <span className="text-caption text-white">Atualizado há 1 minuto</span>
        </div>

        <Paginacao />

        <div className="flex flex-1 justify-end">
          <CardLink asChild>
            <Link to={ROUTES.studio.games}>Ir para Testes</Link>
          </CardLink>
        </div>
      </TableFooter>
    </Table>
  );
}

/** Setinhas de ordenação do cabeçalho. */
function Ordenacao() {
  return (
    <span className="flex flex-col gap-0.5 text-orbit-dark" aria-hidden>
      <svg viewBox="0 0 6 6" className="w-1.5" fill="currentColor">
        <path d="M3 0 6 5.6H0z" />
      </svg>
      <svg viewBox="0 0 6 6" className="w-1.5" fill="currentColor">
        <path d="M3 5.6 0 0h6z" />
      </svg>
    </span>
  );
}

/** Paginação estática do rodapé — o Figma desenha 1 2 3 … 9. */
function Paginacao() {
  return (
    <div className="flex shrink-0 items-center gap-3 text-white">
      <ArrowPagina direcao="anterior" />
      <div className="flex items-center gap-3">
        <span className="flex h-8 items-center rounded-[40px] bg-orbit-blue px-3 py-1 text-button text-orbit-dim">
          1
        </span>
        {['2', '3'].map((pagina) => (
          <span
            key={pagina}
            className="flex h-8 items-center rounded-[40px] border-2 border-orbit-dim px-3 py-1 text-graphic"
          >
            {pagina}
          </span>
        ))}
        <span className="flex size-8 items-end justify-center text-graphic">…</span>
        <span className="flex h-8 items-center rounded-[40px] border-2 border-orbit-dim px-3 py-1 text-graphic">
          9
        </span>
      </div>
      <ArrowPagina direcao="proxima" />
    </div>
  );
}

function ArrowPagina({ direcao }: { direcao: 'anterior' | 'proxima' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6 text-white', direcao === 'anterior' && 'rotate-180')}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 12h16m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
