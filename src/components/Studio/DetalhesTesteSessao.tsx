import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ban, HelpCircle, Info, PartyPopper, RefreshCw, Search, Sparkles } from 'lucide-react';
import { BotoesExportar } from '@/components/Common/BotoesExportar';
import { PageHeading } from '@/components/Common/PageHeading';
import {
  Button,
  Card,
  ErrorState,
  Input,
  SelectField,
  SkeletonCard,
  Table,
  TableFooter,
  TableHeader,
  TableRow,
  Tag,
} from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import { useSessionDetail } from '@/hooks/useReports';
import type { ReportInsight, SessionDetail } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatCountdown, formatNumber, matchesSearch } from '@/utils/helpers';

/**
 * TELA 12 — Detalhamento de uma sessão. Figma: frame `329:9178`.
 *
 * É o zoom numa linha da tabela do relatório: a gravação com a transcrição
 * anotada pela IA, a classificação do testador, as notas por critério, os
 * gatilhos de telemetria e os insights daquela sessão.
 */
export function DetalhesTesteSessao() {
  const { testId, sessionId } = useParams<{ testId: string; sessionId: string }>();
  const sessao = useSessionDetail(testId, sessionId);
  const jogo = useGame(sessao.data?.gameId);

  if (sessao.isError) {
    return <ErrorState description="Não conseguimos carregar a sessão." onRetry={() => sessao.refetch()} />;
  }

  if (sessao.isLoading || !sessao.data) return <SkeletonCard />;

  const dados = sessao.data;
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
        titulo="Detalhes do Teste"
      />

      <Card className="gap-6 p-8">
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

        <h3 className="flex items-baseline gap-2">
          <span className="text-headline text-white">Sua sessão</span>
          <span className="text-headline-mobile text-orbit-muted">#{dados.id}</span>
        </h3>

        {/* Gravação + transcrição anotada */}
        <div className="flex flex-col gap-6 folgado:flex-row">
          <div className="relative h-[397px] w-[706px] max-w-full shrink-0 overflow-hidden rounded-xl">
            <img src={jogo.data?.bannerUrl ?? ''} alt="" className="size-full object-cover" />
            <img
              src="./icons/figma/tutorial-play.svg"
              alt=""
              className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="flex items-center gap-2 text-subtitle text-white">
              <Info className="size-6" />
              Transcrição + Analise de IA
            </p>

            <ol className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-2">
              {dados.transcript.map((fala) => (
                <li key={fala.at} className="flex flex-col gap-1">
                  <span className="flex gap-2 text-body text-white">
                    <span className="shrink-0 font-bold">{fala.at}</span>
                    <span>{fala.text}</span>
                  </span>
                  {fala.aiNote && (
                    <span
                      className={cn(
                        'flex items-center gap-2 pl-14 text-body',
                        // Positivo em verde, o resto em laranja — como no arquivo.
                        fala.aiNote.includes('positiva') ? 'text-orbit-g-emerald' : 'text-orbit-orange',
                      )}
                    >
                      <Sparkles className="size-4 shrink-0" />
                      {fala.aiNote}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <hr className="border-orbit-border" />

        <Classificacao classification={dados.classification} />

        <hr className="border-orbit-border" />

        <Avaliacao evaluation={dados.evaluation} />

        <hr className="border-orbit-border" />

        <Telemetria telemetry={dados.telemetry} />

        <hr className="border-orbit-border" />

        <Insights insights={dados.insights} />

        <div className="flex items-center justify-end gap-6">
          <Acao icone={<HelpCircle className="size-6" />}>Ajuda</Acao>
          <Acao icone={<Ban className="size-6" />} destrutiva>
            Pedir anulação do teste
          </Acao>
          <Acao icone={<RefreshCw className="size-6" />}>Solicitar novo teste</Acao>

          <Button variant="nightfall">
            Agradeçer teste!
            <PartyPopper className="size-6" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Classificacao({ classification }: { classification: SessionDetail['classification'] }) {
  return (
    <>
      <div className="flex flex-col">
        <span className="text-subtitle text-white">Classificação da IA</span>
        <span className="text-caption text-orbit-muted">Lorem ipsulum</span>
      </div>

      <div className="flex flex-wrap gap-6">
        <Campo rotulo="Arquétipo">
          <Tag tone={classification.archetypeTone}>{classification.archetype}</Tag>
        </Campo>
        <Campo rotulo="Tipo de jogador">
          <Tag tone="amber">{classification.playerType}</Tag>
        </Campo>
        <Campo rotulo="Nota da avaliação">
          <Numero valor={classification.score} />
        </Campo>
        <Campo rotulo="Fator diversão">
          <Numero valor={classification.funFactor} />
        </Campo>
        <Campo rotulo="Engajamento">
          <span className="text-[24px] font-bold text-white">
            {Math.round(classification.engagement * 100)}%
          </span>
        </Campo>
        <Campo rotulo="Insights do teste">
          <span className="text-[24px] font-bold text-white">{classification.insights}</span>
        </Campo>
      </div>
    </>
  );
}

function Avaliacao({ evaluation }: { evaluation: SessionDetail['evaluation'] }) {
  return (
    <>
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 text-subtitle text-white">
          <Info className="size-6" />
          Avaliação de teste
        </span>
        <span className="flex-1" />
        <BotoesExportar quantidade={1} />
      </div>

      <Campo rotulo="Nota da avaliação">
        <Numero valor={evaluation.score} />
      </Campo>

      <Table transparente>
        <TableHeader>
          <span className="flex-1">Critério</span>
          <span className="flex-1">Nota</span>
          <span className="flex-1">Observação</span>
        </TableHeader>

        {evaluation.criteria.map((criterio) => (
          <TableRow key={criterio.name}>
            <span className="flex-1 text-graphic text-white">{criterio.name}</span>
            <span className="flex-1 text-graphic text-white">
              {criterio.score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            </span>
            <span className="flex-1 text-graphic text-white">{criterio.note}</span>
          </TableRow>
        ))}
      </Table>
    </>
  );
}

function Telemetria({ telemetry }: { telemetry: SessionDetail['telemetry'] }) {
  return (
    <>
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 text-subtitle text-white">
          <Info className="size-6" />
          Gatilhos e eventos de telemetria
        </span>

        <span className="flex-1" />

        <span className="flex items-center gap-1">
          <span className="relative">
            <img src="./icons/figma/plugin-mark.svg" alt="" className="size-9" />
            <img
              src="./icons/figma/plugin-sparkle.svg"
              alt=""
              className="absolute left-[21px] top-[3.4px] h-[16.8px] w-[18px]"
            />
          </span>
          <span className="text-[28.8px] text-white">
            <strong className="font-bold">Orbit</strong>Plug-in
          </span>
        </span>

        <BotoesExportar quantidade={1} />
      </div>

      <div className="flex w-[852px] max-w-full gap-6">
        <Campo rotulo="Gatilhos registrados">
          <span className="text-[24px] font-bold text-white">{telemetry.triggers}</span>
        </Campo>
        <Campo rotulo="Sugestões gerados">
          <span className="text-[24px] font-bold text-white">{telemetry.suggestions}</span>
        </Campo>
      </div>

      <Table transparente>
        <TableHeader>
          <span className="flex-1">Gatilho</span>
          <span className="flex-1">Momento</span>
          <span className="flex-1">Duração</span>
          <span className="flex-1">Reação</span>
          <span className="flex-1">Insight da IA</span>
        </TableHeader>

        {telemetry.events.map((evento) => (
          <TableRow key={evento.id} className="text-graphic text-white">
            <span className="flex-1">{evento.trigger}</span>
            <span className="flex-1">{evento.at}</span>
            <span className="flex-1">{evento.duration}</span>
            <span className="flex-1">{evento.reaction}</span>
            <span className="flex-1">{evento.insight}</span>
          </TableRow>
        ))}

        <TableFooter className="text-caption text-white">
          Mostrando 1-{telemetry.events.length} de {formatNumber(telemetry.total)} registros.
          Atualizado há 1 minuto
        </TableFooter>
      </Table>
    </>
  );
}

function Insights({ insights }: { insights: ReportInsight[] }) {
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
      <span className="flex items-center gap-2 text-subtitle text-white">
        <Info className="size-6" />
        Insights de IA
        <span className="text-caption text-orbit-muted">Powererd by google gemini v2.87.99</span>
      </span>

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
    </>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
      <span className="text-body text-orbit-muted">{rotulo}</span>
      {children}
    </div>
  );
}

function Numero({ valor }: { valor: number }) {
  return (
    <span className="text-[24px] font-bold text-white">
      {valor.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
    </span>
  );
}


function Acao({
  icone,
  children,
  destrutiva,
}: {
  icone: React.ReactNode;
  children: React.ReactNode;
  destrutiva?: boolean;
}) {
  return (
    <button
      type="button"
      title="Ainda não disponível"
      className={cn(
        'flex items-center gap-1 text-button hover:underline',
        destrutiva ? 'text-orbit-error-l' : 'text-orbit-blue',
      )}
    >
      {children}
      {icone}
    </button>
  );
}
