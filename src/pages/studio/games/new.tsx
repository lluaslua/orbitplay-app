import { useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeading } from '@/components/Common/PageHeading';
import { ConfirmacaoNovoJogo } from '@/components/Studio/GameCreation/ConfirmacaoNovoJogo';
import { Step1Informacoes } from '@/components/Studio/GameCreation/Step1Informacoes';
import { Step2Midias } from '@/components/Studio/GameCreation/Step2Midias';
import { Step3Permissoes } from '@/components/Studio/GameCreation/Step3Permissoes';
import { useNovoJogoDraft } from '@/components/Studio/GameCreation/useNovoJogoDraft';
import { Button, Card, Stepper } from '@/components/UI';
import { useCreateGame } from '@/hooks/useGames';
import type { Genre, Platform } from '@/types';
import { NEW_GAME_STEPS, ROUTES } from '@/utils/constants';

const ULTIMA_ETAPA = 3;

/**
 * TELA — Novo jogo. As três etapas seguem os prints (Informações, Mídias,
 * Permissões); "Finalizar" cria o jogo de fato via `useCreateGame` e mostra a
 * confirmação — sem bolinha no stepper, igual à saída de Novo teste.
 */
export default function StudioNewGamePage() {
  const { draft, update } = useNovoJogoDraft();
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const createGame = useCreateGame();

  function irPara(etapa: number) {
    setCurrentStep(etapa);
    setMaxStepReached((atual) => Math.max(atual, etapa));
  }

  function finalizar() {
    createGame.mutate({
      name: draft.name,
      description: draft.shortDescription,
      shortDescription: draft.shortDescription,
      bannerUrl: draft.coverUrl,
      genres: draft.genres as Genre[],
      platforms: (draft.platform ? [draft.platform] : []) as Platform[],
    });
  }

  const criado = createGame.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.studio.home },
          { label: 'Meus jogos', to: ROUTES.studio.games },
          { label: 'Novo jogo' },
        ]}
        titulo="Novo jogo"
      />

      <Card className="min-w-0 gap-6 p-8">
        {criado ? (
          <ConfirmacaoNovoJogo gameId={criado.id} gameName={criado.name} />
        ) : (
          <>
            <Stepper
              className="mx-auto w-[560px] flex-none"
              steps={NEW_GAME_STEPS.map((titulo, indice) => ({ id: indice, label: titulo }))}
              current={currentStep - 1}
              onStepClick={(indice) => {
                const etapa = indice + 1;
                if (etapa <= maxStepReached) irPara(etapa);
              }}
            />

            <div className="animate-fade-in">
              {currentStep === 1 && <Step1Informacoes draft={draft} onChange={update} />}
              {currentStep === 2 && <Step2Midias draft={draft} onChange={update} />}
              {currentStep === 3 && <Step3Permissoes draft={draft} onChange={update} />}
            </div>

            {createGame.isError && (
              <p className="rounded-xl border border-orbit-error bg-orbit-error-bg p-3 text-graphic text-orbit-error">
                Não foi possível criar o jogo.
              </p>
            )}

            <div className="flex items-center gap-6">
              {currentStep > 1 && <Voltar onClick={() => irPara(currentStep - 1)} />}

              <span className="h-0.5 flex-1 rounded-full bg-orbit-border/40" />

              <button
                type="button"
                title="Ainda não disponível"
                className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
              >
                Salvar
                <Save className="size-5" />
              </button>

              {currentStep < ULTIMA_ETAPA ? (
                <Button variant="nightfall" onClick={() => irPara(currentStep + 1)}>
                  Próximo
                </Button>
              ) : (
                <Button variant="nightfall" onClick={finalizar} loading={createGame.isPending}>
                  Finalizar
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/** "Voltar" com o `arrow_left_line` do arquivo — mesmo ícone do Novo teste. */
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
