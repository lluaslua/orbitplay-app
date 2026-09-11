import { ErrorState, SkeletonCard } from '@/components/UI';
import { useGameAchievements } from '@/hooks/usePlayer';
import type { GameAchievement } from '@/types';
import { cn } from '@/utils/helpers';

/**
 * Aba "Conquistas" da tela do jogo — Figma `224:6222`.
 *
 * Grade de quatro por linha: ladrilho de 100 com o ícone de 48 dentro, título e
 * descrição ao lado. Conquista aberta é o degradê azul→roxo com um brilho azul
 * por trás; a bloqueada troca tudo por preto com brilho cinza e ganha um cadeado
 * no canto.
 */
export function ConquistasJogo({ gameId }: { gameId: string | undefined }) {
  const conquistas = useGameAchievements(gameId);

  if (conquistas.isError) {
    return (
      <ErrorState
        description="Não conseguimos carregar as conquistas."
        onRetry={() => conquistas.refetch()}
      />
    );
  }

  if (conquistas.isLoading || !conquistas.data) return <SkeletonCard />;

  return (
    <div className="grid grid-cols-2 gap-6 folgado:grid-cols-3 figma:grid-cols-4">
      {conquistas.data.map((conquista) => (
        <Conquista key={conquista.id} conquista={conquista} />
      ))}
    </div>
  );
}

function Conquista({ conquista }: { conquista: GameAchievement }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'relative grid size-[100px] shrink-0 place-items-center rounded-lg p-2.5',
          conquista.locked
            ? 'bg-orbit-bg drop-shadow-[0px_0px_5px_#8e8e8e]'
            : 'bg-orbit-nightfall-tile drop-shadow-[0px_0px_5px_#08f]',
        )}
      >
        <img
          src={`./icons/figma/conquista/${conquista.icon}.svg`}
          alt=""
          className="size-12"
        />

        {conquista.locked && (
          <img
            src="./icons/figma/conquista/cadeado.svg"
            alt="Bloqueada"
            className="absolute left-0 top-0 size-6"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center text-body text-white">
        <p className="font-bold">{conquista.title}</p>
        <p>{conquista.description}</p>
      </div>
    </div>
  );
}
