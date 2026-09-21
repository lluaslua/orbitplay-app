import { Link } from 'react-router-dom';
import { Eye, Home } from 'lucide-react';
import { ResumoCompra } from '@/components/Studio/TestCreation/ResumoCompra';
import { NEXT_STEPS_AFTER_PAYMENT, ROUTES } from '@/utils/constants';
import { Button } from '@/components/UI';

/**
 * ETAPA 5 — Pagamento concluído. Figma: `757:6564`.
 *
 * Não tem bolinha no stepper: é a tela de saída do fluxo. O mesmo "Resumo da
 * compra" da etapa 4 reaparece aqui, agora só de leitura.
 */
export function Step5Confirmation() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Selo verde entre dois traços, como no arquivo */}
        <span className="flex w-full items-center justify-center gap-4">
          <span className="h-px w-[106px] bg-orbit-success" />
          <span className="grid size-8 place-items-center rounded-full bg-orbit-success text-white">
            <CheckIcon />
          </span>
          <span className="h-px w-[106px] bg-orbit-success" />
        </span>

        <h2 className="text-headline text-white">Pagamento concluído!</h2>
        <p className="text-subtitle font-bold text-white">
          Seu pagamento foi confirmado e o teste foi criado com sucesso.
        </p>

        <div className="text-body text-white">
          <p>Próximos passos:</p>
          <ol className="list-inside list-decimal">
            {NEXT_STEPS_AFTER_PAYMENT.map((passo) => (
              <li key={passo}>{passo}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Na confirmação o card do resumo não tem fundo, a borda é branca e o respiro é 24 (`757:6719`). */}
      <ResumoCompra className="border-white bg-transparent p-6" />

      <div className="flex items-center gap-6">
        <Link
          to={ROUTES.studio.home}
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
        >
          Voltar para a Home
          <Eye className="size-5" />
        </Link>

        <span className="flex-1" />

        <button
          type="button"
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
          title="Ainda não disponível"
        >
          Baixar comprovante
          <Eye className="size-5" />
        </button>

        <Link
          to={ROUTES.studio.games}
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
        >
          Ver meus testes
          <Eye className="size-5" />
        </Link>

        <Button variant="nightfall" disabled title="Ainda não disponível">
          Ir para o teste
          <Home className="size-5" />
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
