import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { PageHeading } from '@/components/Common/PageHeading';
import { ComunidadeJogo } from '@/components/Player/ComunidadeJogo';
import { ConquistasJogo } from '@/components/Player/ConquistasJogo';
import {
  EmptyState,
  ErrorState,
  IconButton,
  SkeletonCard,
  Table,
  TableHeader,
  TableRow,
  Tag,
} from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import { useGameHistory, usePlayerGameTests } from '@/hooks/usePlayer';
import { gameImageStorage } from '@/stores/gamesStore';
import type { Game, PlayerGameHistory, PlayerGameTest } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatAmount, formatCountdown, formatCurrency, formatNumber } from '@/utils/helpers';

/**
 * TELA 15 — Detalhes do jogo (visão do jogador). Figma: frame `199:1291`.
 *
 * Mesma anatomia da configuração de testes do estúdio — capa, identificação,
 * abas e tabela —, mas a tabela lista o que o **jogador** pode fazer.
 *
 * Quatro das cinco abas têm frame próprio: `199:1291` (Testes disponíveis),
 * `224:5627` (Meus testes), `224:6222` (Conquistas) e `395:2656` (Comunidade).
 * "Especificações" é a única sem tela desenhada, e a única que fica inerte.
 */
const ABAS = ['Testes disponíveis', 'Meus testes', 'Conquistas', 'Comunidade', 'Especificações'];

/** A partir deste índice não há frame no arquivo. */
const SEM_TELA = 4;

