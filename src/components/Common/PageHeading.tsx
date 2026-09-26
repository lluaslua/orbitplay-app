import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/helpers';

/**
 * Cabeçalho das telas internas — Figma: breadcrumb `312:6618`, título `312:6619`
 * e a linha `312:6622` que fecha o bloco.
 *
 * Breadcrumb em Montserrat Regular 14: os níveis anteriores em branco, o atual
 * em `#A0A3A9`. Abaixo, a seta de voltar (36px) e o título em Bold 32.
 *
 * Substitui o `PageHeader` do `MainLayout`, que ainda serve as telas não
 * refeitas; quando a última sair, aquele componente pode ser removido.
 */
export interface Trilha {
  label: string;
  to?: string;
}

export function PageHeading({
  trilha,
  titulo,
  linha = 'clara',
}: {
  trilha: Trilha[];
  titulo: string;
  /** "Gerenciamento de acessos" fecha o bloco com a linha em `#0088FF`, não na cinza das outras telas. */
  linha?: 'clara' | 'azul';
}) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col">
      <p className="text-graphic text-white">
        {trilha.map((nivel, indice) => {
          const ultimo = indice === trilha.length - 1;

          return (
            <span key={nivel.label}>
              {nivel.to && !ultimo ? (
                <Link to={nivel.to} className="hover:underline">
                  {nivel.label}
                </Link>
              ) : (
                <span className={ultimo ? 'text-orbit-muted' : undefined}>{nivel.label}</span>
              )}
              {!ultimo && ' > '}
            </span>
          );
        })}
      </p>

      <div className="flex items-center gap-6 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="shrink-0 orbit-focus-ring"
        >
          <img src="./icons/figma/arrow-left.svg" alt="" className="size-9" />
        </button>

        <h1 className="min-w-0 flex-1 text-headline text-white">{titulo}</h1>
      </div>

      <hr className={cn('mt-6', linha === 'azul' ? 'border-orbit-azure' : 'border-orbit-border')} />
    </header>
  );
}
