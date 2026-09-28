import { useState } from 'react';
import { Checkbox, Input, UserAvatar } from '@/components/UI';
import type { AccessUser } from '@/types';

/**
 * Busca + lista de membros com checkbox, como "Novo grupo" e "Adicionar membro
 * ao grupo" desenham: linhas de 56px com caixa 24, avatar 24, nome em Bold e
 * e-mail ao lado. Rolagem própria a partir do quinto membro.
 */
export function ListaMembros({
  usuarios,
  selecionados,
  onAlternar,
}: {
  usuarios: AccessUser[];
  selecionados: Set<string>;
  onAlternar: (id: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const membros = usuarios.filter(
    (usuario) =>
      usuario.name.toLowerCase().includes(termo) || usuario.email.toLowerCase().includes(termo),
  );

  return (
    <div className="flex flex-col">
      <Input placeholder="Pesquise..." value={busca} onChange={(event) => setBusca(event.target.value)} />

      <p className="mt-2.5 text-[20px] leading-none text-white">Adicione membros individualmente.</p>

      <p className="mt-[29px] text-[20px] leading-none text-white">Membros:</p>

      <ul className="-mb-1 mt-2 max-h-[280px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar]:w-1">
        {membros.map((usuario) => (
          <li key={usuario.id}>
            <label className="flex h-14 cursor-pointer items-center gap-6 px-6 text-body text-white">
              <Checkbox
                checked={selecionados.has(usuario.id)}
                onCheckedChange={() => onAlternar(usuario.id)}
                className="rounded-md border-orbit-muted bg-white data-[state=checked]:border-orbit-blue-deep data-[state=checked]:bg-orbit-blue-deep"
              />
              <span className="flex min-w-0 items-center gap-3">
                <UserAvatar name={usuario.name} src={usuario.avatarUrl} className="size-6" />
                <span className="font-bold">{usuario.name}</span>
                <span className="truncate text-graphic">{usuario.email}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
