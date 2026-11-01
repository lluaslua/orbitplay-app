import { useEffect, useState } from 'react';
import { GameCard } from '@/components/Common/GameCard';
import { EmptyState, ErrorState, Input, SkeletonCard } from '@/components/UI';
import { useGames } from '@/hooks/useGames';
import type { CatalogTab, Game } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

/**
 * TELA 14 — Jogos disponíveis. Figma: frame `849:2926`.
 *
 * Título com subtítulo, busca à direita, cinco abas e a grade de cards de 430px
 * — quatro por linha nos 1792px de conteúdo.
 *
 * As cinco abas são as de `GET /games?tab=`. A busca espera um instante e vai
 * em `search`, para não pedir a lista a cada tecla.
 */
const ABAS: { rotulo: string; id: CatalogTab }[] = [
  { rotulo: 'Populares', id: 'POPULAR' },
  { rotulo: 'Pagando mais', id: 'TOP_PAYING' },
  { rotulo: 'Novos jogos', id: 'NEW' },
  { rotulo: 'Exclusivos ELITE', id: 'ELITE' },
  { rotulo: 'Comunidades', id: 'COMMUNITIES' },
];

export function JogosDisponiveis() {
  const [aba, setAba] = useState<CatalogTab>('POPULAR');
  const [busca, setBusca] = useState('');
  const [buscaEnviada, setBuscaEnviada] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaEnviada(busca.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [busca]);

  const { data, isLoading, isError, refetch } = useGames(undefined, {
    aba,
    busca: buscaEnviada || undefined,
  });
  const filtrados = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Título + busca */}
      <div className="flex items-center gap-6">
        <div className="flex shrink-0 flex-col text-white">
          <h1 className="text-headline">Jogos disponiveis</h1>
          <p className="text-caption-bold">Jogos em teste agora, escolha e ganhe!</p>
        </div>

        <span className="flex-1" />

        <Input
          className="w-[676px] shrink-0"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar jogo..."
          aria-label="Buscar jogo"
          iconRight={<img src="./icons/figma/search.svg" alt="" className="size-6" />}
        />
      </div>

      {/* Abas */}
      <div className="flex items-end">
        {ABAS.map((item) => {
          const ativa = item.id === aba;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setAba(item.id)}
              className={cn('flex flex-col items-center pt-3', ativa ? 'gap-4' : 'gap-[17px]')}
            >
              <span
                className={cn(
                  'px-3 text-center text-body',
                  ativa ? 'font-bold text-orbit-blue' : 'text-white',
                )}
              >
                {item.rotulo}
              </span>
              <span className={cn('w-full', ativa ? 'h-0.5 bg-orbit-blue' : 'h-px bg-white')} />
            </button>
          );
        })}
        <span className="h-px flex-1 bg-white" />
      </div>

      {isError ? (
        <ErrorState description="Não conseguimos carregar o catálogo." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-wrap gap-6">
          <SkeletonCard />
        </div>
      ) : filtrados.length ? (
        <div className="grid grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
          {filtrados.map((jogo: Game) => (
            <GameCard
              key={jogo.id}
              game={jogo}
              to={ROUTES.player.game(jogo.id)}
              ctaLabel="Testar!"
              className="w-full"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum jogo encontrado"
          description="Nenhum título corresponde à sua busca."
        />
      )}
    </div>
  );
}
