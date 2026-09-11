import { PageHeading } from '@/components/Common/PageHeading';
import { GameCard } from '@/components/Common/GameCard';
import { ErrorState, SkeletonCard } from '@/components/UI';
import { useGames } from '@/hooks/useGames';
import { useStudioUser } from '@/stores/authStore';
import { ROUTES } from '@/utils/constants';

/**
 * TELA 03 — Meus jogos. Figma: frame `312:5924`.
 *
 * Cabeçalho, linha e uma grade de cards de 430px com 24 de intervalo — quatro
 * por linha nos 1792px de conteúdo. O último item é sempre o convite para
 * cadastrar um jogo novo.
 *
 * O arquivo não desenha busca nem filtro de status nesta tela; a versão
 * anterior tinha os dois e eles saíram.
 */
export function MeusJogos() {
  const studio = useStudioUser();
  const { data, isLoading, isError, refetch } = useGames(studio?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[{ label: 'Home', to: ROUTES.studio.home }, { label: 'Meus jogos' }]}
        titulo="Meus jogos"
      />

      {isError ? (
        <ErrorState description="Não conseguimos carregar os seus jogos." onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-2 folgado:grid-cols-3 figma:grid-cols-4 gap-6">
          {isLoading ? (
            <SkeletonCard />
          ) : (
            data?.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                to={ROUTES.studio.game(game.id)}
                className="w-full"
              />
            ))
          )}

          <NovoJogoCard />
        </div>
      )}
    </div>
  );
}

/**
 * Card "Novo jogo!" — Figma `312:6727`.
 *
 * Mesma moldura dos cards de jogo (borda `#0059A7`, cantos 24 só no topo-esquerdo
 * e na base-direita). O link não navega: o Figma não tem tela de cadastro de
 * jogo, e a regra aqui é não inventar destino — igual aos itens de navegação
 * que aparecem sem tela correspondente.
 */
function NovoJogoCard() {
  return (
    <div
      className="flex h-[430px] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-br-3xl rounded-tl-3xl border border-[#0059A7] px-4 py-2"
      title="Ainda não disponível"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="./icons/figma/novo-jogo.svg" alt="" className="size-12" />
        <p className="text-headline-mobile text-white">Novo jogo!</p>
        <p className="text-subtitle text-white">Adicione um novo jogo para teste.</p>
      </div>

      <span className="flex items-center gap-1 text-button text-orbit-blue">
        Adicionar
        <img src="./icons/figma/plus.svg" alt="" className="size-6" />
      </span>
    </div>
  );
}
