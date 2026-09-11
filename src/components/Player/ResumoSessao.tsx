import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeading } from '@/components/Common/PageHeading';
import { Button, Card, Checkbox, ErrorState, Input, Radio, SkeletonCard, Tag } from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import { useSessionReview } from '@/hooks/usePlayer';
import type { Game, PlayerSessionReview } from '@/types';
import { ROUTES } from '@/utils/constants';
import { formatAmount, formatCountdown } from '@/utils/helpers';

/**
 * TELA 18 — Avaliação do jogo. Figma: frame `235:7874`.
 *
 * Dois cards: a sessão gravada (vídeo + transcrição com marcação de tempo) e o
 * formulário de avaliação.
 *
 * O formulário é fixo, não montado a partir das perguntas do teste: o arquivo
 * desenha estas nove perguntas com estes rótulos.
 */
const PROBLEMAS = [
  'Travamentos',
  'Bug visual',
  'Som com falha',
  'Problema de performance',
  'Outro',
];

export function ResumoSessao() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const sessao = useSessionReview();
  const jogo = useGame(sessao.data?.gameId);

  const [respostas, setRespostas] = useState<Record<string, string | number>>({});
  const [problemas, setProblemas] = useState<string[]>([]);

  if (sessao.isError) {
    return <ErrorState description="Não conseguimos carregar a sessão." onRetry={() => sessao.refetch()} />;
  }

  if (sessao.isLoading || !sessao.data) return <SkeletonCard />;

  function responder(campo: string, valor: string | number) {
    setRespostas((atual) => ({ ...atual, [campo]: valor }));
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (testId) navigate(ROUTES.player.result(testId));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.player.home },
          { label: 'jogos', to: ROUTES.player.catalog },
          { label: 'Detalhes', to: ROUTES.player.game(sessao.data.gameId) },
          { label: 'Avaliação do jogo' },
        ]}
        titulo="Avaliação do jogo"
      />

      <CardSessao sessao={sessao.data} jogo={jogo.data} />

      <Card className="gap-6 p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-headline text-white">Sua avaliação</h2>
          <p className="text-body text-white">
            Respostas claras, detalhadas e bem contextualizadas são avaliadas pela IA e recebem
            maior pontuação de qualidade, gerando insights mais relevantes e melhores recompensas.
          </p>
        </div>

        <hr className="border-orbit-border" />

        <form onSubmit={enviar} className="flex flex-col gap-6">
          <Escala
            campo="geral"
            rotulo="Avaliação geral*"
            maximo={5}
            valor={respostas.geral as number}
            onChange={responder}
          />
          <Escala
            campo="diversao"
            rotulo="Quão divertido foi?"
            maximo={10}
            valor={respostas.diversao as number}
            onChange={responder}
          />
          <Escala
            campo="desafio"
            rotulo="Nível do desafio"
            maximo={10}
            inicio="Fácil"
            fim="Difícil"
            valor={respostas.desafio as number}
            onChange={responder}
          />
          <Escala
            campo="rejogar"
            rotulo="Por quanto tempo você jogaria novamente?"
            maximo={10}
            inicio="Pouco tempo"
            fim="Muito tempo"
            valor={respostas.rejogar as number}
            onChange={responder}
          />

          <hr className="border-orbit-border" />

          <div className="flex flex-col gap-1">
            <span className="text-body-bold text-white">Você encontrou algum problema?</span>
            <div className="flex items-center gap-6">
              {PROBLEMAS.map((problema) => (
                <label key={problema} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={problemas.includes(problema)}
                    onCheckedChange={(marcado) =>
                      setProblemas((atuais) =>
                        marcado === true
                          ? [...atuais, problema]
                          : atuais.filter((item) => item !== problema),
                      )
                    }
                  />
                  <span className="whitespace-nowrap text-body text-white">{problema}</span>
                </label>
              ))}

              <Input
                value={(respostas.explique as string) ?? ''}
                onChange={(evento) => responder('explique', evento.target.value)}
                placeholder="Explique..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-body-bold text-white">
              Você recomendaria esse jogo a um amigo?
            </span>
            <div className="flex items-center gap-3">
              {['Sim', 'Não', 'Talvez'].map((opcao) => (
                <label key={opcao} className="flex cursor-pointer items-center gap-2 pr-3">
                  <span className="text-body text-white">{opcao}</span>
                  <Radio
                    name="recomendaria"
                    checked={respostas.recomendaria === opcao}
                    onChange={() => responder('recomendaria', opcao)}
              />
                </label>
              ))}
            </div>
          </div>

          <hr className="border-orbit-border" />

          <CampoLivre
            campo="divertido"
            rotulo="Qual foi o momento mais divertido do teste?"
            valor={respostas.divertido as string}
            onChange={responder}
          />
          <CampoLivre
            campo="incomodou"
            rotulo="O que mais te incomodou durante o jogo?"
            valor={respostas.incomodou as string}
            onChange={responder}
          />

          <hr className="border-orbit-border" />

          <CampoLivre
            campo="feedback"
            rotulo="Deixe o seu feedback"
            valor={respostas.feedback as string}
            onChange={responder}
          />

          <div className="flex justify-end">
            <Button variant="nightfall" type="submit">
              Enviar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/** Card do topo: identificação do teste e a sessão gravada. */
