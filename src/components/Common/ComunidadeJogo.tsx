import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Lock, MessagesSquare } from 'lucide-react';
import { Card, EmptyState, ErrorState, Input, SkeletonCard } from '@/components/UI';
import {
  communityAccessError,
  isPendingMessage,
  useChannelMessages,
  useGameCommunity,
  useSendMessage,
  useToggleReaction,
} from '@/hooks/useCommunity';
import { selectRole, useAuthStore } from '@/stores/authStore';
import type {
  ChatAuthor,
  ChatMessage,
  ChatRole,
  CommunityAccessError,
  CommunityChannel,
} from '@/types';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/utils/constants';
import { cn, formatDate } from '@/utils/helpers';

/**
 * Aba "Comunidade" da tela do jogo — Figma `395:2656`.
 *
 * É o chat do jogo, e é o mesmo nas duas pontas: o estúdio chega a ele pela
 * configuração do jogo e o tester pela tela de detalhes. Cada canal é uma
 * conversa própria. O chat só existe depois que o jogo recebe a primeira build,
 * e quem entra é a API que decide: o estúdio dono do jogo e os testers que já
 * participaram de algum teste dele.
 *
 * Dois cards colados: a lista de canais à esquerda (431px) e o chat à direita,
 * com o nome do canal flutuando sobre as mensagens num degradê que se dissolve.
 *
 * A cor do anel do avatar e a do selo saem do papel de quem fala. É o mesmo par
 * das `Graphic`: verde para quem faz o jogo, vermelho para QA, roxo para o
 * jogador ELITE. Quem está vendo só muda o lado: a própria mensagem vira o
 * balão azul, à direita.
 */
const PAPEL: Record<ChatRole, { rotulo: string; anel: string; selo: string }> = {
  DEV: {
    rotulo: 'Desenvolvedor',
    anel: 'border-orbit-g-emerald',
    selo: 'bg-[rgba(0,255,120,0.25)] text-orbit-g-emerald',
  },
  QA: {
    rotulo: 'QA Profissional',
    anel: 'border-orbit-g-ruby',
    selo: 'bg-[rgba(235,55,35,0.25)] text-orbit-g-ruby',
  },
  ELITE: {
    rotulo: 'ELITE',
    anel: 'border-orbit-purple',
    selo: 'bg-[rgba(180,0,255,0.25)] text-orbit-g-amethyst',
  },
};

/** Degradê do cabeçalho e do canal ativo (175,05° no arquivo). */
const DEGRADE_CANAL =
  'linear-gradient(175.05deg, rgb(36, 143, 247) 18.801%, rgb(135, 90, 242) 81.199%)';

export function ComunidadeJogo({ gameId }: { gameId: string | undefined }) {
  const comunidade = useGameCommunity(gameId);
  const [canalEscolhido, setCanalEscolhido] = useState<string | null>(null);

  if (comunidade.isError) {
    const motivo = communityAccessError(comunidade.error);
    if (motivo) return <SemAcesso motivo={motivo} />;

    return (
      <ErrorState
        description="Não conseguimos carregar a comunidade."
        onRetry={() => comunidade.refetch()}
      />
    );
  }

  if (!gameId || !comunidade.data) return <SkeletonCard />;

  const { channels, me } = comunidade.data;
  const canal = channels.find((item) => item.id === canalEscolhido) ?? channels[0];

  return (
    <div className="flex items-start">
      {/* Canais */}
      <Card className="w-[431px] shrink-0 gap-4 self-stretch rounded-r-none p-6">
        <span className="text-body-bold leading-5 text-white">Canais</span>

        {channels.map((item) => {
          const ativo = item.id === canal?.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCanalEscolhido(item.id)}
              aria-current={ativo ? 'true' : undefined}
              className={cn(
                'w-full text-left text-body leading-5',
                ativo ? 'bg-clip-text font-bold text-transparent' : 'font-normal text-white',
              )}
              style={ativo ? { backgroundImage: DEGRADE_CANAL } : undefined}
            >
              {item.name}
            </button>
          );
        })}
      </Card>

      {/* Remonta ao trocar de canal: cada canal abre no fim da própria conversa. */}
      {canal && <Conversa key={canal.id} gameId={gameId} canal={canal} me={me} />}
    </div>
  );
}

