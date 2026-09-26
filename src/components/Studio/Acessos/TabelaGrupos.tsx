import { useState } from 'react';
import { CaseSensitive, Eraser, Trash2, Users } from 'lucide-react';
import { Table, TableHeader, Tag, UserAvatar } from '@/components/UI';
import type { AccessGroup, AccessUser } from '@/types';
import { USER_STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { MenuAcoes } from './MenuAcoes';
import {
  AdicionarMembrosModal,
  ConfirmacaoGrupoModal,
  RenomearGrupoModal,
  type PedidoGrupo,
} from './ModaisGrupo';
import { RodapeTabela } from './RodapeTabela';

/** Aba "Grupos": três colunas iguais mais a de Ações. Os participantes são os avatares sobrepostos. */
export function TabelaGrupos({ grupos, usuarios }: { grupos: AccessGroup[]; usuarios: AccessUser[] }) {
  const [pedido, setPedido] = useState<PedidoGrupo | null>(null);

  return (
    <>
      <Table>
        <TableHeader className="py-3">
          <span className="flex-1">Nome</span>
          <span className="flex-1">Status</span>
          <span className="flex-1">Participantes</span>
          <span className="w-[60px] shrink-0">Ações</span>
        </TableHeader>

        <div className="py-2">
          {grupos.map((grupo) => (
            <div key={grupo.id} className="flex h-16 items-center gap-6 px-6 text-graphic text-white">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <img src="./icons/figma/acessos/grupo.png" alt="" className="size-6 shrink-0" />
                <span className="truncate">{grupo.name}</span>
              </span>

              <span className="flex-1">
                <Tag tone={grupo.status === 'ACTIVE' ? 'jade' : 'amber'}>
                  {USER_STATUS_LABELS[grupo.status]}
                </Tag>
              </span>

              <span className="flex flex-1 items-center">
                {grupo.members.map((membro, indice) => (
                  <UserAvatar
                    key={membro.id}
                    name={membro.name}
                    src={membro.avatarUrl}
                    className={cn('size-6', indice > 0 && '-ml-1')}
                  />
                ))}
              </span>

              <span className="flex w-[60px] shrink-0 justify-end">
                <MenuAcoes
                  rotulo={`Ações de ${grupo.name}`}
                  acoes={[
                    {
                      rotulo: 'Gerenciar membros',
                      icone: <Users />,
                      onSelect: () => setPedido({ tipo: 'membros', grupo }),
                    },
                    {
                      rotulo: 'Renomear',
                      icone: <CaseSensitive />,
                      onSelect: () => setPedido({ tipo: 'renomear', grupo }),
                    },
                    {
                      rotulo: 'Remover participantes',
                      icone: <Eraser />,
                      onSelect: () => setPedido({ tipo: 'limpar', grupo }),
                    },
                    {
                      rotulo: 'Excluir grupo',
                      icone: <Trash2 />,
                      perigo: true,
                      onSelect: () => setPedido({ tipo: 'excluir', grupo }),
                    },
                  ]}
                />
              </span>
            </div>
          ))}
        </div>

        <RodapeTabela exibidos={grupos.length} total={grupos.length} />
      </Table>

      <AdicionarMembrosModal
        grupo={pedido?.tipo === 'membros' ? pedido.grupo : null}
        usuarios={usuarios}
        onFechar={() => setPedido(null)}
      />
      <RenomearGrupoModal
        grupo={pedido?.tipo === 'renomear' ? pedido.grupo : null}
        onFechar={() => setPedido(null)}
      />
      <ConfirmacaoGrupoModal
        pedido={pedido?.tipo === 'limpar' || pedido?.tipo === 'excluir' ? pedido : null}
        onFechar={() => setPedido(null)}
      />
    </>
  );
}
