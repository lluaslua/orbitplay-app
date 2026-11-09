import { useEffect, useState } from 'react';
import { GameCard } from '@/components/Common/GameCard';
import { EmptyState, ErrorState, Input, SkeletonCard } from '@/components/UI';
import { useGames } from '@/hooks/useGames';
import type { Game } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { useSearchParams } from 'react-router-dom';

/**
 * TELA 14 — Jogos disponíveis. Figma: frame `849:2926`.
 *
 * Título com subtítulo, busca à direita, cinco abas e a grade de cards de 430px
 * — quatro por linha nos 1792px de conteúdo.
 *
 * Só "Populares" tem ordenação desenhada no arquivo. As outras quatro abas
 * já estão funcionando, além do filtro de busca.
 */
const ABAS = [
  {valor: 'popular', rotulo:'Populares'},
  {valor: 'top-paying', rotulo: 'Pagando mais'},
  {valor: 'new', rotulo: 'Novos jogos'},
  {valor: 'elite', rotulo: 'Exclusivos ELITE'},
  {valor: 'community', rotulo: 'Comunidades'},
] as const;

const ABA_PADRAO = ABAS[0].valor;
const ATRASO_BUSCA_MS = 300;

export function JogosDisponiveis() {
  const [params, setParams] = useSearchParams();

  const tabDaUrl = params.get('tab');
  const aba = ABAS.find((a) => a.valor === tabDaUrl)?.valor ?? ABA_PADRAO;
  const buscaDaUrl = params.get('search') ?? '';
  
  const [busca, setBusca] = useState(buscaDaUrl);

  useEffect(() => {
    if (busca === buscaDaUrl) return;
    const timer = setTimeout(() => {
      setParams(
        (atual) => {
          const proximo = new URLSearchParams(atual);
          if (busca.trim()) proximo.set('search', busca.trim());
          else proximo.delete('search');
          return proximo;
        },
        {replace: true},
      );
    }, ATRASO_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [busca, buscaDaUrl, setParams]);

  function mudarAba(valor: string) {
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        proximo.set('tab', valor);
        return proximo;
      },
      {replace: true},
    );
  }

  const { data, isLoading, isError, refetch } = useGames(undefined, {
    tab: aba,
    search: buscaDaUrl,
  });
  const jogos = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/*Titulo + busca */}
      <div className="flex items-center gap-6">
        <div className="flex shrink-0 flex-col text-white">
          <h1 className="text-headline">Jogos disponiveis</h1>
          <p className="text-caption-bold">Jogos em teste agora, escolha e ganhe!</p>
        </div>

        <span className="flex-1" />

        <Input
          className='w-[676px] shrink-0'
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder='Buscar jogo...'
          aria-label='Buscar jogo'
          iconRight={<img src="./icons/figma/search.svg" alt="" className="size-6" />}
        />
      </div>

      {/* Abas */}
      <div className="flex items-end">
        {ABAS.map(({ valor, rotulo }) => {
          const ativa = valor === aba;

          return (
            <button
            key={valor}
            type='button'
            onClick={() => mudarAba(valor)}
            className={cn('flex flex-col items-center pt-3', ativa ? 'gap-4' : 'gap-[17px]')}
          >
            <span
              className={cn(
                'px-3 text-center text-body',
              ativa ? 'font-bold text-orbit-blue' : 'text-white',
              )}
            >
              {rotulo}
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
    ) : jogos.length ? (
      <div className="grid grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
        {jogos.map((jogo: Game) => (
          <GameCard
            key={jogo.id}
            game={jogo}
            to={ROUTES.player.game(jogo.id)}
            ctaLabel='Testar!'
            className='w-full'
          />
        ))}
      </div>
    ) : (
      <EmptyState
        title='Nenhum jogo encontrado'
        description='Nenhum título corresponde à sua busca.'
      />
    )}
  </div>
  );
}