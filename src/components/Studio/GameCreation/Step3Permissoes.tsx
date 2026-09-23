import { useState, type ReactNode } from 'react';
import { Network, Plus, Trash2 } from 'lucide-react';
import {
  Checkbox,
  Input,
  Modal,
  ModalContent,
  ModalTitle,
  Switch,
  UserAvatar,
} from '@/components/UI';
import { useStudioTeam } from '@/hooks/useStudioTeam';
import { PERMISSION_COLUMNS, type PermissionKey, type PermissionRow } from '@/utils/constants';
import { cn } from '@/utils/helpers';

/**
 * ETAPA 3 de "Novo jogo" — Responsáveis e permissões.
 *
 * Tabela de grupos + membros com 4 colunas de toggle, e o modal "Adicionar
 * membro ou grupo" abaixo dela. O rótulo "Gatilhos e eventos de telemetria"
 * acima da tabela é o texto exato do print — não bate com o conteúdo dela,
 * mas segue a regra do projeto de não reescrever texto do Figma.
 */
export function Step3Permissoes({
  draft,
  onChange,
}: {
  draft: { permissions: PermissionRow[] };
  onChange: (patch: { permissions: PermissionRow[] }) => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);

  function alternar(id: string, coluna: PermissionKey, valor: boolean) {
    onChange({
      permissions: draft.permissions.map((linha) =>
        linha.id === id
          ? { ...linha, permissions: { ...linha.permissions, [coluna]: valor } }
          : linha,
      ),
    });
  }

  function remover(id: string) {
    onChange({ permissions: draft.permissions.filter((linha) => linha.id !== id) });
  }

  function adicionar(novasLinhas: PermissionRow[]) {
    const existentes = new Set(draft.permissions.map((linha) => linha.id));
    onChange({
      permissions: [...draft.permissions, ...novasLinhas.filter((linha) => !existentes.has(linha.id))],
    });
  }

  const grupos = draft.permissions.filter((linha) => linha.kind === 'group');
  const membros = draft.permissions.filter((linha) => linha.kind === 'member');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Responsáveis e permissões</h2>
        <p className="text-body text-white">
          Defina quem será responsável pelo jogo e quais membros poderão visualizar ou editar
          suas informações.
        </p>
      </div>

      <hr className="border-orbit-border" />

      <p className="text-subtitle text-white">Gatilhos e eventos de telemetria</p>

      <div className="overflow-hidden rounded-3xl border border-orbit-border bg-orbit-card">
        <div className="flex items-center gap-6 bg-orbit-info-bg px-6 py-4 text-body text-orbit-dark">
          <span className="min-w-0 flex-1">Nome</span>
          {PERMISSION_COLUMNS.map((coluna) => (
            <span key={coluna.key} className="w-[270px] shrink-0 whitespace-nowrap">
              {coluna.label}
            </span>
          ))}
          <span className="w-6 shrink-0" />
        </div>

        {grupos.map((linha) => (
          <LinhaPermissao key={linha.id} linha={linha} onToggle={alternar} onRemover={remover} />
        ))}

        {grupos.length > 0 && membros.length > 0 && <hr className="border-orbit-border" />}

        {membros.map((linha) => (
          <LinhaPermissao key={linha.id} linha={linha} onToggle={alternar} onRemover={remover} />
        ))}

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex w-fit items-center gap-1 px-6 py-3 text-button text-orbit-blue hover:underline"
        >
          Adicionar membro ou grupo
          <Plus className="size-5" />
        </button>
      </div>

      <AdicionarMembroModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        onAdicionar={adicionar}
      />
    </div>
  );
}

function LinhaPermissao({
  linha,
  onToggle,
  onRemover,
}: {
  linha: PermissionRow;
  onToggle: (id: string, coluna: PermissionKey, valor: boolean) => void;
  onRemover: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-6 px-6 py-4">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-body text-white">
        {linha.kind === 'group' ? (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orbit-nightfall text-white">
            <Network className="size-4" />
          </span>
        ) : (
          <UserAvatar name={linha.name} className="size-8" />
        )}
        <span className="min-w-0 truncate">
          {linha.name}
          {linha.meta && <span className="text-orbit-muted"> ({linha.meta})</span>}
        </span>
      </span>

      {PERMISSION_COLUMNS.map((coluna) => (
        <span key={coluna.key} className="w-[270px] shrink-0">
          <Switch
            checked={linha.permissions[coluna.key]}
            onCheckedChange={(valor) => onToggle(linha.id, coluna.key, valor)}
            aria-label={`${coluna.label} — ${linha.name}`}
          />
        </span>
      ))}

      <button
        type="button"
        onClick={() => onRemover(linha.id)}
        aria-label={`Remover ${linha.name}`}
        className="w-6 shrink-0 text-orbit-error-l orbit-focus-ring"
      >
        <Trash2 className="size-5" />
      </button>
    </div>
  );
}

