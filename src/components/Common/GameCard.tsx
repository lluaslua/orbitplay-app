import { Link } from 'react-router-dom';
import { Tag } from '@/components/UI';
import { gameImageStorage } from '@/stores/gamesStore';
import type { Game } from '@/types';
import { cn, formatAmount, formatCountdown, formatNumber } from '@/utils/helpers';

/**
 * Card de jogo — Figma `Game frame` (430×430), usado pelos dois perfis.
 *
 * São quatro faixas empilhadas com a mesma borda `#0059A7`, e só duas pontas
 * arredondadas: o canto superior esquerdo da capa e o inferior direito do botão.
 * As bordas se encostam (`-mt-px`) para não virar linha dupla no meio.
 *
 * O que muda entre as telas é a terceira faixa e o botão:
 *   estúdio   trio de prêmios  + "Configurar!"
 *   catálogo  trio de prêmios  + "Testar!"
 *   em curso  progresso por pista + "Continuar!" em laranja
 */
export interface GameTrack {
  id: string;
  name: string;
  /** 0 a 1. */
  progress: number;
  rewardCents: number;
}

export function GameCover({ game, className }: { game: Game; className?: string }) {
  const enviada = gameImageStorage.get(game.id);

  return (
    <img
      src={enviada ?? game.bannerUrl}
      alt=""
      className={cn('w-full rounded-lg object-cover', className ?? 'h-32')}
    />
  );
}

export function GameCard({
  game,
  to,
  ctaLabel = 'Configurar!',
  ctaTone = 'action',
  tracks,
  className,
}: {
  game: Game;
  to: string;
  ctaLabel?: string;
  /** `flame` é o laranja do "Continuar!"; `action` é o roxo→azul dos demais. */
  ctaTone?: 'action' | 'flame';
  /** Quando presente, substitui o trio de prêmios pelo progresso das pistas. */
  tracks?: GameTrack[];
  /**
   * Sobrescreve a largura fixa de 430px. As grades de quatro colunas passam
   * `w-full`: em 1920 a célula dá exatamente 430, mas assim o card encolhe em
   * vez de quebrar a linha quando a barra de rolagem rouba alguns pixels.
   */
  className?: string;
}) {
  const enviada = gameImageStorage.get(game.id);
  const capa = enviada ?? game.bannerUrl;

  const disponivel = game.status === 'ACTIVE';
  const prazo = game.endsAt ? formatCountdown(game.endsAt) : null;

  return (
    <article
      className={cn('flex h-[430px] w-[430px] shrink-0 flex-col overflow-hidden', className)}
    >
      {/* Capa + tags de estado */}
      <div className="relative flex h-[249px] shrink-0 items-start overflow-hidden rounded-tl-3xl border border-[#0059A7] p-2">
        <img src={capa} alt="" className="absolute inset-0 size-full object-cover" />

        <div className="relative flex min-w-0 flex-1 items-center gap-2">
          <Tag font="sans" tone={disponivel ? 'emerald-soft' : 'ruby-soft'}>
            {disponivel ? 'Disponível' : 'Indisponível'}
          </Tag>

          <Tag font="sans" tone="veil">
            <img src="./icons/figma/game-clock.svg" alt="" className="size-3" />
            {prazo ? `Termina em ${prazo}` : 'Terminado'}
          </Tag>

          {game.isNew && (
            <Tag font="sans" tone="yellow-soft">
              Novo
            </Tag>
          )}
        </div>
      </div>

      {/* Nome + jogadores */}
      <div className="-mt-px flex shrink-0 items-center gap-2 overflow-hidden border border-[#0059A7] px-4 py-2">
        <h3 className="min-w-0 flex-1 truncate text-[22px] font-bold text-white">{game.name}</h3>

        <span className="flex shrink-0 items-center gap-1">
          <img
            src="./icons/figma/game-players.svg"
            alt=""
            className="h-[16.8px] w-[17.024px] drop-shadow-[0_0_1.4px_rgba(0,0,0,0.5)]"
          />
          <span className="text-[18px] font-bold text-[#E6E6E6]">
            {formatNumber(game.stats.totalPlayers)}
          </span>
        </span>
      </div>

      {/* Corpo: progresso das pistas ou trio de prêmios */}
      <div
        className={cn(
          '-mt-px flex min-h-0 flex-1 overflow-hidden border border-[#0059A7] px-4 py-2',
          tracks
            ? 'flex-col items-center justify-center gap-2'
            : 'items-center justify-center gap-6',
        )}
      >
        {tracks
          ? tracks.map((pista) => <LinhaPista key={pista.id} pista={pista} />)
          : (
            <>
              <Numero
                label="Testes abertos"
                valor={String(game.stats.activeTests)}
                icone="./icons/figma/game-tests.svg"
              />
              <Numero label="Prêmio máximo" valor={formatAmount(game.maxRewardCents)} moeda />
              <Numero
                label="Prêmio restante"
                valor={formatAmount(game.stats.remainingRewardCents)}
                moeda
              />
            </>
          )}
      </div>

      <Link
        to={to}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-br-3xl py-2 font-label text-[24px] font-bold text-white shadow-bevel',
          ctaTone === 'flame' ? 'bg-orbit-flame' : 'bg-orbit-action',
        )}
      >
        {ctaLabel}
      </Link>
    </article>
  );
}

/** Uma pista do teste em andamento: nome, barra de progresso e recompensa. */
function LinhaPista({ pista }: { pista: GameTrack }) {
  return (
    <div className="flex w-full items-center justify-center gap-2.5">
      <p className="min-w-0 flex-1 truncate font-label text-[16px] font-light text-white">
        {pista.name}
      </p>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-label text-[14px] font-normal leading-[1.1] text-white">
          {Math.round(pista.progress * 100)}%
        </span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-orbit-blue"
            style={{ width: `${Math.min(100, Math.max(0, pista.progress * 100))}%` }}
          />
        </div>
      </div>

      <span className="w-[68px] shrink-0 text-graphic text-white">
        + R${formatAmount(pista.rewardCents)}
      </span>
    </div>
  );
}

/** Uma das três colunas do trio: valor grande em cima, rótulo embaixo. */
function Numero({
  label,
  valor,
  icone,
  moeda,
}: {
  label: string;
  valor: string;
  icone?: string;
  moeda?: boolean;
}) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 whitespace-nowrap text-white">
      <p className="flex items-center gap-1 font-label text-[24px] font-bold">
        {icone && <img src={icone} alt="" className="size-6" />}
        {moeda && <span className="text-[12px] font-normal">R$</span>}
        {valor}
      </p>
      <p className="font-label text-[16px] font-light">{label}</p>
    </div>
  );
}