export function DetalhesJogoPlayer() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = useGame(gameId);
  const testes = usePlayerGameTests(gameId);
  const historico = useGameHistory(gameId);
  const [aba, setAba] = useState(0);

  if (game.isError) {
    return (
      <ErrorState description="Não conseguimos carregar o jogo." onRetry={() => game.refetch()} />
    );
  }

  if (game.isLoading || !game.data) return <SkeletonCard />;

  const jogo = game.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.player.home },
          { label: 'jogos', to: ROUTES.player.catalog },
          { label: 'Detalhes' },
        ]}
        titulo="Detalhes"
      />

      <Capa jogo={jogo} />

      <Identificacao jogo={jogo} />

      <div className="flex items-end">
        {ABAS.map((nome, indice) => {
          const ativa = indice === aba;
          const inerte = indice >= SEM_TELA;

          return (
            <button
              key={nome}
              type="button"
              onClick={inerte ? undefined : () => setAba(indice)}
              title={inerte ? 'Ainda não disponível' : undefined}
              className={cn('flex flex-col items-center pt-3', ativa ? 'gap-4' : 'gap-[17px]')}
            >
              <span
                className={cn(
                  'px-3 text-center text-body',
                  ativa ? 'font-bold text-orbit-blue' : 'text-white',
                  inerte && 'text-white/60',
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

      {aba === 3 ? (
        <ComunidadeJogo gameId={gameId} />
      ) : aba === 2 ? (
        <ConquistasJogo gameId={gameId} />
      ) : aba === 1 ? (
        <TabelaMeusTestes linhas={historico.data ?? []} />
      ) : testes.isError ? (
        <ErrorState
          description="Não conseguimos carregar os testes."
          onRetry={() => testes.refetch()}
        />
      ) : (
        <TabelaTestes testes={testes.data ?? []} />
      )}
    </div>
  );
}

function Capa({ jogo }: { jogo: Game }) {
  const enviada = gameImageStorage.get(jogo.id);

  return (
    <div className="relative h-[402px] overflow-hidden rounded-br-2xl rounded-tl-2xl">
      <img src={enviada ?? jogo.bannerUrl} alt="" className="size-full object-cover" />
      <div
        className="absolute bottom-0 left-0 h-[11px] bg-orbit-blue"
        style={{
          width: `${Math.min(100, Math.max(0, jogo.stats.campaignProgress * 100))}%`,
        }}
      />
    </div>
  );
}

function Identificacao({ jogo }: { jogo: Game }) {
  const disponivel = jogo.status === 'ACTIVE';
  const prazo = jogo.endsAt ? formatCountdown(jogo.endsAt) : null;

  return (
    <div className="flex h-[50px] items-center gap-6">
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
 * Tabela "Meus testes" — Figma `224:5627`.
 *
 * Mesmas colunas da tabela de testes disponíveis, com duas diferenças que o
 * arquivo faz questão de marcar: o cabeçalho diz "Progresso" (não "Seu
 * progresso") e a última coluna deixa de ser botão — vira o estado do que já foi
 * entregue, em laranja.
 */
function TabelaMeusTestes({ linhas }: { linhas: PlayerGameHistory[] }) {
  if (!linhas.length) {
    return (
      <EmptyState
        title="Você ainda não testou este jogo"
        description="Assim que concluir um teste, ele aparece aqui."
      />
    );
  }

  return (
    <Table larguraMinima={1150}>
      <TableHeader>
        <span className="flex-1">Nome do teste</span>
          <span className="flex w-[120px] shrink-0 items-center gap-2">
            Tipo
            <Ordenacao />
          </span>
          <span className="w-[130px] shrink-0">Expira</span>
          <span className="w-[140px] shrink-0">Duração estimada</span>
          <span className="w-[140px] shrink-0">Testes necessários</span>
          <span className="w-[180px] shrink-0">Progresso</span>
          <span className="flex w-[130px] shrink-0 items-center gap-2">
            Recompensa
            <Ordenacao />
          </span>
        <span className="w-[180px] shrink-0">Ações</span>
      </TableHeader>

      {linhas.map((linha) => (
        <TableRow key={linha.id}>
            <span className="flex-1 truncate text-graphic text-white">{linha.name}</span>

            <span className="w-[120px] shrink-0">
              <Tag tone={linha.kindTone}>{linha.kind}</Tag>
            </span>

            <span className="w-[130px] shrink-0 text-graphic text-white">
              {linha.expiresAt ? <Expira iso={linha.expiresAt} /> : <b>EXPIRADO</b>}
            </span>

            <span className="w-[140px] shrink-0 text-graphic text-white">
              <b>{linha.estimatedMinutes}</b>m
            </span>

            <span className="w-[140px] shrink-0 text-graphic text-white">
              {String(linha.slotsTaken).padStart(2, '0')}/{linha.slotsTotal}
            </span>

            <span className="flex w-[180px] shrink-0 items-center gap-2">
              <span className="text-graphic text-white">{Math.round(linha.progress * 100)}%</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                <span
                  className="block h-full rounded-full bg-[#56CA00]"
                  style={{ width: `${Math.min(100, Math.max(0, linha.progress * 100))}%` }}
                />
              </span>
            </span>

            <span className="w-[130px] shrink-0 text-graphic text-white">
              {formatCurrency(linha.rewardCents)}
            </span>

            <span className="flex w-[180px] shrink-0 items-center justify-end gap-2.5">
              <span className="flex-1 text-right text-button text-orbit-orange">{linha.status}</span>
              <IconButton aria-label="Mais ações" title="Ainda não disponível" className="shrink-0">
                <MoreVertical className="size-5" />
              </IconButton>
          </span>
        </TableRow>
      ))}
    </Table>
  );
}

/** Tabela "Testes disponíveis". */
function TabelaTestes({ testes }: { testes: PlayerGameTest[] }) {
  if (!testes.length) {
    return (
      <EmptyState
        title="Nenhum teste aberto"
        description="Assim que o estúdio abrir um teste, ele aparece aqui."
      />
    );
  }

  /*
   * Oito colunas, sete delas de largura fixa: somadas passam de 1150px e não há
   * como espremer sem quebrar a leitura. `larguraMinima` faz a tabela rolar
   * dentro do próprio card, em vez de empurrar a página inteira.
   */
  return (
    <Table larguraMinima={1150}>
      <TableHeader>
        <span className="flex-1">Nome do teste</span>
          <span className="flex w-[120px] shrink-0 items-center gap-2">
            Tipo
            <Ordenacao />
          </span>
          <span className="w-[130px] shrink-0">Expira</span>
          <span className="w-[140px] shrink-0">Duração estimada</span>
          <span className="w-[140px] shrink-0">Testes necessários</span>
          <span className="w-[180px] shrink-0">Seu progresso</span>
          <span className="flex w-[130px] shrink-0 items-center gap-2">
            Recompensa
            <Ordenacao />
          </span>
        <span className="w-[180px] shrink-0">Ações</span>
      </TableHeader>

      {testes.map((teste) => (
        <TableRow key={teste.id}>
            <span className="flex-1 truncate text-graphic text-white">{teste.name}</span>

            <span className="w-[120px] shrink-0">
              <Tag tone={teste.kindTone}>{teste.kind}</Tag>
            </span>

            <span className="w-[130px] shrink-0 text-graphic text-white">
              <Expira iso={teste.expiresAt} />
            </span>

            <span className="w-[140px] shrink-0 text-graphic text-white">
              <b>{teste.estimatedMinutes}</b>m
            </span>

            <span className="w-[140px] shrink-0 text-graphic text-white">
              {teste.slotsTaken}/{teste.slotsTotal}
            </span>

            <span className="flex w-[180px] shrink-0 items-center gap-2">
              <span className="text-graphic text-white">{Math.round(teste.progress * 100)}%</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                <span
                  className={cn(
                    'block h-full rounded-full',
                    teste.progress >= 1 ? 'bg-[#56CA00]' : 'bg-orbit-blue',
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, teste.progress * 100))}%`,
                  }}
                />
              </span>
            </span>

            <span
              className={cn(
                'flex w-[130px] shrink-0 items-center gap-1 text-graphic',
                teste.boosted ? 'font-bold text-orbit-orange' : 'text-white',
              )}
            >
              {formatCurrency(teste.rewardCents)}
              {teste.boosted && <span aria-label="Recompensa acima da média">↑</span>}
            </span>

            <span className="flex w-[180px] shrink-0 items-center justify-end gap-2.5">
              <Acao teste={teste} />
              <IconButton aria-label="Mais ações" className="shrink-0">
                <MoreVertical className="size-5" />
              </IconButton>
          </span>
        </TableRow>
      ))}
    </Table>
  );
}

/**
 * A coluna "Ações" só vira botão quando há o que fazer. Em análise, baixando ou
 * indisponível, o arquivo mostra texto — e é isso que o jogador precisa ler.
 */
function Acao({ teste }: { teste: PlayerGameTest }) {
  if (teste.action === 'REVIEW') {
    return (
      <span className="flex-1 text-center text-button text-orbit-g-emerald">
        Completo! (Em análise)
      </span>
    );
  }

  if (teste.action === 'DOWNLOADING') {
    return <span className="flex-1 text-center text-button text-white">Baixando Build...</span>;
  }

  if (teste.action === 'UNAVAILABLE') {
    return (
      <span className="flex-1 text-center text-caption text-white">
        Indisponível para seu dispositivo
      </span>
    );
  }

  const continuando = teste.action === 'CONTINUE';

  return (
    <Link
      to={continuando ? ROUTES.player.gameplay(teste.id) : ROUTES.player.tutorial(teste.id)}
      className={cn(
        'flex h-9 flex-1 items-center justify-center rounded-lg text-button text-white shadow-bevel',
        continuando ? 'bg-orbit-flame' : 'bg-orbit-action-wide',
      )}
    >
      {continuando ? 'Continuar!' : 'Começar!'}
    </Link>
  );
}

/** "27h 32m 54s" — números em Bold, unidades em Regular. */
function Expira({ iso }: { iso: string }) {
  const restante = Math.max(0, new Date(iso).getTime() - Date.now());
  const total = Math.floor(restante / 1000);

  if (!total) return <>-</>;

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  return (
    <>
      <b>{horas}</b>h <b>{String(minutos).padStart(2, '0')}</b>m{' '}
      <b>{String(segundos).padStart(2, '0')}</b>s
    </>
  );
}

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
