import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, get, post } from '@/lib/api';
import { USE_MOCKS } from '@/mocks/server';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { STORAGE_KEYS } from '@/utils/constants';
import type {
  ApiError,
  ChatAuthor,
  ChatMessage,
  CommunityAccessError,
  GameCommunity,
} from '@/types';

/*
 * Chat da comunidade de um jogo (Figma `395:2656`).
 *
 * É o mesmo recurso para o estúdio e para o tester — `/games/:id/community` —,
 * e a API decide quem entra. Por isso os hooks moram aqui, e não em `usePlayer`.
 */

/** A cada quantos ms a conversa procura mensagens novas quando o socket está fora do ar. */
const INTERVALO_DA_CONVERSA = 5_000;

/** Prefixo do id do balão que aparece antes de a API confirmar o envio. */
const PROVISORIA = 'provisoria-';

const SEM_ACESSO: CommunityAccessError[] = ['COMMUNITY_NOT_OPEN', 'COMMUNITY_RESTRICTED'];

/**
 * O motivo de a aba não abrir, quando o erro é de acesso. Não é falha de rede:
 * repetir a requisição não muda a resposta.
 */
export function communityAccessError(error: unknown): CommunityAccessError | null {
  const code = (error as ApiError | null)?.code;
  return SEM_ACESSO.find((motivo) => motivo === code) ?? null;
}

/** O balão ainda não foi confirmado pela API. */
export function isPendingMessage(message: ChatMessage): boolean {
  return message.id.startsWith(PROVISORIA);
}

/**
 * `own` e `reacted` dependem de quem vê, então o id dessa pessoa entra nas
 * chaves — estúdio e tester podem usar o mesmo app, um depois do outro.
 */
function useViewerId(): string {
  return useAuthStore((state) => state.user?.id ?? '');
}

/** Canais do chat do jogo e como quem está vendo aparece nele. */
export function useGameCommunity(gameId: string | undefined) {
  const viewerId = useViewerId();

  return useQuery({
    queryKey: queryKeys.community(gameId ?? '', viewerId),
    queryFn: () => get<GameCommunity>(`/games/${gameId}/community`),
    enabled: !!gameId,
    retry: (falhas, error) => !communityAccessError(error) && falhas < 1,
  });
}

/** Espera antes de tentar reabrir o socket que caiu. */
const RECONEXAO_MS = 2_000;

type EventoDoChat =
  | { type: 'message.created'; gameId: string; message: ChatMessage }
  | { type: 'message.deleted'; gameId: string; channelId: string; messageId: string };

/**
 * Mantém um WebSocket aberto com a comunidade do jogo enquanto a conversa está
 * na tela: mensagens novas e apagadas entram direto no cache, sem esperar
 * nenhuma consulta. Devolve se está conectado — enquanto não está (ou nos
 * mocks, que não têm socket), a conversa volta a perguntar de tempos em tempos.
 */
