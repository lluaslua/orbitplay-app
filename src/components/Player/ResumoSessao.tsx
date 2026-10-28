import { Fragment, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeading } from '@/components/Common/PageHeading';
import { CampoPergunta } from '@/components/Player/CampoPergunta';
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Input,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SkeletonCard,
  Tag,
} from '@/components/UI';
import { useGame } from '@/hooks/useGames';
import {
  useAbrirJogo,
  useBuildDoTeste,
  useDesistirDoTeste,
  useEventosDaSessao,
  useSessionReview,
  useSubmitSession,
} from '@/hooks/usePlayer';
import { useSessaoStore } from '@/stores/sessaoStore';
import type { ApiError, FormQuestion, Game, PlayerSessionReview } from '@/types';
import {
  eventosDosProblemas,
  montarEnvio,
  validarRespostas,
  type Resposta,
  type Respostas,
} from '@/utils/avaliacao';
import { ROUTES } from '@/utils/constants';
import { formatAmount, formatCountdown } from '@/utils/helpers';
import { avaliacaoBloqueada, avisoDoJogo } from '@/utils/jogo';

/**
 * TELA 18 — Avaliação do jogo. Figma: frame `235:7874`.
 *
 * Dois cards: a sessão gravada (vídeo + transcrição com marcação de tempo) e o
 * formulário de avaliação.
 *
 * O formulário é o que o estúdio montou na etapa 2 do Novo teste
 * (`review.questions`), no visual do arquivo (`CampoPergunta`). O bloco "Você
 * encontrou algum problema?" é fixo do app: ele vira os bugs reportados e os
 * eventos BUG da sessão. "Enviar" manda tudo para a API, que calcula XP,
 * recompensa e conquistas, e leva ao resultado.
 *
 * Com build, o formulário só abre depois de jogar (`review.play`, Tela 17): quem
 * não abriu o jogo ou fechou logo volta ao jogo ou desiste do teste. Jogo que
 * travou ou que não chegou ao tempo do teste abre o formulário com um aviso.
 */
/** As escalas que abrem o formulário no arquivo — o bloco de problemas vem logo depois delas. */
const ESCALAS: FormQuestion['type'][] = ['LINEAR_SCALE', 'RATING'];
const ESCRITAS: FormQuestion['type'][] = ['SHORT_TEXT', 'PARAGRAPH'];

/**
 * Divisória antes de uma resposta escrita que vem depois de outro tipo de
 * pergunta (ou do bloco de problemas), como entre "recomendaria" e "Qual foi o
 * momento mais divertido do teste?" no arquivo.
 */
