import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Info, Menu, MoreVertical, Search } from 'lucide-react';
import { BotoesExportar } from '@/components/Common/BotoesExportar';
import { PageHeading } from '@/components/Common/PageHeading';
import { GenreDonut, TestsPerWeekChart } from '@/components/Common/Charts';
import {
  caixaCampo,
  Card,
  CardHeader,
  CardLink,
  CardTitle,
  ErrorState,
  IconButton,
  Input,
  SelectField,
  SkeletonCard,
  Table,
  TableFooter,
  TableHeader,
  TableRow,
  Tag,
} from '@/components/UI';
import { useReport } from '@/hooks/useReports';
import type { ReportInsight, ReportSessionRow, TestReport } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatDate, formatDuration, formatNumber, matchesSearch } from '@/utils/helpers';

/**
 * TELA 11 — Relatório de um teste. Figma: frame `326:6452`.
 *
 * Sete blocos na ordem do arquivo: a faixa "Geral", evolução + avaliações,
 * telemetria + público, a tabela de sessões e o painel de insights de IA.
 *
 * Das cinco abas, só "Geral" tem conteúdo desenhado; as outras ficam inertes.
 */
const ABAS = ['Geral', 'Todos os testes', 'Todas as Avaliações', 'Insights de IA', 'Orbit Plug-in'];

export function Relatorio() {
  const { testId } = useParams<{ testId: string }>();
  const relatorio = useReport(testId);

  if (relatorio.isError) {
    return (
      <ErrorState description="Não conseguimos carregar o relatório." onRetry={() => relatorio.refetch()} />
    );
  }

  if (relatorio.isLoading || !relatorio.data) return <SkeletonCard />;

  const dados = relatorio.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.studio.home },
          { label: 'jogos', to: ROUTES.studio.games },
          { label: 'Configuração', to: ROUTES.studio.game(dados.gameId) },
          { label: 'Meu teste' },
        ]}
        titulo="Meu teste"
      />

      {/* Identificação do teste */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-6">
          <h2 className="shrink-0 text-headline text-white">{dados.testTitle}</h2>
          <Tag tone="topaz">{dados.kind}</Tag>
          <Tag tone="emerald">Finalizado</Tag>
          <span className="flex-1" />
          <IconButton aria-label="Mais ações" className="shrink-0">
            <Menu className="size-5" />
          </IconButton>
        </div>
        <p className="text-body text-white">{dados.description}</p>
      </div>

      <div className="flex items-end">
        {ABAS.map((aba, indice) => {
          const ativa = indice === 0;

          return (
            <span
              key={aba}
              className={cn('flex flex-col items-center pt-3', ativa ? 'gap-4' : 'gap-[17px]')}
              title={ativa ? undefined : 'Ainda não disponível'}
            >
              <span
                className={cn(
                  'px-3 text-center text-body',
                  ativa ? 'font-bold text-orbit-blue' : 'text-white',
                )}
              >
                {aba}
              </span>
              <span className={cn('w-full', ativa ? 'h-0.5 bg-orbit-blue' : 'h-px bg-white')} />
            </span>
          );
        })}
        <span className="h-px flex-1 bg-white" />
      </div>

      <CardGeral geral={dados.geral} />

      <div className="grid grid-cols-2 gap-6">
        <Card className="h-[384px]">
          <CardHeader action={<Info className="text-white" />}>
            <CardTitle>Evolução dos testes</CardTitle>
          </CardHeader>
          <div className="min-h-0 flex-1">
            <TestsPerWeekChart
              data={dados.evolution.map((ponto) => ({
                week: ponto.label,
                created: ponto.tests,
                finished: 0,
              }))}
              somenteCriados
            />
          </div>
        </Card>

        <CardAvaliacoes ratings={dados.ratings} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardTelemetria telemetry={dados.telemetry} testId={testId} />

        <Card className="h-[384px] items-end">
          <CardHeader action={<Info className="text-white" />}>
            <CardTitle>Testadores &amp; Arquétipos</CardTitle>
          </CardHeader>
          <div className="grid min-h-0 w-full flex-1 grid-cols-2">
            <GenreDonut data={dados.playerTypes} />
            <GenreDonut data={dados.archetypes} />
          </div>
        </Card>
      </div>

      <TabelaSessoes sessions={dados.sessions} total={dados.totalSessions} testId={testId} />

      <CardInsights insights={dados.insights} />
    </div>
  );
}

