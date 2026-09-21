import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeading } from '@/components/Common/PageHeading';
import {
  FormasDePagamento,
  ResumoCompra,
} from '@/components/Studio/TestCreation/ResumoCompra';
import { Step1SelectModel } from '@/components/Studio/TestCreation/Step1SelectModel';
import { Step2CreateForm } from '@/components/Studio/TestCreation/Step2CreateForm';
import { Step3UploadBuild } from '@/components/Studio/TestCreation/Step3UploadBuild';
import { Step4Budget } from '@/components/Studio/TestCreation/Step4Budget';
import { Step5Confirmation } from '@/components/Studio/TestCreation/Step5Confirmation';
import { Button, Card, Stepper } from '@/components/UI';
import { useGames } from '@/hooks/useGames';
import { useCreateTest } from '@/hooks/useTests';
import { useStudioUser } from '@/stores/authStore';
import { useTestStore } from '@/stores/testStore';
import { ROUTES, TEST_STEPS } from '@/utils/constants';
import { cn } from '@/utils/helpers';

/**
 * TELAS 06-10 — Novo teste. Figma: `317:2262`, `319:7290`, `319:7985`,
 * `319:8624`, `319:9516` e `757:6564`.
 *
 * Tudo vive dentro de um card só: o stepper no topo, a barra de progresso, o
 * conteúdo da etapa e o botão de avançar no canto inferior direito.
 *
 * O stepper tem quatro bolinhas, mas o fluxo tem cinco telas — a confirmação
 * vem depois de "Orçamento" e não ganha bolinha, como no arquivo.
 */
const ULTIMA_ETAPA = 5;

/**
 * Quanto da barra fica azul em cada etapa, medido nos frames — ela não anda em
 * passos iguais: `317:2262` 285,7 de 1728 · `319:7290` 576 de 1728 ·
 * `319:7985` 861,7 de 1728 · `319:9516` 933,5 de 1122.
 */
const PROGRESSO_DA_ETAPA: Record<number, number> = {
  1: 285.7 / 1728,
  2: 576 / 1728,
  3: 861.7 / 1728,
  4: 933.5 / 1122,
};

/** O Nightfall do "Pagar e finalizar!" (`438:4329`) vem inclinado a 158,77° no arquivo. */
const DEGRADE_PAGAR =
  'linear-gradient(158.77deg, rgb(36, 143, 247) 18.801%, rgb(135, 90, 242) 81.199%)';