function abreGrupoEscrito(perguntas: FormQuestion[], indice: number, depoisDoBloco: boolean): boolean {
  if (!ESCRITAS.includes(perguntas[indice].type)) return false;
  if (indice === 0) return depoisDoBloco;
  return !ESCRITAS.includes(perguntas[indice - 1].type);
}

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
  const sessao = useSessionReview(testId);
  const jogo = useGame(sessao.data?.gameId);
  // Sem build (o A/B de imagens) não houve jogo rodando: só as perguntas.
  const build = useBuildDoTeste(testId);
  const enviarSessao = useSubmitSession();
  const eventos = useEventosDaSessao();
  const sessaoDeJogo = useSessaoStore();
  const abrirJogo = useAbrirJogo();
  const desistir = useDesistirDoTeste();
  const [confirmarDesistencia, setConfirmarDesistencia] = useState(false);

  const [respostas, setRespostas] = useState<Respostas>({});
  const [problemas, setProblemas] = useState<string[]>([]);
  const [explicacao, setExplicacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  // "Tempo médio da avaliação" do relatório: do formulário aberto ao envio.
  const abertoEm = useRef(Date.now());

  if (sessao.isError) {
    return <ErrorState description="Não conseguimos carregar a sessão." onRetry={() => sessao.refetch()} />;
  }

  if (sessao.isLoading || !sessao.data) return <SkeletonCard />;

  const review = sessao.data;
  // Desistiu do teste: não há avaliação, volta ao jogo no catálogo.
  if (review.status === 'ABANDONED' && !desistir.isPending) {
    return <Navigate to={ROUTES.player.game(review.gameId)} replace />;
  }
  // Já enviada: a avaliação não abre de novo, o lugar é o resultado.
  if (review.status !== 'IN_PROGRESS' && testId && !enviarSessao.isPending && !enviarSessao.isSuccess) {
    return <Navigate to={ROUTES.player.result(testId)} replace />;
  }

  const partida = review.play ?? null;
  const bloqueada = avaliacaoBloqueada(partida);
  const aviso = avisoDoJogo(partida);

  async function voltarAoJogo() {
    if (!testId || !build.data) return;
    try {
      await abrirJogo.mutateAsync({ participationId: review.id, build: build.data });
    } catch {
      return;
    }
    navigate(ROUTES.player.gameplay(testId));
  }

  async function desistirDoTeste() {
    if (!testId) return;
    try {
      await desistir.mutateAsync(testId);
    } catch {
      return;
    }
    if (sessaoDeJogo.testId === testId) sessaoDeJogo.limpar();
    navigate(ROUTES.player.game(review.gameId));
  }

  function responder(perguntaId: string, valor: Resposta) {
    setRespostas((atual) => ({ ...atual, [perguntaId]: valor }));
    setErros((atuais) => {
      const restantes = { ...atuais };
      delete restantes[perguntaId];
      return restantes;
    });
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!testId) return;

    const pendentes = validarRespostas(review.questions, respostas);
    setErros(pendentes);
    if (Object.keys(pendentes).length) return;

    const mesmaSessao = sessaoDeJogo.testId === testId;
    const duracao = mesmaSessao ? sessaoDeJogo.segundos() : 0;

    try {
      if (problemas.length) {
        await eventos.mutateAsync({
          participationId: review.id,
          events: eventosDosProblemas(problemas, explicacao, duracao),
        });
      }
      await enviarSessao.mutateAsync({
        testId,
        submission: {
          participationId: review.id,
          answers: montarEnvio(review.questions, respostas),
          bugsReported: problemas.length,
          durationSeconds: duracao,
          formSeconds: Math.round((Date.now() - abertoEm.current) / 1000),
        },
      });
    } catch (motivo) {
      // Obrigatória que só a API pegou: o erro vem por `answers.<id>`.
      const campos = (motivo as ApiError).fields ?? {};
      setErros(
        Object.fromEntries(
          Object.entries(campos)
            .filter(([campo]) => campo.startsWith('answers.'))
            .map(([campo, mensagem]) => [campo.slice('answers.'.length), mensagem]),
        ),
      );
      return;
    }

    if (mesmaSessao) sessaoDeJogo.limpar();
    navigate(ROUTES.player.result(testId));
  }

  const falha = (enviarSessao.error ?? eventos.error) as ApiError | null;

  const inicioSemEscala = review.questions.findIndex((pergunta) => !ESCALAS.includes(pergunta.type));
  const corte = inicioSemEscala === -1 ? review.questions.length : inicioSemEscala;
  const perguntasAntes = review.questions.slice(0, corte);
  const perguntasDepois = review.questions.slice(corte);

  const campo = (pergunta: FormQuestion) => (
    <CampoPergunta
      key={pergunta.id}
      pergunta={pergunta}
      valor={respostas[pergunta.id]}
      erro={erros[pergunta.id]}
      onChange={(valor) => responder(pergunta.id, valor)}
    />
  );

  // "Você encontrou algum problema?" — fixo do app: vira os bugs reportados. Sem build não há jogo onde achar bug.
  const blocoProblemas = !build.isSuccess ? null : (
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
          value={explicacao}
          onChange={(evento) => setExplicacao(evento.target.value)}
          placeholder="Explique..."
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[
          { label: 'Home', to: ROUTES.player.home },
          { label: 'jogos', to: ROUTES.player.catalog },
          { label: 'Detalhes', to: ROUTES.player.game(review.gameId) },
          { label: 'Avaliação do jogo' },
        ]}
        titulo="Avaliação do jogo"
      />

      {build.isSuccess && <CardSessao sessao={review} jogo={jogo.data} />}

      {bloqueada && aviso ? (
        <Card className="gap-6 p-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-headline text-white">{aviso.titulo}</h2>
            <p className="text-body text-white">{aviso.texto}</p>
          </div>

          {(abrirJogo.error || desistir.error) && (
            <p className="rounded-xl border border-orbit-error bg-orbit-error-bg p-3 text-graphic text-orbit-error">
              {((abrirJogo.error ?? desistir.error) as ApiError).message}
            </p>
          )}

          <div className="flex justify-end gap-6">
            <Button variant="tertiary" onClick={() => setConfirmarDesistencia(true)}>
              Desistir do teste
            </Button>
            <Button variant="nightfall" onClick={voltarAoJogo} loading={abrirJogo.isPending} disabled={!build.data}>
              {partida?.outcome === 'NOT_OPENED' ? 'Abrir o jogo' : 'Voltar ao jogo'}
            </Button>
          </div>
        </Card>
      ) : (
      <Card className="gap-6 p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-headline text-white">Sua avaliação</h2>
          <p className="text-body text-white">
            Respostas claras, detalhadas e bem contextualizadas são avaliadas pela IA e recebem
            maior pontuação de qualidade, gerando insights mais relevantes e melhores recompensas.
          </p>
        </div>

        {aviso && (
          <div className="flex flex-col gap-1 rounded-xl border border-orbit-border p-3">
            <span className="text-body-bold text-white">{aviso.titulo}</span>
            <span className="text-body text-white">{aviso.texto}</span>
          </div>
        )}

        <hr className="border-orbit-border" />

        <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
          {/*
            A ordem do arquivo: as escalas do começo, a divisória, o bloco fixo
            de problemas e as perguntas do estúdio que vêm depois, com uma
            divisória antes de cada grupo de respostas escritas. Formulário que
            não começa por escala recebe o bloco no fim.
          */}
          {perguntasAntes.map(campo)}

          {perguntasAntes.length > 0 && blocoProblemas && <hr className="border-orbit-dim" />}
          {perguntasAntes.length > 0 && blocoProblemas}

          {perguntasDepois.map((pergunta, indice) => (
            <Fragment key={pergunta.id}>
              {abreGrupoEscrito(perguntasDepois, indice, perguntasAntes.length > 0) && (
                <hr className="border-orbit-dim" />
              )}
              {campo(pergunta)}
            </Fragment>
          ))}

          {perguntasAntes.length === 0 && blocoProblemas && <hr className="border-orbit-dim" />}
          {perguntasAntes.length === 0 && blocoProblemas}

          {(falha || Object.keys(erros).length > 0) && (
            <p className="rounded-xl border border-orbit-error bg-orbit-error-bg p-3 text-graphic text-orbit-error">
              {Object.keys(erros).length ? 'Responda as perguntas obrigatórias.' : falha?.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button variant="nightfall" type="submit" loading={enviarSessao.isPending || eventos.isPending}>
              Enviar
            </Button>
          </div>
        </form>
      </Card>
      )}

      <Modal open={confirmarDesistencia} onOpenChange={setConfirmarDesistencia}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Desistir do teste?</ModalTitle>
            <ModalDescription>
              A vaga volta para outros testers e você não poderá fazer este teste de novo.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="tertiary" onClick={() => setConfirmarDesistencia(false)}>
              Continuar no teste
            </Button>
            <Button variant="flame" onClick={desistirDoTeste} loading={desistir.isPending}>
              Desistir
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
