import type { ReactNode } from 'react';
import type { UserRole } from '@/types';
import { cn, isElectron } from '@/utils/helpers';

/**
 * O cartão do login (Figma `181:8146` e `291:2022`), compartilhado com as telas
 * de conta que ainda não têm frame — cadastro e redefinição de senha.
 *
 * O frame desenha uma janela de **926×619 com cantos de 24**, flutuando sobre o
 * papel de parede do Windows, e sem barra de título: nada de "OrbitPlay
 * v1.0.0.2". Os únicos controles de janela são minimizar e fechar, soltos no
 * canto do próprio cartão (`1148:3357`). Maximizar não existe aqui, porque a
 * janela do login tem tamanho fixo. A janela do Electron é encolhida e travada
 * nessa medida por `App.tsx`; aqui é só a caixa.
 *
 * Como não há barra de título, é o próprio cartão que arrasta a janela
 * (`app-drag-region`) — sem isso a janela ficaria presa no meio da tela.
 *
 * A arte da direita muda com a aba, e some sob um degradê que vai do fundo
 * `#080321` até transparente.
 *
 * A arte do tester é um loop animado (o burnout). Vinha como GIF de 2,1 MB com
 * extensão .png; virou WebP animado de 281 KB, mesmos 29 frames a 50ms. Como
 * `object-cover` já a amplia ~2,8x, a compressão mais forte não é visível.
 */
export const ABAS_AUTH: {
  role: Extract<UserRole, 'STUDIO' | 'PLAYER'>;
  label: string;
  arte: string;
  email: string;
}[] = [
  {
    role: 'PLAYER',
    label: 'Sou um tester',
    arte: './images/login/tester.webp',
    email: 'player@orbitplay.com',
  },
  {
    role: 'STUDIO',
    label: 'Sou um estúdio',
    arte: './images/login/estudio.png',
    email: 'studio@orbitplay.com',
  },
];

export function MolduraAuth({
  ativa,
  onTrocarAba,
  className,
  children,
}: {
  /** Índice em `ABAS_AUTH`: escolhe a arte e a aba marcada. */
  ativa: number;
  /** Sem ele, as abas não aparecem (redefinição de senha não tem perfil). */
  onTrocarAba?: (indice: number) => void;
  className?: string;
  children: ReactNode;
}) {
  const aba = ABAS_AUTH[ativa];

  return (
    <div
      className={cn(
        'app-drag-region relative flex h-[619px] max-h-full w-[926px] max-w-full flex-col justify-center gap-11 overflow-hidden rounded-3xl bg-orbit-bg p-8',
        className,
      )}
    >
      {/* Arte de fundo, encostada na direita e apagada pelo degradê */}
      <img
        src={aba.arte}
        alt=""
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[64%] object-cover"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[86%]"
        style={{
          backgroundImage: 'linear-gradient(to right, #080321 68.923%, rgba(8, 3, 33, 0) 100%)',
        }}
      />

      {/* Minimizar e fechar: 24px com 9 entre si, a 9 do topo e 14 da direita (`1148:3357`). */}
      <div className="absolute right-[14px] top-[9px] z-10 flex items-center gap-[9px]">
        <BotaoJanela
          rotulo="Minimizar"
          icone="janela-minimizar"
          onClick={() => void window.orbit?.window.minimize()}
        />
        <BotaoJanela
          rotulo="Fechar"
          icone="janela-fechar"
          onClick={() => void window.orbit?.window.close()}
          fechar
        />
      </div>

      <img
        src="./icons/orbitplay-lockup.svg"
        alt="OrbitPlay"
        className="relative h-[29.6px] w-auto self-start"
      />

      {/* Abas de perfil */}
      {onTrocarAba && (
        <div className="relative flex items-start">
          {ABAS_AUTH.map((item, indice) => {
            const selecionada = indice === ativa;

            return (
              <button
                key={item.role}
                type="button"
                onClick={() => onTrocarAba(indice)}
                className={cn(
                  'flex flex-col items-center pt-3',
                  selecionada ? 'gap-4' : 'gap-[17px]',
                )}
                aria-pressed={selecionada}
              >
                <span
                  className={cn(
                    'px-3 text-center text-body',
                    selecionada ? 'font-bold text-orbit-blue' : 'text-white',
                  )}
                >
                  {item.label}
                </span>
                <span
                  className={cn('w-full', selecionada ? 'h-0.5 bg-orbit-blue' : 'h-px bg-white')}
                />
              </button>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Botão de janela do cartão, com o ícone do arquivo (branco, com sombra).
 *
 * Só faz algo dentro do Electron. No browser não há janela para controlar,
 * então ele aparece como no desenho, mas fica inerte, sem o realce de hover.
 */
function BotaoJanela({
  rotulo,
  icone,
  onClick,
  fechar,
}: {
  rotulo: string;
  icone: string;
  onClick: () => void;
  fechar?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
      disabled={!isElectron()}
      className={cn(
        'grid size-6 place-items-center rounded transition-colors disabled:cursor-default',
        fechar ? 'enabled:hover:bg-orbit-error' : 'enabled:hover:bg-white/10',
      )}
    >
      <img src={`./icons/figma/${icone}.svg`} alt="" className="size-6" />
    </button>
  );
}
