import { Minus, Square, X } from 'lucide-react';
import { APP_VERSION } from '@/utils/constants';
import { isElectron } from '@/utils/helpers';

/**
 * Barra de título do app (Figma: node `291:1260`, 1920×40).
 *
 * Valores do arquivo: px 12 · py 8 · gap 16 · texto 16px `#BABABA`,
 * três ícones de 24px com gap 9 à direita.
 *
 * Os botões só fazem algo dentro do Electron; no browser a barra aparece
 * mas as ações ficam inertes, porque não há janela para controlar.
 */
export function TitleBar() {
  const electron = isElectron();

  return (
    <header className="app-drag-region flex h-10 shrink-0 items-center gap-4 bg-orbit-bg px-3 py-2">
      <span className="text-[16px] text-orbit-chrome">OrbitPlay v{APP_VERSION}</span>
      <button type="button" className="app-no-drag text-[16px] text-orbit-chrome hover:text-white">
        View
      </button>
      <button type="button" className="app-no-drag text-[16px] text-orbit-chrome hover:text-white">
        Help
      </button>

      <div className="flex-1" />

      <div className="app-no-drag flex items-center gap-[9px]">
        <WindowButton
          label="Minimizar"
          onClick={() => void window.orbit?.window.minimize()}
          disabled={!electron}
        >
          <Minus className="size-4" />
        </WindowButton>
        <WindowButton
          label="Maximizar"
          onClick={() => void window.orbit?.window.toggleMaximize()}
          disabled={!electron}
        >
          <Square className="size-3.5" />
        </WindowButton>
        <WindowButton
          label="Fechar"
          onClick={() => void window.orbit?.window.close()}
          disabled={!electron}
          danger
        >
          <X className="size-4" />
        </WindowButton>
      </div>
    </header>
  );
}

function WindowButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'grid size-6 place-items-center rounded text-orbit-chrome transition-colors',
        'disabled:cursor-default disabled:opacity-40',
        danger ? 'hover:bg-orbit-error hover:text-white' : 'hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