/** Faixa de sete números do topo. */
function CardGeral({ geral }: { geral: TestReport['geral'] }) {
  const campos: [string, string][] = [
    ['Total de testes', formatNumber(geral.totalTests)],
    ['Tempo médio da sessão', formatDuration(geral.avgSessionSeconds).replace(':', 'm ') + 's'],
    ['Nota média da IA', geral.aiScore.toLocaleString('pt-BR', { minimumFractionDigits: 1 })],
    ['Testadores envolvidos', formatNumber(geral.testers)],
    ['Fator diversão', geral.funFactor.toLocaleString('pt-BR', { minimumFractionDigits: 1 })],
    ['Bugs e Glitches', formatNumber(geral.bugs)],
    ['Retenção', `${Math.round(geral.retention * 100)}%`],
  ];

  return (
    <Card>
      <CardHeader action={<Info className="text-white" />}>
        <CardTitle>Geral</CardTitle>
      </CardHeader>

      <div className="flex w-full gap-6 whitespace-nowrap">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body text-orbit-muted">{rotulo}</span>
            <span className="text-[24px] font-bold text-white">{valor}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Resumo das avaliações: três números e duas perguntas em destaque. */
function CardAvaliacoes({ ratings }: { ratings: TestReport['ratings'] }) {
  const maior = Math.max(...ratings.scaled.distribution, 1);

  return (
    <Card className="h-[384px] items-end">
      <CardHeader action={<Info className="text-white" />}>
        <CardTitle>Avaliações</CardTitle>
      </CardHeader>

      <div className="flex w-full gap-6 whitespace-nowrap">
        <Campo rotulo="Total de perguntas" valor={String(ratings.totalQuestions)} />
        <Campo
          rotulo="Tempo médio da avaliação"
          valor={formatDuration(ratings.avgSeconds).replace(':', 'm ') + 's'}
        />
        <Campo rotulo="Taxa de desistencia" valor={`${Math.round(ratings.dropoutRate * 100)}%`} />
      </div>

      <div className="flex min-h-0 w-full flex-1 gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="flex items-center gap-2 text-body-bold text-white">
            <Info className="size-4 shrink-0" />
            {ratings.scaled.title}
          </p>

          {[...ratings.scaled.distribution].reverse().map((quantidade, indice) => {
            const nota = ratings.scaled.distribution.length - indice;

            return (
              <span key={nota} className="flex items-center gap-2">
                <span className="w-3 text-caption text-white">{nota}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                  <span
                    className="block h-full rounded-full bg-orbit-blue"
                    style={{ width: `${(quantidade / maior) * 100}%` }}
                  />
                </span>
              </span>
            );
          })}

          <p className="text-caption text-white">
            Média de {ratings.scaled.average.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} ⭐
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="flex items-center gap-2 text-body-bold text-white">
            <Info className="size-4 shrink-0" />
            {ratings.open.title}
          </p>
          <p className="text-caption text-orbit-muted">{ratings.open.answers} Respostas</p>
          {ratings.open.quotes.map((frase) => (
            <p key={frase} className="text-caption text-white">
              {frase}
            </p>
          ))}
        </div>
      </div>

      <CardLink asChild>
        <Link to={ROUTES.studio.games}>Ir para Todas as avaliações</Link>
      </CardLink>
    </Card>
  );
}

/** Card laranja da telemetria, com as duas listas do plug-in. */
function CardTelemetria({
  telemetry,
  testId,
}: {
  telemetry: TestReport['telemetry'];
  testId?: string;
}) {
  return (
    <div className="flex h-[384px] flex-col gap-4 rounded-3xl border border-orbit-orange p-6">
      <div className="flex items-center justify-between gap-6">
        <span className="text-subtitle text-white">Telemetria</span>
        <span className="flex items-center gap-1">
          <span className="relative">
            <img src="./icons/figma/plugin-mark.svg" alt="" className="size-6" />
            <img
              src="./icons/figma/plugin-sparkle.svg"
              alt=""
              className="absolute left-3.5 top-0.5 h-3 w-3.5"
            />
          </span>
          <span className="text-body text-white">
            <strong className="font-bold">Orbit</strong>Plug-in
          </span>
        </span>
      </div>

      <div className="flex gap-6 whitespace-nowrap">
        <Campo rotulo="Sessões analisadas" valor={formatNumber(telemetry.sessions)} />
        <Campo rotulo="gatilhos ativos" valor={String(telemetry.triggers)} />
        <Campo rotulo="Descobertas" valor={String(telemetry.findings)} />
        <Campo rotulo="Sugestões de IA" valor={String(telemetry.suggestions)} />
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        <ListaPlugin titulo="Principais descobertas" itens={telemetry.findingsList} />
        <ListaPlugin titulo="Sugestões de IA" itens={telemetry.suggestionsList} />
      </div>

      <div className="flex justify-end">
        <CardLink asChild>
          <Link to={testId ? ROUTES.studio.plugin(testId) : ROUTES.studio.home}>
            Ir para Orbit Plug-in
          </Link>
        </CardLink>
      </div>
    </div>
  );
}

function ListaPlugin({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="flex items-center gap-1 text-body-bold text-orbit-orange">
        <img src="./icons/figma/model/telemetry-1.svg" alt="" className="size-4" />
        {titulo}
      </p>
      <ul className="flex flex-col gap-1">
        {itens.map((item) => (
          <li key={item} className="text-caption text-white">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-caption text-orbit-muted">{rotulo}</span>
      <span className="text-[20px] font-bold text-white">{valor}</span>
    </div>
  );
}

/** Tabela de sessões do teste. */
function TabelaSessoes({
  sessions,
  total,
  testId,
}: {
  sessions: ReportSessionRow[];
  total: number;
  testId?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <span className="flex-1">Data</span>
        <span className="flex-1">Arquétipo</span>
        <span className="flex-1">Tipo de jogador</span>
        <span className="flex-1">Duração</span>
        <span className="flex-1">Qualidade do teste IA</span>
        <span className="flex-1">Orbit Plug-in</span>
        <span className="w-[265px] shrink-0">Ações</span>
      </TableHeader>

      {sessions.map((sessao) => (
        <TableRow key={sessao.id}>
          <span className="flex-1 text-graphic text-white">{formatDate(sessao.date)}</span>
          <span className="flex-1">
            <Tag tone={sessao.archetypeTone}>{sessao.archetype}</Tag>
          </span>
          <span className="flex-1">
            <Tag tone="amber">{sessao.playerType}</Tag>
          </span>
          <span className="flex-1 text-graphic font-bold text-white">
            {formatDuration(sessao.durationSeconds).replace(':', 'm ')}s
          </span>
          <span className="flex-1 text-graphic text-white">
            {sessao.aiScore.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
          </span>
          <span className="flex-1">
            <Tag tone={sessao.plugin ? 'sapphire' : 'ruby'}>{sessao.plugin ? 'SIM' : 'NÃO'}</Tag>
          </span>

          <span className="flex h-9 w-[265px] shrink-0 items-center justify-end gap-2.5">
            <Link
              to={testId ? ROUTES.studio.session(testId, sessao.id) : ROUTES.studio.home}
              className="flex h-full flex-1 items-center justify-center rounded-lg bg-orbit-action-wide text-button text-white shadow-bevel"
            >
              Mostrar teste
            </Link>
            <IconButton aria-label="Mais ações" className="shrink-0">
              <MoreVertical className="size-5" />
            </IconButton>
          </span>
        </TableRow>
      ))}

      <TableFooter>
        <div className="flex flex-1 items-center gap-2 text-caption text-white">
          <span>Mostrar:</span>
          <span className={cn(caixaCampo(), 'w-[74px] text-body')}>
            {sessions.length}
          </span>
          <span>
            Mostrando 1-{sessions.length} de {formatNumber(total)} registros.
          </span>
          <span>Atualizado há 1 minuto</span>
        </div>

        <div className="flex flex-1 justify-end">
          <CardLink asChild>
            <Link to={ROUTES.studio.games}>Ir para Todos os testes</Link>
          </CardLink>
        </div>
      </TableFooter>
    </Table>
  );
}

/** Painel de insights com busca, filtro e exportação. */
function CardInsights({ insights }: { insights: ReportInsight[] }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');

  const categorias = [...new Set(insights.map((item) => item.category))];

  const filtrados = insights.filter(
    (item) =>
      (matchesSearch(item.title, busca) || matchesSearch(item.text, busca)) &&
      (categoria === '' || item.category === categoria),
  );

  return (
    <Card className="items-end">
      <CardHeader
        action={<Info className="text-white" />}
      >
        <CardTitle>Insights de IA</CardTitle>
        <span className="text-caption text-orbit-muted">Powererd by google gemini v2.87.99</span>
      </CardHeader>

      <div className="flex w-full items-end gap-6">
        <Input
          label="Buscar"
          className="w-[320px]"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Digite..."
          iconRight={<Search />}
        />

        <span className="flex-1" />

        <BotoesExportar variante="outline" rotulo="Exportar insights" />

        <SelectField
          label="Filtrar por categoria"
          className="w-[320px]"
          value={categoria}
          onChange={(evento) => setCategoria(evento.target.value)}
        >
          <option value="" className="bg-orbit-bg">
            Digite...
          </option>
          {categorias.map((item) => (
            <option key={item} value={item} className="bg-orbit-bg">
              {item}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid w-full grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
        {filtrados.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col gap-2 rounded-2xl border border-orbit-border p-4"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-body-bold text-white">{insight.title}</span>
              <Tag tone={insight.categoryTone}>{insight.category}</Tag>
            </span>
            <p className="text-caption text-white">{insight.text}</p>
          </div>
        ))}
      </div>

      <CardLink asChild>
        <Link to={ROUTES.studio.games}>Ir para Todos os insights de IA</Link>
      </CardLink>
    </Card>
  );
}
