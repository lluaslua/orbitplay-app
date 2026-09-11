import { useState } from 'react';
import { Card, ErrorState, Input, SkeletonCard } from '@/components/UI';
import { useGameCommunity } from '@/hooks/usePlayer';
import type { ChatMessage, ChatRole } from '@/types';
import { cn } from '@/utils/helpers';

/**
 * Aba "Comunidade" da tela do jogo — Figma `395:2656`.
 *
 * Dois cards colados: a lista de canais à esquerda (431px) e o chat à direita,
 * com o nome do canal flutuando sobre as mensagens num degradê que se dissolve.
 *
 * A cor do anel do avatar e a do selo saem do papel de quem fala. É o mesmo par
 * das `Graphic`: verde para quem faz o jogo, vermelho para QA, roxo para o
 * próprio jogador — que também troca o balão branco pelo azul e vira de lado.
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
  const [canal, setCanal] = useState<string | null>(null);

  if (comunidade.isError) {
    return (
      <ErrorState
        description="Não conseguimos carregar a comunidade."
        onRetry={() => comunidade.refetch()}
      />
    );
  }

  if (comunidade.isLoading || !comunidade.data) return <SkeletonCard />;

  const dados = comunidade.data;
  const aberto = canal ?? dados.selected;

  return (
    <div className="flex items-start">
      {/* Canais */}
      <Card className="w-[431px] shrink-0 gap-4 self-stretch rounded-r-none p-6">
        <span className="text-body-bold text-white">Canais</span>

        {dados.channels.map((nome) => {
          const ativo = nome === aberto;

          return (
            <button
              key={nome}
              type="button"
              onClick={() => setCanal(nome)}
              className={cn(
                'w-full text-left text-body',
                ativo ? 'bg-clip-text font-bold text-transparent' : 'font-normal text-white',
              )}
              style={ativo ? { backgroundImage: DEGRADE_CANAL } : undefined}
            >
              {nome}
            </button>
          );
        })}
      </Card>

      {/* Conversa */}
      <Card className="relative h-[727px] min-w-0 flex-1 justify-end gap-4 overflow-hidden rounded-l-none p-0">
        {dados.messages.map((mensagem) => (
          <Mensagem key={mensagem.id} mensagem={mensagem} />
        ))}

        <BarraDeEnvio />

        {/*
          O nome do canal fica por cima das mensagens, não acima delas: o degradê
          nasce opaco no topo e some antes do fim, deixando a conversa aparecer.
        */}
        <span
          className="absolute inset-x-0 top-0 flex items-center px-6 py-4"
          style={{
            backgroundImage:
              'linear-gradient(175.06deg, rgba(36, 143, 247, 0.75) 18.801%, rgba(135, 90, 242, 0) 81.199%)',
          }}
        >
          <span
            className="text-headline text-white"
            style={{ textShadow: '0px 0px 14px black' }}
          >
            {aberto}
          </span>
        </span>
      </Card>
    </div>
  );
}

function Mensagem({ mensagem }: { mensagem: ChatMessage }) {
  const papel = PAPEL[mensagem.role];

  const avatar = (
    <span className="relative block size-12 shrink-0">
      <img
        src={mensagem.avatarUrl}
        alt=""
        className={cn('size-full rounded-full border-2 object-cover', papel.anel)}
      />
      {/* Ponto de online, com borda da cor do fundo do app */}
      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-orbit-bg bg-orbit-g-emerald" />
    </span>
  );

  const emoji = (
    <img src="./icons/figma/chat-emoji.svg" alt="" className="size-6 shrink-0 self-center" />
  );

  const balao = (
    <span
      className={cn(
        'flex max-w-[557px] flex-col gap-2 rounded-b-3xl px-4 py-2',
        mensagem.own ? 'items-end rounded-tl-3xl bg-[#BDD2FF]' : 'items-start rounded-tr-3xl bg-white',
      )}
    >
      <span className="flex items-center gap-1">
        <span className="text-body-bold text-orbit-dark">{mensagem.author}</span>
        <span
          className={cn(
            'rounded-br-[11.2px] rounded-tl-[11.2px] px-[5.6px] py-[2.8px] text-[7px] font-bold leading-[1.7]',
            papel.selo,
          )}
        >
          {papel.rotulo}
        </span>
      </span>

      <span className="text-body text-orbit-dark">{mensagem.text}</span>
      <span className="text-caption text-orbit-muted">{mensagem.sentAt}</span>
    </span>
  );

  // A pontinha do balão aponta para o avatar, então troca de lado junto com ele.
  const ponta = (
    <img
      src={`./icons/figma/chat-tail-${mensagem.own ? 'right' : 'left'}.svg`}
      alt=""
      className="mt-[13px] h-2 w-[7px] shrink-0"
    />
  );

  return (
    <div className={cn('flex w-full px-6', mensagem.own && 'justify-end')}>
      <div className="flex items-start gap-2">
        {mensagem.own ? (
          <>
            {emoji}
            {balao}
            {ponta}
            {avatar}
          </>
        ) : (
          <>
            {avatar}
            {ponta}
            {balao}
            {emoji}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Barra de envio.
 *
 * É a única superfície clara do card (`Types and Elements/Light`), como a linha
 * de cabeçalho das tabelas. Os quatro ícones ao lado do campo são anexos que o
 * arquivo desenha mas não especifica, então ficam inertes.
 */
function BarraDeEnvio() {
  const [texto, setTexto] = useState('');

  return (
    <div className="flex w-full shrink-0 items-center gap-6 bg-orbit-dim px-6 py-2">
      {/* Único campo sobre superfície clara do app: texto escuro. */}
      <Input
        surface="light"
        className="w-[676px] max-w-full"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Digite uma mensagem..."
        aria-label="Mensagem"
        iconRight={
          <button type="button" aria-label="Enviar" title="Ainda não disponível">
            <img src="./icons/figma/chat-send.svg" alt="" className="size-6" />
          </button>
        }
      />

      {['chat-emoji', 'chat-imagem', 'chat-agenda', 'chat-contato'].map((icone) => (
        <button key={icone} type="button" title="Ainda não disponível">
          <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6" />
        </button>
      ))}

      <span className="flex-1" />

      <button type="button" title="Ainda não disponível">
        <img src="./icons/figma/chat-ajuda.svg" alt="" className="size-6" />
      </button>
    </div>
  );
}
