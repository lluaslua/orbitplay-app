import { Link } from 'react-router-dom';
import { Eye, Home } from 'lucide-react';
import { Button } from '@/components/UI';
import { ROUTES } from '@/utils/constants';

/**
 * Tela de saída do fluxo "Novo jogo" — sem bolinha no stepper, igual à
 * confirmação de Novo teste (`Step5Confirmation`). Selo verde entre dois
 * traços, título, nome do jogo entre aspas e os dois links do rodapé.
 */
export function ConfirmacaoNovoJogo({ gameId, gameName }: { gameId: string; gameName: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex w-full items-center justify-center gap-4">
          <span className="h-px w-[106px] bg-orbit-success" />
          <span className="grid size-8 place-items-center rounded-full bg-orbit-success text-white">
            <CheckIcon />
          </span>
          <span className="h-px w-[106px] bg-orbit-success" />
        </span>

        <h2 className="text-headline text-white">Jogo criado com sucesso!</h2>
        <p className="text-subtitle font-bold text-white">
          &ldquo;{gameName}&rdquo; foi adicionado ao seu estúdio.
        </p>
      </div>

      <hr className="border-orbit-border" />

      <div className="flex items-center justify-end gap-6">
        <Link
          to={ROUTES.studio.game(gameId)}
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
        >
          Ir para o jogo
          <Eye className="size-5" />
        </Link>

        <Button variant="nightfall" asChild>
          <Link to={ROUTES.studio.home}>
            Voltar para a Home
            <Home className="size-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
