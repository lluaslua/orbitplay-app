import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/UI';

/**
 * Campo de gênero/sub-gênero de "Novo jogo" — busca + chips selecionados +
 * sugestões clicáveis, igual ao print da etapa "Informações".
 */
export function GenreMultiSelect({
  label,
  required,
  options,
  selected,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [busca, setBusca] = useState('');

  const disponiveis = useMemo(
    () =>
      options.filter(
        (opcao) =>
          !selected.includes(opcao) && opcao.toLowerCase().includes(busca.trim().toLowerCase()),
      ),
    [options, selected, busca],
  );

  function adicionar(opcao: string) {
    onChange([...selected, opcao]);
    setBusca('');
  }

  function remover(opcao: string) {
    onChange(selected.filter((item) => item !== opcao));
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={label}
        required={required}
        placeholder="Pesquise..."
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        className="w-[560px]"
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((opcao) => (
            <span
              key={opcao}
              className="inline-flex items-center gap-2 rounded-full bg-orbit-nightfall py-2 pl-4 pr-3 text-body font-bold text-white"
            >
              {opcao}
              <button
                type="button"
                onClick={() => remover(opcao)}
                aria-label={`Remover ${opcao}`}
                className="orbit-focus-ring rounded-full"
              >
                <X className="size-5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {disponiveis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {disponiveis.map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => adicionar(opcao)}
              className="inline-flex items-center gap-2 rounded-full border border-orbit-border py-2 pl-4 pr-3 text-body text-white transition-colors hover:border-white"
            >
              {opcao}
              <Plus className="size-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
