import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Boxes, Download, Info, Search } from 'lucide-react';
import { LockupPlugin } from '@/components/Common/LockupPlugin';
import { BotoesExportar } from '@/components/Common/BotoesExportar';
import { PageHeading } from '@/components/Common/PageHeading';
import { Card, ErrorState, Input, SelectField, SkeletonCard, Tag } from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import { usePluginReport } from '@/hooks/useReports';
import type { PluginReport, ReportInsight } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatCountdown, matchesSearch } from '@/utils/helpers';

/**
 * TELA 13 — Relatório do plug-in de telemetria. Figma: frame `427:3376`.
 *
 * Três blocos sob o cabeçalho do jogo: o heatmap de um mapa gravado, o
 * detalhamento de um gatilho e a grade de insights de IA. Os dois primeiros têm
 * a mesma anatomia — dois números, um seletor e duas colunas de cards roláveis.
 */
export function RelatorioPlugin() {
  const { testId } = useParams<{ testId: string }>();
  const relatorio = usePluginReport(testId);
  const jogo = useGame(relatorio.data?.gameId);

  if (relatorio.isError) {
    return (
      <ErrorState
        description="Não conseguimos carregar a telemetria."
        onRetry={() => relatorio.refetch()}
      />
    );
  }

  if (relatorio.isLoading || !relatorio.data) return <SkeletonCard />;

  const dados = relatorio.data;
  const disponivel = jogo.data?.status === 'ACTIVE';
  const prazo = jogo.data?.endsAt ? formatCountdown(jogo.data.endsAt) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.studio.home },
          { label: 'jogos', to: ROUTES.studio.games },
          { label: 'Configuração', to: ROUTES.studio.game(dados.gameId) },
          { label: 'Novo teste' },
        ]}
        titulo="Telemetria"
      />

      <Card className="gap-6 p-8">
        <LockupPlugin />

        {/* Identificação */}
        <div className="flex gap-6">
          <img
            src={jogo.data?.bannerUrl ?? ''}
            alt=""
            className="h-[230px] w-[560px] max-w-[45%] shrink-0 rounded-xl object-cover"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <h2 className="shrink-0 text-headline text-white">{jogo.data?.name ?? 'Jogo'}</h2>
              <Tag font="sans" size="sm" tone={disponivel ? 'emerald-soft' : 'ruby-soft'}>
                {disponivel ? 'Disponível' : 'Indisponível'}
              </Tag>
              <Tag font="sans" size="sm" tone="veil">
                <img src="./icons/figma/game-clock.svg" alt="" className="size-3" />
                {prazo ? `Termina em ${prazo}` : 'Terminado'}
              </Tag>
              <span className="flex-1" />
              <BotoesExportar quantidade={2} />
            </div>

            <div className="flex items-center gap-6">
              <span className="text-headline-mobile text-white">{dados.testName}</span>
              <Tag tone="topaz">{dados.testKind}</Tag>
            </div>
          </div>
        </div>

        <hr className="border-orbit-border" />

        <div className="flex gap-6">
          <Campo rotulo="Sessões analisadas" valor={dados.geral.sessions} />
          <Campo rotulo="Heatmaps" valor={dados.geral.heatmaps} />
          <Campo rotulo="gatilhos ativos" valor={dados.geral.activeTriggers} />
          <Campo rotulo="Descobertas" valor={dados.geral.findings} />
          <Campo rotulo="Sugestões de IA" valor={dados.geral.suggestions} />
        </div>

        <hr className="border-orbit-border" />

        <BlocoHeatmap heatmap={dados.heatmap} />

        <hr className="border-orbit-border" />

        <BlocoGatilhos triggers={dados.triggers} />

        <hr className="border-orbit-border" />

        <BlocoInsights insights={dados.insights} />
      </Card>
    </div>
  );
}

