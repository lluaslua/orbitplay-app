import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, Tag, UserAvatar } from '@/components/UI';
import {
  useAtualizarUsuario,
  useConvidarUsuario,
  useExcluirUsuario,
  useRedefinirSenha,
} from '@/hooks/useAcessos';
import type { AccessUser } from '@/types';
import { senhaValida } from '@/utils/helpers';
import { ModalAcessos } from './ModalAcessos';
import { ModalConfirmacao } from './ModalConfirmacao';
import { RotuloObrigatorio } from './RotuloObrigatorio';

type TipoPedidoUsuario = 'excluir' | 'suspender' | 'restabelecer' | 'senha';

export type PedidoUsuario = {
  [T in TipoPedidoUsuario]: { tipo: T; usuario: AccessUser };
}[TipoPedidoUsuario];

/**
 * "Novo usuário": o e-mail entra no Enter e vira um convite pendente na lista
 * logo abaixo. O "Concluído" só fecha; permissões e grupos vêm depois.
 */
export function NovoUsuarioModal({
  aberto,
  onOpenChange,
  pendentes,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  pendentes: AccessUser[];
}) {
  const convidar = useConvidarUsuario();
  const [email, setEmail] = useState('');

  function enviar(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    convidar.mutate(email, { onSuccess: () => setEmail('') });
  }

  return (
    <ModalAcessos
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Novo usuário"
      acao="Concluído"
      onConfirmar={() => onOpenChange(false)}
    >
      <p className="mt-7 text-[16px] leading-[1.2] text-white">
        Convide uma pessoa para acessar o estúdio. Ela receberá um e-mail para criar a conta e
        definir a própria senha.
      </p>

      <form onSubmit={enviar}>
        <RotuloObrigatorio texto="E-mail do novo usuário" className="mt-6">
          <Input
            type="email"
            placeholder="Digite..."
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={convidar.error?.message}
            hint="Use o e-mail profissional da pessoa que receberá o convite."
            iconRight={<Eye className="text-white" />}
          />
        </RotuloObrigatorio>
      </form>

      <ul className="mt-3 max-h-28 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar]:w-1">
        {pendentes.map((usuario) => (
          <li key={usuario.id} className="flex h-14 items-center gap-3 px-6 text-body text-white">
            <UserAvatar name={usuario.name} src={usuario.avatarUrl} className="size-[26px]" />
            <span className="font-bold">{usuario.name}</span>
            <span className="text-graphic">{usuario.email}</span>
            <Tag tone="topaz">Pendente</Tag>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[16px] leading-[1.2] text-white">
        As permissões e grupos poderão ser definidos após o envio do convite.
      </p>
    </ModalAcessos>
  );
}

/** "Redefinir senha de usuário": o "Atualizar" só libera quando a senha cumpre as seis regras. */
export function RedefinirSenhaModal({
  usuario,
  onFechar,
}: {
  usuario: AccessUser | null;
  onFechar: () => void;
}) {
  const redefinir = useRedefinirSenha();
  const [senha, setSenha] = useState('');
  const [visivel, setVisivel] = useState(false);

  function fechar() {
    setSenha('');
    setVisivel(false);
    redefinir.reset();
    onFechar();
  }

  return (
    <ModalAcessos
      aberto={!!usuario}
      onOpenChange={(aberto) => !aberto && fechar()}
      titulo="Redefinir senha de usuário"
      acao="Atualizar"
      cancelar
      carregando={redefinir.isPending}
      desabilitado={!senhaValida(senha)}
      onConfirmar={() => usuario && redefinir.mutate({ id: usuario.id, password: senha }, { onSuccess: fechar })}
    >
      <Input
        label="Nova senha"
        type={visivel ? 'text' : 'password'}
        placeholder="Digite..."
        value={senha}
        onChange={(event) => setSenha(event.target.value)}
        error={redefinir.error?.message}
        className="mt-[26px]"
        iconRight={
          <button
            type="button"
            onClick={() => setVisivel((atual) => !atual)}
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            className="text-white orbit-focus-ring"
          >
            {visivel ? <EyeOff /> : <Eye />}
          </button>
        }
      />

      <ul className="px-4 text-[12px] leading-[15px] text-white">
        <li>Sua nova senha deve conter:</li>
        <li>- Um número</li>
        <li>- Um símbolo</li>
        <li>- Uma letra minúscula</li>
        <li>- Uma letra maiúscula</li>
        <li>- No mínimo 8 caracteres</li>
        <li>- Apenas letras do alfabeto latino</li>
      </ul>
    </ModalAcessos>
  );
}

const CONFIRMACOES = {
  excluir: {
    selo: 'alerta',
    titulo: 'Excluir usuário?',
    descricao: 'Esta ação removerá o acesso deste usuário ao estúdio e não poderá ser desfeita.',
    acao: 'Excluir',
  },
  suspender: {
    selo: 'pergunta',
    titulo: 'Suspender acesso?',
    descricao:
      'Este usuário perderá temporariamente o acesso ao estúdio, projetos e testes. As informações e conteúdos vinculados à conta serão mantidos.',
    acao: 'Suspender',
  },
  restabelecer: {
    selo: 'pergunta',
    titulo: 'Restabelecer acesso?',
    descricao:
      'Este usuário voltará a ter acesso ao estúdio de acordo com suas permissões anteriores.',
    acao: 'Restabelecer',
  },
} as const;

/** Excluir, suspender e restabelecer compartilham o modal branco; muda o texto e o que a ação grava. */
export function ConfirmacaoUsuarioModal({
  pedido,
  onFechar,
}: {
  pedido: Exclude<PedidoUsuario, { tipo: 'senha' }> | null;
  onFechar: () => void;
}) {
  const excluir = useExcluirUsuario();
  const atualizar = useAtualizarUsuario();
  const texto = CONFIRMACOES[pedido?.tipo ?? 'excluir'];

  function confirmar() {
    if (!pedido) return;
    const { tipo, usuario } = pedido;
    if (tipo === 'excluir') excluir.mutate(usuario.id, { onSuccess: onFechar });
    else {
      atualizar.mutate(
        { id: usuario.id, status: tipo === 'suspender' ? 'INACTIVE' : 'ACTIVE' },
        { onSuccess: onFechar },
      );
    }
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