function useCommunitySocket(gameId: string): boolean {
  const client = useQueryClient();
  const viewerId = useViewerId();
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if (USE_MOCKS) return;
    let fechado = false;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout>;

    function abrir() {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (!token) return;
      const base = String(api.defaults.baseURL).replace(/^http/, 'ws');
      socket = new WebSocket(`${base}/community/ws?gameId=${encodeURIComponent(gameId)}&token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        setConectado(true);
        // O que chegou enquanto estava fora do ar.
        void client.invalidateQueries({ queryKey: queryKeys.community(gameId, viewerId) });
      };
      socket.onmessage = (evento) => {
        const dado = JSON.parse(String(evento.data)) as EventoDoChat;
        if (dado.gameId !== gameId) return;
        const chave = (canal: string) => queryKeys.communityMessages(gameId, viewerId, canal);

        if (dado.type === 'message.created') {
          // As próprias mensagens já voltam pela resposta do envio.
          if (dado.message.author.id === viewerId) return;
          client.setQueryData<ChatMessage[]>(chave(dado.message.channelId), (atual) =>
            !atual || atual.some((m) => m.id === dado.message.id) ? atual : [...atual, dado.message],
          );
        } else {
          client.setQueryData<ChatMessage[]>(chave(dado.channelId), (atual) =>
            atual?.filter((m) => m.id !== dado.messageId),
          );
        }
      };
      socket.onclose = () => {
        setConectado(false);
        if (!fechado) timer = setTimeout(abrir, RECONEXAO_MS);
      };
    }

    abrir();
    return () => {
      fechado = true;
      clearTimeout(timer);
      socket?.close();
      setConectado(false);
    };
  }, [client, gameId, viewerId]);

  return conectado;
}

/**
 * Mensagens de um canal.
 *
 * Com o socket conectado, o que o estúdio escreve aparece para o tester (e
 * vice-versa) assim que a API publica, sem recarregar a tela. Sem socket, a
 * conversa pergunta a cada poucos segundos. Abrir o canal também busca na hora:
 * o que estiver em cache aparece enquanto isso, mas nunca vale como atual.
 */
export function useChannelMessages(gameId: string, channelId: string) {
  const viewerId = useViewerId();
  const conectado = useCommunitySocket(gameId);

  return useQuery({
    queryKey: queryKeys.communityMessages(gameId, viewerId, channelId),
    queryFn: () => get<ChatMessage[]>(`/games/${gameId}/community/channels/${channelId}/messages`),
    staleTime: 0,
    refetchInterval: conectado ? false : INTERVALO_DA_CONVERSA,
  });
}

/**
 * Envia uma mensagem.
 *
 * O balão entra na hora, com o autor que a própria comunidade informou (`me`),
 * e é trocado pelo da API quando ela responde. Se o envio falhar ele sai, e o
 * `mutateAsync` rejeita para a tela devolver o texto ao campo.
 */
export function useSendMessage(gameId: string) {
  const client = useQueryClient();
  const viewerId = useViewerId();

  return useMutation({
    mutationFn: ({ channelId, text }: { channelId: string; text: string; me: ChatAuthor }) =>
      post<ChatMessage>(`/games/${gameId}/community/channels/${channelId}/messages`, { text }),

    onMutate: async ({ channelId, text, me }) => {
      const chave = queryKeys.communityMessages(gameId, viewerId, channelId);
      await client.cancelQueries({ queryKey: chave });
      const anterior = client.getQueryData<ChatMessage[]>(chave);

      const provisoria: ChatMessage = {
        id: `${PROVISORIA}${Date.now()}`,
        channelId,
        author: me,
        online: true,
        text,
        sentAt: new Date().toISOString(),
        own: true,
        reacted: false,
      };
      client.setQueryData<ChatMessage[]>(chave, [...(anterior ?? []), provisoria]);

      return { chave, anterior };
    },

    onError: (_erro, _envio, contexto) => {
      if (contexto) client.setQueryData(contexto.chave, contexto.anterior);
    },

    onSettled: (_mensagem, _erro, { channelId }) =>
      client.invalidateQueries({
        queryKey: queryKeys.communityMessages(gameId, viewerId, channelId),
      }),
  });
}

/**
 * Marca ou desmarca a reação de quem está vendo.
 *
 * O Figma só desenha o botão, então a reação é só isto: o ícone acende em azul
 * para quem reagiu, e os outros não a veem.
 */
export function useToggleReaction(gameId: string) {
  const client = useQueryClient();
  const viewerId = useViewerId();

  return useMutation({
    mutationFn: ({ messageId }: { channelId: string; messageId: string }) =>
      post<ChatMessage>(`/games/${gameId}/community/messages/${messageId}/reaction`),

    onMutate: async ({ channelId, messageId }) => {
      const chave = queryKeys.communityMessages(gameId, viewerId, channelId);
      await client.cancelQueries({ queryKey: chave });
      const anterior = client.getQueryData<ChatMessage[]>(chave);

      client.setQueryData<ChatMessage[]>(chave, (atual) =>
        atual?.map((mensagem) =>
          mensagem.id === messageId ? { ...mensagem, reacted: !mensagem.reacted } : mensagem,
        ),
      );

      return { chave, anterior };
    },

    onError: (_erro, _reacao, contexto) => {
      if (contexto) client.setQueryData(contexto.chave, contexto.anterior);
    },

    onSettled: (_mensagem, _erro, { channelId }) =>
      client.invalidateQueries({
        queryKey: queryKeys.communityMessages(gameId, viewerId, channelId),
      }),
  });
}
