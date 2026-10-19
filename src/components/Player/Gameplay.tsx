import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useBuildDoTeste, useEventosDaSessao } from '@/hooks/usePlayer';
import { useSessaoStore } from '@/stores/sessaoStore';
import type { SessionEventType } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn, formatDuration } from '@/utils/helpers';

/**
 * TELA 17 — Gameplay. Figma: `224:7594` (build ainda carregando) e `224:7869`.
 *
 * A tela é o jogo rodando: o app não desenha nada em cima dele além do painel
 * de gravação, encostado na borda esquerda. Por isso ela usa o layout `bare`,
 * sem navegação.
 *
 * O painel pode ser fechado pelo ×, mas a tarja "Recording..." fica — é o que
 * garante que o jogador saiba que a sessão continua sendo gravada.
 *
 * O cronômetro é o da sessão começada no "Iniciar Jogo!" do tutorial: recarregar
 * não zera. Ligar ou desligar microfone e webcam vira evento da sessão, com o
 * segundo em que aconteceu, e "Finalizar teste" fecha a sessão antes da avaliação.
 */
export function Gameplay() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [painelAberto, setPainelAberto] = useState(true);
  const [microfone, setMicrofone] = useState(true);
  const [webcam, setWebcam] = useState(true);
  const sessao = useSessaoStore();
  const build = useBuildDoTeste(testId);
  const eventos = useEventosDaSessao();
  const [segundos, setSegundos] = useState(() => sessao.segundos());

  useEffect(() => {
    const timer = window.setInterval(() => setSegundos(useSessaoStore.getState().segundos()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Teste sem build não tem tela de jogo: vai direto às perguntas.
  if (build.isError && testId) return <Navigate to={ROUTES.player.summary(testId)} replace />;
  if (build.isLoading) return null;

  /** Registra na sessão o que o jogador ligou ou desligou, no segundo em que fez. */
  function registrar(type: SessionEventType, label: string) {
    if (!sessao.participationId || sessao.testId !== testId) return;
    eventos.mutate({
      participationId: sessao.participationId,
      events: [{ atSecond: sessao.segundos(), type, label }],
    });
  }

  function alternarMicrofone() {
    registrar(microfone ? 'MIC_OFF' : 'MIC_ON', microfone ? 'Microfone desligado' : 'Microfone ligado');
    setMicrofone((v) => !v);
  }

  function alternarWebcam() {
    registrar(webcam ? 'CAM_OFF' : 'CAM_ON', webcam ? 'Webcam desligada' : 'Webcam ligada');
    setWebcam((v) => !v);
  }

  function finalizar() {
    if (!testId) return;
    sessao.encerrar();
    navigate(ROUTES.player.summary(testId));
  }

  /*
   * `fixed` abaixo da barra de título (40px): aqui a tela é a janela do jogo,
   * e `h-full` não resolveria — o `main` é filho flex e a altura percentual
   * colapsa para zero.
   */
  return (
    <div className="fixed inset-0 top-10 overflow-hidden bg-orbit-bg">
      {/*
        Área do jogo. Num app real é a janela da build; aqui fica o fundo do
        arquivo, que é o que o Figma mostra enquanto a build não abriu.
      */}
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-subtitle text-orbit-faint">A build está rodando nesta janela.</p>
      </div>

      {painelAberto && (
        <div className="absolute bottom-[99px] left-0 flex w-[367px] flex-col gap-1 rounded-br-3xl rounded-tr-3xl bg-orbit-bg/50 px-4 py-2 backdrop-blur-[4px]">
          <div className="flex w-full items-start gap-2.5">
            <img src="./icons/figma/rec-logo.svg" alt="OrbitPlay" className="h-[27.318px] w-[120.39px]" />
            <span className="h-px flex-1" />
            <button
              type="button"
              onClick={() => setPainelAberto(false)}
              aria-label="Fechar aviso de gravação"
              className="-mt-1 shrink-0"
            >
              <img src="./icons/figma/rec-close.svg" alt="" className="size-6" />
            </button>
          </div>

          <p className="flex items-center gap-1 text-headline-mobile text-white">
            <img src="./icons/figma/rec-dot.svg" alt="" className="size-[14.832px]" />
            Gravação em andamento
          </p>

          <p className="w-[289px] text-subtitle text-white">
            Sua tela, áudio do microfone e webcam estão sendo gravados para fins de análise do
            teste.
          </p>
        </div>
      )}

      {/* Barra de ações, sempre visível */}
      <div className="absolute bottom-[35px] left-0 flex items-center gap-2 rounded-br-[99px] rounded-tr-[99px] bg-orbit-bg/50 px-4 py-2 backdrop-blur-[4px]">
        <button
          type="button"
          onClick={finalizar}
          className="flex items-center gap-2 rounded-[99px] border border-white p-1 text-button text-white"
        >
          Finalizar teste
          <img src="./icons/figma/rec-exit.svg" alt="" className="size-6" />
        </button>

        <button
          type="button"
          onClick={alternarMicrofone}
          aria-pressed={microfone}
          aria-label={microfone ? 'Desligar microfone' : 'Ligar microfone'}
          className={cn('shrink-0', !microfone && 'opacity-40')}
        >
          <img src="./icons/figma/rec-mic.svg" alt="" className="size-6" />
        </button>

        <button
          type="button"
          onClick={alternarWebcam}
          aria-pressed={webcam}
          aria-label={webcam ? 'Desligar webcam' : 'Ligar webcam'}
          className={cn('shrink-0', !webcam && 'opacity-40')}
        >
          <img src="./icons/figma/rec-webcam.svg" alt="" className="size-6" />
        </button>
      </div>

      <p className="absolute bottom-[11px] left-4 flex items-center gap-1 text-body text-white">
        <img src="./icons/figma/rec-dot.svg" alt="" className="size-[7.416px]" />
        Recording... {formatDuration(segundos)}
      </p>
    </div>
  );
}