/** Heatmap de um mapa gravado, com as descobertas e sugestões daquele mapa. */
function BlocoHeatmap({ heatmap }: { heatmap: PluginReport['heatmap'] }) {
  const [mapa, setMapa] = useState(heatmap.selected);

  return (
    <>
      <TituloBloco icone="section-heatmap" titulo="Heatmap">
        <BotoesExportar quantidade={1} />
      </TituloBloco>

      <div className="flex w-[852px] max-w-full gap-6">
        <Campo rotulo="Mapas registrados" valor={heatmap.registered} />
        <Campo rotulo="Sugestões gerados" valor={heatmap.suggestions} />
      </div>

      <Seletor rotulo="Mapa" valor={mapa} opcoes={heatmap.maps} onChange={setMapa} />

      <div className="flex flex-col gap-6 folgado:flex-row">
        <div className="relative h-[397px] w-[707px] max-w-full shrink-0 overflow-hidden rounded-xl bg-black">
          <img src={heatmap.imageUrl} alt={`Heatmap de ${mapa}`} className="size-full object-cover" />

          <span className="absolute left-5 top-4 text-headline-mobile text-white">{mapa}</span>

          <button
            type="button"
            title="Ainda não disponível"
            className="absolute left-1/2 top-1/2 grid h-[86px] w-[78px] -translate-x-1/2 -translate-y-1/2 place-items-center"
          >
            <img src="./icons/figma/heatmap-3d.svg" alt="" className="absolute inset-0 size-full" />
            <span className="relative text-[24px] font-bold text-white">3D</span>
          </button>
        </div>

        <ColunasDeCards findings={heatmap.findings} aiSuggestions={heatmap.aiSuggestions} altura={397} />
      </div>

      <div className="flex gap-6">
        <LinkArquivo icone={<Boxes className="size-6" />}>Exportar para unity</LinkArquivo>
        <LinkArquivo icone={<Download className="size-6" />}>Baixar mapa .OBJ</LinkArquivo>
      </div>
    </>
  );
}

/** Detalhamento de um gatilho: os seis campos e as descobertas ligadas a ele. */
function BlocoGatilhos({ triggers }: { triggers: PluginReport['triggers'] }) {
  const [gatilho, setGatilho] = useState(triggers.selected);
  const { detail } = triggers;

  return (
    <>
      <TituloBloco icone="section-triggers" titulo="Gatilhos e eventos">
        <BotoesExportar quantidade={1} />
      </TituloBloco>

      <div className="flex w-[852px] max-w-full gap-6">
        <Campo rotulo="Gatilhos registrados" valor={triggers.registered} />
        <Campo rotulo="Sugestões gerados" valor={triggers.suggestions} />
      </div>

      <Seletor rotulo="Gatilho" valor={gatilho} opcoes={triggers.names} onChange={setGatilho} />

      <div className="flex flex-col gap-6 folgado:flex-row">
        <div className="flex w-[838px] max-w-full shrink-0 flex-col gap-6">
          <div className="flex gap-6">
            <Campo rotulo="Nome" texto={detail.name} />
            <Campo rotulo="Tipo">
              <Tag tone={detail.typeTone}>{detail.type}</Tag>
            </Campo>
          </div>
          <div className="flex gap-6">
            <Campo rotulo="Testes gatilho presente" texto={detail.presence} />
            <Campo rotulo="Total de ativações" texto={detail.activations} />
          </div>
          <div className="flex gap-6">
            <Campo rotulo="Média de acionamento" texto={detail.averageRate} />
            <Campo rotulo="Tempo média até a ativação" texto={detail.averageTime} />
          </div>
        </div>

        <ColunasDeCards
          findings={triggers.findings}
          aiSuggestions={triggers.aiSuggestions}
          altura={400}
        />
      </div>
    </>
  );
}

/** As duas colunas roláveis que os dois blocos repetem. */
function ColunasDeCards({
  findings,
  aiSuggestions,
  altura,
}: {
  findings: ReportInsight[];
  aiSuggestions: ReportInsight[];
  altura: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 gap-4" style={{ height: altura }}>
      <ColunaDeCards icone="section-findings" titulo="Principais descobertas" cards={findings} />
      <ColunaDeCards icone="section-ai" titulo="Sugestões de IA" cards={aiSuggestions} />
    </div>
  );
}

