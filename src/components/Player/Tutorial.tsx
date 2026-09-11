import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TUTORIAL_OBSERVAR, TUTORIAL_DICAS, ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { Button } from '@/components/UI';

/**
 * TELA 16 — Tutorial. Figma: `224:7273`, `224:7334`, `224:7409`, `224:7481` e
 * `224:7540`.
 *
 * É um modal de 1140px sobre a tela, não uma página inteira. São quatro etapas;
 * as duas últimas telas do arquivo são a mesma etapa em dois momentos do
 * download — com a build ainda baixando o botão fica desabilitado, e ao chegar
 * a 100% a barra fica verde e aparece "Rever tutorial".
 *
 * O download é simulado: sem backend, a barra avança sozinha para que a última
 * etapa saia do estado desabilitado como no desenho.
 */
const DURACAO_DOWNLOAD_MS = 18_000;

/** Vídeo do tutorial — o `v=` da URL que o YouTube usa como id do embed. */
const VIDEO_TUTORIAL = '5E_m9mv83k0';

export function Tutorial() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState(0);
  const [progresso, setProgresso] = useState(0.08);

  useEffect(() => {
    const inicio = Date.now();
    const timer = window.setInterval(() => {
      const decorrido = (Date.now() - inicio) / DURACAO_DOWNLOAD_MS;
      setProgresso(Math.min(1, 0.08 + decorrido * 0.92));
    }, 200);

    return () => window.clearInterval(timer);
  }, []);

  const pronto = progresso >= 1;
  const ultima = etapa === 3;

  function sair() {
    navigate(-1);
  }

  function avancar() {
    if (!ultima) return setEtapa((atual) => atual + 1);
    if (pronto && testId) navigate(ROUTES.player.gameplay(testId));
  }

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="flex w-[1140px] max-w-full flex-col gap-6 rounded-2xl border border-orbit-dim bg-orbit-bg px-6 pb-6 pt-4">
        {/* Cabeçalho: a última etapa esconde o título, como no arquivo */}
        <div className="flex items-center justify-end pl-6 pr-4">
          {!ultima && (
            <h1 className="flex-1 text-headline text-white">Tutorial: Teste demo livre</h1>
          )}
          <button type="button" onClick={sair} aria-label="Fechar tutorial">
            <img src="./icons/figma/tutorial-close.svg" alt="" className="size-6" />
          </button>
        </div>

        {etapa === 0 && <EtapaVideo />}
        {etapa === 1 && <EtapaObservar />}
        {etapa === 2 && <EtapaDicas />}
        {etapa === 3 && <EtapaPronto />}

        <hr className="border-orbit-blue-deep" />

        <div className="flex items-center justify-end gap-6">
          {etapa === 0 && (
            <button
              type="button"
              onClick={sair}
              className="flex h-12 items-center gap-2.5 rounded-lg px-8 text-button text-orbit-blue"
            >
              Pular tutorial
              <img src="./icons/figma/tutorial-skip.svg" alt="" className="size-6 -scale-x-100" />
            </button>
          )}

          {ultima && pronto && (
            <button
              type="button"
              onClick={() => setEtapa(0)}
              className="flex h-12 items-center gap-2.5 rounded-lg px-8 text-button text-orbit-blue"
            >
              Rever tutorial
              <img src="./icons/figma/tutorial-skip.svg" alt="" className="size-6" />
            </button>
          )}

          <span className="h-0.5 flex-1" />

          {!ultima && <Bolinhas total={4} atual={etapa} />}

          {/*
            Enquanto a build baixa o botão fica cinza `orbit-faint`, que é o
            desabilitado desenhado no arquivo — diferente do cinza claro padrão
            do design system, por isso vem por `className`.
          */}
          <Button
            variant="nightfall"
            onClick={avancar}
            disabled={ultima && !pronto}
            className={cn(ultima && !pronto && 'disabled:bg-orbit-faint disabled:text-white')}
          >
            {ultima ? 'Iniciar Jogo!' : 'Próximo'}
          </Button>
        </div>

        {/* Download da build */}
        <div className="flex items-center gap-1">
          <span className="font-label text-[14px] font-normal leading-[1.1] text-white">
            Baixando a build
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-[99px] bg-white">
            <span
              className={cn(
                'block h-full rounded-[40px] transition-[width]',
                pronto ? 'bg-orbit-g-emerald' : 'bg-orbit-nightfall',
              )}
              style={{ width: `${progresso * 100}%` }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

function Bolinhas({ total, atual }: { total: number; atual: number }) {
  return (
    <span className="flex items-center gap-2" aria-label={`Etapa ${atual + 1} de ${total}`}>
      {Array.from({ length: total }).map((_, indice) => (
        <span
          key={indice}
          className={cn(
            'size-4 rounded-full',
            indice <= atual ? 'bg-orbit-blue-deep' : 'bg-orbit-faint',
          )}
        />
      ))}
    </span>
  );
}

/** Etapa 1 — o vídeo de como fazer um bom playtest. */
function EtapaVideo() {
  return (
    <>
      <p className="w-full text-subtitle text-white">
        Enquanto a build do jogo está baixando, você vai passar por um breve tutorial. Assim,
        aprende como testar da melhor forma e ganhar mais pontos de feedback!
      </p>

      {/*
        O arquivo desenha uma capa com o botão de play; aqui entra o vídeo de
        verdade, na mesma caixa de 610×350 e raio 20.

        `youtube-nocookie` em vez de `youtube.com`: é o domínio de embed que não
        grava cookie de rastreio antes de o usuário dar play. Ele precisa estar
        liberado no `frame-src` do CSP em `index.html` — sem isso o iframe é
        bloqueado em silêncio.
      */}
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${VIDEO_TUTORIAL}`}
        title="Saiba como fazer um bom playtest de um jogo!"
        className="h-[350px] w-[610px] rounded-[20px] border-0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      <div className="flex w-[610px] flex-col gap-1 text-body text-white">
        <p className="font-bold">Saiba como fazer um bom playtest de um jogo!</p>
        <p>
          Neste video, Cláudio Gusmão da UX4INDIE mostra como dar um feedback eficaz após realizar
          o playtest de um game. Aprenda...
        </p>
      </div>
    </>
  );
}

/** Etapa 2 — quatro coisas para observar durante a sessão. */
function EtapaObservar() {
  return (
    <>
      <p className="w-full text-subtitle text-white">O que observar?</p>

      <div className="flex w-full gap-6">
        {TUTORIAL_OBSERVAR.map((item, indice) => (
          <div key={item.titulo} className="flex min-w-0 flex-1 flex-col gap-2">
            <img
              src={`./images/tutorial/observar-${indice + 1}.webp`}
              alt=""
              className="h-[185px] w-full rounded-lg object-cover"
            />
            <p className="text-body-bold text-white">{item.titulo}</p>
            <p className="text-body text-white">{item.texto}</p>
            <p className="text-body-bold text-orbit-orange">{item.chamada}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/** Etapa 3 — dicas de como escrever o feedback. */
function EtapaDicas() {
  return (
    <>
      <p className="w-full text-subtitle text-white">Dicas para o formulário</p>

      <div className="grid w-full grid-cols-2 gap-x-10 gap-y-8">
        {TUTORIAL_DICAS.map((dica, indice) => (
          <div key={dica.titulo} className="flex flex-col gap-2">
            <img
              src={`./icons/figma/tutorial-dica-${indice + 1}.svg`}
              alt=""
              className="size-10"
            />
            <p className="text-body-bold text-white">{dica.titulo}</p>
            <p className="text-body text-white">{dica.texto}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/** Etapa 4 — confirmação, com o botão liberado só quando a build termina. */
function EtapaPronto() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-orbit-nightfall">
        <svg viewBox="0 0 24 24" className="size-8 text-orbit-bg" fill="none" aria-hidden>
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <h2 className="text-headline text-white">Tudo pronto!</h2>
      <p className="text-subtitle font-bold text-white">
        Assim que a build estiver pronta voce poderá começar o seu teste, divirta-se!
      </p>
      <p className="text-body text-orbit-muted">
        Lembrando que a recompensa só será enviada após o feedback, Se fechar sem enviar feedback,
        não conta.
      </p>
    </div>
  );
}