export default function StudioNewTestPage() {
  const createTest = useCreateTest();

  const [searchParams] = useSearchParams();
  const studio = useStudioUser();
  const games = useGames(studio?.id);

  const draft = useTestStore((state) => state.draft);
  const setGame = useTestStore((state) => state.setGame);

  /*
   * O Figma não desenha seleção de jogo no fluxo: ele começa na configuração de
   * um jogo. O id chega por `?game=`; sem ele, cai no primeiro jogo do estúdio
   * para que abrir a rota direto continue funcionando.
   */
  const gameIdAlvo = searchParams.get('game') ?? games.data?.[0]?.id ?? null;

  useEffect(() => {
    if (gameIdAlvo && draft.gameId !== gameIdAlvo) setGame(gameIdAlvo);
  }, [gameIdAlvo, draft.gameId, setGame]);

  const currentStep = useTestStore((state) => state.currentStep);
  const maxStepReached = useTestStore((state) => state.maxStepReached);
  const setStep = useTestStore((state) => state.setStep);
  const nextStep = useTestStore((state) => state.nextStep);
  const previousStep = useTestStore((state) => state.previousStep);
  const isStepValid = useTestStore((state) => state.isStepValid);

  /*
   * Não há efeito recalculando o orçamento aqui. Havia um que rodava enquanto
   * `totalCents` fosse zero — mas zero virou um estado legítimo (nenhum modelo
   * escolhido ainda, ou "até desativar o teste"), e o efeito passou a se
   * disparar em loop. Quem fecha a conta é a etapa 4, que conhece o modelo.
   */

  const podeAvancar = isStepValid(currentStep);
  const naEtapaDeCompra = currentStep === 4;
  const naConfirmacao = currentStep === ULTIMA_ETAPA;

  /**
   * "Pagar e finalizar" cria o teste e avança para a confirmação. Sair do fluxo
   * é decisão do usuário a partir dela, não um redirecionamento automático.
   */
  async function publicar() {
    await createTest.mutateAsync(draft);
    nextStep();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.studio.home },
          { label: 'jogos', to: ROUTES.studio.games },
          { label: 'Configuração', to: ROUTES.studio.games },
          { label: 'Novo teste' },
        ]}
        titulo="Novo teste"
      />

      <div className={cn('flex items-start gap-6', naEtapaDeCompra && 'flex-row')}>
      <Card className="min-w-0 flex-1 gap-0 p-8">
        {/* A confirmação não tem stepper no Figma: o fluxo já acabou. */}
        {!naConfirmacao && (
          <>
            <Stepper
              className="mx-auto w-[560px] flex-none"
              steps={TEST_STEPS.map((step) => ({ id: step.id, label: step.title }))}
              current={Math.min(currentStep, TEST_STEPS.length) - 1}
              onStepClick={(index) => {
                if (index + 1 <= maxStepReached) setStep(index + 1);
              }}
            />

            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-orbit-faint">
              <div
                className="h-full rounded-full bg-orbit-blue transition-[width]"
                style={{ width: `${(PROGRESSO_DA_ETAPA[currentStep] ?? 1) * 100}%` }}
              />
            </div>
          </>
        )}

        <div className={cn('animate-fade-in', !naConfirmacao && 'mt-6')}>
          {currentStep === 1 && <Step1SelectModel />}
          {currentStep === 2 && <Step2CreateForm />}
          {currentStep === 3 && <Step3UploadBuild />}
          {currentStep === 4 && <Step4Budget />}
          {currentStep === 5 && <Step5Confirmation />}
        </div>

        {createTest.isError && (
          <p className="mt-6 rounded-xl border border-orbit-error bg-orbit-error-bg p-3 text-graphic text-orbit-error">
            {(createTest.error as { message?: string })?.message ??
              'Não foi possível publicar o teste.'}
          </p>
        )}

        {/* Etapas 4 e 5 trazem o próprio rodapé: a 4 no resumo lateral, a 5 no fim da tela. */}
        {!naEtapaDeCompra && !naConfirmacao && (
          <div className="mt-6 flex items-center gap-6">
            {currentStep > 1 && <Voltar onClick={previousStep} />}

            <span className="h-0.5 flex-1 rounded-full bg-orbit-border/40" />

            <Button variant="nightfall" onClick={nextStep} disabled={!podeAvancar}>
              Próximo
            </Button>
          </div>
        )}
      </Card>

      {naEtapaDeCompra && (
        // 582px no desenho (1186 + 24 + 582 = 1792); abaixo do `figma` o card da etapa precisa do espaço.
        <aside className="w-[420px] shrink-0 figma:w-[582px]">
          <ResumoCompra>
            <FormasDePagamento />

            <div className="flex items-center justify-between gap-6">
              <Voltar onClick={previousStep} />

              <Button
                variant="nightfall"
                onClick={publicar}
                loading={createTest.isPending}
                disabled={!podeAvancar}
                style={{ backgroundImage: DEGRADE_PAGAR }}
              >
                Pagar e finalizar!
              </Button>
            </div>
          </ResumoCompra>
        </aside>
      )}
      </div>
    </div>
  );
}

/** "Voltar" com o `arrow_left_line` do arquivo (`438:4339`). */
function Voltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
    >
      <img src="./icons/figma/voltar.svg" alt="" className="size-6" />
      Voltar
    </button>
  );
}