function ColunaDeCards({
  icone,
  titulo,
  cards,
}: {
  icone: string;
  titulo: string;
  cards: ReportInsight[];
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="flex items-center gap-2 text-body-bold text-white">
        <IconeFigma nome={icone} />
        {titulo}
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex shrink-0 flex-col gap-2 rounded-br-lg rounded-tl-lg border-2 border-orbit-dim p-4"
          >
            <span className="flex items-start justify-between gap-6">
              <span className="text-body-bold text-white">{card.title}</span>
              <Tag tone={card.categoryTone}>{card.category}</Tag>
            </span>
            <p className="text-body text-white">{card.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grade de insights com busca, filtro e exportação. */
function BlocoInsights({ insights }: { insights: ReportInsight[] }) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');

  const categorias = [...new Set(insights.map((item) => item.category))];
  const filtrados = insights.filter(
    (item) =>
      (matchesSearch(item.title, busca) || matchesSearch(item.text, busca)) &&
      (categoria === '' || item.category === categoria),
  );

  return (
    <>
      <div className="flex items-center gap-6">
        <span className="flex items-baseline gap-2 text-subtitle text-white">
          <IconeFigma nome="section-ai" className="self-center" />
          Insights de IA
          <span className="text-caption text-orbit-muted">Powererd by google gemini v2.87.99</span>
        </span>
        <span className="flex-1" />
        <Info className="size-6 shrink-0 text-white" />
      </div>

      <div className="flex items-end gap-6">
        <Input
          label="Buscar"
          className="w-[415px]"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Digite..."
          iconRight={<Search />}
        />

        <span className="flex-1" />
        <BotoesExportar quantidade={3} />

        <SelectField
          label="Filtrar por categoria"
          className="w-[415px]"
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

      <div className="grid grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
        {filtrados.map((insight) => (
          <div
            key={insight.id}
            className="flex flex-col gap-2 rounded-br-lg rounded-tl-lg border-2 border-orbit-dim p-4"
          >
            <span className="flex items-start justify-between gap-6">
              <span className="text-body-bold text-white">{insight.title}</span>
              <Tag tone={insight.categoryTone}>{insight.category}</Tag>
            </span>
            {insight.text.split('\n').map((paragrafo) => (
              <p key={paragrafo} className="text-body text-white">
                {paragrafo}
              </p>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Ícone de seção exportado do arquivo (`hiking_fill`, `rotate_x_fill`,
 * `search_ai_fill`, `head_ai_fill`). Já vêm brancos do Figma, então não há
 * recoloração aqui.
 */
function IconeFigma({ nome, className }: { nome: string; className?: string }) {
  return (
    <img src={`./icons/figma/${nome}.svg`} alt="" className={cn('size-6 shrink-0', className)} />
  );
}

/** Cabeçalho de bloco: ícone, título e o que vier à direita. */
function TituloBloco({
  icone,
  titulo,
  children,
}: {
  icone: string;
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-6">
      <span className="flex items-center gap-2 text-subtitle text-white">
        <IconeFigma nome={icone} />
        {titulo}
      </span>
      <span className="flex-1" />
      {children}
    </div>
  );
}

/**
 * Seletor de mapa / gatilho.
 *
 * O arquivo desenha um dropdown fechado, com um único valor visível; aqui ele
 * abre com o que o relatório tem — nada além disso.
 */
function Seletor({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string;
  valor: string;
  opcoes: string[];
  onChange: (valor: string) => void;
}) {
  return (
    <SelectField
      label={rotulo}
      className="w-[415px]"
      value={valor}
      onChange={(evento) => onChange(evento.target.value)}
    >
      {opcoes.map((opcao) => (
        <option key={opcao} value={opcao} className="bg-orbit-bg">
          {opcao}
        </option>
      ))}
    </SelectField>
  );
}

function Campo({
  rotulo,
  valor,
  texto,
  children,
}: {
  rotulo: string;
  valor?: number;
  texto?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
      <span className="text-body text-orbit-muted">{rotulo}</span>
      {children ?? <span className="text-[24px] font-bold text-white">{texto ?? valor}</span>}
    </div>
  );
}

/** Os dois links de exportação do mapa, abaixo do heatmap. */
function LinkArquivo({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title="Ainda não disponível"
      className="flex items-center gap-1 text-body-bold text-orbit-blue hover:underline"
    >
      {children}
      {icone}
    </button>
  );
}

