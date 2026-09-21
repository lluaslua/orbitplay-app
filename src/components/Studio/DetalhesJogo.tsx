import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ComunidadeJogo } from '@/components/Common/ComunidadeJogo';
import { PageHeading } from '@/components/Common/PageHeading';
import { Button, EmptyState, ErrorState, IconButton, SkeletonCard, Table, TableHeader, TableRow, Tag } from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import { useTests } from '@/hooks/useTests';
import { gameImageStorage } from '@/stores/gamesStore';
import type { Game, Playtest } from '@/types';
import { ROUTES, TEST_STATUS_LABELS, TEST_STATUS_TONES } from '@/utils/constants';
import {
  cn,
  formatAmount,
  formatCountdown,
  formatCurrency,
  formatDate,
  formatNumber,
} from '@/utils/helpers';

/**
 * TELA 04 — Configuração de testes de um jogo. Figma: frame `312:7015`.
 *
 * Capa larga com a barra de progresso da campanha, linha de identificação com
 * os três números, abas, os dois botões de ação e a tabela de testes do jogo.
 *
 * Duas abas têm tela: "Testes ativos" e "Comunidade". A Comunidade é o mesmo
 * chat que o tester abre na tela do jogo (`395:2656`) — é por ela que o estúdio
 * conversa com quem testa. As outras não têm frame no Figma, então aparecem
 * como estão desenhadas mas não navegam — mesmo tratamento dos itens de
 * navegação sem tela.
 */
const ABAS = [
  'Testes ativos',
  'Todos os testes',
  'Avaliações',
  'Conquistas',
  'Comunidade',
  'Especificações',
];

const ABA_TESTES = 0;
const ABA_COMUNIDADE = 4;