function CardSessao({ sessao, jogo }: { sessao: PlayerSessionReview; jogo?: Game }) {
  const disponivel = jogo?.status === 'ACTIVE';
  const prazo = jogo?.endsAt ? formatCountdown(jogo.endsAt) : null;

  return (
    <Card className="gap-6 p-8">
      <div className="flex gap-6">
        <img
          src={jogo?.bannerUrl ?? ''}
          alt=""
          className="h-[230px] w-[560px] max-w-[45%] shrink-0 rounded-xl object-cover"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <h2 className="shrink-0 text-headline text-white">{jogo?.name ?? 'Jogo'}</h2>
            <Tag font="sans" size="sm" tone={disponivel ? 'emerald-soft' : 'ruby-soft'}>
              {disponivel ? 'Disponível' : 'Indisponível'}
            </Tag>
            <Tag font="sans" size="sm" tone="veil">
              <img src="./icons/figma/game-clock.svg" alt="" className="size-3" />
              {prazo ? `Termina em ${prazo}` : 'Terminado'}
            </Tag>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-headline-mobile text-white">{sessao.testName}</span>
            <Tag tone="topaz">{sessao.testKind}</Tag>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex flex-col items-center whitespace-nowrap text-white">
              <span className="font-label text-[24px] font-bold">
                <span className="text-[12px] font-normal">R$</span>
                {formatAmount(sessao.rewardCents)}
              </span>
              <span className="font-label text-[16px] font-light">Prêmio</span>
            </span>

            <span className="flex flex-col items-center whitespace-nowrap text-white">
              <span className="flex items-center gap-1 font-label text-[24px] font-bold">
                <img src="./icons/figma/players-lg.svg" alt="" className="size-6" />
                {sessao.testsDone}
              </span>
              <span className="font-label text-[16px] font-light">Testes realizados</span>
            </span>
          </div>
        </div>
      </div>

      <hr className="border-orbit-border" />

      <h3 className="flex items-baseline gap-2">
        <span className="text-headline text-white">Sua sessão</span>
        <span className="text-headline-mobile text-orbit-muted">#{sessao.id}</span>
      </h3>

      <div className="flex gap-6">
        {/* Gravação: sem player real no MVP, fica a capa com o botão de play */}
        <div className="relative h-[397px] w-[706px] shrink-0 overflow-hidden rounded-xl">
          <img src={jogo?.bannerUrl ?? ''} alt="" className="size-full object-cover" />
          <img
            src="./icons/figma/tutorial-play.svg"
            alt=""
            className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="flex items-center gap-2 text-subtitle text-white">
            <img src="./icons/figma/question-image.svg" alt="" className="size-6" />
            Transcrição
          </p>

          <ol className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-2">
            {sessao.transcript.map((fala) => (
              <li key={fala.at} className="flex gap-2 text-body text-white">
                <span className="shrink-0 font-bold">{fala.at}</span>
                <span>{fala.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}

/**
 * Escala numérica.
 *
 * O arquivo usa caixas de seleção na "Avaliação geral" e rádios nas outras
 * três. Aqui todas são rádio: é uma nota única, e caixa deixaria marcar vários.
 */
function Escala({
  campo,
  rotulo,
  maximo,
  inicio,
  fim,
  valor,
  onChange,
}: {
  campo: string;
  rotulo: string;
  maximo: number;
  inicio?: string;
  fim?: string;
  valor?: number;
  onChange: (campo: string, valor: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body-bold text-white">{rotulo}</span>

      <div className="flex items-center gap-6">
        {inicio && <span className="whitespace-nowrap text-body text-white">{inicio}</span>}

        <div className="flex items-end gap-6">
          {Array.from({ length: maximo }, (_, indice) => indice + 1).map((nota) => (
            <label key={nota} className="flex w-6 cursor-pointer flex-col items-center gap-1">
              <span className="text-caption text-white">{nota}</span>
              <Radio
                name={campo}
                checked={valor === nota}
                onChange={() => onChange(campo, nota)}
                aria-label={`${rotulo}: ${nota}`}
              />
            </label>
          ))}
        </div>

        {fim && <span className="whitespace-nowrap text-body text-white">{fim}</span>}
      </div>
    </div>
  );
}

function CampoLivre({
  campo,
  rotulo,
  valor,
  onChange,
}: {
  campo: string;
  rotulo: string;
  valor?: string;
  onChange: (campo: string, valor: string) => void;
}) {
  return (
    <Input
      label={rotulo}
      value={valor ?? ''}
      onChange={(evento) => onChange(campo, evento.target.value)}
      placeholder="Digite..."
    />
  );
}