/** Chips vazios: todas as permissões desligadas até o estúdio ajustar. */
function linhaVazia(base: { id: string; name: string; meta?: string }, kind: PermissionRow['kind']): PermissionRow {
  return {
    ...base,
    kind,
    permissions: { editPermissions: false, editInfo: false, editTests: false, viewReports: false },
  };
}

function AdicionarMembroModal({
  aberto,
  onOpenChange,
  onAdicionar,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onAdicionar: (linhas: PermissionRow[]) => void;
}) {
  const { data: equipe, isLoading } = useStudioTeam();
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const termo = busca.trim().toLowerCase();
  const todosGrupos = equipe?.groups ?? [];
  const todosMembros = equipe?.members ?? [];
  const grupos = todosGrupos.filter((grupo) => grupo.name.toLowerCase().includes(termo));
  const membros = todosMembros.filter((membro) => membro.name.toLowerCase().includes(termo));

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function fechar() {
    onOpenChange(false);
    setBusca('');
    setSelecionados(new Set());
  }

  // O botão do print chama "Finalizar", igual ao rodapé da etapa — texto exato do arquivo.
  function finalizar() {
    const novasLinhas: PermissionRow[] = [
      ...todosGrupos
        .filter((grupo) => selecionados.has(grupo.id))
        .map((grupo) => linhaVazia({ id: grupo.id, name: grupo.name, meta: `${grupo.memberCount} perfis` }, 'group')),
      ...todosMembros
        .filter((membro) => selecionados.has(membro.id))
        .map((membro) => linhaVazia(membro, 'member')),
    ];
    onAdicionar(novasLinhas);
    fechar();
  }

  return (
    <Modal open={aberto} onOpenChange={(valor) => (valor ? onOpenChange(true) : fechar())}>
      <ModalContent className="max-w-md bg-orbit-bg">
        <ModalTitle>Adicionar membro ou grupo</ModalTitle>

        <Input
          placeholder="Pesquise..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
        <p className="text-caption text-orbit-muted">
          Adicione membros individualmente começando com @, ou digite o nome de um Grupo.
        </p>

        <div className="flex max-h-72 flex-col gap-4 overflow-y-auto">
          {isLoading && <p className="text-body text-orbit-muted">Carregando...</p>}

          {grupos.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-body-bold text-white">Grupos:</p>
              {grupos.map((grupo) => (
                <ItemSelecionavel
                  key={grupo.id}
                  id={grupo.id}
                  label={grupo.name}
                  meta={`${grupo.memberCount} perfis`}
                  icon={<Network className="size-4" />}
                  checked={selecionados.has(grupo.id)}
                  onToggle={alternarSelecao}
                />
              ))}
            </div>
          )}

          {membros.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-body-bold text-white">Membros:</p>
              {membros.map((membro) => (
                <ItemSelecionavel
                  key={membro.id}
                  id={membro.id}
                  label={membro.name}
                  avatar={<UserAvatar name={membro.name} className="size-6" />}
                  checked={selecionados.has(membro.id)}
                  onToggle={alternarSelecao}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={fechar}
            className="text-button text-orbit-blue hover:underline"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={finalizar}
            disabled={selecionados.size === 0}
            className="rounded-lg bg-orbit-nightfall px-5 py-2 text-button text-white shadow-bevel disabled:opacity-40"
          >
            Finalizar
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function ItemSelecionavel({
  id,
  label,
  meta,
  icon,
  avatar,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  meta?: string;
  icon?: ReactNode;
  avatar?: ReactNode;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-body text-white hover:bg-white/5',
      )}
    >
      <Checkbox checked={checked} onCheckedChange={() => onToggle(id)} />
      {icon && (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orbit-nightfall text-white">
          {icon}
        </span>
      )}
      {avatar}
      <span className="truncate">
        {label}
        {meta && <span className="text-orbit-muted"> ({meta})</span>}
      </span>
    </label>
  );
}
