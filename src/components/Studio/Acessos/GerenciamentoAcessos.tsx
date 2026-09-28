import { useState } from 'react';
import { Search } from 'lucide-react';
import { BotoesExportar } from '@/components/Common/BotoesExportar';
import { PageHeading } from '@/components/Common/PageHeading';
import { Button, ErrorState, Input, SkeletonCard } from '@/components/UI';
import { useAcessos } from '@/hooks/useAcessos';
import type { AccessSummary } from '@/types';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/utils/helpers';
import { NovoGrupoModal } from './ModaisGrupo';
import { NovoUsuarioModal } from './ModaisUsuario';
import { TabelaGrupos } from './TabelaGrupos';
import { TabelaUsuarios } from './TabelaUsuarios';

/**
 * Gerenciamento de acessos (Figma: os dois frames "Gerenciamento de acessos",
 * 1920×2428, um por aba).
 *
 * Cabeçalho com a linha azul, os quatro números, as abas "Usuários" e
 * "Grupos", a barra de busca com os botões de exportar e o CTA laranja, e a
 * tabela da aba. Cada aba tem seu próprio CTA, seus modais e seu menu de
 * ações; o que muda entre as duas está em `TabelaUsuarios` e `TabelaGrupos`.
 */
const ABAS = ['Usuários', 'Grupos'] as const;

export function GerenciamentoAcessos() {
  const acessos = useAcessos();
  const [aba, setAba] = useState<(typeof ABAS)[number]>('Usuários');
  const [busca, setBusca] = useState('');
  const [novoUsuario, setNovoUsuario] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState(false);

  const termo = busca.trim().toLowerCase();
  const usuarios =
    acessos.data?.users.filter(
      (usuario) =>
        usuario.name.toLowerCase().includes(termo) || usuario.email.toLowerCase().includes(termo),
    ) ?? [];
  const grupos = acessos.data?.groups.filter((grupo) => grupo.name.toLowerCase().includes(termo)) ?? [];
  const usuariosAba = aba === 'Usuários';

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        trilha={[{ label: 'Home', to: ROUTES.studio.home }, { label: 'Gerenciar perfis' }]}
        titulo="Gerenciamento de acessos"
        linha="azul"
      />

      {acessos.data && <Resumo resumo={acessos.data.summary} />}

      <div className="flex items-end">
        {ABAS.map((nome) => {
          const ativa = nome === aba;

          return (
            <button
              key={nome}
              type="button"
              onClick={() => setAba(nome)}
              className={cn('flex flex-col items-center pt-3', ativa ? 'gap-4' : 'gap-[17px]')}
            >
              <span
                className={cn(
                  'px-3 text-center text-body',
                  ativa ? 'font-bold text-orbit-blue' : 'text-white',
                )}
              >
                {nome}
              </span>
              <span className={cn('w-full', ativa ? 'h-0.5 bg-orbit-blue' : 'h-px bg-white')} />
            </button>
          );
        })}
        <span className="h-px flex-1 bg-white" />
      </div>

      <div className="flex items-end gap-6">
        <label className="flex w-[415px] flex-col gap-1.5 pt-0.5">
          <span className="text-[16px] font-bold leading-none text-white">Buscar</span>
          <Input
            placeholder="Digite..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            iconRight={<Search className="text-white" />}
          />
        </label>

        <span className="flex-1" />

        <BotoesExportar className="gap-6" />

        <Button variant="flame" onClick={() => (usuariosAba ? setNovoUsuario(true) : setNovoGrupo(true))}>
          {usuariosAba ? 'Novo usuário' : 'Novo grupo'}
          <img src="./icons/figma/plus-branco.svg" alt="" className="size-6" />
        </Button>
      </div>

      {acessos.isError ? (
        <ErrorState
          description="Não conseguimos carregar os acessos do estúdio."
          onRetry={() => acessos.refetch()}
        />
      ) : acessos.isLoading ? (
        <SkeletonCard />
      ) : usuariosAba ? (
        <TabelaUsuarios usuarios={usuarios} />
      ) : (
        <TabelaGrupos grupos={grupos} usuarios={acessos.data?.users ?? []} />
      )}

      <NovoUsuarioModal
        aberto={novoUsuario}
        onOpenChange={setNovoUsuario}
        pendentes={acessos.data?.users.filter((usuario) => usuario.status === 'PENDING') ?? []}
      />
      <NovoGrupoModal
        aberto={novoGrupo}
        onOpenChange={setNovoGrupo}
        usuarios={acessos.data?.users ?? []}
      />
    </div>
  );
}

/** Os quatro números do topo: ícone 24 à esquerda, rótulo 12 sobre o valor 24, em blocos de 192px. */
function Resumo({ resumo }: { resumo: AccessSummary }) {
  const numeros = [
    ['game-players', 'Usuários ativos', resumo.activeUsers],
    ['publico/todos', 'Grupos', resumo.groups],
    ['game-clock', 'Convites pendentes', resumo.pendingInvites],
    ['login-key', 'Administradores', resumo.admins],
  ] as const;

  return (
    <div className="flex gap-6">
      {numeros.map(([icone, rotulo, valor]) => (
        <div key={rotulo} className="flex w-48 items-center gap-1 whitespace-nowrap text-white">
          <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6 shrink-0" />
          <div className="flex flex-col">
            <span className="font-label text-[12px] leading-[14px]">{rotulo}</span>
            <span className="font-label text-[24px] font-bold leading-none">{valor}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
