import { useState } from 'react';
import { KeyRound, Lock, LockOpen, Trash2, UserPen } from 'lucide-react';
import { Switch, Table, TableHeader, Tag, UserAvatar } from '@/components/UI';
import { useAtualizarUsuario } from '@/hooks/useAcessos';
import type { AccessPermissions, AccessUser, UserStatus } from '@/types';
import { USER_STATUS_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';
import { MenuAcoes } from './MenuAcoes';
import { ConfirmacaoUsuarioModal, RedefinirSenhaModal, type PedidoUsuario } from './ModaisUsuario';
import { RodapeTabela } from './RodapeTabela';

const TONS = { ACTIVE: 'jade', PENDING: 'topaz', INACTIVE: 'amber' } as const satisfies Record<UserStatus, string>;

/** "22/09/2026 - 14:10", como a coluna "Último acesso" escreve. */
function ultimoAcesso(iso: string) {
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  return `${formatDate(iso)} - ${hora}`;
}

/**
 * Aba "Usuários": seis colunas iguais mais a de Ações (60px). As duas colunas
 * de toggle são as permissões `manageUsers` e `deleteUsers`, gravadas na hora.
 */
export function TabelaUsuarios({ usuarios }: { usuarios: AccessUser[] }) {
  const atualizar = useAtualizarUsuario();
  const [pedido, setPedido] = useState<PedidoUsuario | null>(null);

  function alternar(usuario: AccessUser, chave: keyof AccessPermissions, valor: boolean) {
    atualizar.mutate({ id: usuario.id, permissions: { [chave]: valor } });
  }

  return (
    <>
      <Table>
        <TableHeader className="py-3">
          <span className="flex-1">Usuário</span>
          <span className="flex-1">Status</span>
          <span className="flex-1">Grupos</span>
          <span className="flex-1">Último acesso</span>
          <span className="flex-1">Criar/Editar usuário</span>
          <span className="flex-1">Excluir usuário</span>
          <span className="w-[60px] shrink-0">Ações</span>
        </TableHeader>

        <div className="py-2">
          {usuarios.map((usuario) => {
            const suspenso = usuario.status === 'INACTIVE';

            return (
              <div
                key={usuario.id}
                className="flex h-16 items-center gap-6 px-6 text-graphic text-white"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <UserAvatar name={usuario.name} src={usuario.avatarUrl} className="size-[26px]" />
                  <span className="truncate">{usuario.name}</span>
                  {usuario.admin && <Tag tone="amethyst">ADM</Tag>}
                </span>

                <span className="flex-1">
                  <Tag tone={TONS[usuario.status]}>{USER_STATUS_LABELS[usuario.status]}</Tag>
                </span>

                <span className="flex-1 truncate font-bold">{usuario.groups.join(', ') || '-'}</span>

                <span className="flex-1 font-bold">
                  {usuario.lastAccessAt ? ultimoAcesso(usuario.lastAccessAt) : '-'}
                </span>

                <span className="flex-1">
                  <Switch
                    checked={usuario.permissions.manageUsers}
                    onCheckedChange={(valor) => alternar(usuario, 'manageUsers', valor)}
                    aria-label={`Criar/Editar usuário — ${usuario.name}`}
                    className="data-[state=checked]:bg-orbit-blue-deep"
                  />
                </span>
                <span className="flex-1">
                  <Switch
                    checked={usuario.permissions.deleteUsers}
                    onCheckedChange={(valor) => alternar(usuario, 'deleteUsers', valor)}
                    aria-label={`Excluir usuário — ${usuario.name}`}
                    className="data-[state=checked]:bg-orbit-blue-deep"
                  />
                </span>

                <span className="flex w-[60px] shrink-0 justify-end">
                  <MenuAcoes
                    rotulo={`Ações de ${usuario.name}`}
                    acoes={[
                      { rotulo: 'Editar perfil', icone: <UserPen /> },
                      {
                        rotulo: 'Redefinir senha',
                        icone: <KeyRound />,
                        onSelect: () => setPedido({ tipo: 'senha', usuario }),
                      },
                      {
                        rotulo: suspenso ? 'Restabelecer acesso' : 'Suspender acesso',
                        icone: suspenso ? <LockOpen /> : <Lock />,
                        onSelect: () =>
                          setPedido({ tipo: suspenso ? 'restabelecer' : 'suspender', usuario }),
                      },
                      {
                        rotulo: 'Excluir usuário',
                        icone: <Trash2 />,
                        perigo: true,
                        onSelect: () => setPedido({ tipo: 'excluir', usuario }),
                      },
                    ]}
                  />
                </span>
              </div>
            );
          })}
        </div>

        <RodapeTabela exibidos={usuarios.length} total={usuarios.length} />
      </Table>

      <ConfirmacaoUsuarioModal
        pedido={pedido?.tipo === 'senha' ? null : pedido}
        onFechar={() => setPedido(null)}
      />
      <RedefinirSenhaModal
        usuario={pedido?.tipo === 'senha' ? pedido.usuario : null}
        onFechar={() => setPedido(null)}
      />
    </>
  );
}
