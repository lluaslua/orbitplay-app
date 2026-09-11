import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
 */
export function Gameplay() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [painelAberto, setPainelAberto] = useState(true);
  const [microfone, setMicrofone] = useState(true);
  const [webcam, setWebcam] = useState(true);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
          onClick={() => testId && navigate(ROUTES.player.summary(testId))}
          className="flex items-center gap-2 rounded-[99px] border border-white p-1 text-button text-white"
        >
          Finalizar teste
          <img src="./icons/figma/rec-exit.svg" alt="" className="size-6" />
        </button>

        <button
          type="button"
          onClick={() => setMicrofone((v) => !v)}
          aria-pressed={microfone}
          aria-label={microfone ? 'Desligar microfone' : 'Ligar microfone'}
          className={cn('shrink-0', !microfone && 'opacity-40')}
        >
          <img src="./icons/figma/rec-mic.svg" alt="" className="size-6" />
        </button>

        <button
          type="button"
          onClick={() => setWebcam((v) => !v)}
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
