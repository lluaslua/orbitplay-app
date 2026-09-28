import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Input } from '@/components/UI';
import { RotuloObrigatorio } from './RotuloObrigatorio';
import { useAtualizarGrupo, useCriarGrupo, useExcluirGrupo } from '@/hooks/useAcessos';
import type { AccessGroup, AccessUser } from '@/types';
import { ListaMembros } from './ListaMembros';
import { ModalAcessos } from './ModalAcessos';
import { ModalConfirmacao } from './ModalConfirmacao';

type TipoPedidoGrupo = 'membros' | 'renomear' | 'limpar' | 'excluir';

export type PedidoGrupo = {
  [T in TipoPedidoGrupo]: { tipo: T; grupo: AccessGroup };
}[TipoPedidoGrupo];

/** Quem pode entrar num grupo: os usuários ativos, fora o dono do estúdio. */
function elegiveis(usuarios: AccessUser[]) {
  return usuarios.filter((usuario) => usuario.status === 'ACTIVE' && !usuario.admin);
}

function useSelecao(iniciais: string[]) {
  const [selecionados, setSelecionados] = useState(() => new Set(iniciais));

  function alternar(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  return { selecionados, alternar, redefinir: (ids: string[]) => setSelecionados(new Set(ids)) };
}

export function NovoGrupoModal({
  aberto,
  onOpenChange,
  usuarios,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  usuarios: AccessUser[];
}) {
  const criar = useCriarGrupo();
  const [nome, setNome] = useState('');
  const { selecionados, alternar, redefinir } = useSelecao([]);

  function fechar() {
    setNome('');
    redefinir([]);
    criar.reset();
    onOpenChange(false);
  }

  return (
    <ModalAcessos
      aberto={aberto}
      onOpenChange={(valor) => !valor && fechar()}
      titulo="Novo grupo"
      acao="Concluído"
      carregando={criar.isPending}
      desabilitado={!nome.trim()}
      onConfirmar={() =>
        criar.mutate({ name: nome, memberIds: [...selecionados] }, { onSuccess: fechar })
      }
    >
      <p className="mt-7 text-[16px] leading-[1.2] text-white">
        Crie um grupo para organizar usuários e facilitar o gerenciamento de acessos e permissões.
      </p>

      <RotuloObrigatorio texto="Nome do grupo" className="mt-6">
        <Input
          placeholder="Digite..."
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          error={criar.error?.message}
          hint="Escolha um nome claro que identifique a equipe ou função do grupo."
          iconRight={<Eye className="text-white" />}
        />
      </RotuloObrigatorio>

      <div className="mt-5">
        <ListaMembros usuarios={elegiveis(usuarios)} selecionados={selecionados} onAlternar={alternar} />
      </div>
    </ModalAcessos>
  );
}

/** "Adicionar membro ao grupo": abre com os membros atuais marcados e grava a lista inteira no Finalizar. */
export function AdicionarMembrosModal({
  grupo,
  usuarios,
  onFechar,
}: {
  grupo: AccessGroup | null;
  usuarios: AccessUser[];
  onFechar: () => void;
}) {
  const atualizar = useAtualizarGrupo();
  const { selecionados, alternar, redefinir } = useSelecao([]);

  useEffect(() => {
    redefinir(grupo?.members.map((membro) => membro.id) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo?.id]);

  return (
    <ModalAcessos
      aberto={!!grupo}
      onOpenChange={(aberto) => !aberto && onFechar()}
      titulo="Adicionar membro ao grupo"
      acao="Finalizar"
      cancelar
      carregando={atualizar.isPending}
      onConfirmar={() =>
        grupo && atualizar.mutate({ id: grupo.id, memberIds: [...selecionados] }, { onSuccess: onFechar })
      }
    >
      <div className="mt-7">
        <ListaMembros
          key={grupo?.id}
          usuarios={elegiveis(usuarios)}
          selecionados={selecionados}
          onAlternar={alternar}
        />
      </div>
    </ModalAcessos>
  );
}

export function RenomearGrupoModal({
  grupo,
  onFechar,
}: {
  grupo: AccessGroup | null;
  onFechar: () => void;
}) {
  const atualizar = useAtualizarGrupo();
  const [nome, setNome] = useState('');

  function fechar() {
    setNome('');
    atualizar.reset();
    onFechar();
  }

  return (
    <ModalAcessos
      aberto={!!grupo}
      onOpenChange={(aberto) => !aberto && fechar()}
      titulo="Renomear grupo"
      acao="Finalizar"
      cancelar
      carregando={atualizar.isPending}
      desabilitado={!nome.trim()}
      onConfirmar={() => grupo && atualizar.mutate({ id: grupo.id, name: nome }, { onSuccess: fechar })}
    >
      <Input
        label="Novo nome do grupo"
        placeholder="Digite..."
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        error={atualizar.error?.message}
        className="mt-[26px]"
      />
    </ModalAcessos>
  );
}

const CONFIRMACOES = {
  limpar: {
    selo: 'pergunta',
    titulo: 'Limpar participantes do grupo?',
    descricao:
      'Esta ação removerá todos os participantes do grupo, mas não excluirá os usuários da conta do estúdio.',
    acao: 'Limpar',
  },
  excluir: {
    selo: 'alerta',
    titulo: 'Excluir grupo?',
    descricao:
      'Esta ação excluirá o grupo e removerá suas permissões herdadas dos membros. Os usuários permanecerão ativos.',
    acao: 'Excluir',
  },
} as const;

export function ConfirmacaoGrupoModal({
  pedido,
  onFechar,
}: {
  pedido: Extract<PedidoGrupo, { tipo: 'limpar' | 'excluir' }> | null;
  onFechar: () => void;
}) {
  const excluir = useExcluirGrupo();
  const atualizar = useAtualizarGrupo();
  const texto = CONFIRMACOES[pedido?.tipo ?? 'excluir'];

  function confirmar() {
    if (!pedido) return;
    if (pedido.tipo === 'excluir') excluir.mutate(pedido.grupo.id, { onSuccess: onFechar });
    else atualizar.mutate({ id: pedido.grupo.id, memberIds: [] }, { onSuccess: onFechar });
  }

  return (
    <ModalConfirmacao
      aberto={!!pedido}
      onOpenChange={(aberto) => !aberto && onFechar()}
      selo={texto.selo}
      titulo={texto.titulo}
      descricao={texto.descricao}
      acao={texto.acao}
      carregando={excluir.isPending || atualizar.isPending}
      onConfirmar={confirmar}
    />
  );
}