export function DetalhesJogo() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = useGame(gameId);
  const tests = useTests(gameId);
  const [aba, setAba] = useState(ABA_TESTES);

  if (game.isError) {
    return <ErrorState description="Não conseguimos carregar o jogo." onRetry={() => game.refetch()} />;
  }

  if (game.isLoading || !game.data) {
    return <SkeletonCard />;
  }

  const jogo = game.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.studio.home },
          { label: 'jogos', to: ROUTES.studio.games },
          { label: 'Configuração' },
        ]}
        titulo="Configuração de testes"
      />

      <Capa jogo={jogo} />

      <Identificacao jogo={jogo} />

      <div className="flex items-end">
        {ABAS.map((nome, indice) => {
          const ativa = indice === aba;
          const temTela = indice === ABA_TESTES || indice === ABA_COMUNIDADE;

          return (
            <button
              key={nome}
              type="button"
              onClick={temTela ? () => setAba(indice) : undefined}
              aria-disabled={temTela ? undefined : true}
              title={temTela ? undefined : 'Ainda não disponível'}
              className={cn(
                'flex flex-col items-center pt-3',
                ativa ? 'gap-4' : 'gap-[17px]',
                !temTela && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'px-3 text-center text-body',
                  ativa ? 'font-bold text-orbit-blue' : 'text-white',
                )}
              >
                {nome}
              </span>
              <span className={cn('w-full', ativa ? 'h-0.5 bg-orbit-blue' : 'h-px bg-white')} />
            </button>
          );
        })}
        <span className="h-px flex-1 bg-white" />
      </div>

      {aba === ABA_COMUNIDADE ? (
        <ComunidadeJogo gameId={jogo.id} />
      ) : (
        <>
          {/* Ações */}
          <div className="flex items-start gap-6">
            <Button variant="flame" asChild>
              <Link to={`${ROUTES.studio.newTest}?game=${jogo.id}`}>
                Novo teste
                {/* O "+" do arquivo é azul; aqui ele acompanha o texto do botão. */}
                <img src="./icons/figma/plus-branco.svg" alt="" className="size-6" />
              </Link>
            </Button>

            <Button variant="nightfall" disabled title="Ainda não disponível">
              Configurar Orbit Plug-in
              <span className="relative size-[25.2px]">
                <img src="./icons/figma/plugin-config.svg" alt="" className="size-full" />
                <img
                  src="./icons/figma/plugin-config-spark.svg"
                  alt=""
                  className="absolute left-[14.7px] top-[2.38px] h-[11.76px] w-[12.6px]"
                />
              </span>
            </Button>
          </div>

          {tests.isError ? (
            <ErrorState
              description="Não conseguimos carregar os testes."
              onRetry={() => tests.refetch()}
            />
          ) : (
            <TabelaTestes testes={tests.data ?? []} />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Capa 1792×402 com cantos 16 no topo-esquerdo e na base-direita.
 * A barra azul do rodapé é o progresso da campanha de testes.
 */
function Capa({ jogo }: { jogo: Game }) {
  const enviada = gameImageStorage.get(jogo.id);

  return (
    <div className="relative h-[402px] overflow-hidden rounded-br-2xl rounded-tl-2xl">
      <img src={enviada ?? jogo.bannerUrl} alt="" className="size-full object-cover" />

      <IconButton
        aria-label="Trocar imagem de capa"
        className="absolute bottom-[44px] right-[18px]"
      >
        <img src="./icons/figma/hero-image.svg" alt="" className="size-6" />
      </IconButton>

      <div
        className="absolute bottom-0 left-0 h-[11px] bg-orbit-blue"
        style={{ width: `${Math.min(100, Math.max(0, jogo.stats.campaignProgress * 100))}%` }}
      />
    </div>
  );
}

/** Nome, tags de estado e os três números da direita. */
function Identificacao({ jogo }: { jogo: Game }) {
  const disponivel = jogo.status === 'ACTIVE';
  const prazo = jogo.endsAt ? formatCountdown(jogo.endsAt) : null;

  return (
    <div className="flex h-[50px] items-center gap-6">
      <IconButton aria-label="Editar jogo" className="shrink-0">
        <img src="./icons/figma/game-edit.svg" alt="" className="size-6" />
      </IconButton>

      <h2 className="shrink-0 text-headline text-white">{jogo.name}</h2>

      <Tag font="sans" size="sm" tone={disponivel ? 'emerald-soft' : 'ruby-soft'}>
        {disponivel ? 'Disponível' : 'Indisponível'}
      </Tag>

      <Tag font="sans" size="sm" tone="veil">
        <img src="./icons/figma/game-clock.svg" alt="" className="size-3" />
        {prazo ? `Termina em ${prazo}` : 'Terminado'}
      </Tag>

      <span className="flex-1" />

      <Numero
        icone="./icons/figma/players-lg.svg"
        valor={formatNumber(jogo.stats.playingNow)}
        label="Jogando agora"
      />
      <Numero
        icone="./icons/figma/game-tests.svg"
        valor={String(jogo.stats.activeTests)}
        label="Testes abertos"
      />
      <Numero valor={formatAmount(jogo.maxRewardCents)} label="Prêmio máximo" moeda />
    </div>
  );
}

function Numero({
  icone,
  valor,
  label,
  moeda,
}: {
  icone?: string;
  valor: string;
  label: string;
  moeda?: boolean;
}) {
  return (
    <div className="flex h-full w-[116.667px] shrink-0 flex-col items-center justify-center gap-1 whitespace-nowrap text-white">
      <p className="flex items-center gap-1 font-label text-[24px] font-bold">
        {icone && <img src={icone} alt="" className="size-6" />}
        {moeda && <span className="text-[12px] font-normal">R$</span>}
        {valor}
      </p>
      <p className="font-label text-[16px] font-light">{label}</p>
    </div>
  );
}

/**
 * Tabela de testes do jogo — Figma `312:7135`.
 *
 * Difere da tabela da Home nas colunas: sem "Jogo", com "Expira" e
 * "Recompensa". O botão vira "Relatório final" quando o teste acabou.
 */
function TabelaTestes({ testes }: { testes: Playtest[] }) {
  if (!testes.length) {
    return (
      <EmptyState
        title="Nenhum teste neste jogo"
        description="Crie o primeiro teste para começar a receber sessões."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <span className="flex-1">Teste</span>
        <span className="flex flex-1 items-center gap-2">
          Tipo
          <Ordenacao />
        </span>
        <span className="flex flex-1 items-center gap-2">
          Status
          <Ordenacao />
        </span>
        <span className="flex-1">Expira</span>
        <span className="flex-1">Data início</span>
        <span className="flex-1">Data fim</span>
        <span className="flex-1">Orbit Plug-in</span>
        <span className="flex flex-1 items-center gap-2">
          Recompensa
          <Ordenacao />
        </span>
        <span className="w-[265px] shrink-0">Ações</span>
      </TableHeader>

      {testes.map((teste) => {
        const encerrado = teste.status === 'FINISHED';

        return (
          <TableRow key={teste.id}>
            <span className="flex-1 truncate text-graphic text-white">{teste.title}</span>

            <span className="flex-1">
              <Tag tone="topaz">{teste.kind}</Tag>
            </span>
            <span className="flex-1">
              <Tag tone={TEST_STATUS_TONES[teste.status]}>{TEST_STATUS_LABELS[teste.status]}</Tag>
            </span>

            <span className="flex-1 text-graphic text-white">
              <Expira iso={teste.expiresAt} />
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

            <span className="flex-1 text-graphic text-white">
              {formatCurrency(teste.budget.rewardPerSessionCents)}
            </span>

            <span className="flex h-9 w-[265px] shrink-0 items-center justify-end gap-2.5">
              <Link
                to={ROUTES.studio.report(teste.id)}
                className={cn(
                  'flex h-full flex-1 items-center justify-center rounded-lg text-button text-white shadow-bevel',
                  encerrado ? 'bg-orbit-flame' : 'bg-orbit-nightfall',
                )}
              >
                {encerrado ? 'Relatório final' : 'Relatório'}
              </Link>
              <IconButton aria-label="Mais ações" className="shrink-0">
                <img src="./icons/figma/row-more.svg" alt="" className="size-6" />
              </IconButton>
            </span>
          </TableRow>
        );
      })}
    </Table>
  );
}

/** "27h 32m 54s" — números em Bold, unidades em Regular, como no arquivo. */
function Expira({ iso }: { iso: string }) {
  const restante = Math.max(0, new Date(iso).getTime() - Date.now());
  const total = Math.floor(restante / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  if (!total) return <>-</>;

  return (
    <>
      <b>{horas}</b>h <b>{String(minutos).padStart(2, '0')}</b>m{' '}
      <b>{String(segundos).padStart(2, '0')}</b>s
    </>
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
