import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { BotaoJanela } from '@/components/Auth/MolduraAuth';
import { caixaCampo } from '@/components/UI';
import { cn } from '@/utils/helpers';

/** O `<input>`/`<select>` dentro da `Caixa`: sem borda própria, o texto em 14 e o placeholder cinza. */
export const CLASSE_INPUT =
  'min-w-0 flex-1 bg-transparent text-graphic text-white outline-none placeholder:text-orbit-muted';

/** A caixa de 46 do design system com o ícone à esquerda; `seta` põe o chevron do dropdown. */
export function Caixa({
  erro,
  icone,
  seta,
  children,
}: {
  erro: boolean;
  icone: ReactNode;
  seta?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={cn(caixaCampo({ tone: erro ? 'negative' : 'default' }), 'relative')}>
      <span className="shrink-0">{icone}</span>
      {children}
      {seta && (
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-4 size-5 text-white" fill="none" aria-hidden>
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/**
 * O cartão das telas de conta do Figma: "Criar conta", "Verifique seu e-mail",
 * "E-mail verificado!", "Esqueceu sua senha?", "Criar nova senha" e "Senha
 * redefinida!".
 *
 * É a mesma janela de 926×619 do login (a janela do Electron já fica travada
 * nessa medida sem sessão), mas sem arte nem abas: o fundo é o degradê
 * `orbit-conta`, o título vem com a seta de voltar e a ação principal fica no
 * canto de baixo à direita. Como no login, o próprio cartão arrasta a janela.
 *
 * Medidas lidas da captura dos frames (o MCP do Figma não estava disponível):
 * respiro de 40, título Montserrat Bold 28, campos de 46 em duas colunas.
 */
export function MolduraConta({
  titulo,
  aoVoltar,
  acao,
  centralizado,
  children,
}: {
  /** Sem título, o cartão é de confirmação e o conteúdo vai centralizado. */
  titulo?: string;
  aoVoltar?: () => void;
  /** O botão do canto de baixo à direita. */
  acao?: ReactNode;
  centralizado?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="app-drag-region relative flex h-[619px] max-h-full w-[926px] max-w-full flex-col overflow-hidden rounded-3xl bg-orbit-conta px-10 pb-8 pt-10">
      <div className="absolute right-[14px] top-[9px] z-10 flex items-center gap-[9px]">
        <BotaoJanela rotulo="Minimizar" icone="janela-minimizar" onClick={() => void window.orbit?.window.minimize()} />
        <BotaoJanela rotulo="Fechar" icone="janela-fechar" onClick={() => void window.orbit?.window.close()} fechar />
      </div>

      {titulo && (
        <header className="flex items-center gap-6">
          {aoVoltar && (
            <button type="button" onClick={aoVoltar} aria-label="Voltar" className="app-no-drag shrink-0 orbit-focus-ring">
              <img src="./icons/figma/voltar.svg" alt="" className="size-6" />
            </button>
          )}
          <h1 className="text-[28px] font-bold leading-none text-white">{titulo}</h1>
        </header>
      )}

      <div
        className={cn(
          'app-no-drag flex min-h-0 flex-1 flex-col',
          centralizado ? 'items-center justify-center text-center' : 'pt-8',
        )}
      >
        {children}
      </div>

      {acao && <div className="app-no-drag flex shrink-0 justify-end pt-4">{acao}</div>}
    </div>
  );
}

/** O botão roxo→azul das telas de conta ("Criar conta", "Verificar e-mail", "Entrar!"...). */
export function BotaoConta({
  children,
  ocupado,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { ocupado?: boolean }) {
  return (
    <button
      type="submit"
      disabled={ocupado || props.disabled}
      className={cn(
        'flex h-[58px] w-[426px] max-w-full shrink-0 items-center justify-center rounded-lg bg-orbit-action-wide text-subtitle font-normal text-white shadow-bevel transition-opacity disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Rótulo pequeno com o asterisco vermelho, o campo e o erro abaixo — o bloco dos formulários de conta. */
export function CampoConta({
  id,
  rotulo,
  obrigatorio,
  erro,
  className,
  children,
}: {
  id: string;
  rotulo: string;
  obrigatorio?: boolean;
  erro?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="font-label text-title-s text-white">
        {rotulo}
        {obrigatorio && <span className="text-orbit-error-l">*</span>}
      </label>
      {children}
      {erro && <p className="px-1 text-caption text-orbit-error-l">{erro}</p>}
    </div>
  );
}

/** Ícone de 20 do campo, à esquerda do texto — os mesmos do login (`login-mail`, `login-key`). */
export function IconeCampo({ nome }: { nome: string }) {
  return <img src={`./icons/figma/${nome}.svg`} alt="" className="size-5" />;
}

/** Aviso do formulário: erro da API ou confirmação (link enviado, código reenviado). */
export function AvisoConta({ tom, children }: { tom: 'erro' | 'ok'; children: ReactNode }) {
  const erro = tom === 'erro';
  const Icone = erro ? AlertCircle : CheckCircle2;
  return (
    <p
      role={erro ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border p-3 text-left text-graphic',
        erro
          ? 'border-orbit-error/40 bg-orbit-error/10 text-orbit-error-l'
          : 'border-orbit-success/40 bg-orbit-success/10 text-orbit-success-l',
      )}
    >
      <Icone className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

/**
 * "E-mail verificado!" e "Senha redefinida!": o selo com o check no meio do
 * cartão, o título, o texto e o botão logo abaixo (não no canto).
 */
export function CartaoSucesso({
  titulo,
  texto,
  rotuloBotao,
  onClick,
}: {
  titulo: string;
  texto: ReactNode;
  rotuloBotao: string;
  onClick: () => void;
}) {
  return (
    <MolduraConta centralizado>
      <span className="grid size-12 place-items-center rounded-full bg-orbit-blue/15 shadow-glow" aria-hidden>
        <span className="grid size-7 place-items-center rounded-full bg-orbit-action text-white">
          <CheckCircle2 className="size-5" />
        </span>
      </span>
      <h1 className="pt-12 text-[28px] font-bold leading-none text-white">{titulo}</h1>
      <p className="max-w-[560px] pt-4 text-body text-white">{texto}</p>
      <div className="pt-10">
        <BotaoConta type="button" onClick={onClick}>
          {rotuloBotao}
        </BotaoConta>
      </div>
    </MolduraConta>
  );
}