/**
 * O card da conversa de um canal.
 *
 * As mensagens se acumulam de baixo para cima, como no arquivo, e a lista rola
 * quando passa da altura do card. Ela só desce sozinha se quem está vendo já
 * estava no fim: quem subiu para ler o histórico não é puxado de volta.
 */
function Conversa({
  gameId,
  canal,
  me,
}: {
  gameId: string;
  canal: CommunityChannel;
  me: ChatAuthor;
}) {
  const mensagens = useChannelMessages(gameId, canal.id);
  const enviar = useSendMessage(gameId);
  const reagir = useToggleReaction(gameId);

  const listaRef = useRef<HTMLDivElement>(null);
  const noFim = useRef(true);

  const lista = mensagens.data ?? [];
  const ultima = lista[lista.length - 1]?.id;

  useLayoutEffect(() => {
    const el = listaRef.current;
    if (el && noFim.current) el.scrollTop = el.scrollHeight;
  }, [ultima]);

  function aoRolar() {
    const el = listaRef.current;
    if (el) noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  function aoEnviar(texto: string) {
    // Quem acabou de escrever quer ver a própria mensagem.
    noFim.current = true;
    return enviar.mutateAsync({ channelId: canal.id, text: texto, me });
  }

  return (
    <Card className="relative -ml-px h-[727px] min-w-0 flex-1 gap-4 overflow-hidden rounded-l-none p-0">
      {/*
        Os 27px do arquivo menos as bordas do card, que lá não ocupam espaço:
        com a conversa desenhada, a primeira mensagem começa meio coberta pelo
        degradê do cabeçalho e a lista ainda não rola.
      */}
      <div
        ref={listaRef}
        onScroll={aoRolar}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-[25px]"
      >
        {mensagens.isError ? (
          <div className="m-auto px-6">
            <ErrorState
              description="Não conseguimos carregar as mensagens."
              onRetry={() => mensagens.refetch()}
            />
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-4">
            {lista.map((mensagem) => (
              <Mensagem
                key={mensagem.id}
                mensagem={mensagem}
                pendente={isPendingMessage(mensagem)}
                onReagir={() => reagir.mutate({ channelId: canal.id, messageId: mensagem.id })}
              />
            ))}
          </div>
        )}
      </div>

      <BarraDeEnvio onEnviar={aoEnviar} />

      {/*
        O nome do canal fica por cima das mensagens, não acima delas: o degradê
        nasce opaco no topo e some antes do fim, deixando a conversa aparecer.
        Ele não captura o mouse, para a roda continuar rolando a lista.
      */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center px-6 py-4"
        style={{
          backgroundImage:
            'linear-gradient(175.06deg, rgba(36, 143, 247, 0.75) 18.801%, rgba(135, 90, 242, 0) 81.199%)',
        }}
      >
        <span
          className="text-headline leading-[39px] text-white"
          style={{ textShadow: '0px 0px 14px black' }}
        >
          {canal.name}
        </span>
      </span>
    </Card>
  );
}

function Mensagem({
  mensagem,
  pendente,
  onReagir,
}: {
  mensagem: ChatMessage;
  pendente: boolean;
  onReagir: () => void;
}) {
  const papel = PAPEL[mensagem.author.role];
  const { own } = mensagem;

  /*
   * Anel e foto são camadas separadas no arquivo: o anel de 48 com traço de 2
   * por dentro e a foto de 41 no meio, com um vão entre os dois.
   */
  const avatar = (
    <span className="relative block size-12 shrink-0">
      <span className={cn('absolute inset-0 rounded-full border-2', papel.anel)} />
      {mensagem.author.avatarUrl && (
        <img
          src={mensagem.author.avatarUrl}
          alt=""
          className="absolute left-[3.43px] top-[3.43px] size-[41.14px] rounded-full object-cover"
        />
      )}
      {/* Online: 10px de verde com 2px de contorno por fora, na cor do fundo do app. */}
      {mensagem.online && (
        <span
          role="img"
          aria-label="Online"
          className="absolute left-[33px] top-[33px] size-3.5 rounded-full border-2 border-orbit-bg bg-orbit-g-emerald"
        />
      )}
    </span>
  );

  // Cinza até a pessoa reagir; aí acende no azul dos ícones da barra.
  const reagir = (
    <button
      type="button"
      onClick={onReagir}
      disabled={pendente}
      aria-pressed={mensagem.reacted}
      aria-label="Reagir"
      title={mensagem.reacted ? 'Desfazer reação' : 'Reagir'}
      className={cn(
        'shrink-0 self-center',
        mensagem.reacted ? 'text-orbit-blue' : 'text-orbit-muted',
      )}
    >
      <IconeEmoji className="size-6" />
    </button>
  );

  /*
   * No arquivo o nome, o texto e a data têm altura de linha automática da
   * Montserrat — 20px no corpo e 15px na data —, e é isso que dá os 87px do
   * balão de uma linha. `text-body` sozinho daria 24px.
   */
  const balao = (
    <span
      className={cn(
        'flex max-w-[557px] flex-col gap-2 rounded-b-3xl px-4 py-2',
        own ? 'items-end rounded-tl-3xl bg-[#BDD2FF]' : 'items-start rounded-tr-3xl bg-white',
      )}
    >
      <span className="flex items-center gap-1">
        <span className="text-body-bold leading-5 text-orbit-dark">{mensagem.author.name}</span>
        <span
          className={cn(
            'rounded-br-[11.2px] rounded-tl-[11.2px] px-[5.6px] py-[2.8px] text-[7px] font-bold leading-[1.7]',
            papel.selo,
          )}
        >
          {papel.rotulo}
        </span>
      </span>

      <span className="break-words text-body leading-5 text-orbit-dark">{mensagem.text}</span>
      <span className="text-caption leading-[15px] text-orbit-muted">
        {formatarEnvio(mensagem.sentAt)}
      </span>
    </span>
  );

  // A pontinha nasce no topo do balão e aponta para o avatar, então troca de lado junto com ele.
  const ponta = (
    <img
      src={`./icons/figma/chat-tail-${own ? 'right' : 'left'}.svg`}
      alt=""
      className="h-2 w-[7px] shrink-0"
    />
  );

  return (
    <div className={cn('flex w-full px-6', own && 'justify-end')}>
      <div className="flex items-start gap-2">
        {own ? (
          <>
            {reagir}
            <span className="flex items-start">
              {balao}
              {ponta}
            </span>
            {avatar}
          </>
        ) : (
          <>
            {avatar}
            <span className="flex items-start">
              {ponta}
              {balao}
            </span>
            {reagir}
          </>
        )}
      </div>
    </div>
  );
}

/** "30/01/2026 - 09:59", como o arquivo escreve. */
function formatarEnvio(iso: string): string {
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
  return `${formatDate(iso)} - ${hora}`;
}

/**
 * Barra de envio.
 *
 * É a única superfície clara do card (`Types and Elements/Light`), como a linha
 * de cabeçalho das tabelas. Enter ou o aviãozinho enviam; campo vazio não envia.
 * Os ícones ao lado do campo — emoji, imagem, agenda, contato e ajuda — o
 * arquivo desenha mas não especifica, então ficam inertes.
 */
function BarraDeEnvio({ onEnviar }: { onEnviar: (texto: string) => Promise<unknown> }) {
  const [texto, setTexto] = useState('');

  function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const mensagem = texto.trim();
    if (!mensagem) return;

    setTexto('');
    // Se o envio falhar, o texto volta ao campo — a menos que já tenham
    // começado a escrever outra coisa.
    onEnviar(mensagem).catch(() => setTexto((atual) => atual || mensagem));
  }

  return (
    <form
      onSubmit={aoSubmeter}
      className="flex w-full shrink-0 items-center gap-6 bg-orbit-dim px-6 py-2"
    >
      {/* Único campo sobre superfície clara do app: texto escuro. */}
      <Input
        surface="light"
        className="w-[676px] max-w-full"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        onKeyDown={(evento) => {
          // Enter envia de forma explícita, sem depender do envio implícito do
          // formulário. Durante a composição de um acento, o Enter é do teclado.
          if (evento.key === 'Enter' && !evento.nativeEvent.isComposing) {
            evento.preventDefault();
            evento.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Digite uma mensagem..."
        aria-label="Mensagem"
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        autoComplete="off"
        iconRight={
          <button type="submit" aria-label="Enviar" disabled={!texto.trim()}>
            <img src="./icons/figma/chat-send.svg" alt="" className="size-6" />
          </button>
        }
      />

      <button type="button" title="Ainda não disponível">
        <IconeEmoji className="size-6 text-orbit-blue" />
      </button>

      {['chat-imagem', 'chat-agenda', 'chat-contato'].map((icone) => (
        <button key={icone} type="button" title="Ainda não disponível">
          <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6" />
        </button>
      ))}

      <span className="flex-1" />

      <button type="button" title="Ainda não disponível">
        <img src="./icons/figma/chat-ajuda.svg" alt="" className="size-6" />
      </button>
    </form>
  );
}

/**
 * O chat não abre: o jogo ainda não tem build, ou quem está vendo não é o
 * estúdio do jogo nem testou o jogo. O texto muda com o perfil porque o caminho
 * para destravar também muda.
 */
function SemAcesso({ motivo }: { motivo: CommunityAccessError }) {
  const estudio = useAuthStore(selectRole) === 'STUDIO';

  if (motivo === 'COMMUNITY_NOT_OPEN') {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="A comunidade ainda não abriu"
        description={
          estudio
            ? 'O chat com os testers abre quando o jogo recebe a primeira build. Crie um teste para enviar a sua.'
            : 'O chat abre quando o estúdio enviar a primeira build do jogo para teste.'
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Lock}
      title="Comunidade só para quem testa o jogo"
      description={
        estudio
          ? 'Só o estúdio dono do jogo participa deste chat.'
          : 'Participe de um teste deste jogo para entrar no chat com o estúdio e os outros testers.'
      }
    />
  );
}

/** `emoji_fill` do arquivo em `currentColor`: cinza no balão, azul na barra e na reação marcada. */
function IconeEmoji({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2ZM14.8 13.857C14.0532 14.5912 13.0473 15.0018 12 15C10.9527 15.0018 9.94682 14.5912 9.2 13.857C9.1067 13.7629 8.99563 13.6882 8.87323 13.6374C8.75084 13.5866 8.61957 13.5606 8.48704 13.561C8.35452 13.5614 8.22339 13.5881 8.10128 13.6396C7.97916 13.6911 7.8685 13.7663 7.77573 13.8609C7.68295 13.9556 7.60991 14.0677 7.56085 14.1908C7.51179 14.3139 7.48769 14.4455 7.48995 14.578C7.4922 14.7105 7.52078 14.8413 7.57401 14.9626C7.62723 15.084 7.70405 15.1936 7.8 15.285C8.92064 16.3858 10.4292 17.0018 12 17C13.5708 17.0018 15.0794 16.3858 16.2 15.285C16.385 15.0984 16.4891 14.8465 16.4898 14.5838C16.4905 14.321 16.3878 14.0685 16.2039 13.8809C16.0199 13.6933 15.7695 13.5856 15.5068 13.5811C15.2441 13.5767 14.9902 13.6758 14.8 13.857ZM8.5 8C8.10218 8 7.72064 8.15804 7.43934 8.43934C7.15804 8.72064 7 9.10218 7 9.5C7 9.89782 7.15804 10.2794 7.43934 10.5607C7.72064 10.842 8.10218 11 8.5 11C8.89782 11 9.27936 10.842 9.56066 10.5607C9.84196 10.2794 10 9.89782 10 9.5C10 9.10218 9.84196 8.72064 9.56066 8.43934C9.27936 8.15804 8.89782 8 8.5 8ZM15.5 8C15.1022 8 14.7206 8.15804 14.4393 8.43934C14.158 8.72064 14 9.10218 14 9.5C14 9.89782 14.158 10.2794 14.4393 10.5607C14.7206 10.842 15.1022 11 15.5 11C15.8978 11 16.2794 10.842 16.5607 10.5607C16.842 10.2794 17 9.89782 17 9.5C17 9.10218 16.842 8.72064 16.5607 8.43934C16.2794 8.15804 15.8978 8 15.5 8Z"
      />
    </svg>
  );
}
